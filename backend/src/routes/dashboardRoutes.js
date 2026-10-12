import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Resume } from '../models/Resume.js';
import { AssessmentAttempt } from '../models/Aptitude.js';
import { JobApplication } from '../models/Jobs.js';
import { InterviewSession } from '../models/Interview.js';
import { UserActivity } from '../models/Activity.js';
import { asyncHandler } from '../utils/AppError.js';

const r = Router();
r.get('/', requireAuth, asyncHandler(async (req, res) => {
  const u = req.user.id;
  const [resumes, attempts, applications, activities, interviews] = await Promise.all([
    Resume.countDocuments({ user: u }), AssessmentAttempt.find({ user: u }).sort({ createdAt: -1 }).limit(200),
    JobApplication.countDocuments({ user: u }), UserActivity.find({ user: u }).sort({ createdAt: -1 }).limit(8),
    InterviewSession.find({ user: u, status: 'completed' }).select('overall')]);
  const topics = {};
  for (const a of attempts) for (const x of a.answers) { const t = (topics[x.topic] ||= { right: 0, total: 0 }); t.total++; if (x.correct) t.right++; }
  const topicAccuracy = Object.entries(topics).map(([topic, v]) => ({ topic, accuracy: Math.round((v.right / v.total) * 100), attempted: v.total }));
  const pcts = attempts.filter((a) => a.total).map((a) => (a.score / a.total) * 100);
  res.json({
    interviewsCompleted: interviews.length,
    interviewAverage: interviews.length ? Math.round(interviews.reduce((s, i) => s + i.overall, 0) / interviews.length) : null,
    resumes, aptitudeTests: attempts.length, applications,
    averageScore: pcts.length ? Math.round(pcts.reduce((s, x) => s + x, 0) / pcts.length) : null,
    topicAccuracy, weakAreas: topicAccuracy.filter((t) => t.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy),
    activities,
  });
}));
export default r;
