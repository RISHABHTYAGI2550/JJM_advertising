import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { io } from '../server';
import { resolverService } from '../services/resolverService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const campaigns = db.getCampaigns();
  res.json({ success: true, campaigns });
});

router.post('/', (req: Request, res: Response) => {
  const {
    name,
    description,
    type,
    contentType,
    targetIds,
    mediaId,
    mediaUrl,
    playlistId,
    priority,
    startDate,
    endDate,
    startTime,
    endTime,
    daysOfWeek,
  } = req.body;

  if (!name || !type) {
    return res.status(400).json({ success: false, message: 'Name and Campaign type are required' });
  }

  const campaign = db.createCampaign({
    name,
    description: description || '',
    type,
    contentType: contentType || (playlistId ? 'playlist' : mediaId || mediaUrl ? 'single_image' : 'playlist'),
    targetIds: targetIds || (type === 'global' ? ['all'] : []),
    mediaId,
    mediaUrl,
    playlistId,
    priority: priority || (type === 'emergency' ? 100 : type === 'global' ? 80 : 50),
    startDate,
    endDate,
    startTime,
    endTime,
    daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    status: 'active',
  });

  // Broadcast configuration refresh to all affected screens
  if (io) {
    db.getScreens().forEach(s => {
      try {
        const config = resolverService.resolveScreenConfig(s.id);
        io.to(`screen:${s.id}`).emit('config:update', { config });
      } catch {}
    });
    io.emit('screens:changed');
  }

  return res.status(201).json({ success: true, campaign });
});

// 1-Click Global Advertisement Broadcast
router.post('/broadcast-global', (req: Request, res: Response) => {
  const { name, mediaId, mediaUrl, priority, duration } = req.body;

  if (!name || (!mediaId && !mediaUrl)) {
    return res.status(400).json({ success: false, message: 'Campaign name and media are required' });
  }

  const campaign = db.createCampaign({
    name: name || 'Hospital-Wide Announcement',
    description: 'Instant 1-Click Global Campaign across all hospital screens',
    type: 'global',
    targetIds: ['all'],
    mediaId,
    mediaUrl,
    priority: priority || 85,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    status: 'active',
  });

  if (io) {
    db.getScreens().forEach(s => {
      try {
        const config = resolverService.resolveScreenConfig(s.id);
        io.to(`screen:${s.id}`).emit('config:update', { config });
      } catch {}
    });
    io.emit('screens:changed');
  }

  db.logAudit('GLOBAL_BROADCAST', 'Campaign', campaign.id, `1-Click Global Advertisement published: ${campaign.name}`);
  return res.status(201).json({ success: true, campaign, message: 'Global campaign broadcasted to all screens!' });
});

router.patch('/:id', (req: Request, res: Response) => {
  const campaign = db.updateCampaign(req.params.id, req.body);
  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  // Update screens
  if (io) {
    db.getScreens().forEach(s => {
      try {
        const config = resolverService.resolveScreenConfig(s.id);
        io.to(`screen:${s.id}`).emit('config:update', { config });
      } catch {}
    });
    io.emit('screens:changed');
  }

  return res.json({ success: true, campaign });
});

router.delete('/:id', (req: Request, res: Response) => {
  const success = db.deleteCampaign(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  if (io) {
    db.getScreens().forEach(s => {
      try {
        const config = resolverService.resolveScreenConfig(s.id);
        io.to(`screen:${s.id}`).emit('config:update', { config });
      } catch {}
    });
    io.emit('screens:changed');
  }

  return res.json({ success: true, message: 'Campaign deleted' });
});

router.post('/:id/toggle-pause', (req: Request, res: Response) => {
  const campaign = db.getCampaignById(req.params.id);
  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  const newStatus = campaign.status === 'active' ? 'paused' : 'active';
  const updated = db.updateCampaign(campaign.id, { status: newStatus });

  if (io) {
    db.getScreens().forEach(s => {
      try {
        const config = resolverService.resolveScreenConfig(s.id);
        io.to(`screen:${s.id}`).emit('config:update', { config });
      } catch {}
    });
    io.emit('screens:changed');
  }

  db.logAudit('TOGGLE_PAUSE_CAMPAIGN', 'Campaign', campaign.id, `Campaign status changed to ${newStatus}`);
  return res.json({ success: true, status: newStatus, campaign: updated });
});

export default router;
