/**
 * Learning Data Export Engine
 * Exports user's localized learning progress, notebook vocabulary,
 * mistake bank, and custom decks into a structured, portable JSON document.
 */

import { vocabStorage } from '../storage/vocabStorage.js';
import { userStorage } from '../storage/userStorage.js';
import { progressStorage } from '../storage/progressStorage.js';
import { mistakeStorage } from '../storage/mistakeStorage.js';
import { deckStorage } from '../storage/deckStorage.js';
import { topicStorage } from '../storage/topicStorage.js';
import { getCurrentScope, isUserScope } from '../storage/storageScope.js';

/**
 * Builds the complete export bundle object.
 */
export const buildExportData = () => {
  const scope = getCurrentScope();
  const vocab = vocabStorage.getSavedVocab();
  const stats = userStorage.getUserStats();
  const progress = progressStorage.getTopicProgress();
  const mistakes = mistakeStorage.getMistakes();
  const decks = deckStorage.getCustomDecks();
  const customTopics = topicStorage.getCustomTopics();

  return {
    app: 'Antigravity English V2',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    scope: isUserScope() ? 'user' : 'guest',
    metadata: {
      totalVocab: vocab.length,
      totalMistakes: mistakes.length,
      totalDecks: decks.length,
      totalTopics: customTopics.length,
      streak: stats.streak || 0,
      points: stats.points || 0
    },
    data: {
      vocab,
      stats,
      progress,
      mistakes,
      decks,
      customTopics
    }
  };
};

/**
 * Triggers a browser download of the export JSON file.
 * @param {string} [filename]
 */
export const exportDataToFile = (filename = null) => {
  const exportPayload = buildExportData();
  const dateStr = new Date().toISOString().slice(0, 10);
  const defaultName = `antigravity_english_backup_${dateStr}.json`;
  const name = filename || defaultName;

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });

  if (typeof window !== 'undefined' && window.document) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return { success: true, filename: name, size: jsonStr.length };
};

export default {
  buildExportData,
  exportDataToFile
};
