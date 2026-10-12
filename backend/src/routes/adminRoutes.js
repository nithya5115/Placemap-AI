import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireDbRole } from '../middleware/adminDb.js';
import { validate } from '../middleware/validate.js';
import * as a from '../controllers/adminController.js';

const r = Router();
r.use(requireAuth, requireRole('admin', 'placement_officer'));
r.get('/ping', (req, res) => res.json({ ok: true, role: req.user.role }));
r.use(requireDbRole('admin', 'placement_officer')); // everything below re-checks the database

r.get('/stats', a.stats);
r.get('/users', a.users);
r.get('/aptitude', a.aptitude.list);
r.get('/interview-questions', a.interviewQ.list);

// Only full admins may change data
r.patch('/users/:id/active', requireDbRole('admin'), validate(a.activeSchema), a.setActive);
r.post('/aptitude', requireDbRole('admin'), validate(a.aptitudeSchema), a.aptitude.create);
r.delete('/aptitude/:id', requireDbRole('admin'), a.aptitude.remove);
r.post('/interview-questions', requireDbRole('admin'), validate(a.interviewQSchema), a.interviewQ.create);
r.delete('/interview-questions/:id', requireDbRole('admin'), a.interviewQ.remove);
export default r;
