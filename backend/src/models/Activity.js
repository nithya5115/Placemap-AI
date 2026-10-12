import mongoose from 'mongoose';
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, label: String,
}, { timestamps: true });
s.index({ user: 1, createdAt: -1 });
export const UserActivity = mongoose.model('UserActivity', s);
export const log = (user, type, label) => UserActivity.create({ user, type, label }).catch(() => {});
