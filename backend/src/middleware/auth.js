import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function signToken(user) {
  return jwt.sign({ id: String(user._id), role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError('Authentication required', 401));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!roles.includes(req.user.role)) return next(new AppError('You do not have permission', 403));
  next();
};
