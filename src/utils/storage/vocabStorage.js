import { calculateSM2 } from './sm2.js';
import { userStorage } from './userStorage.js';
import { api } from '../../services/api.js';

const KEY_VOCAB = "eng_app_saved_vocab";

export const vocabStorage = {
  getSavedVocab: () => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(KEY_VOCAB);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading vocab from localStorage", e);
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
          localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
        }
        return updatedList;
      }

      const newWord = {
        word: wordObj.word,
        ipa: wordObj.ipa || "",
        vietnamese: wordObj.vietnamese || "",
        example: wordObj.example || "",
        topic: wordObj.topic || "General",
        deckId: wordObj.deckId || null,
        deckName: wordObj.deckName || null,
        lowGradeCount: 0,
        // SM-2 fields
        repetitions: 0,
        interval: 1,
        easinessFactor: 2.5,
        nextReviewDate: Date.now(), // Ready to review immediately
        status: "learning",
        savedAt: Date.now()
      };

      const updatedList = [newWord, ...list];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      }
      return updatedList;
    } catch (e) {
      console.error("Error saving word to localStorage", e);
      return [];
    }
  },

  deleteWord: (wordText) => {
    try {
      const list = vocabStorage.getSavedVocab();
      const updatedList = list.filter(item => item.word.toLowerCase() !== wordText.toLowerCase());
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      }
      return updatedList;
    } catch (e) {
      console.error("Error deleting word from localStorage", e);
      return [];
    }
  },

  updateWordProgress: (wordText, grade, setId = 'vocab_notebook') => {
    try {
      const list = vocabStorage.getSavedVocab();
      let targetSetId = setId;
      const updatedList = list.map(item => {
        if (item.word.toLowerCase() === wordText.toLowerCase()) {
          if (item.deckId) targetSetId = item.deckId;
          const sm2Result = calculateSM2(
            grade,
            item.repetitions,
            item.interval,
            item.easinessFactor
          );

          const isLowGrade = grade <= 2;

          return {
            ...item,
            ...sm2Result,
            status: sm2Result.repetitions >= 3 ? "mastered" : "learning",
            lowGradeCount: (item.lowGradeCount || 0) + (isLowGrade ? 1 : 0)
          };
        }
        return item;
      });

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      }

      // Increment user learning activity as well
      userStorage.incrementActivity(1);

      // Async sync review to backend SM-2 database API (non-blocking)
      api.submitCardReview(
        userStorage.getDeviceId(),
        targetSetId || 'vocab_notebook',
        wordText,
        grade >= 3,
        grade
      ).catch(() => {});

      return updatedList;
    } catch (e) {
      console.error("Error updating word progress", e);
      return [];
    }
  },

  resetWord: (wordText) => {
    try {
      const list = vocabStorage.getSavedVocab();
      let targetSetId = 'vocab_notebook';
      const updatedList = list.map(item => {
        if (item.word.toLowerCase() === wordText.toLowerCase()) {
          if (item.deckId) targetSetId = item.deckId;
          return {
            ...item,
            repetitions: 0,
            interval: 1,
            easinessFactor: 2.5,
            nextReviewDate: Date.now(),
            status: "learning"
          };
        }
        return item;
      });

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      }

      // Async sync reset to backend SM-2 database API (non-blocking)
      api.submitCardReview(
        userStorage.getDeviceId(),
        targetSetId || 'vocab_notebook',
        wordText,
        false,
        1
      ).catch(() => {});

      return updatedList;
    } catch (e) {
      console.error("Error resetting word", e);
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
        localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      }
      return updatedList;
    } catch (e) {
      console.error("Error assigning word to deck", e);
      return [];
    }
  }
};
