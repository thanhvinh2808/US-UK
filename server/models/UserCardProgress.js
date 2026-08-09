import mongoose from 'mongoose';

const userCardProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  setId: { type: String, required: true },
  cardId: { type: String, required: true },
  
  repetitions: { type: Number, default: 0 },
  interval: { type: Number, default: 0 },
  easinessFactor: { type: Number, default: 2.5 },
  status: { type: String, enum: ['new', 'learning', 'mastered'], default: 'new' },
  
  timesReviewed: { type: Number, default: 0 },
  lastReviewedAt: { type: Date, default: null },
  nextReviewAt: { type: Date, default: Date.now },
  isStarred: { type: Boolean, default: false }
}, { timestamps: true });

userCardProgressSchema.index({ userId: 1, cardId: 1 }, { unique: true });

export default mongoose.model('UserCardProgress', userCardProgressSchema);
