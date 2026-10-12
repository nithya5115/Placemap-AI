import path from 'node:path';
import { z } from 'zod';
import { Resume, ResumeAnalysis } from '../models/Resume.js';
import { analyze, extractSkills } from '../services/ats.js';
import { extractText } from '../services/resumeParser.js';
import { log } from '../models/Activity.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

const str = z.string().trim().max(500).optional();
export const resumeSchema = z.object({
  title: z.string().trim().min(1).max(100),
  template: z.enum(['classic', 'modern', 'professional']).default('classic'),
  data: z.object({
    personal: z.object({ name: str, email: str, phone: str, location: str, summary: z.string().trim().max(2000).optional() }).default({}),
    education: z.array(z.object({ school: str, degree: str, year: str })).max(10).default([]),
    skills: z.array(z.string().trim().max(60)).max(60).default([]),
    projects: z.array(z.object({ name: str, description: z.string().max(1500).optional(), tech: str })).max(15).default([]),
    internships: z.array(z.object({ company: str, role: str, duration: str, description: z.string().max(1500).optional() })).max(10).default([]),
    certifications: z.array(z.string().trim().max(150)).max(20).default([]),
  }).default({}),
});
export const analyzeSchema = z.object({ jobTitle: z.string().trim().max(120).optional(), jobDescription: z.string().trim().min(20).max(10000) });

const owned = async (req) => {
  const r = await Resume.findOne({ _id: req.params.id, user: req.user.id });
  if (!r) throw new AppError('Resume not found', 404);
  return r;
};
export const list = asyncHandler(async (req, res) => res.json({ resumes: await Resume.find({ user: req.user.id }).select('-data.rawText').sort({ updatedAt: -1 }) }));
export const create = asyncHandler(async (req, res) => {
  const r = await Resume.create({ ...req.body, user: req.user.id });
  log(req.user.id, 'resume', `Created resume "${r.title}"`);
  res.status(201).json({ resume: r });
});
export const get = asyncHandler(async (req, res) => res.json({ resume: await owned(req) }));
export const update = asyncHandler(async (req, res) => {
  const r = await owned(req); Object.assign(r, req.body); await r.save(); res.json({ resume: r });
});
export const remove = asyncHandler(async (req, res) => { const r = await owned(req); await r.deleteOne(); res.json({ ok: true }); });
export const analyzeResume = asyncHandler(async (req, res) => {
  const r = await owned(req);
  const result = analyze(r.data.toObject(), req.body.jobDescription);
  await ResumeAnalysis.create({ user: req.user.id, resume: r._id, jobTitle: req.body.jobTitle, jobDescription: req.body.jobDescription,
    score: result.score ?? 0, matched: result.matched, missing: result.missing, suggestions: result.suggestions });
  log(req.user.id, 'analysis', `Analyzed "${r.title}"`);
  res.json(result);
});
export const history = asyncHandler(async (req, res) =>
  res.json({ analyses: await ResumeAnalysis.find({ user: req.user.id, resume: req.params.id }).sort({ createdAt: -1 }).limit(20).select('-jobDescription') }));

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose a PDF or DOCX file', 400);
  const text = await extractText(req.file.buffer, req.file.originalname);
  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0];
  const name = req.file.originalname;
  const r = await Resume.create({ user: req.user.id, title: path.basename(name, path.extname(name)).slice(0, 100), source: 'upload',
    fileName: name.slice(0, 200), data: { personal: { email }, skills: extractSkills(text), rawText: text.slice(0, 30000) } });
  log(req.user.id, 'resume', `Uploaded resume "${r.title}"`);
  const obj = r.toObject(); delete obj.data.rawText;
  res.status(201).json({ resume: obj, detectedSkills: obj.data.skills, characters: text.length });
});
