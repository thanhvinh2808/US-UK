import mongoose from 'mongoose';

const userCardProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  setId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySet', required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  leitnerBox: { type: Number, min: 1, max: 5, default: 1 }, // Box 1 to 5
  status: { type: String, enum: ['new', 'learning', 'mastered'], default: 'new' },
  
  consecutiveCorrect: { type: Number, default: 0 },
  timesReviewed: { type: Number, default: 0 },
  lastReviewedAt: { type: Date, default: null },
  nextReviewAt: { type: Date, default: Date.now },
  isStarred: { type: Boolean, default: false }
}, { timestamps: true });

userCardProgressSchema.index({ userId: 1, cardId: 1 }, { unique: true });

export default mongoose.model('UserCardProgress', userCardProgressSchema);
