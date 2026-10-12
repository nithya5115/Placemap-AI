import mongoose from 'mongoose';
const { Schema } = mongoose;
export const TYPES = ['technical', 'hr', 'behavioral'];

const qSchema = new Schema({
  type: { type: String, enum: TYPES, required: true },
  role: { type: String, default: 'general', trim: true, lowercase: true, maxlength: 60 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  text: { type: String, required: true, maxlength: 500 },
  keywords: [{ type: String, lowercase: true, trim: true }],
  isSample: { type: Boolean, default: false },
}, { timestamps: true });
qSchema.index({ type: 1, role: 1 });

const sessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: TYPES, required: true },
  role: String,
  level: { type: String, enum: ['student', 'fresher', 'experienced'], default: 'student' },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  overall: Number,
  questions: [{
    text: String, keywords: [String], answer: String, answeredAt: Date,
    feedback: { score: Number, relevance: Number, clarity: Number, structure: Number,
      strengths: [String], improvements: [String], suggestion: String, source: String },
  }],
}, { timestamps: true });
sessionSchema.index({ user: 1, createdAt: -1 });

export const InterviewQuestion = mongoose.model('InterviewQuestion', qSchema);
export const InterviewSession = mongoose.model('InterviewSession', sessionSchema);
