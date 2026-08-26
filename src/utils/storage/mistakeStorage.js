import { getScopedKey, isUserScope } from './storageScope.js';

const BASE_KEY_MISTAKES = 'mistake_bank';
const LEGACY_KEY_MISTAKES = 'eng_app_mistake_bank';
const MAX_MISTAKES_STORED = 500;

export const mistakeStorage = {
  saveMistake: (mistake) => {
    try {
      if (!mistake || typeof mistake !== 'object') return mistakeStorage.getMistakes();
      const list = mistakeStorage.getMistakes();

      const moduleName = mistake.module || 'khac';
      const skillName = mistake.skill || 'Khác';
      const questionText = mistake.question || '';
      const correctAnswerText = mistake.correctAnswer || '';
      const userAnswerText = mistake.userAnswer || '';
      const topicId = mistake.topicId || null;

      // Deduplicate: If the exact mistake for this question & module already exists, update and move to top
      const filteredList = list.filter(m => {
        if (!m) return false;
        const sameModule = m.module === moduleName;
        const sameQuestion = (m.question || '').trim().toLowerCase() === questionText.trim().toLowerCase();
        const sameCorrect = (m.correctAnswer || '').trim().toLowerCase() === correctAnswerText.trim().toLowerCase();
        return !(sameModule && sameQuestion && sameCorrect);
      });

      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        module: moduleName,
        skill: skillName,
        question: questionText,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        topicId: topicId,
      };
      const updated = [entry, ...filteredList].slice(0, MAX_MISTAKES_STORED);
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_MISTAKES);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error saving mistake', e);
      return [];
    }
  },

  getMistakes: (moduleFilter = null, explicitUserId = undefined) => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const key = getScopedKey(BASE_KEY_MISTAKES, explicitUserId);
      let data = localStorage.getItem(key);

      // Controlled fallback: If guest has no data yet, check legacy un-scoped key
      if (!data && !isUserScope() && explicitUserId === undefined) {
        const legacyData = localStorage.getItem(LEGACY_KEY_MISTAKES);
        if (legacyData) {
          data = legacyData;
        }
      }

      if (!data) return [];
      const parsed = JSON.parse(data);
      const list = Array.isArray(parsed) ? parsed : [];
      if (moduleFilter) {
        return list.filter(m => m && m.module === moduleFilter);
      }
      return list;
    } catch (e) {
      console.warn('Recovered from corrupted mistake bank JSON:', e.message);
      return [];
    }
  },

  deleteMistake: (id) => {
    try {
      if (!id) return mistakeStorage.getMistakes();
      const list = mistakeStorage.getMistakes();
      const updated = list.filter(m => m && m.id !== id);
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_MISTAKES);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error deleting mistake', e);
      return [];
    }
  },

  clearMistakes: (moduleFilter = null) => {
    try {
      const key = getScopedKey(BASE_KEY_MISTAKES);
      if (!moduleFilter) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, JSON.stringify([]));
        }
        return [];
      }
      const list = mistakeStorage.getMistakes();
      const updated = list.filter(m => m && m.module !== moduleFilter);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error clearing mistake bank', e);
      return [];
    }
  },

  getWeaknessStats: () => {
    try {
      const list = mistakeStorage.getMistakes();
      const counts = {};
      list.forEach(m => {
        if (m && m.skill) {
          counts[m.skill] = (counts[m.skill] || 0) + 1;
        }
      });
      return Object.entries(counts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count);
    } catch (e) {
      console.error('Error computing weakness stats', e);
      return [];
    }
  }
};

export default mistakeStorage;
