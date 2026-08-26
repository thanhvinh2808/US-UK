import assert from 'node:assert';
import { mistakeStorage } from '../src/utils/storage/mistakeStorage.js';
import { getLearnerProfile } from '../src/utils/learning/learningProfile.js';
import { getDailyLearningPlan } from '../src/utils/learning/dailyPlan.js';
import { getRecommendations } from '../src/utils/learning/recommendationEngine.js';
import { getLearningInsights } from '../src/utils/learning/learningInsights.js';
import { setStorageScope } from '../src/utils/storage/storageScope.js';

// Setup Mock LocalStorage for Node environment
const mockStore = new Map();
globalThis.localStorage = {
  getItem: (k) => mockStore.get(k) || null,
  setItem: (k, v) => mockStore.set(k, String(v)),
  removeItem: (k) => mockStore.delete(k),
  clear: () => mockStore.clear()
};

console.log('================ RUNNING PHASE 15 REAL-WORLD QA TEST SUITE ================\n');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// 1. Cross-Module Mistake Recording
runTest('1. Cross-module mistake recording across Grammar, Vocab, Spelling, Pronunciation, Dictation, Writing', () => {
  localStorage.clear();
  setStorageScope('user_qa_15');

  // Grammar mistake
  mistakeStorage.saveMistake({
    module: 'grammar',
    skill: 'Ngữ pháp - Present Simple',
    question: 'She go to school everyday.',
    userAnswer: 'Cho là đúng',
    correctAnswer: 'Câu SAI — She goes to school everyday.'
  });

  // Vocabulary mistake
  mistakeStorage.saveMistake({
    module: 'flashcards',
    skill: 'Từ vựng (Vocabulary)',
    question: 'Nghĩa của từ: "ephemeral"',
    userAnswer: 'vĩnh cửu',
    correctAnswer: 'phù du, chóng tàn'
  });

  // Spelling mistake
  mistakeStorage.saveMistake({
    module: 'flashcards',
    skill: 'Chính tả (Spelling)',
    question: 'Chính tả từ: "accommodation"',
    userAnswer: 'acommodation',
    correctAnswer: 'accommodation'
  });

  // Pronunciation mistake
  mistakeStorage.saveMistake({
    module: 'pronunciation',
    skill: 'Phát âm (Pronunciation)',
    question: 'Phát âm câu: "I would like a glass of water."',
    userAnswer: 'I would like glass water',
    correctAnswer: 'I would like a glass of water.'
  });

  // Dictation mistake
  mistakeStorage.saveMistake({
    module: 'dictation',
    skill: 'Nghe & Điền từ (Dictation)',
    question: 'Nghe và viết lại câu',
    userAnswer: 'The train leave at 5',
    correctAnswer: 'The train leaves at 5'
  });

  // Writing mistake
  mistakeStorage.saveMistake({
    module: 'writing',
    skill: 'Cấu trúc câu (Sentence Ordering)',
    question: 'Sắp xếp câu bài Viết',
    userAnswer: 'Nam will London fly to',
    correctAnswer: 'Nam will fly to London'
  });

  const allMistakes = mistakeStorage.getMistakes();
  assert.strictEqual(allMistakes.length, 6, 'All 6 cross-module mistakes must be recorded');
});

// 2. Mistake Bank Deduplication
runTest('2. Mistake Bank deduplicates retried identical errors while keeping data fresh', () => {
  const initialLength = mistakeStorage.getMistakes().length;

  // Retry the exact same grammar mistake
  mistakeStorage.saveMistake({
    module: 'grammar',
    skill: 'Ngữ pháp - Present Simple',
    question: 'She go to school everyday.',
    userAnswer: 'Vẫn cho là đúng (thử lại lần 2)',
    correctAnswer: 'Câu SAI — She goes to school everyday.'
  });

  const updatedMistakes = mistakeStorage.getMistakes();
  assert.strictEqual(updatedMistakes.length, initialLength, 'Duplicate mistake should not increase count');
  
  // The first item should now be the updated one
  assert.strictEqual(updatedMistakes[0].userAnswer, 'Vẫn cho là đúng (thử lại lần 2)');
});

// 3. Weakness Stats Analysis
runTest('3. Weakness stats correctly aggregates and sorts by failure frequency', () => {
  const weaknessStats = mistakeStorage.getWeaknessStats();
  assert.ok(Array.isArray(weaknessStats) && weaknessStats.length > 0);
  
  // Verify descending sort
  for (let i = 0; i < weaknessStats.length - 1; i++) {
    assert.ok(weaknessStats[i].count >= weaknessStats[i + 1].count, 'Weakness stats must be sorted in descending order');
  }
});

// 4. Learning Intelligence Priority Chain
runTest('4. Recommendation engine respects exact priority hierarchy (SM-2 Due > Weak Vocab > Mistakes > Topics > Onboarding)', () => {
  const profileWithAll = {
    dueCount: 15,
    forgottenVocabulary: [{ word: 'ubiquitous', lowGradeCount: 5 }],
    mistakeCount: 6,
    primaryWeakSkill: 'Ngữ pháp - Present Simple',
    inProgressTopicIds: ['topic_airport'],
    completedTopicIds: []
  };
  const topics = [{ id: 'topic_airport', title: 'At the Airport', level: 'A2' }];

  const recommendations = getRecommendations(profileWithAll, topics, 4);
  assert.strictEqual(recommendations.length, 4);

  // Priority 1: SM-2 Due
  assert.strictEqual(recommendations[0].priority, 1);
  assert.strictEqual(recommendations[0].type, 'review');

  // Priority 2: Weak Vocab
  assert.strictEqual(recommendations[1].priority, 2);
  assert.strictEqual(recommendations[1].type, 'vocabulary');

  // Priority 3: Mistakes
  assert.strictEqual(recommendations[2].priority, 3);
  assert.strictEqual(recommendations[2].type, 'skill');

  // Priority 4: In-progress topic
  assert.strictEqual(recommendations[3].priority, 4);
  assert.strictEqual(recommendations[3].type, 'topic');
});

// 5. Zero-Data Resilience
runTest('5. Zero-data scenario gracefully provides onboarding guidance without errors', () => {
  const emptyProfile = {
    dueCount: 0,
    dueVocabulary: [],
    forgottenVocabulary: [],
    mistakeCount: 0,
    primaryWeakSkill: null,
    inProgressTopicIds: [],
    completedTopicIds: [],
    isNewUser: true,
    streak: 0,
    points: 0,
    vocabularyCount: 0
  };

  const plan = getDailyLearningPlan(emptyProfile, [{ id: 't1', title: 'Hello', level: 'A1' }]);
  assert.ok(plan.tasks.length >= 1, 'Empty plan must provide starter task');
  assert.ok(
    plan.tasks[0].id === 'task_cefr_next_lesson' ||
    plan.tasks[0].id === 'task_topic_learning' ||
    plan.tasks[0].id === 'task_onboarding_starter',
    `Expected valid starter task id, got ${plan.tasks[0].id}`
  );

  const recs = getRecommendations(emptyProfile, [{ id: 't1', title: 'Hello', level: 'A1' }], 3);
  assert.ok(recs.length >= 1);

  const insights = getLearningInsights(emptyProfile);
  assert.ok(Array.isArray(insights));
});

// 6. Multi-Scope Storage Isolation
runTest('6. Storage isolation guarantees Guest, User A, and User B data segregation', () => {
  // Guest scope
  setStorageScope(null);
  mistakeStorage.saveMistake({
    module: 'flashcards',
    skill: 'Từ vựng',
    question: 'Guest question',
    userAnswer: 'Guest ans',
    correctAnswer: 'Guest correct'
  });
  const guestMistakes = mistakeStorage.getMistakes();
  assert.strictEqual(guestMistakes.length, 1);

  // User A scope
  setStorageScope('user_A_id');
  mistakeStorage.saveMistake({
    module: 'flashcards',
    skill: 'Từ vựng',
    question: 'User A question',
    userAnswer: 'User A ans',
    correctAnswer: 'User A correct'
  });
  const userAMistakes = mistakeStorage.getMistakes();
  assert.strictEqual(userAMistakes.length, 1);
  assert.strictEqual(userAMistakes[0].question, 'User A question');

  // User B scope (empty)
  setStorageScope('user_B_id');
  const userBMistakes = mistakeStorage.getMistakes();
  assert.strictEqual(userBMistakes.length, 0, 'User B must have 0 mistakes initially');
});

console.log('\n================ PHASE 15 REAL-WORLD QA COMPLETED ================');
console.log(`Passed: ${passed}/${passed + failed}`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
