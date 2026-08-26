import { calculateSM2 } from './sm2.js';
import { userStorage, defaultStats } from './userStorage.js';
import { vocabStorage } from './vocabStorage.js';
import { deckStorage } from './deckStorage.js';
import { topicStorage } from './topicStorage.js';
import { progressStorage } from './progressStorage.js';
import { mistakeStorage } from './mistakeStorage.js';
import {
  setStorageScope,
  getCurrentUserId,
  getCurrentScope,
  isUserScope,
  getScopedKey,
  onStorageScopeChange
} from './storageScope.js';
import {
  getOutboxQueue,
  enqueueReviewAction,
  removeActionFromQueue,
  clearOutboxQueue,
  flushOutboxQueue,
  hydrateFromServer,
  onSyncComplete
} from './syncEngine.js';
import {
  broadcastTabMessage,
  subscribeTabMessages
} from './multiTabSync.js';
import {
  checkGuestDataExists,
  mergeGuestDataToAccount,
  clearGuestData,
  calculateStreakFromActivity,
  getMigrationJournal
} from './guestMergeEngine.js';

import { cefrProgressStorage, defaultCEFRProgress } from '../cefr/cefrProgressStorage.js';

export {
  calculateSM2,
  userStorage,
  defaultStats,
  vocabStorage,
  deckStorage,
  topicStorage,
  progressStorage,
  mistakeStorage,
  cefrProgressStorage,
  defaultCEFRProgress,
  setStorageScope,
  getCurrentUserId,
  getCurrentScope,
  isUserScope,
  getScopedKey,
  onStorageScopeChange,
  getOutboxQueue,
  enqueueReviewAction,
  removeActionFromQueue,
  clearOutboxQueue,
  flushOutboxQueue,
  hydrateFromServer,
  onSyncComplete,
  broadcastTabMessage,
  subscribeTabMessages,
  checkGuestDataExists,
  mergeGuestDataToAccount,
  clearGuestData,
  calculateStreakFromActivity,
  getMigrationJournal
};

/**
 * Unified, backward-compatible Storage Facade.
 * Combines all modularized storage operations into a single API.
 */
export const storage = {
  // Storage Scoping & Session Isolation
  setStorageScope,
  getCurrentUserId,
  getCurrentScope,
  isUserScope,
  getScopedKey,
  onStorageScopeChange,

  // Offline Outbox & Sync
  getOutboxQueue,
  enqueueReviewAction,
  removeActionFromQueue,
  clearOutboxQueue,
  flushOutboxQueue,
  hydrateFromServer,
  onSyncComplete,

  // Multi-Tab Sync
  broadcastTabMessage,
  subscribeTabMessages,

  // User & Activity methods
  getDeviceId: userStorage.getDeviceId,
  getUserStats: userStorage.getUserStats,
  updateUserStats: userStorage.updateUserStats,
  recordActivity: userStorage.recordActivity,
  incrementActivity: userStorage.incrementActivity,

  // Vocabulary & Word progress (SM-2)
  getSavedVocab: vocabStorage.getSavedVocab,
  setSavedVocabDirect: vocabStorage.setSavedVocabDirect,
  saveWord: vocabStorage.saveWord,
  deleteWord: vocabStorage.deleteWord,
  updateWordProgress: vocabStorage.updateWordProgress,
  resetWord: vocabStorage.resetWord,
  assignWordToDeck: vocabStorage.assignWordToDeck,

  // Custom Decks
  getCustomDecks: deckStorage.getCustomDecks,
  saveCustomDeck: deckStorage.saveCustomDeck,
  deleteCustomDeck: deckStorage.deleteCustomDeck,

  // Topics & Progress
  getTopicProgress: progressStorage.getTopicProgress,
  updateTopicProgress: progressStorage.updateTopicProgress,
  getCustomTopics: topicStorage.getCustomTopics,
  saveCustomTopic: topicStorage.saveCustomTopic,
  deleteCustomTopic: topicStorage.deleteCustomTopic,
  getPendingTopics: topicStorage.getPendingTopics,
  savePendingTopic: topicStorage.savePendingTopic,
  deletePendingTopic: topicStorage.deletePendingTopic,

  // Mistake Bank & Weaknesses
  saveMistake: mistakeStorage.saveMistake,
  getMistakes: mistakeStorage.getMistakes,
  deleteMistake: mistakeStorage.deleteMistake,
  clearMistakes: mistakeStorage.clearMistakes,
  getWeaknessStats: mistakeStorage.getWeaknessStats,

  // CEFR Learning Engine Progress
  getCEFRProgress: cefrProgressStorage.getCEFRProgress,
  saveCEFRProgress: cefrProgressStorage.saveCEFRProgress,
  completeCEFRActivity: cefrProgressStorage.completeCEFRActivity,
  completeCEFRLesson: cefrProgressStorage.completeCEFRLesson,

  // Guest Learning & Account Merge
  checkGuestDataExists,
  mergeGuestDataToAccount,
  clearGuestData,
  calculateStreakFromActivity,
  getMigrationJournal
};

export default storage;
