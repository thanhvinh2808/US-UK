import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: 'demo_password_hash' },
  preferredAccent: { type: String, enum: ['US', 'UK'], default: 'US' },
  targetBand: { type: Number, default: 7.5 },
  streakDays: { type: Number, default: 0 },
  lastActiveAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
