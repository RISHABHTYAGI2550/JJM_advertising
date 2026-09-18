import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { resolverService } from '../services/resolverService';
import { io } from '../server';

const router = Router();

// Resolved display configuration for a screen
router.get('/:screenId/config', (req: Request, res: Response) => {
  try {
    const config = resolverService.resolveScreenConfig(req.params.screenId);
    return res.json({ success: true, config });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// TV Heartbeat endpoint (HTTP fallback if socket disconnected)
router.post('/:screenId/heartbeat', (req: Request, res: Response) => {
  const { currentContent, playerVersion, deviceMetadata } = req.body;
  const screen = db.updateScreen(req.params.screenId, {
    connectionStatus: 'online',
    lastHeartbeat: new Date().toISOString(),
    currentContent: currentContent || 'queue',
    playerVersion: playerVersion || '1.0.0',
    deviceMetadata: deviceMetadata || undefined,
  });

  if (!screen) {
    return res.status(404).json({ success: false, message: 'Screen not registered' });
  }

  if (io) {
    io.emit('screen:heartbeat_received', { screenId: screen.id, status: 'online' });
  }

  return res.json({ success: true, timestamp: new Date().toISOString() });
});

export default router;
