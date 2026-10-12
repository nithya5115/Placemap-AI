import { z } from 'zod';
import { AptitudeQuestion, AssessmentAttempt, CATEGORIES } from '../models/Aptitude.js';
import { scoreAttempt } from '../services/scoring.js';
import { log } from '../models/Activity.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

export const submitSchema = z.object({
  category: z.enum(CATEGORIES),
  durationSec: z.number().int().min(0).max(36000).default(0),
  answers: z.array(z.object({ questionId: z.string().length(24), selected: z.number().int().nullable().optional() })).min(1).max(100),
});

export const questions = asyncHandler(async (req, res) => {
  const category = z.enum(CATEGORIES).safeParse(req.query.category);
  if (!category.success) throw new AppError('Invalid category', 400);
  const count = Math.min(Math.max(parseInt(req.query.count) || 10, 1), 30);
  const match = { category: category.data };
  if (req.query.topic) match.topic = String(req.query.topic).slice(0, 80);
  const diff = z.enum(['easy', 'medium', 'hard']).safeParse(req.query.difficulty);
  if (diff.success) match.difficulty = diff.data;
  const qs = await AptitudeQuestion.aggregate([{ $match: match }, { $sample: { size: count } },
    { $project: { question: 1, options: 1, topic: 1, difficulty: 1 } }]); // answerIndex never sent
  res.json({ questions: qs });
});

export const topics = asyncHandler(async (_req, res) => {
  const rows = await AptitudeQuestion.aggregate([{ $group: { _id: { category: '$category', topic: '$topic' }, count: { $sum: 1 } } }, { $sort: { '_id.topic': 1 } }]);
  res.json({ topics: rows.map((r) => ({ category: r._id.category, topic: r._id.topic, count: r.count })) });
});

export const submit = asyncHandler(async (req, res) => {
  const ids = req.body.answers.map((a) => a.questionId);
  const qs = await AptitudeQuestion.find({ _id: { $in: ids } }).select('+answerIndex');
  const { score, total, review } = scoreAttempt(qs, req.body.answers.map((a) => ({ ...a, selected: a.selected ?? null })));
  if (!total) throw new AppError('No valid questions submitted', 400);
  await AssessmentAttempt.create({ user: req.user.id, category: req.body.category, score, total, durationSec: req.body.durationSec,
    answers: review.map((r) => ({ question: r.question, topic: r.topic, difficulty: r.difficulty, selected: r.selected, correct: r.correct })) });
  log(req.user.id, 'aptitude', `Aptitude ${req.body.category}: ${score}/${total}`);
  res.json({ score, total, percentage: Math.round((score / total) * 100), review });
});

export const history = asyncHandler(async (req, res) =>
  res.json({ attempts: await AssessmentAttempt.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50).select('-answers') }));
