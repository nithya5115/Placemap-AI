import { z } from 'zod';
import { JobDescription, JobApplication, STATUSES } from '../models/Jobs.js';
import { extractSkills } from '../services/ats.js';
import { log } from '../models/Activity.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

export const jobSchema = z.object({ title: z.string().trim().min(1).max(120), company: z.string().trim().max(120).optional(), text: z.string().trim().min(20).max(10000) });
export const appSchema = z.object({ jobId: z.string().length(24), status: z.enum(STATUSES).default('applied') });
export const statusSchema = z.object({ status: z.enum(STATUSES) });

export const createJob = asyncHandler(async (req, res) => {
  const job = await JobDescription.create({ ...req.body, user: req.user.id, skills: extractSkills(req.body.text) });
  res.status(201).json({ job });
});
export const listJobs = asyncHandler(async (req, res) => res.json({ jobs: await JobDescription.find({ user: req.user.id }).sort({ createdAt: -1 }) }));
export const createApp = asyncHandler(async (req, res) => {
  const job = await JobDescription.findOne({ _id: req.body.jobId, user: req.user.id });
  if (!job) throw new AppError('Job not found', 404);
  const a = await JobApplication.create({ user: req.user.id, job: job._id, status: req.body.status, history: [{ status: req.body.status }] });
  log(req.user.id, 'application', `Tracking ${job.title} (${req.body.status})`);
  res.status(201).json({ application: a });
});
export const listApps = asyncHandler(async (req, res) =>
  res.json({ applications: await JobApplication.find({ user: req.user.id }).populate('job', 'title company skills').sort({ updatedAt: -1 }) }));
export const setStatus = asyncHandler(async (req, res) => {
  const a = await JobApplication.findOne({ _id: req.params.id, user: req.user.id });
  if (!a) throw new AppError('Application not found', 404);
  a.status = req.body.status; a.history.push({ status: req.body.status }); await a.save();
  res.json({ application: a });
});
