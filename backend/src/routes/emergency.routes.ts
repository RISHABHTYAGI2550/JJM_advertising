import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { io } from '../server';
import { resolverService } from '../services/resolverService';
import { EmergencyAnnouncement } from '../types';

const router = Router();

// GET current emergency announcement
router.get('/', (req: Request, res: Response) => {
  const announcement = db.getEmergencyAnnouncement();
  return res.json({ success: true, announcement });
});

// POST Broadcast emergency announcement
router.post('/broadcast', (req: Request, res: Response) => {
  const { title, message, severity, displayMode, highlightScreen } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }

  const announcement: EmergencyAnnouncement = {
    id: `EMERG-${Date.now().toString(36).toUpperCase()}`,
    title: title.trim(),
    message: message.trim(),
    severity: severity || 'critical',
    displayMode: displayMode || 'takeover',
    highlightScreen: highlightScreen !== undefined ? !!highlightScreen : true,
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.setEmergencyAnnouncement(announcement);

  // Broadcast to all screens via Socket.IO
  if (io) {
    io.emit('emergency:update', { announcement });
    // Also push config update to all screen rooms
    db.getScreens().forEach((s) => {
      try {
        const config = resolverService.resolveScreenConfig(s.id);
        io.to(`screen:${s.id}`).emit('config:update', { config });
      } catch {}
    });
    io.emit('screens:changed');
  }

  return res.json({ success: true, announcement, message: 'Emergency announcement broadcasted to all screens' });
});

// POST Dismiss emergency announcement
router.post('/dismiss', (req: Request, res: Response) => {
  db.setEmergencyAnnouncement(null);

  if (io) {
    io.emit('emergency:update', { announcement: null });
    db.getScreens().forEach((s) => {
      try {
        const config = resolverService.resolveScreenConfig(s.id);
        io.to(`screen:${s.id}`).emit('config:update', { config });
      } catch {}
    });
    io.emit('screens:changed');
  }

  return res.json({ success: true, message: 'Emergency announcement dismissed and normal playback restored' });
});

export default router;
