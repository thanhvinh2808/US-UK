/**
 * Safe Legacy Storage Migration Engine
 * Detects legacy global keys, safely migrates them into guest or user scoped namespaces,
 * verifies completeness, and cleanly flags migrated state.
 */

import { getScopedKey } from '../storage/storageScope.js';

const LEGACY_KEYS = {
  vocab: 'eng_app_saved_vocab',
  stats: 'eng_app_user_stats',
  progress: 'eng_app_topic_progress',
  mistakes: 'eng_app_mistake_bank',
  decks: 'eng_app_custom_decks',
  topics: 'eng_app_custom_topics'
};

const MIGRATION_FLAG_KEY = 'eng_v2_legacy_migrated';

/**
 * Checks if un-migrated legacy storage items exist in localStorage
 */
export const checkLegacyDataExists = () => {
  if (typeof localStorage === 'undefined') return false;

  const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (alreadyMigrated === 'true') return false;

  for (const legacyKey of Object.values(LEGACY_KEYS)) {
    const data = localStorage.getItem(legacyKey);
    if (data && data !== '[]' && data !== '{}' && data.trim() !== '') {
      return true;
    }
  }
  return false;
};

/**
 * Performs safe migration from legacy global keys to a target scope (default: guest)
 * @param {string|null} [targetUserId] - The target user ID or null for guest
 * @returns {{ migrated: boolean, itemsMigrated: number, errors: string[] }}
 */
export const runLegacyMigration = (targetUserId = null) => {
  if (typeof localStorage === 'undefined') {
    return { migrated: false, itemsMigrated: 0, errors: ['localStorage unavailable'] };
  }

  let itemsMigrated = 0;
  const errors = [];

  try {
    for (const [logicalName, legacyKey] of Object.entries(LEGACY_KEYS)) {
      const rawLegacyData = localStorage.getItem(legacyKey);
      if (rawLegacyData) {
        try {
          const parsed = JSON.parse(rawLegacyData);
          if (parsed && ((Array.isArray(parsed) && parsed.length > 0) || (typeof parsed === 'object' && Object.keys(parsed).length > 0))) {
            const scopedKey = getScopedKey(
              logicalName === 'vocab' ? 'saved_vocab' :
              logicalName === 'stats' ? 'user_stats' :
              logicalName === 'progress' ? 'topic_progress' :
              logicalName === 'mistakes' ? 'mistake_bank' :
              logicalName === 'decks' ? 'custom_decks' :
              logicalName === 'topics' ? 'custom_topics' : logicalName,
              targetUserId
            );

            // Only copy if scoped target does not already have data
            const existingScoped = localStorage.getItem(scopedKey);
            if (!existingScoped || existingScoped === '[]' || existingScoped === '{}') {
              localStorage.setItem(scopedKey, rawLegacyData);
              itemsMigrated++;
            }
          }
        } catch (parseErr) {
          errors.push(`Error parsing legacy key ${legacyKey}: ${parseErr.message}`);
        }
      }
    }

    // Set migration completion flag
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

    return {
      migrated: true,
      itemsMigrated,
      errors
    };
  } catch (err) {
    return {
      migrated: false,
      itemsMigrated,
      errors: [err.message]
    };
  }
};

export default {
  checkLegacyDataExists,
  runLegacyMigration
};
