// Usage: SEED_ADMIN_EMAIL=you@x.com SEED_ADMIN_PASSWORD=Strong1234 node scripts/seed.js
import mongoose from 'mongoose';
import '../src/config/env.js';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';
import { AptitudeQuestion } from '../src/models/Aptitude.js';
import { samples } from './sampleQuestions.js';
import { InterviewQuestion } from '../src/models/Interview.js';
import { interviewSamples } from './sampleInterview.js';

await mongoose.connect(env.MONGODB_URI);
const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password } = process.env;
if (email && password) {
  if (!(await User.findOne({ email }))) { await User.create({ name: 'Admin', email, password, role: 'admin' }); console.log('Admin created:', email); }
  else console.log('Admin already exists');
} else console.log('Skipping admin (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD)');
await AptitudeQuestion.deleteMany({ isSample: true });
await AptitudeQuestion.insertMany(samples);
console.log(`Inserted ${samples.length} SAMPLE aptitude questions`);
await InterviewQuestion.deleteMany({ isSample: true });
await InterviewQuestion.insertMany(interviewSamples);
console.log(`Inserted ${interviewSamples.length} SAMPLE interview questions`);
await mongoose.disconnect();
