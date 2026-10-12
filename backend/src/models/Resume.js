import mongoose from 'mongoose';
const { Schema } = mongoose;
const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m, required: true });

const resumeSchema = new Schema({
  user: { ...ref('User'), index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  source: { type: String, enum: ['form', 'upload'], default: 'form' },
  fileName: { type: String, maxlength: 200 },
  template: { type: String, enum: ['classic', 'modern', 'professional'], default: 'classic' },
  data: {
    personal: { name: String, email: String, phone: String, location: String, summary: { type: String, maxlength: 2000 } },
    education: [{ school: String, degree: String, year: String }],
    skills: [String],
    projects: [{ name: String, description: String, tech: String }],
    internships: [{ company: String, role: String, duration: String, description: String }],
    certifications: [String],
    rawText: { type: String, maxlength: 30000 },
  },
}, { timestamps: true });
resumeSchema.index({ user: 1, updatedAt: -1 });

const analysisSchema = new Schema({
  user: { ...ref('User'), index: true }, resume: ref('Resume'),
  jobTitle: String, jobDescription: { type: String, maxlength: 10000 },
  score: Number, matched: [String], missing: [String], suggestions: [String],
}, { timestamps: true });

export const Resume = mongoose.model('Resume', resumeSchema);
export const ResumeAnalysis = mongoose.model('ResumeAnalysis', analysisSchema);
