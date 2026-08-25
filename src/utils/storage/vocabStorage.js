import { calculateSM2 } from './sm2.js';
import { userStorage } from './userStorage.js';
import { getScopedKey, isUserScope } from './storageScope.js';
import { enqueueReviewAction, flushOutboxQueue } from './syncEngine.js';

const BASE_KEY_VOCAB = 'saved_vocab';
const LEGACY_KEY_VOCAB = 'eng_app_saved_vocab';

export const vocabStorage = {
  getSavedVocab: (explicitUserId = undefined) => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const key = getScopedKey(BASE_KEY_VOCAB, explicitUserId);
      let data = localStorage.getItem(key);

      // Controlled fallback: If guest has no data yet, check legacy un-scoped key
      if (!data && !isUserScope() && explicitUserId === undefined) {
        const legacyData = localStorage.getItem(LEGACY_KEY_VOCAB);
        if (legacyData) {
          data = legacyData;
        }
      }

      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading vocab from localStorage', e);
      return [];
    }
  },

  setSavedVocabDirect: (updatedList, explicitUserId = undefined) => {
    try {
      if (typeof localStorage === 'undefined') return updatedList;
      const key = getScopedKey(BASE_KEY_VOCAB, explicitUserId);
      localStorage.setItem(key, JSON.stringify(updatedList));
      return updatedList;
    } catch (e) {
      console.error('Error saving vocab direct to localStorage', e);
      return [];
    }
  },

  saveWord: (wordObj) => {
    try {
      const list = vocabStorage.getSavedVocab();
      // Avoid duplicate saves
      const existingWord = list.find(item => item.word.toLowerCase() === wordObj.word.toLowerCase());
      if (existingWord) {
        // If word exists, update deck information if provided
        const updatedList = list.map(item => {
          if (item.word.toLowerCase() === wordObj.word.toLowerCase()) {
            return {
              ...item,
              deckId: wordObj.deckId !== undefined ? wordObj.deckId : item.deckId,
              deckName: wordObj.deckName !== undefined ? wordObj.deckName : item.deckName
            };
          }
          return item;
        });
        if (typeof localStorage !== 'undefined') {
          const key = getScopedKey(BASE_KEY_VOCAB);
          localStorage.setItem(key, JSON.stringify(updatedList));
        }
        return updatedList;
      }

      const newWord = {
        word: wordObj.word,
        ipa: wordObj.ipa || '',
        vietnamese: wordObj.vietnamese || '',
        example: wordObj.example || '',
        topic: wordObj.topic || 'General',
        deckId: wordObj.deckId || null,
        deckName: wordObj.deckName || null,
        lowGradeCount: wordObj.lowGradeCount || 0,
        // SM-2 fields
        repetitions: wordObj.repetitions !== undefined ? wordObj.repetitions : 0,
        interval: wordObj.interval !== undefined ? wordObj.interval : 1,
        easinessFactor: wordObj.easinessFactor !== undefined ? wordObj.easinessFactor : 2.5,
        nextReviewDate: wordObj.nextReviewDate !== undefined ? wordObj.nextReviewDate : Date.now(),
        status: wordObj.status || (wordObj.repetitions >= 3 ? 'mastered' : 'learning'),
        savedAt: wordObj.savedAt || Date.now()
      };

      const updatedList = [newWord, ...list];
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_VOCAB);
        localStorage.setItem(key, JSON.stringify(updatedList));
      }
      return updatedList;
    } catch (e) {
      console.error('Error saving word to localStorage', e);
      return [];
    }
  },

  deleteWord: (wordText) => {
    try {
      const list = vocabStorage.getSavedVocab();
      const updatedList = list.filter(item => item.word.toLowerCase() !== wordText.toLowerCase());
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_VOCAB);
        localStorage.setItem(key, JSON.stringify(updatedList));
      }
      return updatedList;
    } catch (e) {
      console.error('Error deleting word from localStorage', e);
      return [];
    }
  },

  updateWordProgress: (wordText, grade, setId = 'vocab_notebook') => {
    try {
      const list = vocabStorage.getSavedVocab();
      let targetSetId = setId;
      let calculatedSm2 = null;

      const updatedList = list.map(item => {
        if (item.word.toLowerCase() === wordText.toLowerCase()) {
          if (item.deckId) targetSetId = item.deckId;
          const sm2Result = calculateSM2(
            grade,
            item.repetitions,
            item.interval,
            item.easinessFactor
          );
          calculatedSm2 = sm2Result;

          const isLowGrade = grade <= 2;

          return {
            ...item,
            ...sm2Result,
            status: sm2Result.repetitions >= 3 ? 'mastered' : 'learning',
            lowGradeCount: (item.lowGradeCount || 0) + (isLowGrade ? 1 : 0)
          };
        }
        return item;
      });

      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_VOCAB);
        localStorage.setItem(key, JSON.stringify(updatedList));
      }

      // Increment user learning activity as well
      userStorage.incrementActivity(1);

      // Persistent Outbox Queue + Async Background Sync
      enqueueReviewAction({
        setId: targetSetId || 'vocab_notebook',
        cardId: wordText,
        isCorrect: grade >= 3,
        grade,
        sm2Result: calculatedSm2,
        timestamp: Date.now()
      });

      // Try flushing outbox immediately
      flushOutboxQueue().catch(() => {});

      return updatedList;
    } catch (e) {
      console.error('Error updating word progress', e);
      return [];
    }
  },

  resetWord: (wordText) => {
    try {
      const list = vocabStorage.getSavedVocab();
      let targetSetId = 'vocab_notebook';
      let calculatedSm2 = null;

      const updatedList = list.map(item => {
        if (item.word.toLowerCase() === wordText.toLowerCase()) {
          if (item.deckId) targetSetId = item.deckId;
          const sm2Result = calculateSM2(1, 0, 1, 2.5);
          calculatedSm2 = sm2Result;

          return {
            ...item,
            repetitions: 0,
            interval: 1,
            easinessFactor: 2.5,
            nextReviewDate: Date.now(),
            status: 'learning'
          };
        }
        return item;
      });

      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_VOCAB);
        localStorage.setItem(key, JSON.stringify(updatedList));
      }

      // Persistent Outbox Queue + Async Background Sync
      enqueueReviewAction({
        setId: targetSetId || 'vocab_notebook',
        cardId: wordText,
        isCorrect: false,
        grade: 1,
        sm2Result: calculatedSm2,
        timestamp: Date.now()
      });

      // Try flushing outbox immediately
      flushOutboxQueue().catch(() => {});

      return updatedList;
    } catch (e) {
      console.error('Error resetting word', e);
      return [];
    }
  },

  assignWordToDeck: (wordText, deckId, deckName) => {
    try {
      const list = vocabStorage.getSavedVocab();
      const updatedList = list.map(item => {
        if (item.word.toLowerCase() === wordText.toLowerCase()) {
          return {
            ...item,
            deckId,
            deckName
          };
        }
        return item;
      });

      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_VOCAB);
        localStorage.setItem(key, JSON.stringify(updatedList));
      }
      return updatedList;
    } catch (e) {
      console.error('Error assigning word to deck', e);
      return [];
    }
  }
};

export default vocabStorage;
