/**
 * Multi-Tab Synchronization Engine
 * Keeps active sessions, storage scopes, and review states synchronized across multiple browser tabs
 * using BroadcastChannel (with graceful fallback to StorageEvents).
 */

const CHANNEL_NAME = 'eng_v2_tab_sync';

let channel = null;
const messageListeners = new Set();

// Initialize BroadcastChannel if supported in environment
if (typeof BroadcastChannel !== 'undefined') {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event && event.data) {
        notifyListeners(event.data);
      }
    };
  } catch (e) {
    channel = null;
  }
}

// Storage event listener fallback for cross-tab messaging
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'eng_v2_tab_event' && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        notifyListeners(data);
      } catch (e) {}
    }
  });
}

const notifyListeners = (message) => {
  messageListeners.forEach(listener => {
    try {
      listener(message);
    } catch (e) {}
  });
};

/**
 * Broadcast an event to all other open tabs
 * @param {string} type - Event type (e.g., 'SCOPE_SWITCHED', 'VOCAB_UPDATED', 'SYNC_COMPLETED')
 * @param {Object} [payload] - Optional event payload
 */
export const broadcastTabMessage = (type, payload = {}) => {
  const message = {
    type,
    payload,
    timestamp: Date.now(),
    tabId: Math.random().toString(36).slice(2, 8)
  };

  // Primary: BroadcastChannel
  if (channel) {
    try {
      channel.postMessage(message);
    } catch (e) {}
  }

  // Fallback: localStorage item toggle
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('eng_v2_tab_event', JSON.stringify(message));
    } catch (e) {}
  }

  // Direct notification for in-process subscribers
  notifyListeners(message);
};

/**
 * Subscribe to cross-tab broadcast events
 * @param {Function} callback - Receives { type, payload, timestamp }
 * @returns {Function} Unsubscribe function
 */
export const subscribeTabMessages = (callback) => {
  if (typeof callback === 'function') {
    messageListeners.add(callback);
    return () => messageListeners.delete(callback);
  }
  return () => {};
};

/**
 * Clear all listeners (for unit testing)
 */
export const clearTabListeners = () => {
  messageListeners.clear();
};

export default {
  broadcastTabMessage,
  subscribeTabMessages,
  clearTabListeners
};
