import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { screenRepo } from './db/repositories/screenRepository';
import { commandService } from './services/commandService';
import { healthMonitor } from './services/healthMonitor';
import { Logger } from './services/logger';

import screensRouter from './routes/screens.routes';
import departmentsRouter from './routes/departments.routes';
import mediaRouter from './routes/media.routes';
import campaignsRouter from './routes/campaigns.routes';
import playlistsRouter from './routes/playlists.routes';
import displayRouter from './routes/display.routes';
import auditRouter from './routes/audit.routes';
import emergencyRouter from './routes/emergency.routes';

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

export const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploaded media with open CORS
app.use(
  '/uploads',
  cors(),
  express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  })
);

// Mount API routes
app.use('/api/screens', screensRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/display', displayRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/emergency', emergencyRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0-PROD',
    system: 'JJM Hospital Queue & Signage Controller (Production V2)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Real-time WebSocket connection handling with Command Lifecycle Integration
io.on('connection', (socket) => {
  Logger.info(`[Socket.IO] Client connected: ${socket.id}`);

  // TV client registers itself
  socket.on('screen:register', ({ screenId, deviceToken, appVersion, configVersion }) => {
    if (screenId) {
      const room = `screen:${screenId}`;
      socket.join(room);
      Logger.info(`[Socket.IO] Screen joined room: ${room}`, { screenId, appVersion, configVersion });

      const now = new Date().toISOString();
      screenRepo.update(screenId, {
        connectionStatus: 'online',
        healthStatus: 'ONLINE',
        lastHeartbeat: now,
        lastHeartbeatAt: now,
        deviceToken: deviceToken || undefined,
        playerVersion: appVersion || '1.0.0',
        appliedConfigVersion: configVersion !== undefined ? Number(configVersion) : undefined,
      });

      io.emit('screen:status_change', { screenId, status: 'online', healthStatus: 'ONLINE' });
      io.emit('screens:changed');
    }
  });

  // TV sends periodic heartbeat
  socket.on('screen:heartbeat', ({
    screenId,
    currentContent,
    playerVersion,
    appliedConfigVersion,
    mediaManifestVersion,
    queueConnected,
    queueLastUpdateAt,
    deviceMetadata,
  }) => {
    if (screenId) {
      const screen = screenRepo.getById(screenId);
      if (screen) {
        const healthStatus = healthMonitor.evaluateScreenHealth(screen, {
          queueConnected,
          queueLastUpdateAt,
          mediaManifestVersion,
        });

        screenRepo.recordHeartbeat(screenId, {
          appliedConfigVersion: appliedConfigVersion !== undefined ? Number(appliedConfigVersion) : undefined,
          mediaManifestVersion: mediaManifestVersion !== undefined ? Number(mediaManifestVersion) : undefined,
          currentContent: currentContent || 'queue',
          playerVersion: playerVersion || '1.0.0',
          healthStatus,
          deviceMetadata,
        });

        io.emit('screen:heartbeat_received', {
          screenId,
          status: 'online',
          healthStatus,
          appliedConfigVersion,
          targetConfigVersion: screen.targetConfigVersion,
          currentContent,
        });
      }
    }
  });

  // Real TV screenshot snapshot received
  socket.on('screen:snapshot', ({ screenId, image }) => {
    if (screenId && image) {
      const now = new Date().toISOString();
      screenRepo.update(screenId, {
        latestSnapshot: image,
        latestSnapshotTime: now,
      });
      io.emit('screen:snapshot_updated', {
        screenId,
        latestSnapshot: image,
        latestSnapshotTime: now,
      });
    }
  });

  // -------------------------------------------------------------
  // TV COMMAND LIFECYCLE SOCKET EVENTS (V2 5-Stage ACK Handshake)
  // -------------------------------------------------------------
  socket.on('command:received', ({ commandId, screenId }) => {
    if (commandId && screenId) {
      commandService.handleReceived(commandId, screenId);
    }
  });

  socket.on('command:applied', ({ commandId, screenId }) => {
    if (commandId && screenId) {
      commandService.handleApplied(commandId, screenId);
    }
  });

  socket.on('command:ack', ({ commandId, screenId, resultPayload }) => {
    if (commandId && screenId) {
      commandService.handleAcknowledged(commandId, screenId, resultPayload);
    }
  });

  socket.on('command:fail', ({ commandId, screenId, errorMessage }) => {
    if (commandId && screenId) {
      commandService.handleFailed(commandId, screenId, errorMessage || 'Unknown error');
    }
  });

  socket.on('disconnect', () => {
    Logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Global Express Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Logger.error(`[Unhandled Error] ${req.method} ${req.url}: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Hospital Control Server Error',
  });
});

// Periodic offline watchdog (every 15 seconds)
setInterval(() => {
  healthMonitor.runWatchdog();
}, 15000);

// Periodic command timeout reaper (every 10 seconds)
setInterval(() => {
  commandService.reapTimeouts();
}, 10000);

// Safe Process Exception Handlers
process.on('uncaughtException', (err) => {
  Logger.error(`[CRITICAL UNCAUGHT EXCEPTION] ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (reason: any) => {
  Logger.error(`[UNHANDLED PROMISE REJECTION] ${reason?.message || reason}`);
});

server.listen(PORT, HOST, () => {
  Logger.info(`=======================================================`);
  Logger.info(` JJM Hospital Queue & Signage Controller (Production V2) `);
  Logger.info(` Port: http://${HOST}:${PORT}                       `);
  Logger.info(` Health: http://${HOST}:${PORT}/api/health           `);
  Logger.info(` Database: SQLite WAL Transactional Storage Ready      `);
  Logger.info(` Environment: ${process.env.NODE_ENV || 'production'} `);
  Logger.info(`=======================================================`);
});

export default server;
