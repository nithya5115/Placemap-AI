import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
// Re-checks role and active status in the DATABASE (a JWT alone can be stale).
export const requireDbRole = (...roles) => async (req, _res, next) => {
  try {
    const u = await User.findById(req.user.id).select('role isActive');
    if (!u || !u.isActive || !roles.includes(u.role)) throw new AppError('You do not have permission', 403);
    next();
  } catch (e) { next(e); }
};
