import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ success: true, logs });
});

export default router;
