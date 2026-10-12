import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { register, login, me, registerSchema, loginSchema } from '../controllers/authController.js';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const r = Router();
r.post('/register', limiter, validate(registerSchema), register);
r.post('/login', limiter, validate(loginSchema), login);
r.get('/me', requireAuth, me);
export default r;
