import { z } from 'zod';
import { InterviewQuestion, InterviewSession, TYPES } from '../models/Interview.js';
import { getFeedback } from '../services/interviewFeedback.js';
import { log } from '../models/Activity.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

export const startSchema = z.object({
  type: z.enum(TYPES), role: z.string().trim().max(60).default('general'),
  level: z.enum(['student', 'fresher', 'experienced']).default('student'),
  count: z.number().int().min(3).max(10).default(5),
});
export const answerSchema = z.object({ index: z.number().int().min(0).max(20), answer: z.string().trim().min(1).max(3000) });

const owned = async (req) => {
  const s = await InterviewSession.findOne({ _id: req.params.id, user: req.user.id });
  if (!s) throw new AppError('Session not found', 404);
  return s;
};

export const start = asyncHandler(async (req, res) => {
  const { type, role, level, count } = req.body;
  const qs = await InterviewQuestion.aggregate([{ $match: { type, role: { $in: [role.toLowerCase(), 'general'] } } }, { $sample: { size: count } }]);
  if (qs.length < 3) throw new AppError('Not enough questions for this type. Ask an admin to add more.', 404);
  const session = await InterviewSession.create({ user: req.user.id, type, role, level,
    questions: qs.map((q) => ({ text: q.text, keywords: q.keywords })) });
  res.status(201).json({ session });
});

export const answer = asyncHandler(async (req, res) => {
  const s = await owned(req);
  if (s.status !== 'in_progress') throw new AppError('Session already finished', 409);
  const q = s.questions[req.body.index];
  if (!q) throw new AppError('Invalid question number', 400);
  if (q.answer) throw new AppError('Question already answered', 409);
  const feedback = await getFeedback({ text: q.text, keywords: q.keywords, type: s.type }, req.body.answer, s.level);
  q.answer = req.body.answer; q.answeredAt = new Date(); q.feedback = feedback;
  await s.save();
  res.json({ feedback });
});

export const finish = asyncHandler(async (req, res) => {
  const s = await owned(req);
  const scored = s.questions.filter((q) => q.feedback?.score != null);
  if (!scored.length) throw new AppError('Answer at least one question first', 400);
  if (s.status !== 'completed') {
    s.overall = Math.round(scored.reduce((t, q) => t + q.feedback.score, 0) / scored.length);
    s.status = 'completed'; await s.save();
    log(req.user.id, 'interview', `${s.type} interview: ${s.overall}/100`);
  }
  res.json({ session: s });
});

export const get = asyncHandler(async (req, res) => res.json({ session: await owned(req) }));
export const list = asyncHandler(async (req, res) =>
  res.json({ sessions: await InterviewSession.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30).select('-questions') }));
