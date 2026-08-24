const KEY_CUSTOM_TOPICS = "eng_app_custom_topics";
const KEY_PENDING_TOPICS = "eng_app_pending_topics";

export const topicStorage = {
  getCustomTopics: () => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(KEY_CUSTOM_TOPICS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading custom topics", e);
      return [];
    }
  },

  saveCustomTopic: (topicObj) => {
    try {
      const list = topicStorage.getCustomTopics();
      const filtered = list.filter(t => t.id !== topicObj.id);
      const updated = [...filtered, topicObj];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_CUSTOM_TOPICS, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error("Error saving custom topic", e);
      return [];
    }
  },

  deleteCustomTopic: (topicId) => {
    try {
      const list = topicStorage.getCustomTopics();
      const updated = list.filter(t => t.id !== topicId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_CUSTOM_TOPICS, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error("Error deleting custom topic", e);
      return [];
    }
  },

  getPendingTopics: () => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(KEY_PENDING_TOPICS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading pending topics", e);
      return [];
    }
  },

  savePendingTopic: (topicObj) => {
    try {
      const list = topicStorage.getPendingTopics();
      const filtered = list.filter(t => t.id !== topicObj.id);
      const updated = [...filtered, topicObj];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_PENDING_TOPICS, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error("Error saving pending topic", e);
      return [];
    }
  },

  deletePendingTopic: (topicId) => {
    try {
      const list = topicStorage.getPendingTopics();
      const updated = list.filter(t => t.id !== topicId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_PENDING_TOPICS, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error("Error deleting pending topic", e);
      return [];
    }
  }
};
