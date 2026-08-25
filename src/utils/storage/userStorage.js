import { getScopedKey, isUserScope } from './storageScope.js';

const BASE_KEY_STATS = 'user_stats';
const BASE_KEY_DEVICE = 'device_id';
const LEGACY_KEY_STATS = 'eng_app_user_stats';

export const defaultStats = {
  streak: 0,
  points: 0,
  level: 'A1',
  lastActive: null,
  completedModules: 0,
  activityHistory: {} // "YYYY-MM-DD" -> count
};

export const userStorage = {
  getDeviceId: () => {
    try {
      if (typeof localStorage === 'undefined') return 'dev_guest';
      const key = getScopedKey(BASE_KEY_DEVICE);
      let id = localStorage.getItem(key);
      if (!id) {
        id = 'dev_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now());
        localStorage.setItem(key, id);
      }
      return id;
    } catch (e) {
      return 'dev_guest';
    }
  },

  getUserStats: () => {
    try {
      if (typeof localStorage === 'undefined') return { ...defaultStats };
      const key = getScopedKey(BASE_KEY_STATS);
      let data = localStorage.getItem(key);

      // Controlled fallback: If guest has no data yet, check legacy un-scoped key
      if (!data && !isUserScope()) {
        const legacyData = localStorage.getItem(LEGACY_KEY_STATS);
        if (legacyData) {
          data = legacyData;
        }
      }

      let stats = { ...defaultStats };
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            stats = { ...defaultStats, ...parsed };
          }
        } catch (e) {
          console.warn('Recovered from corrupted user stats JSON:', e.message);
        }
      }

      // Ensure activityHistory exists
      if (!stats.activityHistory || typeof stats.activityHistory !== 'object') {
        stats.activityHistory = {};
      }

      // Automatic streak validation/update
      const now = new Date();
      if (stats.lastActive) {
        const lastActiveDate = new Date(stats.lastActive);
        const diffTime = Math.abs(now.setHours(0, 0, 0, 0) - lastActiveDate.setHours(0, 0, 0, 0));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          stats.streak = 0;
          localStorage.setItem(key, JSON.stringify(stats));
        }
      }

      return stats;
    } catch (e) {
      console.error('Error getting user stats', e);
      return { ...defaultStats };
    }
  },

  updateUserStats: (updates) => {
    try {
      const current = userStorage.getUserStats();
      const safeUpdates = (updates && typeof updates === 'object') ? updates : {};
      const updated = {
        ...current,
        ...safeUpdates
      };
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_STATS);
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error('Error updating user stats', e);
      return { ...defaultStats };
    }
  },

  recordActivity: () => {
    try {
      const stats = userStorage.getUserStats();
      const now = new Date();
      const todayString = now.toDateString();
      const dateKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

      let updatedStats = { ...stats };
      if (!updatedStats.activityHistory || typeof updatedStats.activityHistory !== 'object') {
        updatedStats.activityHistory = {};
      }

      if (!stats.lastActive) {
        updatedStats.streak = 1;
      } else {
        const lastActiveDate = new Date(stats.lastActive);
        const lastActiveString = lastActiveDate.toDateString();

        if (lastActiveString !== todayString) {
          const diffTime = Math.abs(now.setHours(0, 0, 0, 0) - lastActiveDate.setHours(0, 0, 0, 0));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            updatedStats.streak += 1;
          } else if (diffDays > 1) {
            updatedStats.streak = 1;
          }
        }
      }

      if (updatedStats.activityHistory[dateKey] === undefined) {
        updatedStats.activityHistory[dateKey] = 0;
      }

      updatedStats.lastActive = Date.now();
      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_STATS);
        localStorage.setItem(key, JSON.stringify(updatedStats));
      }
      return updatedStats;
    } catch (e) {
      console.error('Error recording user activity', e);
      return { ...defaultStats };
    }
  },

  incrementActivity: (amount = 1) => {
    try {
      const stats = userStorage.getUserStats();
      const now = new Date();
      const dateKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const todayString = now.toDateString();

      let updatedStats = { ...stats };
      if (!updatedStats.activityHistory || typeof updatedStats.activityHistory !== 'object') {
        updatedStats.activityHistory = {};
      }

      if (!stats.lastActive) {
        updatedStats.streak = 1;
      } else {
        const lastActiveDate = new Date(stats.lastActive);
        const lastActiveString = lastActiveDate.toDateString();

        if (lastActiveString !== todayString) {
          const diffTime = Math.abs(new Date().setHours(0, 0, 0, 0) - new Date(stats.lastActive).setHours(0, 0, 0, 0));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            updatedStats.streak = (stats.streak || 0) + 1;
          } else if (diffDays > 1) {
            updatedStats.streak = 1;
          }
        }
      }

      updatedStats.activityHistory[dateKey] = (updatedStats.activityHistory[dateKey] || 0) + amount;
      updatedStats.lastActive = Date.now();

      if (typeof localStorage !== 'undefined') {
        const key = getScopedKey(BASE_KEY_STATS);
        localStorage.setItem(key, JSON.stringify(updatedStats));
      }
      return updatedStats;
    } catch (e) {
      console.error('Error incrementing user activity', e);
      return null;
    }
  }
};

export default userStorage;
