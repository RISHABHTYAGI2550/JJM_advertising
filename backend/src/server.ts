import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { screenRepo } from './db/repositories/screenRepository';
import { commandService } from './services/commandService';
import { healthMonitor } from './services/healthMonitor';
import { Logger } from './services/logger';
import { pairingService } from './services/pairingService';


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

// --- CORS: Allow production domain + local dev ---
const ALLOWED_ORIGINS = [
  'https://jjm-advertising.onrender.com',
  'https://jjm-admin.onrender.com',
  // Local dev origins
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];
// Allow all if CORS_ORIGIN is * or explicit override
const CORS_ORIGIN_ENV = process.env.CORS_ORIGIN;
const corsOriginFn = CORS_ORIGIN_ENV === '*'
  ? true
  : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin) || CORS_ORIGIN_ENV === origin) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    };

export const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN_ENV === '*' ? '*' : ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.disable('x-powered-by'); // Don't leak Express version
app.use(cors({ origin: corsOriginFn, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ─── Simple in-memory rate limiter for pairing endpoint ─────────────────────
const pairRateMap = new Map<string, { count: number; resetAt: number }>();
const pairingRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = pairRateMap.get(ip);
  if (entry && entry.resetAt > now) {
    if (entry.count >= 10) {
      return res.status(429).json({ success: false, message: 'Too many pairing attempts. Please wait 60 seconds.' });
    }
    entry.count++;
  } else {
    pairRateMap.set(ip, { count: 1, resetAt: now + 60_000 });
  }
  return next();
};

// ─── Admin token authentication middleware ──────────────────────────────────
// Active admin sessions (in-memory; survives restarts for ~24h)
const adminSessions = new Map<string, { createdAt: number }>();

export function createAdminSession(): string {
  const token = `ADM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;
  adminSessions.set(token, { createdAt: Date.now() });
  // Auto-expire after 24h
  setTimeout(() => adminSessions.delete(token), 24 * 60 * 60 * 1000);
  return token;
}

const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-admin-token'] as string;
  if (token && adminSessions.has(token)) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized. Admin session required.' });
};

// ─── Admin login route (server-side credential check) ──────────────────────
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, pin } = req.body;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'JJMads@Vibesoft.in';
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'JJM@#ads';
  const ADMIN_PIN = process.env.ADMIN_PIN || '935989';

  if (email?.trim() !== ADMIN_EMAIL || password?.trim() !== ADMIN_PASS || String(pin) !== ADMIN_PIN) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or PIN' });
  }

  const token = createAdminSession();
  return res.json({ success: true, token, email: ADMIN_EMAIL });
});

// ─── Admin logout ───────────────────────────────────────────────────────────
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-admin-token'] as string;
  if (token) adminSessions.delete(token);
  return res.json({ success: true });
});


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
// TV Display Routes (Public — no admin token required, TV clients only need screenId)
app.use('/api/display', displayRouter);

// ─── TV Pairing Session (PUBLIC — no admin token, rate-limited) ─────────────
// TV calls POST /api/screens/pair-session on boot to get a 6-digit pairing code.
// This MUST be registered BEFORE the auth-protected /api/screens router.
app.post('/api/screens/pair-session', pairingRateLimiter, (req: Request, res: Response) => {
  const { socketId, deviceMetadata } = req.body;
  try {
    const session = pairingService.createPairingSession(socketId, deviceMetadata);
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin Management Routes (require admin session token) ───────────────────
app.use('/api/screens', requireAdminAuth, screensRouter);
app.use('/api/departments', requireAdminAuth, departmentsRouter);
app.use('/api/media', requireAdminAuth, mediaRouter);
app.use('/api/campaigns', requireAdminAuth, campaignsRouter);
app.use('/api/playlists', requireAdminAuth, playlistsRouter);
app.use('/api/audit-logs', requireAdminAuth, auditRouter);
app.use('/api/emergency', requireAdminAuth, emergencyRouter);


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
