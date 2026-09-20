import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { io } from '../server';
import { resolverService } from '../services/resolverService';
import { EmergencyAnnouncement } from '../types';

const router = Router();

let autoDismissTimer: NodeJS.Timeout | null = null;

// Helper to push dismiss to all screens
function dismissActiveEmergency() {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer);
    autoDismissTimer = null;
  }
  db.setEmergencyAnnouncement(null);

  if (io) {
    io.emit('emergency:update', { announcement: null });
    io.emit('emergency:dismiss', {});
    db.getScreens().forEach((s) => {
      try {
        const config = resolverService.resolveScreenConfig(s.id);
        io.to(`screen:${s.id}`).emit('config:update', { config });
        io.emit('config:update', { screenId: s.id, config });
      } catch {}
    });
    io.emit('screens:changed');
  }
}

// GET current emergency announcement
router.get('/', (req: Request, res: Response) => {
  const announcement = db.getEmergencyAnnouncement();
  if (announcement && announcement.expiresAt && announcement.expiresAt <= Date.now()) {
    dismissActiveEmergency();
    return res.json({ success: true, announcement: null });
  }
  return res.json({ success: true, announcement });
});

// POST Broadcast emergency announcement
router.post('/broadcast', (req: Request, res: Response) => {
  const { title, message, severity, displayMode, highlightScreen, durationSeconds } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }

  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer);
    autoDismissTimer = null;
  }

  const parsedDuration = durationSeconds ? Number(durationSeconds) : undefined;
  const expiresAt = parsedDuration && parsedDuration > 0 ? Date.now() + parsedDuration * 1000 : undefined;

  const announcement: EmergencyAnnouncement = {
    id: `EMERG-${Date.now().toString(36).toUpperCase()}`,
    title: title.trim(),
    message: message.trim(),
    severity: severity || 'critical',
    displayMode: displayMode || 'takeover',
    highlightScreen: highlightScreen !== undefined ? !!highlightScreen : true,
    active: true,
    durationSeconds: parsedDuration && parsedDuration > 0 ? parsedDuration : undefined,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  // Add backward/forward compatible aliases
  (announcement as any).isActive = true;
  (announcement as any).screenHighlight = announcement.highlightScreen;
  (announcement as any).status = 'active';

  db.setEmergencyAnnouncement(announcement);

  // Broadcast to all screens via Socket.IO
  if (io) {
    io.emit('emergency:update', { announcement });
    io.emit('emergency:broadcast', { announcement });
    // Also push config update to all screen rooms and globally
    db.getScreens().forEach((s) => {
      try {
        const config = resolverService.resolveScreenConfig(s.id);
        io.to(`screen:${s.id}`).emit('config:update', { config });
        io.emit('config:update', { screenId: s.id, config });
      } catch {}
    });
    io.emit('screens:changed');
  }

  // Schedule auto-dismiss if duration was specified (e.g. 4 seconds)
  if (parsedDuration && parsedDuration > 0) {
    autoDismissTimer = setTimeout(() => {
      const current = db.getEmergencyAnnouncement();
      if (current && current.id === announcement.id) {
        dismissActiveEmergency();
      }
    }, parsedDuration * 1000);
  }

  return res.json({
    success: true,
    announcement,
    message: `Emergency announcement broadcasted to all screens${parsedDuration ? ` for ${parsedDuration}s` : ''}`,
  });
});

// POST Dismiss emergency announcement
router.post('/dismiss', (req: Request, res: Response) => {
  dismissActiveEmergency();
  return res.json({ success: true, message: 'Emergency announcement dismissed and normal playback restored' });
});

export default router;

