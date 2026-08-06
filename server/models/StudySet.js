import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  termEn: { type: String, required: true, trim: true },
  wordType: { type: String, default: 'noun' }, // noun, verb, adj, idiom, phrase
  ipaUs: { type: String, default: '' },
  ipaUk: { type: String, default: '' },
  definitionVi: { type: String, required: true },
  definitionEn: { type: String, default: '' },
  exampleEn: { type: String, default: '' },
  exampleVi: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  audioUsUrl: { type: String, default: '' },
  audioUkUrl: { type: String, default: '' },
  orderIndex: { type: Number, default: 0 }
}, { _id: true });

const studySetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  topicCategory: { type: String, required: true, default: 'IELTS Academic' },
  levelTag: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], default: 'B2' },
  isPublic: { type: Boolean, default: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cards: [flashcardSchema]
}, { timestamps: true });

export default mongoose.model('StudySet', studySetSchema);
