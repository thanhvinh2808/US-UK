/**
 * CEFR Progress Storage Engine (Phase 17)
 * Implements scoped persistence, activity completion, idempotent XP rewards,
 * SM-2 vocabulary ingestion, mistake logging, and multi-tab synchronization.
 */

import { getScopedKey } from '../storage/storageScope.js';
import { userStorage } from '../storage/userStorage.js';
import { vocabStorage } from '../storage/vocabStorage.js';
import { mistakeStorage } from '../storage/mistakeStorage.js';
import { broadcastTabMessage } from '../storage/multiTabSync.js';
import { getCEFRUnit } from './cefrEngine.js';
import { calculateUnitMastery } from './masteryEngine.js';

const BASE_KEY_CEFR_PROGRESS = 'cefr_progress';

export const defaultCEFRProgress = {
  completedLessons: [],
  completedActivities: [],
  lessonProgress: {}, // { [lessonId]: { score: 1.0, completedAt: number, attempts: number } }
  unitMastery: {}, // { [unitId]: percentage }
  levelStatus: { A1: 'in_progress' },
  lastActiveLesson: null,
  activityXPJournal: {}, // { [activityId]: xpAwarded } (prevents duplicate XP)
  lessonXPJournal: {}, // { [lessonId]: xpAwarded } (prevents duplicate XP)
  updatedAt: null
};

export const cefrProgressStorage = {
  /**
   * Retrieves the CEFR progress for current or explicit user scope.
   */
  getCEFRProgress: (explicitUserId = undefined) => {
    try {
      if (typeof localStorage === 'undefined') return { ...defaultCEFRProgress };
      const key = getScopedKey(BASE_KEY_CEFR_PROGRESS, explicitUserId);
      const data = localStorage.getItem(key);

      if (!data) return { ...defaultCEFRProgress };

      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ...defaultCEFRProgress };
      }

      return {
        completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
        completedActivities: Array.isArray(parsed.completedActivities) ? parsed.completedActivities : [],
        lessonProgress: (parsed.lessonProgress && typeof parsed.lessonProgress === 'object') ? parsed.lessonProgress : {},
        unitMastery: (parsed.unitMastery && typeof parsed.unitMastery === 'object') ? parsed.unitMastery : {},
        levelStatus: (parsed.levelStatus && typeof parsed.levelStatus === 'object') ? parsed.levelStatus : { A1: 'in_progress' },
        lastActiveLesson: parsed.lastActiveLesson || null,
        activityXPJournal: (parsed.activityXPJournal && typeof parsed.activityXPJournal === 'object') ? parsed.activityXPJournal : {},
        lessonXPJournal: (parsed.lessonXPJournal && typeof parsed.lessonXPJournal === 'object') ? parsed.lessonXPJournal : {},
        updatedAt: parsed.updatedAt || null
      };
    } catch (e) {
      console.warn('Recovered from corrupted CEFR progress JSON:', e.message);
      return { ...defaultCEFRProgress };
    }
  },

  /**
   * Directly writes CEFR progress to scoped storage.
   */
  saveCEFRProgress: (progressObj, explicitUserId = undefined) => {
    try {
      if (typeof localStorage === 'undefined') return progressObj;
      const key = getScopedKey(BASE_KEY_CEFR_PROGRESS, explicitUserId);
      const safeData = {
        ...defaultCEFRProgress,
        ...(progressObj || {}),
        updatedAt: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(safeData));
      broadcastTabMessage('CEFR_PROGRESS_UPDATED');
      return safeData;
    } catch (e) {
      console.error('Error saving CEFR progress to storage:', e);
      return progressObj;
    }
  },

  /**
   * Completes an individual Activity inside a Lesson.
   * Handles idempotent XP reward, vocabulary addition, mistake logging, and streak recording.
   */
  completeCEFRActivity: ({
    activityId,
    lessonId,
    unitId,
    _score = 1.0,
    isCorrect = true,
    xpReward = 10,
    mistakeData = null,
    vocabWords = []
  }) => {
    if (!activityId) return cefrProgressStorage.getCEFRProgress();

    const current = cefrProgressStorage.getCEFRProgress();
    const completedActs = new Set(current.completedActivities);
    completedActs.add(activityId);

    const activityXPJournal = { ...(current.activityXPJournal || {}) };

    // Idempotent XP Awarding
    if (!activityXPJournal[activityId] && xpReward > 0 && isCorrect) {
      activityXPJournal[activityId] = xpReward;
      const currentStats = userStorage.getUserStats();
      userStorage.updateUserStats({
        points: (currentStats.points || 0) + xpReward
      });
    }

    // Ingest new vocabulary into SM-2 store
    if (Array.isArray(vocabWords) && vocabWords.length > 0) {
      vocabWords.forEach(wordItem => {
        if (typeof wordItem === 'string') {
          vocabStorage.saveWord({
            word: wordItem,
            topic: unitId ? `Unit ${unitId}` : 'CEFR A1',
            status: 'learning',
            repetitions: 0,
            interval: 1,
            easinessFactor: 2.5
          });
        } else if (wordItem && wordItem.word) {
          vocabStorage.saveWord({
            ...wordItem,
            topic: wordItem.topic || (unitId ? `Unit ${unitId}` : 'CEFR A1'),
            status: 'learning',
            repetitions: 0,
            interval: 1,
            easinessFactor: 2.5
          });
        }
      });
    }

    // Log mistake to Mistake Bank if answer was incorrect
    if (!isCorrect && mistakeData) {
      mistakeStorage.saveMistake({
        module: 'cefr_lesson',
        skill: mistakeData.skill || 'Ngữ pháp & Từ vựng',
        question: mistakeData.question || '',
        userAnswer: mistakeData.userAnswer || '',
        correctAnswer: mistakeData.correctAnswer || '',
        topicId: unitId || 'cefr_a1'
      });
    }

    // Record learning activity for streak
    userStorage.recordActivity();

    const updated = {
      ...current,
      completedActivities: Array.from(completedActs),
      activityXPJournal,
      lastActiveLesson: lessonId || current.lastActiveLesson
    };

    return cefrProgressStorage.saveCEFRProgress(updated);
  },

  /**
   * Completes a Lesson and updates Unit Mastery and Level status.
   */
  completeCEFRLesson: ({
    lessonId,
    unitId,
    score = 1.0,
    xpReward = 25
  }) => {
    if (!lessonId) return cefrProgressStorage.getCEFRProgress();

    const current = cefrProgressStorage.getCEFRProgress();
    const completedLessons = new Set(current.completedLessons);
    completedLessons.add(lessonId);

    const lessonProgress = { ...(current.lessonProgress || {}) };
    const prevEntry = lessonProgress[lessonId] || { attempts: 0, score: 0 };
    lessonProgress[lessonId] = {
      score: Math.max(prevEntry.score || 0, score),
      completedAt: Date.now(),
      attempts: (prevEntry.attempts || 0) + 1
    };

    const lessonXPJournal = { ...(current.lessonXPJournal || {}) };
    if (!lessonXPJournal[lessonId] && xpReward > 0) {
      lessonXPJournal[lessonId] = xpReward;
      const currentStats = userStorage.getUserStats();
      userStorage.updateUserStats({
        points: (currentStats.points || 0) + xpReward
      });
    }

    // Calculate updated Unit Mastery
    const unitMastery = { ...(current.unitMastery || {}) };
    if (unitId) {
      const unitObj = getCEFRUnit(unitId);
      if (unitObj) {
        const tempProgress = {
          ...current,
          completedLessons: Array.from(completedLessons),
          lessonProgress
        };
        unitMastery[unitId] = calculateUnitMastery(unitObj, tempProgress);
      }
    }

    // Record learning activity for streak
    userStorage.recordActivity();

    const updated = {
      ...current,
      completedLessons: Array.from(completedLessons),
      lessonProgress,
      unitMastery,
      lessonXPJournal,
      lastActiveLesson: lessonId
    };

    return cefrProgressStorage.saveCEFRProgress(updated);
  }
};

export default cefrProgressStorage;
