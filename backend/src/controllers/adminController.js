import { z } from 'zod';
import User from '../models/User.js';
import { Resume } from '../models/Resume.js';
import { AptitudeQuestion, AssessmentAttempt, CATEGORIES } from '../models/Aptitude.js';
import { InterviewQuestion, InterviewSession, TYPES } from '../models/Interview.js';
import { JobApplication } from '../models/Jobs.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

export const aptitudeSchema = z.object({
  category: z.enum(CATEGORIES), topic: z.string().trim().min(1).max(80), difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  question: z.string().trim().min(5).max(1000), options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  answerIndex: z.number().int().min(0), explanation: z.string().trim().max(1000).optional(),
}).refine((d) => d.answerIndex < d.options.length, { message: 'answerIndex must point to an option', path: ['answerIndex'] });
export const interviewQSchema = z.object({
  type: z.enum(TYPES), role: z.string().trim().min(1).max(60).default('general'), difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  text: z.string().trim().min(5).max(500), keywords: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
});
export const activeSchema = z.object({ isActive: z.boolean() });

export const stats = asyncHandler(async (_req, res) => {
  const [students, resumes, attempts, sessions, applications, aptQ, intQ] = await Promise.all([
    User.countDocuments({ role: 'student' }), Resume.countDocuments(), AssessmentAttempt.countDocuments(),
    InterviewSession.countDocuments({ status: 'completed' }), JobApplication.countDocuments(),
    AptitudeQuestion.countDocuments(), InterviewQuestion.countDocuments()]);
  res.json({ students, resumes, aptitudeAttempts: attempts, interviewsCompleted: sessions, applications, aptitudeQuestions: aptQ, interviewQuestions: intQ });
});

export const users = asyncHandler(async (req, res) => {
  const q = String(req.query.search || '').trim().slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] } : {};
  res.json({ users: await User.find(filter).sort({ createdAt: -1 }).limit(100).select('name email role isActive createdAt') });
});
export const setActive = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new AppError('You cannot change your own status', 400);
  const u = await User.findById(req.params.id);
  if (!u) throw new AppError('User not found', 404);
  if (u.role === 'admin') throw new AppError('Admin accounts cannot be disabled here', 403);
  u.isActive = req.body.isActive; await u.save();
  res.json({ user: u.toSafeJSON(), isActive: u.isActive });
});

const crud = (Model, { select = '' } = {}) => ({
  list: asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const [items, total] = await Promise.all([Model.find().select(select).sort({ createdAt: -1 }).skip((page - 1) * 50).limit(50), Model.countDocuments()]);
    res.json({ items, total, page });
  }),
  create: asyncHandler(async (req, res) => res.status(201).json({ item: await Model.create(req.body) })),
  remove: asyncHandler(async (req, res) => {
    const d = await Model.findByIdAndDelete(req.params.id);
    if (!d) throw new AppError('Not found', 404);
    res.json({ ok: true });
  }),
});
export const aptitude = crud(AptitudeQuestion, { select: '+answerIndex' });
export const interviewQ = crud(InterviewQuestion);
