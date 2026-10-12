import { z } from 'zod';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { signToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(72).regex(/[A-Za-z]/, 'must contain a letter').regex(/\d/, 'must contain a digit'),
});
export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(72),
});

// Public registration ALWAYS creates a student. Admins are created via seed script.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) throw new AppError('Email already registered', 409);
  const user = await User.create({ name, email, password, role: 'student' });
  await StudentProfile.create({ user: user._id });
  res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive || !(await user.comparePassword(password)))
    throw new AppError('Invalid email or password', 401);
  res.json({ token: signToken(user), user: user.toSafeJSON() });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.isActive) throw new AppError('Account not found', 401);
  res.json({ user: user.toSafeJSON() });
});
