import assert from 'assert';
import { CEFR_LEVELS, CEFR_UNITS } from '../src/data/cefrData.js';
import {
  isLevelUnlocked,
  isUnitUnlocked,
  isLessonUnlocked,
  getLessonStatus,
  getNextRecommendedLesson
} from '../src/utils/cefr/cefrEngine.js';
import {
  calculateUnitMastery,
  isUnitMastered
} from '../src/utils/cefr/masteryEngine.js';
import { cefrProgressStorage } from '../src/utils/cefr/cefrProgressStorage.js';
import { storage, setStorageScope } from '../src/utils/storage/index.js';
import { mergeGuestDataToAccount } from '../src/utils/storage/guestMergeEngine.js';

// Setup Mock In-Memory LocalStorage for Node testing environment
const mockStorage = {};
global.localStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(mockStorage, k) ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};
global.window = {
  location: { hash: '' },
  dispatchEvent: () => {}
};

console.log('--- RUNNING CEFR LEARNING ENGINE TEST SUITE ---');

// =========================================================================
// TEST SUITE 1: CEFR Content Registry Integrity
// =========================================================================
console.log('Test 1: CEFR Content Registry Structure & Metadata');
assert.strictEqual(CEFR_LEVELS.length, 6, 'Must define exactly 6 CEFR levels (A1 to C2)');
assert.strictEqual(CEFR_LEVELS[0].id, 'A1', 'First level must be A1');
assert.strictEqual(CEFR_LEVELS[5].id, 'C2', 'Sixth level must be C2');

const a1Units = CEFR_UNITS.filter(u => u.levelId === 'A1');
assert.strictEqual(a1Units.length >= 4, true, 'Level A1 must have at least 4 comprehensive units');

const u1 = a1Units[0];
assert.strictEqual(u1.id, 'a1_u1', 'Unit 1 ID must be a1_u1');
assert.strictEqual(Array.isArray(u1.objectives), true, 'Unit must define learning objectives');
assert.strictEqual(Array.isArray(u1.coreVocabulary), true, 'Unit must define core vocabulary');
assert.strictEqual(u1.coreVocabulary.length >= 6, true, 'Unit 1 must have at least 6 core vocabulary words');
assert.strictEqual(Boolean(u1.grammarFocus), true, 'Unit 1 must have a grammar focus breakdown');
assert.strictEqual(Array.isArray(u1.lessons), true, 'Unit 1 must define lessons list');
assert.strictEqual(u1.lessons.length >= 6, true, 'Unit 1 must cover all key skills with at least 6 lessons');

// =========================================================================
// TEST SUITE 2: Deterministic Mastery Calculations
// =========================================================================
console.log('Test 2: Mastery Calculation Engine');
// 2.1 Empty progress
assert.strictEqual(calculateUnitMastery(u1, {}), 0, 'Empty progress must result in 0% unit mastery');

// 2.2 Complete first lesson (vocabulary)
const singleLessonProgress = {
  completedLessons: ['a1_u1_l1'],
  lessonProgress: {
    'a1_u1_l1': { score: 1.0 }
  }
};
const singleMastery = calculateUnitMastery(u1, singleLessonProgress);
assert.strictEqual(singleMastery > 0 && singleMastery <= 30, true, 'Completing vocabulary lesson should give proportional weight (~25%)');

// 2.3 Complete all lessons
const allCompletedLessons = u1.lessons.map(l => l.id);
const fullProgress = {
  completedLessons: allCompletedLessons,
  lessonProgress: Object.fromEntries(allCompletedLessons.map(id => [id, { score: 1.0 }]))
};
const fullMastery = calculateUnitMastery(u1, fullProgress);
assert.strictEqual(fullMastery, 100, 'Completing all lessons with full score must yield 100% mastery');
assert.strictEqual(isUnitMastered(u1, fullProgress, 70), true, '100% mastery satisfies mastery threshold');

// =========================================================================
// TEST SUITE 3: Progression & Deterministic Unlocking
// =========================================================================
console.log('Test 3: CEFR Progression & Unlock Engine');

// 3.1 A1 is always unlocked; A2 is locked when A1 has 0 progress
assert.strictEqual(isLevelUnlocked('A1', {}), true, 'Level A1 must be unlocked by default');
assert.strictEqual(isLevelUnlocked('A2', {}), false, 'Level A2 must be locked for beginner');

// 3.2 Unit 1 is unlocked; Unit 2 is locked until Unit 1 reaches 70%
assert.strictEqual(isUnitUnlocked('a1_u1', {}), true, 'Unit 1 must be unlocked by default');
assert.strictEqual(isUnitUnlocked('a1_u2', {}), false, 'Unit 2 must be locked when Unit 1 has 0% mastery');
assert.strictEqual(isUnitUnlocked('a1_u2', fullProgress), true, 'Unit 2 unlocks when Unit 1 is 100% mastered');

// 3.3 Lesson 1 is unlocked; Lesson 2 is locked until Lesson 1 is completed
assert.strictEqual(isLessonUnlocked('a1_u1_l1', {}), true, 'Lesson 1 must be unlocked by default');
assert.strictEqual(isLessonUnlocked('a1_u1_l2', {}), false, 'Lesson 2 must be locked before Lesson 1 completion');
assert.strictEqual(isLessonUnlocked('a1_u1_l2', { completedLessons: ['a1_u1_l1'] }), true, 'Lesson 2 unlocks when Lesson 1 is completed');

// 3.4 Lesson status transitions
assert.strictEqual(getLessonStatus('a1_u1_l1', {}), 'available', 'Lesson 1 starts in available state');
assert.strictEqual(getLessonStatus('a1_u1_l2', {}), 'locked', 'Lesson 2 starts in locked state');
assert.strictEqual(getLessonStatus('a1_u1_l1', { completedLessons: ['a1_u1_l1'] }), 'completed', 'Completed lesson reflects completed status');

// 3.5 Next recommended lesson
const nextLesson = getNextRecommendedLesson({});
assert.strictEqual(nextLesson.lesson.id, 'a1_u1_l1', 'Next recommended lesson for new learner must be Lesson 1');

// =========================================================================
// TEST SUITE 4: Scoped CEFR Storage & Activity Completion
// =========================================================================
console.log('Test 4: Scoped CEFR Progress Storage & Activity Processing');

// 4.1 Guest scope storage
setStorageScope(null);
localStorage.clear();

let guestProg = cefrProgressStorage.getCEFRProgress();
assert.deepStrictEqual(guestProg.completedLessons, [], 'Initial guest progress should have empty completed lessons');

// Complete an activity
guestProg = cefrProgressStorage.completeCEFRActivity({
  activityId: 'a1_u1_l1_a1',
  lessonId: 'a1_u1_l1',
  unitId: 'a1_u1',
  score: 1.0,
  isCorrect: true,
  xpReward: 20,
  vocabWords: [{ word: 'hello', ipa: '/həˈloʊ/', vietnamese: 'xin chào' }]
});

assert.strictEqual(guestProg.completedActivities.includes('a1_u1_l1_a1'), true, 'Activity ID must be added to completedActivities');
assert.strictEqual(guestProg.activityXPJournal['a1_u1_l1_a1'], 20, 'Activity XP must be recorded in journal');

// Verify XP was credited to user stats
const guestStats = storage.getUserStats();
assert.strictEqual(guestStats.points, 20, 'Guest points should be incremented to 20 XP');

// Verify Vocabulary was added with SM-2 spaced repetition fields
const savedVocab = storage.getSavedVocab();
assert.strictEqual(savedVocab.length, 1, 'Learned vocabulary word must be saved');
assert.strictEqual(savedVocab[0].word, 'hello', 'Saved word matches learned word');
assert.strictEqual(savedVocab[0].repetitions, 0, 'Initial SM-2 repetitions is 0');
assert.strictEqual(savedVocab[0].easinessFactor, 2.5, 'Initial SM-2 EF is 2.5');

// =========================================================================
// TEST SUITE 5: XP Idempotency
// =========================================================================
console.log('Test 5: XP Idempotency on Repeated Activity / Lesson Execution');

// Completing the same activity again must not duplicate XP
cefrProgressStorage.completeCEFRActivity({
  activityId: 'a1_u1_l1_a1',
  lessonId: 'a1_u1_l1',
  unitId: 'a1_u1',
  score: 1.0,
  isCorrect: true,
  xpReward: 20
});

const statsAfterReplay = storage.getUserStats();
assert.strictEqual(statsAfterReplay.points, 20, 'Re-completing same activity must not duplicate XP (points remain 20)');

// Complete the lesson
guestProg = cefrProgressStorage.completeCEFRLesson({
  lessonId: 'a1_u1_l1',
  unitId: 'a1_u1',
  score: 1.0,
  xpReward: 25
});

assert.strictEqual(guestProg.completedLessons.includes('a1_u1_l1'), true, 'Lesson ID must be added to completedLessons');
const statsAfterLesson = storage.getUserStats();
assert.strictEqual(statsAfterLesson.points, 45, 'Total points should now be 20 + 25 = 45 XP');

// Re-complete the same lesson -> XP remains 45
cefrProgressStorage.completeCEFRLesson({
  lessonId: 'a1_u1_l1',
  unitId: 'a1_u1',
  score: 1.0,
  xpReward: 25
});
const statsAfterLessonReplay = storage.getUserStats();
assert.strictEqual(statsAfterLessonReplay.points, 45, 'Re-completing lesson must not duplicate XP');

// =========================================================================
// TEST SUITE 6: Mistake Bank Integration
// =========================================================================
console.log('Test 6: Mistake Bank Integration for Incorrect Answers');

cefrProgressStorage.completeCEFRActivity({
  activityId: 'a1_u1_l1_a2',
  lessonId: 'a1_u1_l1',
  unitId: 'a1_u1',
  isCorrect: false,
  mistakeData: {
    skill: 'Vocabulary',
    question: 'Nghĩa của từ student là gì?',
    userAnswer: 'Giáo viên',
    correctAnswer: 'Học sinh / sinh viên'
  }
});

const mistakes = storage.getMistakes();
assert.strictEqual(mistakes.length, 1, 'Incorrect CEFR activity answer must be recorded in Mistake Bank');
assert.strictEqual(mistakes[0].module, 'cefr_lesson', 'Mistake module is recorded as cefr_lesson');
assert.strictEqual(mistakes[0].userAnswer, 'Giáo viên', 'User answer is captured');

// =========================================================================
// TEST SUITE 7: Guest -> Account CEFR Progress Merge
// =========================================================================
console.log('Test 7: Guest -> Account Merge Engine CEFR Support');

const targetUserId = '60d5ecb8b392d43a88c29999';

// Set up existing user account with Lesson 2 completed
setStorageScope(targetUserId);
cefrProgressStorage.saveCEFRProgress({
  completedLessons: ['a1_u1_l2'],
  completedActivities: ['a1_u1_l2_a1'],
  lessonProgress: { 'a1_u1_l2': { score: 0.9, attempts: 1 } },
  unitMastery: { 'a1_u1': 20 },
  levelStatus: { A1: 'in_progress' }
}, targetUserId);

// Switch back to guest context and perform merge
setStorageScope(null);
const mergeResult = mergeGuestDataToAccount(targetUserId);

assert.strictEqual(mergeResult.merged, true, 'Merge operation must succeed');
assert.strictEqual(mergeResult.status, 'completed', 'Merge status must be completed');

// Switch to authenticated user and verify merged state
setStorageScope(targetUserId);
const mergedCefrProg = cefrProgressStorage.getCEFRProgress(targetUserId);

// Both Lesson 1 (from guest) and Lesson 2 (from user) must be present in completedLessons
assert.strictEqual(mergedCefrProg.completedLessons.includes('a1_u1_l1'), true, 'Guest completed lesson 1 must be merged');
assert.strictEqual(mergedCefrProg.completedLessons.includes('a1_u1_l2'), true, 'User completed lesson 2 must be preserved');
assert.strictEqual(mergedCefrProg.completedActivities.includes('a1_u1_l1_a1'), true, 'Guest completed activity must be merged');
assert.strictEqual(mergedCefrProg.completedActivities.includes('a1_u1_l2_a1'), true, 'User completed activity must be preserved');

console.log('✅ ALL CEFR LEARNING ENGINE TESTS PASSED (100% SUCCESS, 0 REGRESSIONS)');
process.exit(0);
