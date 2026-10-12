import mongoose from 'mongoose';
const { Schema } = mongoose;
export const CATEGORIES = ['quantitative', 'logical', 'verbal', 'data_interpretation', 'technical'];

const qSchema = new Schema({
  category: { type: String, enum: CATEGORIES, required: true },
  topic: { type: String, required: true, trim: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  question: { type: String, required: true },
  options: { type: [String], validate: (v) => v.length >= 2 && v.length <= 6 },
  answerIndex: { type: Number, required: true, select: false },
  explanation: String,
  isSample: { type: Boolean, default: false },
}, { timestamps: true });
qSchema.index({ category: 1, topic: 1, difficulty: 1 });

const attemptSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: String, score: Number, total: Number, durationSec: Number,
  answers: [{ question: { type: Schema.Types.ObjectId, ref: 'AptitudeQuestion' }, topic: String, difficulty: String, selected: Number, correct: Boolean }],
}, { timestamps: true });
attemptSchema.index({ user: 1, createdAt: -1 });

export const AptitudeQuestion = mongoose.model('AptitudeQuestion', qSchema);
export const AssessmentAttempt = mongoose.model('AssessmentAttempt', attemptSchema);
