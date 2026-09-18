import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { io } from '../server';
import { resolverService } from '../services/resolverService';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const playlists = db.getPlaylists();
  res.json({ success: true, playlists });
});

router.post('/', (req: Request, res: Response) => {
  const { name, description, items, isDefault } = req.body;
  if (!name || !items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'Name and items array are required' });
  }

  const playlist = db.createPlaylist({
    name,
    description: description || '',
    items,
    isDefault: !!isDefault,
  });

  return res.status(201).json({ success: true, playlist });
});

router.patch('/:id', (req: Request, res: Response) => {
  const playlist = db.updatePlaylist(req.params.id, req.body);
  if (!playlist) {
    return res.status(404).json({ success: false, message: 'Playlist not found' });
  }

  if (io) {
    db.getScreens().forEach(s => {
      if (s.playlistId === playlist.id) {
        try {
          const config = resolverService.resolveScreenConfig(s.id);
          io.to(`screen:${s.id}`).emit('config:update', { config });
        } catch {}
      }
    });
  }

  return res.json({ success: true, playlist });
});

router.delete('/:id', (req: Request, res: Response) => {
  const success = db.deletePlaylist(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Playlist not found' });
  }
  return res.json({ success: true, message: 'Playlist deleted successfully' });
});

export default router;
