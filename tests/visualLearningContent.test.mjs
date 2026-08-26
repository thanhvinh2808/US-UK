import assert from 'assert';
import { CEFR_UNITS } from '../src/data/cefrData.js';
import {
  visualLearningData,
  getUnitVisual,
  getVocabularyVisual,
  getVocabularyVisualList
} from '../src/data/visualLearningData.js';
import { cefrProgressStorage } from '../src/utils/cefr/cefrProgressStorage.js';
import { storage, setStorageScope } from '../src/utils/storage/index.js';
import { mergeGuestDataToAccount } from '../src/utils/storage/guestMergeEngine.js';

// Setup Mock LocalStorage for Node testing environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

console.log('--- RUNNING VISUAL LEARNING CONTENT TEST SUITE (PHASE 17B) ---');

// =========================================================================
// TEST 1: A1 Curriculum Units Count
// =========================================================================
console.log('Test 1: A1 Curriculum has 4 structured units');
const a1Units = CEFR_UNITS.filter(u => u.levelId === 'A1');
assert.strictEqual(a1Units.length, 4, 'A1 Level must contain exactly 4 units');

// =========================================================================
// TEST 2: Every A1 Unit has Visual Context Mapping
// =========================================================================
console.log('Test 2: Each Unit has visual context metadata');
a1Units.forEach(unit => {
  const visual = getUnitVisual(unit.id);
  assert.ok(visual, `Unit ${unit.id} must have visual metadata defined`);
  assert.ok(visual.hero, `Unit ${unit.id} must have a hero visual`);
  assert.ok(visual.hero.image && visual.hero.image.startsWith('http'), `Unit ${unit.id} hero must have valid image URL`);
  assert.ok(visual.hero.alt && visual.hero.alt.length > 5, `Unit ${unit.id} hero must have descriptive alt text`);
  assert.ok(visual.hero.caption && visual.hero.caption.length > 5, `Unit ${unit.id} hero must have caption`);
});

// Specific Pedagogical Illustrations
const u1Visual = getUnitVisual('a1_u1');
assert.ok(u1Visual.grammarVisual, 'Unit 1 must have grammar pronouns visual');
assert.strictEqual(u1Visual.grammarVisual.items.length >= 4, true, 'Unit 1 grammar visual must have pronouns');

const u2Visual = getUnitVisual('a1_u2');
assert.ok(u2Visual.sequence, 'Unit 2 must have daily routine sequence timeline');
assert.strictEqual(u2Visual.sequence.steps.length >= 5, true, 'Unit 2 sequence must have steps');

const u3Visual = getUnitVisual('a1_u3');
assert.ok(u3Visual.familyTree, 'Unit 3 must have family members structure visual');

// =========================================================================
// TEST 3: Core Vocabulary Visual Mapping
// =========================================================================
console.log('Test 3: Core Vocabulary visual mapping across Units 1-4');
const sampleWords = ['hello', 'student', 'teacher', 'breakfast', 'family', 'parents', 'coffee', 'water'];

sampleWords.forEach(word => {
  const vocabVisual = getVocabularyVisual(word);
  assert.ok(vocabVisual, `Word "${word}" must have visual mapping`);
  assert.strictEqual(vocabVisual.word, word);
  assert.ok(vocabVisual.image && vocabVisual.image.length > 10, `Word "${word}" must have valid image URL`);
  assert.ok(vocabVisual.alt && vocabVisual.alt.length > 5, `Word "${word}" must have descriptive alt`);
  assert.ok(vocabVisual.caption && vocabVisual.caption.length > 5, `Word "${word}" must have caption`);
  assert.ok(vocabVisual.source, `Word "${word}" must have source specified`);
  assert.ok(vocabVisual.attribution, `Word "${word}" must have attribution`);
});

// =========================================================================
// TEST 4: Null Safety for Missing or Invalid Inputs
// =========================================================================
console.log('Test 4: Resilience and graceful fallback on unknown inputs');
assert.strictEqual(getUnitVisual(null), null);
assert.strictEqual(getUnitVisual(''), null);
assert.strictEqual(getUnitVisual('unknown_unit_999'), null);

assert.strictEqual(getVocabularyVisual(null), null);
assert.strictEqual(getVocabularyVisual(''), null);
assert.strictEqual(getVocabularyVisual('nonexistent_word_xyz'), null);

const emptyList = getVocabularyVisualList(['unknown_1', 'unknown_2']);
assert.deepStrictEqual(emptyList, []);

// =========================================================================
// TEST 5: Image Alt Text Integrity (Accessibility & Quality)
// =========================================================================
console.log('Test 5: Image metadata has descriptive alt text without placeholders');
Object.values(visualLearningData.vocabulary).forEach(item => {
  const alt = item.alt.toLowerCase();
  assert.strictEqual(alt !== 'image', true, 'Alt must not be generic "image"');
  assert.strictEqual(alt !== 'photo', true, 'Alt must not be generic "photo"');
  assert.strictEqual(alt.includes('ai generated'), false, 'Alt must not mention AI generated');
});

// =========================================================================
// TEST 6: CEFR Progress and Scoped Storage Integrity
// =========================================================================
console.log('Test 6: Visual layer does not modify CEFR storage or progress state');
localStorage.clear();
setStorageScope(null);

const initialProgress = cefrProgressStorage.getCEFRProgress();
assert.deepStrictEqual(initialProgress.completedLessons, []);

// Querying visual data does NOT award points or complete lessons
getUnitVisual('a1_u1');
getVocabularyVisual('hello');
getVocabularyVisualList(['hello', 'morning']);

const progressAfterQueries = cefrProgressStorage.getCEFRProgress();
assert.deepStrictEqual(progressAfterQueries.completedLessons, [], 'Visual queries must not alter completed lessons');

const stats = storage.getUserStats();
assert.strictEqual(stats.points, 0, 'Viewing visuals must not award XP');

// =========================================================================
// TEST 7: Guest Learning and Authenticated Isolation
// =========================================================================
console.log('Test 7: Guest and User data isolation remains intact');
// Complete an activity in guest mode
cefrProgressStorage.completeCEFRActivity({
  activityId: 'a1_u1_l1_a1',
  lessonId: 'a1_u1_l1',
  unitId: 'a1_u1',
  isCorrect: true,
  xpReward: 15
});

const guestProg = cefrProgressStorage.getCEFRProgress();
assert.strictEqual(guestProg.completedActivities.includes('a1_u1_l1_a1'), true);

// Switch to user scope
const testUserId = '60d5ecb8b392d43a88c27777';
setStorageScope(testUserId);
const userProg = cefrProgressStorage.getCEFRProgress(testUserId);
assert.strictEqual(userProg.completedActivities.length, 0, 'User scope must remain isolated from guest');

// Switch back to guest and merge
setStorageScope(null);
const mergeRes = mergeGuestDataToAccount(testUserId);
assert.strictEqual(mergeRes.merged, true);

setStorageScope(testUserId);
const mergedUserProg = cefrProgressStorage.getCEFRProgress(testUserId);
assert.strictEqual(mergedUserProg.completedActivities.includes('a1_u1_l1_a1'), true, 'Guest data safely merged');

// =========================================================================
// TEST 8: SM-2 Spaced Repetition Scheduling Preserved
// =========================================================================
console.log('Test 8: SM-2 Spaced Repetition parameters preserved');
const newWord = {
  word: 'breakfast',
  ipa: '/ˈbrek.fəst/',
  vietnamese: 'bữa sáng',
  example: 'I have breakfast at 7 AM.'
};
storage.saveWord(newWord);

const savedWords = storage.getSavedVocab();
const savedBreakfast = savedWords.find(w => w.word === 'breakfast');
assert.ok(savedBreakfast, 'Word must be saved in notebook');
assert.strictEqual(typeof savedBreakfast.interval, 'number', 'SM-2 interval initialized');
assert.strictEqual(typeof savedBreakfast.easinessFactor, 'number', 'SM-2 easinessFactor initialized');

console.log('✅ ALL VISUAL LEARNING CONTENT TESTS PASSED (100% SUCCESS, 0 REGRESSIONS)');
process.exit(0);
