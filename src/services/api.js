const API_BASE = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) || 'http://localhost:5000/api';

// In-Memory Token Store & Auth Handlers
let currentAccessToken = null;
let onTokenUpdateCallback = null;
let onAuthFailedCallback = null;
let refreshPromise = null;

/**
 * Configure Auth callbacks from AuthContext (Memory-only token binding)
 */
export const configureApiClient = ({ getToken, setToken, onAuthFailed }) => {
  if (getToken) {
    // Allows custom token getter
  }
  if (setToken) {
    onTokenUpdateCallback = setToken;
  }
  if (onAuthFailed) {
    onAuthFailedCallback = onAuthFailed;
  }
};

/**
 * Update current in-memory access token
 */
export const setApiAccessToken = (token) => {
  currentAccessToken = token;
};

/**
 * Get current in-memory access token
 */
export const getApiAccessToken = () => currentAccessToken;

/**
 * Internal single-flight silent refresh mechanism
 * Prevents concurrent refresh storms
 */
async function performSilentRefresh() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Sends HttpOnly refreshToken cookie
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.accessToken) {
        const newAccessToken = data.accessToken;
        const user = data.user;
        currentAccessToken = newAccessToken;
        if (onTokenUpdateCallback) {
          onTokenUpdateCallback(newAccessToken, user);
        }
        return { success: true, accessToken: newAccessToken, user };
      } else {
        currentAccessToken = null;
        if (onTokenUpdateCallback) {
          onTokenUpdateCallback(null, null);
        }
        if (onAuthFailedCallback) {
          onAuthFailedCallback(data?.error || { message: 'Session expired' });
        }
        return { success: false, error: data?.error || { message: 'Session expired' } };
      }
    } catch (err) {
      currentAccessToken = null;
      if (onTokenUpdateCallback) {
        onTokenUpdateCallback(null, null);
      }
      if (onAuthFailedCallback) {
        onAuthFailedCallback({ message: err.message || 'Network error during refresh' });
      }
      return { success: false, error: { message: err.message } };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Core Authenticated Request Helper with Automatic 401 Refresh & 1-Time Retry
 */
async function requestWithAuth(url, options = {}, isRetry = false) {
  const headers = { ...(options.headers || {}) };

  // Attach Bearer token if present in memory
  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`;
  }

  // Ensure JSON content type by default if body is present and not FormData
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' // Always support cookies for auth endpoints
  };

  try {
    const res = await fetch(url, fetchOptions);

    // If 401 Unauthorized (e.g. TOKEN_EXPIRED) and hasn't retried yet
    if (res.status === 401 && !isRetry) {
      const errData = await res.clone().json().catch(() => ({}));
      const errorCode = errData?.error?.code;

      // Try silent refresh if token was expired or missing/invalid
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN' || currentAccessToken) {
        const refreshResult = await performSilentRefresh();

        if (refreshResult.success && refreshResult.accessToken) {
          // Retry initial request with new access token exactly once
          const retryHeaders = {
            ...headers,
            'Authorization': `Bearer ${refreshResult.accessToken}`
          };
          return await fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: 'include'
          });
        }
      }
    }

    return res;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Check backend server health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/health`);
      return await res.json();
    } catch (e) {
      console.warn('Backend server not connected, fallback to local mode.');
      return null;
    }
  },

  // ================= AUTHENTICATION ENDPOINTS =================

  async register({ username, email, password, preferredAccent, targetBand }) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, preferredAccent, targetBand })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          status: res.status,
          error: data.error || { message: 'Registration failed', code: 'REGISTER_ERROR' }
        };
      }
      return { success: true, status: res.status, data };
    } catch (err) {
      return {
        success: false,
        status: 0,
        error: { message: err.message || 'Network error', code: 'NETWORK_ERROR' }
      };
    }
  },

  async login({ email, password }) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          status: res.status,
          error: data.error || { message: 'Login failed', code: 'LOGIN_ERROR' }
        };
      }

      // Store in-memory token
      if (data.accessToken) {
        currentAccessToken = data.accessToken;
      }

      return {
        success: true,
        status: res.status,
        accessToken: data.accessToken,
        user: data.user
      };
    } catch (err) {
      return {
        success: false,
        status: 0,
        error: { message: err.message || 'Network error', code: 'NETWORK_ERROR' }
      };
    }
  },

  async refreshToken() {
    return await performSilentRefresh();
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentAccessToken ? { 'Authorization': `Bearer ${currentAccessToken}` } : {})
        },
        credentials: 'include'
      });
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      currentAccessToken = null;
    }
    return { success: true };
  },

  async logoutAll() {
    try {
      await requestWithAuth(`${API_BASE}/auth/logout-all`, {
        method: 'POST'
      });
    } catch (err) {
      console.warn('Logout-all API error:', err.message);
    } finally {
      currentAccessToken = null;
    }
    return { success: true };
  },

  async getMe() {
    try {
      const res = await requestWithAuth(`${API_BASE}/auth/me`, {
        method: 'GET'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch (err) {
      return null;
    }
  },

  // ================= AI GATEWAY ENDPOINT =================

  async generateAi({ prompt, systemInstruction }) {
    try {
      const res = await requestWithAuth(`${API_BASE}/ai/generate`, {
        method: 'POST',
        body: JSON.stringify({ prompt, systemInstruction })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || { message: 'AI generation failed', code: 'AI_ERROR' }
        };
      }
      return { success: true, text: data.text };
    } catch (err) {
      return {
        success: false,
        error: { message: err.message || 'AI service unavailable', code: 'NETWORK_ERROR' }
      };
    }
  },

  // ================= TOPICS (READING PASSAGES & LESSONS) =================

  // Fetch all reading topics (Public)
  async getTopics() {
    try {
      const res = await fetch(`${API_BASE}/topics`);
      if (!res.ok) throw new Error('Failed to fetch topics');
      return await res.json();
    } catch (e) {
      console.error('API error getTopics:', e);
      return null;
    }
  },

  // Fetch single topic by slugId or ID (Public)
  async getTopicById(id) {
    try {
      const res = await fetch(`${API_BASE}/topics/${id}`);
      if (!res.ok) throw new Error('Failed to fetch topic');
      return await res.json();
    } catch (e) {
      console.error('API error getTopicById:', e);
      return null;
    }
  },

  // Create new topic (Protected: JWT Admin Role)
  async createTopic(topicData) {
    try {
      const res = await requestWithAuth(`${API_BASE}/topics`, {
        method: 'POST',
        body: JSON.stringify(topicData)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || errData.error || 'Failed to create topic');
      }
      return await res.json();
    } catch (e) {
      console.error('API error createTopic:', e);
      return null;
    }
  },

  // Update existing topic (Protected: JWT Admin Role)
  async updateTopic(id, topicData) {
    try {
      const res = await requestWithAuth(`${API_BASE}/topics/${id}`, {
        method: 'PUT',
        body: JSON.stringify(topicData)
      });
      if (!res.ok) throw new Error('Failed to update topic');
      return await res.json();
    } catch (e) {
      console.error('API error updateTopic:', e);
      return null;
    }
  },

  // Delete topic (Protected: JWT Admin Role)
  async deleteTopic(id) {
    try {
      const res = await requestWithAuth(`${API_BASE}/topics/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete topic');
      return await res.json();
    } catch (e) {
      console.error('API error deleteTopic:', e);
      return null;
    }
  },

  // ================= STUDY SETS =================

  async getStudySets() {
    try {
      const res = await fetch(`${API_BASE}/study-sets`);
      if (!res.ok) throw new Error('Failed to fetch study sets');
      return await res.json();
    } catch (e) {
      console.error('API error getStudySets:', e);
      return null;
    }
  },

  async getStudySetById(id) {
    try {
      const res = await fetch(`${API_BASE}/study-sets/${id}`);
      if (!res.ok) throw new Error('Failed to fetch study set');
      return await res.json();
    } catch (e) {
      console.error('API error getStudySetById:', e);
      return null;
    }
  },

  async createStudySet(setData) {
    try {
      const res = await requestWithAuth(`${API_BASE}/study-sets`, {
        method: 'POST',
        body: JSON.stringify(setData)
      });
      if (!res.ok) throw new Error('Failed to create study set');
      return await res.json();
    } catch (e) {
      console.error('API error createStudySet:', e);
      return null;
    }
  },

  async updateStudySet(id, setData) {
    try {
      const res = await requestWithAuth(`${API_BASE}/study-sets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(setData)
      });
      if (!res.ok) throw new Error('Failed to update study set');
      return await res.json();
    } catch (e) {
      console.error('API error updateStudySet:', e);
      return null;
    }
  },

  async deleteStudySet(id) {
    try {
      const res = await requestWithAuth(`${API_BASE}/study-sets/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete study set');
      return await res.json();
    } catch (e) {
      console.error('API error deleteStudySet:', e);
      return null;
    }
  },

  // ================= PROGRESS & SM-2 =================

  // Submit card review (Protected: server automatically binds to req.user.id)
  async submitCardReview(userId, setId, cardId, isCorrect, grade) {
    try {
      const res = await requestWithAuth(`${API_BASE}/progress/review`, {
        method: 'POST',
        body: JSON.stringify({ setId, cardId, isCorrect, grade })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('API submitCardReview skipped (offline mode):', e.message);
      return null;
    }
  },

  // Get authenticated user progress
  async getMyProgress(setId) {
    try {
      const url = setId
        ? `${API_BASE}/progress/my-progress?setId=${encodeURIComponent(setId)}`
        : `${API_BASE}/progress/my-progress`;
      const res = await requestWithAuth(url, { method: 'GET' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }
};

export default api;
