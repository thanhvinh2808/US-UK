import mongoose from 'mongoose';

const dialogueSchema = new mongoose.Schema({
  id: { type: String, required: true },
  speaker: { type: String, required: true },
  text: { type: String, required: true },
  vietnamese: { type: String, required: true }
});

const defaultVocabSchema = new mongoose.Schema({
  word: { type: String, required: true },
  ipa: { type: String, default: '' },
  vietnamese: { type: String, required: true },
  example: { type: String, default: '' }
});

const writingExerciseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true }, // fill_blank, sentence_ordering, free_writing
  sentence_parts: [{ type: String }],
  answer: { type: String },
  hint: { type: String },
  words: [{ type: String }],
  prompt_vi: { type: String },
  required_keywords: [{ type: String }],
  min_words: { type: Number }
});

const grammarFocusSchema = new mongoose.Schema({
  tense: { type: String, required: true },
  tense_vi: { type: String, required: true },
  formula: { type: String, required: true },
  explanation: { type: String, required: true },
  examples: [{
    en: { type: String, required: true },
    vi: { type: String, required: true },
    note: { type: String, default: '' }
  }]
});

const topicSchema = new mongoose.Schema({
  slugId: { type: String, required: true, unique: true, index: true },
  topicCategory: { type: String, required: true },
  level: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], default: 'A2' },
  title: { type: String, required: true },
  reading_passage: { type: String, required: true },
  reading_passage_translation: { type: String, required: true },
  grammar_focus: grammarFocusSchema,
  writing_exercises: [writingExerciseSchema],
  dialogues: [dialogueSchema],
  default_vocabs: [defaultVocabSchema]
}, { timestamps: true });

export default mongoose.model('Topic', topicSchema);
