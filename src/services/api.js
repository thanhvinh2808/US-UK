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

  // Create new topic (bài học) via API
  async createTopic(topicData) {
    try {
      const res = await fetch(`${API_BASE}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create topic');
      }
      return await res.json();
    } catch (e) {
      console.error("API error createTopic:", e);
      return null;
    }
  },

  // Update existing topic (bài học) via API
  async updateTopic(id, topicData) {
    try {
      const res = await fetch(`${API_BASE}/topics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData)
      });
      if (!res.ok) throw new Error('Failed to update topic');
      return await res.json();
    } catch (e) {
      console.error("API error updateTopic:", e);
      return null;
    }
  },

  // Delete topic (bài học) via API
  async deleteTopic(id) {
    try {
      const res = await fetch(`${API_BASE}/topics/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete topic');
      return await res.json();
    } catch (e) {
      console.error("API error deleteTopic:", e);
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
