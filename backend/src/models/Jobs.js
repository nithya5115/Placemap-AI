import mongoose from 'mongoose';
const { Schema } = mongoose;
export const STATUSES = ['saved', 'applied', 'in_progress', 'interview', 'offer', 'rejected'];

const jobSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  company: { type: String, trim: true, maxlength: 120 },
  text: { type: String, required: true, maxlength: 10000 },
  skills: [String],
}, { timestamps: true });

const appSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: Schema.Types.ObjectId, ref: 'JobDescription', required: true },
  status: { type: String, enum: STATUSES, default: 'applied' },
  history: [{ status: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });
appSchema.index({ user: 1, status: 1 });

export const JobDescription = mongoose.model('JobDescription', jobSchema);
export const JobApplication = mongoose.model('JobApplication', appSchema);
