import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    college: { type: String, trim: true, maxlength: 120 },
    degree: { type: String, trim: true, maxlength: 80 },
    branch: { type: String, trim: true, maxlength: 80 },
    graduationYear: { type: Number, min: 2000, max: 2100 },
    phone: { type: String, trim: true, maxlength: 20 },
    targetRole: { type: String, trim: true, maxlength: 80 },
    targetCompanies: [{ type: String, trim: true, maxlength: 60 }],
    skills: [{ name: { type: String, trim: true }, level: { type: Number, min: 1, max: 5, default: 1 } }],
  },
  { timestamps: true }
);

export default mongoose.model('StudentProfile', profileSchema);
