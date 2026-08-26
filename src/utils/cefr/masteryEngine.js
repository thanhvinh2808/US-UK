/**
 * CEFR Mastery Calculation Engine (Phase 17)
 * Provides deterministic, mathematical mastery percentages (0-100%)
 * across Activities, Lessons, Units, and CEFR Levels.
 */

export const SKILL_WEIGHTS = {
  vocabulary: 0.25,
  grammar: 0.20,
  listening: 0.15,
  speaking: 0.15,
  reading: 0.15,
  writing: 0.10
};

/**
 * Calculates mastery percentage for a single Unit based on completed lessons.
 * 
 * @param {Object} unit - The CEFR Unit object containing lessons array
 * @param {Object} cefrProgress - The CEFR progress record
 * @returns {number} Mastery percentage between 0 and 100
 */
export function calculateUnitMastery(unit, cefrProgress = {}) {
  if (!unit || !Array.isArray(unit.lessons) || unit.lessons.length === 0) {
    return 0;
  }

  const completedLessons = Array.isArray(cefrProgress.completedLessons)
    ? cefrProgress.completedLessons
    : [];

  const lessonProgressMap = cefrProgress.lessonProgress || {};

  let totalWeight = 0;
  let earnedWeight = 0;

  unit.lessons.forEach(lesson => {
    const weight = SKILL_WEIGHTS[lesson.type] || (1 / unit.lessons.length);
    totalWeight += weight;

    const isCompleted = completedLessons.includes(lesson.id);
    const progressObj = lessonProgressMap[lesson.id];
    const score = progressObj && typeof progressObj.score === 'number'
      ? Math.max(0, Math.min(1, progressObj.score))
      : (isCompleted ? 1.0 : 0);

    earnedWeight += (score * weight);
  });

  if (totalWeight <= 0) return 0;

  const percentage = Math.round((earnedWeight / totalWeight) * 100);
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Calculates overall mastery percentage for a CEFR Level across all its Units.
 * 
 * @param {string} levelId - CEFR Level ID (A1, A2, B1, etc.)
 * @param {Array} units - Array of units belonging to this level
 * @param {Object} cefrProgress - The CEFR progress record
 * @returns {number} Level mastery percentage between 0 and 100
 */
export function calculateLevelMastery(levelId, units = [], cefrProgress = {}) {
  const levelUnits = units.filter(u => u && u.levelId === levelId);
  if (levelUnits.length === 0) return 0;

  let totalMastery = 0;
  levelUnits.forEach(unit => {
    const mastery = calculateUnitMastery(unit, cefrProgress);
    totalMastery += mastery;
  });

  return Math.round(totalMastery / levelUnits.length);
}

/**
 * Checks if a Unit meets the threshold for unlock/completion.
 * 
 * @param {Object} unit
 * @param {Object} cefrProgress
 * @param {number} requiredThreshold - Default 70%
 * @returns {boolean}
 */
export function isUnitMastered(unit, cefrProgress = {}, requiredThreshold = 70) {
  const mastery = calculateUnitMastery(unit, cefrProgress);
  return mastery >= requiredThreshold;
}
