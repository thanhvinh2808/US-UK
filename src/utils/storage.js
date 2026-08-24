/**
 * Compatibility Gateway for Storage
 * Re-exports modularized storage implementations from ./storage/index.js
 */
export {
  calculateSM2,
  userStorage,
  defaultStats,
  vocabStorage,
  deckStorage,
  topicStorage,
  progressStorage,
  mistakeStorage,
  storage,
  default
} from './storage/index.js';
