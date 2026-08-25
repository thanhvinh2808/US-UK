/**
 * Secure Learning Data Import Engine
 * Validates untrusted input, prevents prototype pollution, strips privilege escalation attempts,
 * provides preview diff summaries, and safely merges into active scoped storage.
 */

import { vocabStorage } from '../storage/vocabStorage.js';
import { mistakeStorage } from '../storage/mistakeStorage.js';
import { deckStorage } from '../storage/deckStorage.js';
import { topicStorage } from '../storage/topicStorage.js';
import { userStorage } from '../storage/userStorage.js';

// Forbidden object keys that could cause prototype pollution or privilege tampering
const FORBIDDEN_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'role',
  'isAdmin',
  'userId',
  'authorId',
  'password',
  'passwordHash',
  'accessToken',
  'refreshToken',
  'secret'
]);

/**
 * Checks for malicious keys or prototype pollution in parsed JSON structure
 */
const containsDangerousKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return false;

  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (typeof obj[key] === 'object' && containsDangerousKeys(obj[key])) {
      return true;
    }
  }
  return false;
};

/**
 * Validates a raw JSON string or parsed object for import.
 * @param {string|Object} rawInput
 * @returns {{ isValid: boolean, error?: string, sanitizedData?: Object, summary?: Object }}
 */
export const validateImportData = (rawInput) => {
  let parsed;

  try {
    if (typeof rawInput === 'string') {
      // Preliminary string check for Prototype Pollution attempts
      if (rawInput.includes('__proto__') || rawInput.includes('constructor') && rawInput.includes('prototype')) {
        return { isValid: false, error: 'Phát hiện dữ liệu không an toàn (Prototype Pollution attempt).' };
      }
      parsed = JSON.parse(rawInput);
    } else if (typeof rawInput === 'object' && rawInput !== null) {
      parsed = rawInput;
    } else {
      return { isValid: false, error: 'Dữ liệu nhập vào phải là chuỗi JSON hợp lệ.' };
    }
  } catch (e) {
    return { isValid: false, error: 'Định dạng JSON không hợp lệ: ' + e.message };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, error: 'Tệp dữ liệu không chứa đối tượng JSON hợp lệ.' };
  }

  // Strict recursive check for dangerous keys
  if (containsDangerousKeys(parsed)) {
    return { isValid: false, error: 'Dữ liệu chứa các trường nhạy cảm hoặc không được phép nhập.' };
  }

  // Extract data payload (supports both wrapped export format `{ data: {...} }` and direct `{ vocab: [...] }`)
  const rawData = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

  // Sanitize and validate collections
  const validVocab = [];
  if (Array.isArray(rawData.vocab)) {
    for (const item of rawData.vocab) {
      if (item && typeof item.word === 'string' && item.word.trim()) {
        validVocab.push({
          word: String(item.word).trim().slice(0, 100),
          ipa: typeof item.ipa === 'string' ? item.ipa.slice(0, 100) : '',
          vietnamese: typeof item.vietnamese === 'string' ? item.vietnamese.slice(0, 500) : '',
          example: typeof item.example === 'string' ? item.example.slice(0, 500) : '',
          topic: typeof item.topic === 'string' ? item.topic.slice(0, 100) : 'General',
          deckId: typeof item.deckId === 'string' ? item.deckId.slice(0, 100) : null,
          deckName: typeof item.deckName === 'string' ? item.deckName.slice(0, 100) : null,
          repetitions: Number.isFinite(item.repetitions) ? Math.max(0, item.repetitions) : 0,
          interval: Number.isFinite(item.interval) ? Math.max(0, item.interval) : 1,
          easinessFactor: Number.isFinite(item.easinessFactor) ? Math.min(5.0, Math.max(1.3, item.easinessFactor)) : 2.5,
          nextReviewDate: Number.isFinite(item.nextReviewDate) ? item.nextReviewDate : Date.now(),
          status: item.status === 'mastered' ? 'mastered' : 'learning',
          savedAt: Number.isFinite(item.savedAt) ? item.savedAt : Date.now()
        });
      }
    }
  }

  const validMistakes = [];
  if (Array.isArray(rawData.mistakes)) {
    for (const item of rawData.mistakes) {
      if (item && typeof item.question === 'string' && item.question.trim()) {
        validMistakes.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Number.isFinite(item.timestamp) ? item.timestamp : Date.now(),
          module: typeof item.module === 'string' ? item.module.slice(0, 50) : 'khac',
          skill: typeof item.skill === 'string' ? item.skill.slice(0, 50) : 'Khác',
          question: String(item.question).slice(0, 1000),
          userAnswer: typeof item.userAnswer === 'string' ? item.userAnswer.slice(0, 500) : '',
          correctAnswer: typeof item.correctAnswer === 'string' ? item.correctAnswer.slice(0, 500) : '',
          topicId: typeof item.topicId === 'string' ? item.topicId.slice(0, 100) : null
        });
      }
    }
  }

  const validDecks = [];
  if (Array.isArray(rawData.decks)) {
    for (const d of rawData.decks) {
      if (d && typeof d.id === 'string' && typeof d.name === 'string' && d.name.trim()) {
        validDecks.push({
          id: String(d.id).slice(0, 100),
          name: String(d.name).trim().slice(0, 100),
          icon: typeof d.icon === 'string' ? d.icon.slice(0, 20) : '📚'
        });
      }
    }
  }

  const sanitizedData = {
    vocab: validVocab,
    mistakes: validMistakes,
    decks: validDecks
  };

  const summary = {
    vocabCount: validVocab.length,
    mistakeCount: validMistakes.length,
    deckCount: validDecks.length
  };

  return {
    isValid: true,
    sanitizedData,
    summary
  };
};

/**
 * Merges validated imported data into the active scoped storage.
 * @param {Object} sanitizedData - Output from validateImportData.sanitizedData
 * @returns {{ success: boolean, importedCounts: Object }}
 */
export const executeDataImport = (sanitizedData) => {
  if (!sanitizedData) return { success: false, error: 'No data to import' };

  let vocabImported = 0;
  let mistakesImported = 0;
  let decksImported = 0;

  // 1. Merge Vocabulary
  if (Array.isArray(sanitizedData.vocab) && sanitizedData.vocab.length > 0) {
    const currentVocab = vocabStorage.getSavedVocab();
    const existingWordMap = new Map(currentVocab.map(w => [w.word.toLowerCase(), w]));

    sanitizedData.vocab.forEach(newWord => {
      const key = newWord.word.toLowerCase();
      if (!existingWordMap.has(key)) {
        currentVocab.push(newWord);
        existingWordMap.set(key, newWord);
        vocabImported++;
      }
    });

    vocabStorage.setSavedVocabDirect(currentVocab);
  }

  // 2. Merge Custom Decks
  if (Array.isArray(sanitizedData.decks) && sanitizedData.decks.length > 0) {
    sanitizedData.decks.forEach(deck => {
      deckStorage.saveCustomDeck(deck);
      decksImported++;
    });
  }

  // 3. Merge Mistakes
  if (Array.isArray(sanitizedData.mistakes) && sanitizedData.mistakes.length > 0) {
    sanitizedData.mistakes.forEach(mistake => {
      mistakeStorage.saveMistake(mistake);
      mistakesImported++;
    });
  }

  return {
    success: true,
    importedCounts: {
      vocab: vocabImported,
      mistakes: mistakesImported,
      decks: decksImported
    }
  };
};

export default {
  validateImportData,
  executeDataImport
};
