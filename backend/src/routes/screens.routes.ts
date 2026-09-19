import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { pairingService } from '../services/pairingService';
import { resolverService } from '../services/resolverService';
import { io } from '../server';

const router = Router();

// GET all screens
router.get('/', (req: Request, res: Response) => {
  const screens = db.getScreens().map(s => {
    // Determine online/offline based on last heartbeat within 60s
    let isOnline = false;
    if (s.lastHeartbeat) {
      const diffSeconds = (Date.now() - new Date(s.lastHeartbeat).getTime()) / 1000;
      isOnline = diffSeconds <= 60;
    }
    return {
      ...s,
      connectionStatus: isOnline ? 'online' : 'offline',
    };
  });
  res.json({ success: true, screens });
});

// GET screen by ID
router.get('/:id', (req: Request, res: Response) => {
  const screen = db.getScreenById(req.params.id);
  if (!screen) {
    return res.status(404).json({ success: false, message: 'Screen not found' });
  }
  try {
    const resolvedConfig = resolverService.resolveScreenConfig(screen.id);
    return res.json({ success: true, screen, resolvedConfig });
  } catch {
    return res.json({ success: true, screen, resolvedConfig: null });
  }
});

// POST Create screen manually
router.post('/', (req: Request, res: Response) => {
  const { name, code, departmentId, location, queueUrl, playlistId } = req.body;
  if (!name || !departmentId || !queueUrl) {
    return res.status(400).json({ success: false, message: 'Missing required fields (name, departmentId, queueUrl)' });
  }

  const screenCode = code || `DOC${Math.floor(100 + Math.random() * 900)}`;
  const screenId = `SCR-${screenCode}`;

  const screen = db.createScreen({
    id: screenId,
    name,
    code: screenCode,
    departmentId,
    location: location || 'Hospital OPD Area',
    queueUrl,
    status: 'active',
    connectionStatus: 'offline',
    lastHeartbeat: null,
    currentContent: 'queue',
    currentCampaignId: null,
    playlistId: playlistId || 'PL-DEFAULT',
    deviceToken: null,
    playerVersion: '1.0.0',
  });

  return res.status(201).json({ success: true, screen });
});

// PATCH Update screen
router.patch('/:id', (req: Request, res: Response) => {
  const screen = db.updateScreen(req.params.id, req.body);
  if (!screen) {
    return res.status(404).json({ success: false, message: 'Screen not found' });
  }

  // Notify connected TV via WebSocket to update config immediately
  if (io) {
    io.to(`screen:${screen.id}`).emit('config:update', {
      config: resolverService.resolveScreenConfig(screen.id),
    });
  }

  db.logAudit('UPDATE_SCREEN', 'Screen', screen.id, `Updated screen parameters: ${JSON.stringify(req.body)}`);
  return res.json({ success: true, screen });
});

// DELETE Screen
router.delete('/:id', (req: Request, res: Response) => {
  const success = db.deleteScreen(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Screen not found' });
  }
  return res.json({ success: true, message: 'Screen deleted' });
});

// POST TV generates pairing code
router.post('/pair-session', (req: Request, res: Response) => {
  const { socketId, deviceMetadata } = req.body;
  const session = pairingService.createPairingSession(socketId, deviceMetadata);
  return res.json({ success: true, session });
});

// POST Admin submits pairing code
router.post('/pair', (req: Request, res: Response) => {
  const { pairingCode, name, code, departmentId, location, queueUrl } = req.body;
  if (!pairingCode || !name || !departmentId || !queueUrl) {
    return res.status(400).json({ success: false, message: 'Missing pairing parameters' });
  }

  try {
    const { screen, session } = pairingService.pairScreen(pairingCode, {
      name,
      code,
      departmentId,
      location,
      queueUrl,
    });

    // Notify TV client over Socket.IO if connected
    if (io) {
      io.emit(`pair:${pairingCode}`, {
        success: true,
        screen,
        deviceToken: session.deviceToken,
        config: resolverService.resolveScreenConfig(screen.id),
      });
      io.emit('screens:changed');
    }

    return res.json({ success: true, screen, deviceToken: session.deviceToken });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// POST Unpair screen
router.post('/:id/unpair', (req: Request, res: Response) => {
  const screen = pairingService.unpairScreen(req.params.id);
  if (!screen) {
    return res.status(404).json({ success: false, message: 'Screen not found' });
  }

  if (io) {
    io.to(`screen:${screen.id}`).emit('screen:unpaired');
    io.emit('screens:changed');
  }

  return res.json({ success: true, message: 'Screen unpaired successfully' });
});

// POST Remote refresh screen
router.post('/:id/refresh', (req: Request, res: Response) => {
  const screen = db.getScreenById(req.params.id);
  if (!screen) {
    return res.status(404).json({ success: false, message: 'Screen not found' });
  }

  if (io) {
    const config = resolverService.resolveScreenConfig(screen.id);
    io.to(`screen:${screen.id}`).emit('command:refresh', { config });
    db.logAudit('REMOTE_COMMAND', 'Screen', screen.id, 'Sent remote refresh command');
  }

  return res.json({ success: true, message: 'Refresh command broadcasted to screen' });
});

// POST Remote test content
router.post('/:id/test-content', (req: Request, res: Response) => {
  const { message } = req.body;
  const screen = db.getScreenById(req.params.id);
  if (!screen) {
    return res.status(404).json({ success: false, message: 'Screen not found' });
  }

  if (io) {
    io.to(`screen:${screen.id}`).emit('command:test', {
      message: message || 'Test Display Command from JJM Hospital Control Center',
    });
    db.logAudit('TEST_DISPLAY', 'Screen', screen.id, 'Triggered test display');
  }

  return res.json({ success: true, message: 'Test display command sent' });
});

// POST Toggle Play / Pause on Screen
router.post('/:id/toggle-pause', (req: Request, res: Response) => {
  const screen = db.getScreenById(req.params.id);
  if (!screen) {
    return res.status(404).json({ success: false, message: 'Screen not found' });
  }

  const newPaused = !screen.isPaused;
  const updated = db.updateScreen(screen.id, { isPaused: newPaused });

  if (io) {
    const config = resolverService.resolveScreenConfig(screen.id);
    io.to(`screen:${screen.id}`).emit('config:update', { config });
    io.to(`screen:${screen.id}`).emit('command:playback', { isPaused: newPaused });
    io.emit('command:playback', { screenId: screen.id, isPaused: newPaused });
    io.emit('screen:playback', { screenId: screen.id, isPaused: newPaused });
    io.emit('config:update', { screenId: screen.id, config });
    io.emit('screens:changed');
  }

  db.logAudit('TOGGLE_PAUSE_SCREEN', 'Screen', screen.id, `Screen playback ${newPaused ? 'PAUSED' : 'RESUMED'}`);
  return res.json({ success: true, isPaused: newPaused, screen: updated });
});

export default router;
