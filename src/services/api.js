const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // Check backend server health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/health`);
      return await res.json();
    } catch (e) {
      console.warn("Backend server not connected, fallback to local mode.");
      return null;
    }
  },

  // Fetch all study sets from API
  async getStudySets() {
    try {
      const res = await fetch(`${API_BASE}/study-sets`);
      if (!res.ok) throw new Error('Failed to fetch study sets');
      return await res.json();
    } catch (e) {
      console.error("API error getStudySets:", e);
      return null;
    }
  },

  // Fetch single study set by ID
  async getStudySetById(id) {
    try {
      const res = await fetch(`${API_BASE}/study-sets/${id}`);
      if (!res.ok) throw new Error('Failed to fetch study set');
      return await res.json();
    } catch (e) {
      console.error("API error getStudySetById:", e);
      return null;
    }
  },

  // Create new study set via API
  async createStudySet(setData) {
    try {
      const res = await fetch(`${API_BASE}/study-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setData)
      });
      if (!res.ok) throw new Error('Failed to create study set');
      return await res.json();
    } catch (e) {
      console.error("API error createStudySet:", e);
      return null;
    }
  },

  // Fetch all reading topics from API
  async getTopics() {
    try {
      const res = await fetch(`${API_BASE}/topics`);
      if (!res.ok) throw new Error('Failed to fetch topics');
      return await res.json();
    } catch (e) {
      console.error("API error getTopics:", e);
      return null;
    }
  },

  // Fetch single topic by slugId or ID
  async getTopicById(id) {
    try {
      const res = await fetch(`${API_BASE}/topics/${id}`);
      if (!res.ok) throw new Error('Failed to fetch topic');
      return await res.json();
    } catch (e) {
      console.error("API error getTopicById:", e);
      return null;
    }
  },

  // Submit card review result for Spaced Repetition (Leitner 5-box calculation)
  async submitCardReview(userId, setId, cardId, isCorrect) {
    try {
      const res = await fetch(`${API_BASE}/progress/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, setId, cardId, isCorrect })
      });
      return await res.json();
    } catch (e) {
      console.error("API error submitCardReview:", e);
      return null;
    }
  }
};
