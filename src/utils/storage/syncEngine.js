/**
 * Production-Hardened Offline Outbox & Sync Engine
 * Manages reliable, offline-first queueing, background synchronization,
 * Last-Write-Wins (LWW) conflict resolution, multi-tab broadcast, and defensive recovery.
 */

import { getScopedKey, isUserScope, getCurrentUserId, onStorageScopeChange } from './storageScope.js';
import { api } from '../../services/api.js';
import { broadcastTabMessage } from './multiTabSync.js';

const KEY_OUTBOX = 'outbox_queue';
const MAX_RETRY_COUNT = 5;

let isSyncing = false;
let syncListeners = new Set();

/**
 * Reset internal syncing state (for unit testing and error recovery)
 */
export const _resetSyncingState = () => {
  isSyncing = false;
};

/**
 * Get the current scoped outbox queue from localStorage with defensive parsing
 */
export const getOutboxQueue = (userId = undefined) => {
  try {
    if (typeof localStorage === 'undefined') return [];
    const key = getScopedKey(KEY_OUTBOX, userId);
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Recovered from corrupted outbox queue JSON:', err.message);
    return [];
  }
};

/**
 * Save the scoped outbox queue to localStorage
 */
export const saveOutboxQueue = (queue, userId = undefined) => {
  try {
    if (typeof localStorage === 'undefined') return;
    const key = getScopedKey(KEY_OUTBOX, userId);
    const safeQueue = Array.isArray(queue) ? queue : [];
    localStorage.setItem(key, JSON.stringify(safeQueue));
  } catch (err) {
    console.error('Error saving outbox queue:', err);
  }
};

/**
 * Enqueue a learning review action into the persistent outbox queue
 */
export const enqueueReviewAction = ({ setId, cardId, isCorrect, grade, sm2Result = null, timestamp = Date.now() }) => {
  const queue = getOutboxQueue();
  const id = `act_${timestamp}_${Math.random().toString(36).slice(2, 7)}`;

  // Deduplicate: if an older pending action for the exact same card exists, update it with the latest state
  const existingIdx = queue.findIndex(item => item.payload.cardId === cardId && item.payload.setId === (setId || 'vocab_notebook'));

  const newAction = {
    id,
    type: 'CARD_REVIEW',
    payload: {
      setId: setId || 'vocab_notebook',
      cardId,
      isCorrect: Boolean(isCorrect),
      grade: Number(grade),
      timestamp,
      sm2Result
    },
    createdAt: timestamp,
    retryCount: 0,
    lastAttemptAt: null,
    status: 'pending'
  };

  let updatedQueue;
  if (existingIdx !== -1) {
    updatedQueue = [...queue];
    updatedQueue[existingIdx] = newAction;
  } else {
    updatedQueue = [...queue, newAction];
  }

  saveOutboxQueue(updatedQueue);
  return newAction;
};

/**
 * Remove a completed action from the queue
 */
export const removeActionFromQueue = (actionId, userId = undefined) => {
  const queue = getOutboxQueue(userId);
  const updated = queue.filter(item => item.id !== actionId);
  saveOutboxQueue(updated, userId);
};

/**
 * Clear the entire outbox queue for current scope
 */
export const clearOutboxQueue = (userId = undefined) => {
  saveOutboxQueue([], userId);
};

/**
 * Flush and sync all pending outbox queue items to the server
 */
export const flushOutboxQueue = async () => {
  // Prevent duplicate concurrent sync workers
  if (isSyncing) return { status: 'already_syncing' };

  // Check network connectivity
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { status: 'offline' };
  }

  // Only sync if in an authenticated user scope
  if (!isUserScope()) {
    return { status: 'guest_scope_skipped' };
  }

  const userId = getCurrentUserId();
  const queue = getOutboxQueue(userId);

  if (queue.length === 0) {
    return { status: 'empty_queue', syncedCount: 0, failedCount: 0 };
  }

  isSyncing = true;
  let syncedCount = 0;
  let failedCount = 0;

  try {
    const queueCopy = [...queue];
    for (const item of queueCopy) {
      // Re-check scope in case user logged out or switched account during loop
      if (getCurrentUserId() !== userId) {
        break;
      }

      if (item.type === 'CARD_REVIEW') {
        const { setId, cardId, isCorrect, grade } = item.payload;
        try {
          const res = await api.submitCardReview(setId, cardId, isCorrect, grade);

          if (res) {
            // Success: remove action from persistent queue
            removeActionFromQueue(item.id, userId);
            syncedCount++;
          } else {
            // Handled failure (e.g. 500 server error / offline)
            failedCount++;
            item.retryCount = (item.retryCount || 0) + 1;
            item.lastAttemptAt = Date.now();
            item.status = 'failed_retryable';

            if (item.retryCount >= MAX_RETRY_COUNT) {
              removeActionFromQueue(item.id, userId);
            } else {
              const currentPersistent = getOutboxQueue(userId);
              const idx = currentPersistent.findIndex(q => q.id === item.id);
              if (idx !== -1) {
                currentPersistent[idx].retryCount = item.retryCount;
                currentPersistent[idx].lastAttemptAt = item.lastAttemptAt;
                currentPersistent[idx].status = item.status;
                saveOutboxQueue(currentPersistent, userId);
              }
            }
          }
        } catch (err) {
          failedCount++;
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastAttemptAt = Date.now();
          item.status = 'failed_retryable';

          if (item.retryCount >= MAX_RETRY_COUNT) {
            removeActionFromQueue(item.id, userId);
          } else {
            const currentPersistent = getOutboxQueue(userId);
            const idx = currentPersistent.findIndex(q => q.id === item.id);
            if (idx !== -1) {
              currentPersistent[idx].retryCount = item.retryCount;
              currentPersistent[idx].lastAttemptAt = item.lastAttemptAt;
              currentPersistent[idx].status = item.status;
              saveOutboxQueue(currentPersistent, userId);
            }
          }
        }

        // Small delay between sequential requests to prevent load spikes
        await new Promise(r => setTimeout(r, 20));
      }
    }

    const remaining = getOutboxQueue(userId).length;
    notifySyncListeners({ syncedCount, failedCount, remaining });
    broadcastTabMessage('SYNC_COMPLETED', { userId, syncedCount, remaining });

    return { status: 'completed', syncedCount, failedCount };
  } finally {
    isSyncing = false;
  }
};

/**
 * Hydrates local storage with server-side progress records using Last-Write-Wins (LWW)
 *
 * @param {Function} getVocabListFn - Callback to read current local vocab list
 * @param {Function} updateVocabListFn - Callback to persist updated vocab list into local storage
 */
export const hydrateFromServer = async (getVocabListFn, updateVocabListFn) => {
  if (!isUserScope()) return { hydrated: false, reason: 'guest' };

  try {
    const serverData = await api.getMyProgress();
    if (!serverData) return { hydrated: false, reason: 'no_server_data' };

    const serverProgressList = Array.isArray(serverData.progress) ? serverData.progress : (Array.isArray(serverData) ? serverData : []);
    if (serverProgressList.length === 0) return { hydrated: true, updatedWordsCount: 0 };

    const localVocab = typeof getVocabListFn === 'function' ? getVocabListFn() : [];
    let updatedWordsCount = 0;

    const mergedVocab = localVocab.map(localWord => {
      const serverMatch = serverProgressList.find(sp => sp.cardId && sp.cardId.toLowerCase() === localWord.word.toLowerCase());
      if (!serverMatch) return localWord;

      const serverReviewTime = serverMatch.lastReviewedAt ? new Date(serverMatch.lastReviewedAt).getTime() : 0;
      const localReviewTime = localWord.nextReviewDate ? (localWord.nextReviewDate - (localWord.interval || 1) * 86400000) : (localWord.savedAt || 0);

      // Last-Write-Wins (LWW): Server wins if server's last review timestamp is strictly newer
      if (serverReviewTime > localReviewTime) {
        updatedWordsCount++;
        return {
          ...localWord,
          repetitions: serverMatch.repetitions ?? localWord.repetitions,
          interval: serverMatch.interval ?? localWord.interval,
          easinessFactor: serverMatch.easinessFactor ?? localWord.easinessFactor,
          nextReviewDate: serverMatch.nextReviewAt ? new Date(serverMatch.nextReviewAt).getTime() : localWord.nextReviewDate,
          status: serverMatch.status || localWord.status
        };
      }

      return localWord;
    });

    if (updatedWordsCount > 0 && typeof updateVocabListFn === 'function') {
      updateVocabListFn(mergedVocab);
    }

    return { hydrated: true, updatedWordsCount };
  } catch (err) {
    console.warn('Hydration warning (offline or server unreachable):', err.message);
    return { hydrated: false, error: err.message };
  }
};

/**
 * Register a listener for sync completion events
 */
export const onSyncComplete = (callback) => {
  if (typeof callback === 'function') {
    syncListeners.add(callback);
    return () => syncListeners.delete(callback);
  }
  return () => {};
};

const notifySyncListeners = (data) => {
  syncListeners.forEach(listener => {
    try {
      listener(data);
    } catch (e) {}
  });
};

// Automatic Online Listener to trigger flush when network reconnects
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOutboxQueue().catch(() => {});
  });
}

export default {
  getOutboxQueue,
  saveOutboxQueue,
  enqueueReviewAction,
  removeActionFromQueue,
  clearOutboxQueue,
  flushOutboxQueue,
  hydrateFromServer,
  onSyncComplete,
  _resetSyncingState
};
