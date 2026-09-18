import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const departments = db.getDepartments();
  const screens = db.getScreens();
  // enrich with screen counts
  const enriched = departments.map(d => ({
    ...d,
    screenCount: screens.filter(s => s.departmentId === d.id).length,
  }));
  res.json({ success: true, departments: enriched });
});

router.post('/', (req: Request, res: Response) => {
  const { name, code, floor, description, defaultQueueUrl, defaultPlaylistId } = req.body;
  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Name and code are required' });
  }

  const dept = db.createDepartment({
    name,
    code,
    floor: floor || '1st Floor',
    description: description || '',
    defaultQueueUrl: defaultQueueUrl || 'https://hms.jjmhospitalkashipur.com/qd/DOC038',
    defaultPlaylistId,
    status: 'active',
  });

  return res.status(201).json({ success: true, department: dept });
});

router.patch('/:id', (req: Request, res: Response) => {
  const dept = db.updateDepartment(req.params.id, req.body);
  if (!dept) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }
  return res.json({ success: true, department: dept });
});

router.delete('/:id', (req: Request, res: Response) => {
  const success = db.deleteDepartment(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }
  return res.json({ success: true, message: 'Department deleted' });
});

export default router;
