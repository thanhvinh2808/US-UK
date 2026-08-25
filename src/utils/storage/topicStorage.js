import { getScopedKey, isUserScope } from './storageScope.js';

const BASE_KEY_CUSTOM_TOPICS = 'custom_topics';
const BASE_KEY_PENDING_TOPICS = 'pending_topics';
const LEGACY_KEY_CUSTOM_TOPICS = 'eng_app_custom_topics';
const LEGACY_KEY_PENDING_TOPICS = 'eng_app_pending_topics';

export const topicStorage = {
  getCustomTopics: (explicitUserId = undefined) => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const key = getScopedKey(BASE_KEY_CUSTOM_TOPICS, explicitUserId);
      let data = localStorage.getItem(key);

      // Controlled fallback: If guest has no data yet, check legacy un-scoped key
      if (!data && !isUserScope() && explicitUserId === undefined) {
        const legacyData = localStorage.getItem(LEGACY_KEY_CUSTOM_TOPICS);
        if (legacyData) {
          data = legacyData;
        }
      }

      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Recovered from corrupted custom topics JSON:', e.message);
      return [];
    }
  },

  saveCustomTopic: (topicObj) => {
    try {
      if (!topicObj || typeof topicObj !== 'object' || !topicObj.id) {
        return topicStorage.getCustomTopics();
      }
      const list = topicStorage.getCustomTopics();
      const filtered = list.filter(t => t && t.id !== topicObj.id);
      const updated = [...filtered, topicObj];
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_CUSTOM_TOPICS);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error saving custom topic', e);
      return [];
    }
  },

  deleteCustomTopic: (topicId) => {
    try {
      if (!topicId) return topicStorage.getCustomTopics();
      const list = topicStorage.getCustomTopics();
      const updated = list.filter(t => t && t.id !== topicId);
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_CUSTOM_TOPICS);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error deleting custom topic', e);
      return [];
    }
  },

  getPendingTopics: (explicitUserId = undefined) => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const key = getScopedKey(BASE_KEY_PENDING_TOPICS, explicitUserId);
      let data = localStorage.getItem(key);

      // Controlled fallback: If guest has no data yet, check legacy un-scoped key
      if (!data && !isUserScope() && explicitUserId === undefined) {
        const legacyData = localStorage.getItem(LEGACY_KEY_PENDING_TOPICS);
        if (legacyData) {
          data = legacyData;
        }
      }

      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Recovered from corrupted pending topics JSON:', e.message);
      return [];
    }
  },

  savePendingTopic: (topicObj) => {
    try {
      if (!topicObj || typeof topicObj !== 'object' || !topicObj.id) {
        return topicStorage.getPendingTopics();
      }
      const list = topicStorage.getPendingTopics();
      const filtered = list.filter(t => t && t.id !== topicObj.id);
      const updated = [...filtered, topicObj];
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_PENDING_TOPICS);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error saving pending topic', e);
      return [];
    }
  },

  deletePendingTopic: (topicId) => {
    try {
      if (!topicId) return topicStorage.getPendingTopics();
      const list = topicStorage.getPendingTopics();
      const updated = list.filter(t => t && t.id !== topicId);
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_PENDING_TOPICS);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error deleting pending topic', e);
      return [];
    }
  }
};

export default topicStorage;
