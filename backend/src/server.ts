import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { db } from './db/database';
import screensRouter from './routes/screens.routes';
import departmentsRouter from './routes/departments.routes';
import mediaRouter from './routes/media.routes';
import campaignsRouter from './routes/campaigns.routes';
import playlistsRouter from './routes/playlists.routes';
import displayRouter from './routes/display.routes';
import auditRouter from './routes/audit.routes';

const app = express();
const server = http.createServer(app);

export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded media
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes
app.use('/api/screens', screensRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/display', displayRouter);
app.use('/api/audit-logs', auditRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'JJM Hospital Queue & Signage Controller',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Real-time WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] New client connected: ${socket.id}`);

  // TV client identifies itself
  socket.on('screen:register', ({ screenId, deviceToken }) => {
    if (screenId) {
      socket.join(`screen:${screenId}`);
      console.log(`[Socket.IO] Screen joined room: screen:${screenId}`);

      db.updateScreen(screenId, {
        connectionStatus: 'online',
        lastHeartbeat: new Date().toISOString(),
      });
      io.emit('screen:status_change', { screenId, status: 'online' });
    }
  });

  // Heartbeat from TV client
  socket.on('screen:heartbeat', ({ screenId, currentContent, playerVersion, deviceMetadata }) => {
    if (screenId) {
      db.updateScreen(screenId, {
        connectionStatus: 'online',
        lastHeartbeat: new Date().toISOString(),
        currentContent: currentContent || 'queue',
        playerVersion: playerVersion || '1.0.0',
        deviceMetadata: deviceMetadata || undefined,
      });
      io.emit('screen:heartbeat_received', { screenId, status: 'online', currentContent });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Periodic offline checker (if no heartbeat for > 45 seconds, mark offline)
setInterval(() => {
  const screens = db.getScreens();
  const now = Date.now();
  screens.forEach(s => {
    if (s.connectionStatus === 'online' && s.lastHeartbeat) {
      const diffSec = (now - new Date(s.lastHeartbeat).getTime()) / 1000;
      if (diffSec > 60) {
        db.updateScreen(s.id, { connectionStatus: 'offline' });
        io.emit('screen:status_change', { screenId: s.id, status: 'offline' });
      }
    }
  });
}, 15000);

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` JJM Hospital Queue + Digital Signage Server Running `);
  console.log(` Port: http://localhost:${PORT}                      `);
  console.log(` API Docs / Health: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
