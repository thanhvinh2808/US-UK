/**
 * CEFR Learning Domain Engine (Phase 17)
 * Centralizes curriculum progression, prerequisites, and unlock status
 * without mixing domain logic into UI components.
 */

import { CEFR_LEVELS, CEFR_UNITS } from '../../data/cefrData.js';
import { calculateUnitMastery, calculateLevelMastery } from './masteryEngine.js';

export const CEFR_LEVEL_RANKS = {
  'A1': 1,
  'A2': 2,
  'B1': 3,
  'B2': 4,
  'C1': 5,
  'C2': 6
};

/**
 * Returns all available CEFR Levels sorted by rank
 */
export function getCEFRLevels() {
  return [...CEFR_LEVELS].sort((a, b) => a.order - b.order);
}

/**
 * Returns a specific CEFR Level by ID
 */
export function getCEFRLevel(levelId) {
  return CEFR_LEVELS.find(l => l.id === levelId) || null;
}

/**
 * Returns all units belonging to a specific CEFR level
 */
export function getCEFRUnits(levelId = null) {
  const units = [...CEFR_UNITS].sort((a, b) => {
    const levelDiff = (CEFR_LEVEL_RANKS[a.levelId] || 1) - (CEFR_LEVEL_RANKS[b.levelId] || 1);
    if (levelDiff !== 0) return levelDiff;
    return a.order - b.order;
  });

  if (!levelId) return units;
  return units.filter(u => u.levelId === levelId);
}

/**
 * Returns a single Unit by ID
 */
export function getCEFRUnit(unitId) {
  return CEFR_UNITS.find(u => u.id === unitId) || null;
}

/**
 * Returns a single Lesson by ID along with its parent Unit and Level
 */
export function getCEFRLesson(lessonId) {
  for (const unit of CEFR_UNITS) {
    if (Array.isArray(unit.lessons)) {
      const lesson = unit.lessons.find(l => l.id === lessonId);
      if (lesson) {
        return {
          lesson,
          unit,
          levelId: unit.levelId
        };
      }
    }
  }
  return null;
}

/**
 * Checks if a CEFR level is unlocked for the user.
 * A1 is always unlocked by default.
 * Higher levels (A2, B1, etc.) unlock when previous level mastery >= requiredMastery.
 */
export function isLevelUnlocked(levelId, progress = {}) {
  if (levelId === 'A1') return true;

  const currentLevelObj = getCEFRLevel(levelId);
  if (!currentLevelObj) return false;

  // Find previous level in hierarchy
  const allLevels = getCEFRLevels();
  const prevLevel = allLevels.find(l => l.order === currentLevelObj.order - 1);
  if (!prevLevel) return true;

  const prevLevelUnits = getCEFRUnits(prevLevel.id);
  const mastery = calculateLevelMastery(prevLevel.id, prevLevelUnits, progress);
  return mastery >= (prevLevel.requiredMasteryToUnlockNext || 70);
}

/**
 * Checks if a Unit is unlocked.
 * Unit 1 in an unlocked level is always unlocked.
 * Subsequent units (Unit 2, 3...) unlock when the immediately preceding unit mastery >= 70%.
 */
export function isUnitUnlocked(unitId, progress = {}) {
  const unit = getCEFRUnit(unitId);
  if (!unit) return false;

  // Check if level itself is unlocked
  if (!isLevelUnlocked(unit.levelId, progress)) {
    return false;
  }

  // Unit 1 of level is unlocked
  if (unit.order === 1) {
    return true;
  }

  // Check preceding unit in same level
  const sameLevelUnits = getCEFRUnits(unit.levelId);
  const prevUnit = sameLevelUnits.find(u => u.order === unit.order - 1);
  if (!prevUnit) return true;

  const prevUnitMastery = calculateUnitMastery(prevUnit, progress);
  return prevUnitMastery >= 70;
}

/**
 * Checks if a Lesson is unlocked.
 * Lesson 1 of an unlocked unit is unlocked.
 * Lesson N is unlocked if Lesson N-1 is in completedLessons.
 */
export function isLessonUnlocked(lessonId, progress = {}) {
  const lessonData = getCEFRLesson(lessonId);
  if (!lessonData) return false;

  const { lesson, unit } = lessonData;

  // Check unit unlock status
  if (!isUnitUnlocked(unit.id, progress)) {
    return false;
  }

  // Lesson 1 is unlocked
  if (lesson.order === 1) {
    return true;
  }

  // Check previous lesson in unit
  const prevLesson = unit.lessons.find(l => l.order === lesson.order - 1);
  if (!prevLesson) return true;

  const completedList = Array.isArray(progress.completedLessons) ? progress.completedLessons : [];
  return completedList.includes(prevLesson.id);
}

/**
 * Returns exact status of a lesson: 'completed' | 'in_progress' | 'available' | 'locked'
 */
export function getLessonStatus(lessonId, progress = {}) {
  const completedList = Array.isArray(progress.completedLessons) ? progress.completedLessons : [];
  if (completedList.includes(lessonId)) {
    return 'completed';
  }

  const unlocked = isLessonUnlocked(lessonId, progress);
  if (!unlocked) {
    return 'locked';
  }

  const lessonProgressMap = progress.lessonProgress || {};
  if (lessonProgressMap[lessonId]) {
    return 'in_progress';
  }

  return 'available';
}

/**
 * Calculates the next recommended lesson for the learner.
 */
export function getNextRecommendedLesson(progress = {}) {
  const allUnits = getCEFRUnits();
  const completedList = Array.isArray(progress.completedLessons) ? progress.completedLessons : [];

  for (const unit of allUnits) {
    if (isUnitUnlocked(unit.id, progress)) {
      for (const lesson of unit.lessons) {
        if (!completedList.includes(lesson.id) && isLessonUnlocked(lesson.id, progress)) {
          return {
            lesson,
            unit,
            levelId: unit.levelId
          };
        }
      }
    }
  }

  // Fallback to first lesson of first unit
  if (allUnits.length > 0 && allUnits[0].lessons.length > 0) {
    return {
      lesson: allUnits[0].lessons[0],
      unit: allUnits[0],
      levelId: allUnits[0].levelId
    };
  }

  return null;
}
