import assert from 'node:assert';
import { getLearnerProfile } from '../src/utils/learning/learningProfile.js';
import { getDailyLearningPlan } from '../src/utils/learning/dailyPlan.js';
import { getRecommendations } from '../src/utils/learning/recommendationEngine.js';
import { getLearningInsights } from '../src/utils/learning/learningInsights.js';
import { calculateSM2 } from '../src/utils/storage/sm2.js';

console.log('================ RUNNING PRODUCTION LAUNCH SMOKE TESTS (4 PERSONAS) ================\n');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// PERSONA A: Public Guest Persona
runTest('Persona A (Guest): Navigates landing page, views public articles, has zero crashes on empty storage', () => {
  const guestProfile = getLearnerProfile([]);
  assert.strictEqual(guestProfile.vocabularyCount, 0);
  assert.strictEqual(guestProfile.isNewUser, true);

  const plan = getDailyLearningPlan(guestProfile, [{ id: 'intro', title: 'Getting Started', level: 'A1' }]);
  assert.ok(plan.tasks.length > 0);
  assert.strictEqual(plan.tasks[0].type, 'topic');
});

// PERSONA B: Brand New Registered User
runTest('Persona B (New User): Completes initial onboarding plan and receives beginner recommendations', () => {
  const newProfile = {
    vocabularyCount: 1,
    masteredCount: 0,
    learningCount: 1,
    dueCount: 1,
    dueVocabulary: [{ word: 'hello', repetitions: 0, nextReviewDate: Date.now() }],
    forgottenVocabulary: [],
    mistakeCount: 0,
    primaryWeakSkill: null,
    inProgressTopicIds: [],
    completedTopicIds: [],
    streak: 1,
    points: 10,
    level: 'A1',
    activityHistory: { '2026-08-25': 1 }
  };

  const plan = getDailyLearningPlan(newProfile, [{ id: 'top_1', title: 'Daily Routines', level: 'A1' }]);
  assert.ok(plan.tasks.length >= 1);
  assert.strictEqual(plan.tasks[0].type, 'review');

  const recs = getRecommendations(newProfile, [{ id: 'top_1', title: 'Daily Routines', level: 'A1' }], 3);
  assert.ok(recs.length > 0);
  assert.strictEqual(recs[0].type, 'review');
});

// PERSONA C: Returning Heavy User with Mistakes and Mastery
runTest('Persona C (Returning User): Surfaces due reviews, weakness analysis, and data-backed streak insights', () => {
  const veteranProfile = {
    vocabularyCount: 120,
    masteredCount: 85,
    learningCount: 35,
    dueCount: 18,
    dueVocabulary: Array(18).fill({ word: 'sample' }),
    forgottenVocabulary: [{ word: 'ubiquitous', lowGradeCount: 4 }, { word: 'paradigm', lowGradeCount: 3 }],
    mistakeCount: 12,
    primaryWeakSkill: 'Ngữ pháp',
    inProgressTopicIds: ['top_b2'],
    completedTopicIds: ['top_a1', 'top_a2', 'top_b1'],
    streak: 14,
    points: 1450,
    level: 'B2',
    activityHistory: { '2026-08-20': 5, '2026-08-21': 6, '2026-08-22': 8, '2026-08-23': 4, '2026-08-24': 10, '2026-08-25': 12 }
  };

  const plan = getDailyLearningPlan(veteranProfile, [{ id: 'top_b2', title: 'Academic Research', level: 'B2' }]);
  assert.strictEqual(plan.tasks[0].type, 'review');
  assert.strictEqual(plan.tasks[1].type, 'vocabulary');
  assert.strictEqual(plan.tasks[2].type, 'mistakes');

  const insights = getLearningInsights(veteranProfile);
  assert.ok(insights.length >= 3);
  assert.ok(insights.some(i => i.type === 'streak' && i.highlight.includes('14')));
  assert.ok(insights.some(i => i.type === 'mastery'));
});

// PERSONA D: Offline User Learning Flow
runTest('Persona D (Offline User): Performs SM-2 grading locally, advances interval deterministically', () => {
  // Test SM-2 Grade 4 (Good) on second repetition
  const result = calculateSM2(4, 1, 1, 2.5);
  assert.strictEqual(result.repetitions, 2);
  assert.strictEqual(result.interval, 6);
  assert.ok(result.nextReviewDate > Date.now());
});

console.log(`\n================ LAUNCH SMOKE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
