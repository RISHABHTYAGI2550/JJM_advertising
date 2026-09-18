import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/database';

const router = Router();

const UPLOADS_DIR = path.join(__dirname, '../../uploads/media');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${basename}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|mp4|webm/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, MP4, and WEBM formats are supported'));
    }
  },
});

router.get('/', (req: Request, res: Response) => {
  const media = db.getMedia();
  res.json({ success: true, media });
});

router.post('/', upload.single('file'), (req: Request, res: Response) => {
  const file = req.file;
  const { title, duration, tags, category, customUrl } = req.body;

  let mediaUrl = customUrl;
  let mediaType: 'image' | 'video' | 'announcement' = 'image';
  let size = 0;

  if (file) {
    mediaUrl = `/uploads/media/${file.filename}`;
    const ext = path.extname(file.originalname).toLowerCase();
    mediaType = ext === '.mp4' || ext === '.webm' ? 'video' : 'image';
    size = file.size;
  }

  if (!mediaUrl && !req.body.text) {
    return res.status(400).json({ success: false, message: 'File or Media URL is required' });
  }

  const parsedTags = typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : tags || [];

  const mediaItem = db.createMedia({
    title: title || file?.originalname || 'Hospital Media Asset',
    type: mediaType,
    url: mediaUrl,
    duration: parseInt(duration, 10) || (mediaType === 'video' ? 30 : 15),
    size,
    dimensions: mediaType === 'video' ? '1920x1080 (HD)' : '1920x1080',
    tags: parsedTags,
    category: category || 'Hospital Services',
  });

  return res.status(201).json({ success: true, media: mediaItem });
});

router.delete('/:id', (req: Request, res: Response) => {
  const success = db.deleteMedia(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Media not found' });
  }
  return res.json({ success: true, message: 'Media deleted' });
});

export default router;
