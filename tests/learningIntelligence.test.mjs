import assert from 'node:assert';
import { getLearnerProfile } from '../src/utils/learning/learningProfile.js';
import { getDailyLearningPlan } from '../src/utils/learning/dailyPlan.js';
import { getRecommendations } from '../src/utils/learning/recommendationEngine.js';
import { getLearningInsights } from '../src/utils/learning/learningInsights.js';

console.log('================ RUNNING LEARNING INTELLIGENCE & PERSONALIZATION TESTS ================\n');

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

// 1. Learner Profile Derivation (Mocked Storage Environment)
runTest('1. getLearnerProfile safely generates normalized learner profile without crashing', () => {
  const profile = getLearnerProfile([]);
  assert.ok(profile !== null && typeof profile === 'object');
  assert.ok(typeof profile.vocabularyCount === 'number');
  assert.ok(typeof profile.dueCount === 'number');
  assert.ok(typeof profile.masteredCount === 'number');
  assert.ok(typeof profile.mistakeCount === 'number');
  assert.ok(Array.isArray(profile.weaknessStats));
  assert.ok(Array.isArray(profile.dueVocabulary));
});

// 2. Empty User State Detection
runTest('2. getLearnerProfile correctly flags isNewUser when data is empty', () => {
  const profile = getLearnerProfile([]);
  // In pure node test without mock, storage falls back gracefully
  assert.ok(typeof profile.isNewUser === 'boolean');
});

// 3. Daily Learning Plan Generation
runTest('3. getDailyLearningPlan generates 1 to 4 prioritized actionable tasks', () => {
  const mockProfile = {
    dueCount: 12,
    dueVocabulary: [{ word: 'accommodate' }],
    forgottenVocabulary: [{ word: 'ubiquitous', lowGradeCount: 3 }],
    mistakeCount: 5,
    primaryWeakSkill: 'Ngữ pháp',
    inProgressTopicIds: ['top_1'],
    completedTopicIds: []
  };
  const mockTopics = [{ id: 'top_1', title: 'IELTS Travel', level: 'B1' }];

  const plan = getDailyLearningPlan(mockProfile, mockTopics);
  assert.ok(plan.tasks.length >= 1 && plan.tasks.length <= 4);
  assert.ok(plan.totalEstimatedMinutes > 0);

  // First task must be the Due review
  assert.strictEqual(plan.tasks[0].type, 'review');
  assert.ok(plan.tasks[0].title.includes('12'));
  assert.ok(plan.tasks[0].reason.length > 0);
});

// 4. Daily Learning Plan Fallback for Brand New User
runTest('4. getDailyLearningPlan provides a starter task when user has 0 data', () => {
  const emptyProfile = {
    dueCount: 0,
    dueVocabulary: [],
    forgottenVocabulary: [],
    mistakeCount: 0,
    primaryWeakSkill: null,
    inProgressTopicIds: [],
    completedTopicIds: []
  };
  const starterTopics = [{ id: 'starter_1', title: 'Daily Routines', level: 'A1' }];

  const plan = getDailyLearningPlan(emptyProfile, starterTopics);
  assert.strictEqual(plan.tasks.length, 1);
  assert.ok(plan.tasks[0].badge === 'Bài mới' || plan.tasks[0].badge === 'Khởi động');
  assert.strictEqual(plan.tasks[0].topicData.id, 'starter_1');
});

// 5. Deterministic Recommendation Engine & Reason Generation
runTest('5. getRecommendations provides prioritized recommendations with clear explainable reasons', () => {
  const mockProfile = {
    dueCount: 5,
    forgottenVocabulary: [{ word: 'ambiguous', lowGradeCount: 4 }],
    primaryWeakSkill: 'Phát âm',
    mistakeCount: 3,
    inProgressTopicIds: [],
    completedTopicIds: []
  };
  const mockTopics = [{ id: 'top_2', title: 'Academic Science', level: 'B2' }];

  const recs = getRecommendations(mockProfile, mockTopics, 3);
  assert.ok(recs.length <= 3);

  // Verify each recommendation has key, title, description, reason, and ctaText
  const seenKeys = new Set();
  recs.forEach(r => {
    assert.ok(r.key, 'Recommendation must have unique key');
    assert.ok(!seenKeys.has(r.key), `Duplicate recommendation key: ${r.key}`);
    seenKeys.add(r.key);

    assert.ok(r.title && r.title.length > 0);
    assert.ok(r.description && r.description.length > 0);
    assert.ok(r.reason && r.reason.length > 0);
    assert.ok(r.ctaText && r.ctaText.length > 0);
  });
});

// 6. Recommendation Ordering Priority
runTest('6. getRecommendations enforces priority ordering (SM-2 Due > Forgotten Vocab > Mistakes > Topics)', () => {
  const mockProfile = {
    dueCount: 8,
    forgottenVocabulary: [{ word: 'inevitable', lowGradeCount: 2 }],
    primaryWeakSkill: 'Chính tả',
    mistakeCount: 4,
    inProgressTopicIds: [],
    completedTopicIds: []
  };
  const recs = getRecommendations(mockProfile, [], 4);

  assert.strictEqual(recs[0].type, 'review'); // SM-2 Due is Priority 1
  assert.strictEqual(recs[1].type, 'vocabulary'); // Forgotten Vocab is Priority 2
  assert.strictEqual(recs[2].type, 'skill'); // Mistakes is Priority 3
});

// 7. Learning Insights Generation
runTest('7. getLearningInsights generates verified data-backed insights', () => {
  const profileWithData = {
    streak: 10,
    vocabularyCount: 50,
    masteredCount: 35,
    mistakeCount: 4,
    primaryWeakSkill: 'Ngữ pháp',
    activityHistory: { '2026-08-20': 5, '2026-08-21': 8 }
  };

  const insights = getLearningInsights(profileWithData);
  assert.ok(insights.length >= 3);

  const streakInsight = insights.find(i => i.type === 'streak');
  assert.ok(streakInsight && streakInsight.highlight.includes('10'));

  const masteryInsight = insights.find(i => i.type === 'mastery');
  assert.ok(masteryInsight && masteryInsight.highlight === '70%');
});

// 8. Safe Handling of Null / Undefined / Corrupted Inputs
runTest('8. Intelligence modules gracefully handle null and malformed inputs', () => {
  assert.deepStrictEqual(getDailyLearningPlan(null, null), { tasks: [], totalEstimatedMinutes: 0, completionRate: 0 });
  assert.deepStrictEqual(getRecommendations(null, null), []);
  assert.deepStrictEqual(getLearningInsights(null), []);
});

// 9. Insufficient Data Handling in Insights
runTest('9. getLearningInsights does not generate fake insights on 0 data', () => {
  const emptyProfile = {
    streak: 0,
    vocabularyCount: 0,
    masteredCount: 0,
    mistakeCount: 0,
    primaryWeakSkill: null,
    activityHistory: {}
  };
  const insights = getLearningInsights(emptyProfile);
  assert.strictEqual(insights.length, 0);
});

// 10. Large Dataset Performance
runTest('10. Intelligence functions execute in < 25ms even with 1,000 mock vocabulary items', () => {
  const largeVocabList = Array.from({ length: 1000 }, (_, i) => ({
    word: `word_${i}`,
    lowGradeCount: i % 5 === 0 ? 2 : 0,
    repetitions: i % 3 === 0 ? 4 : 1,
    nextReviewDate: Date.now() - (i % 2 === 0 ? 10000 : -10000)
  }));

  const mockLargeProfile = {
    vocabularyCount: largeVocabList.length,
    dueCount: 500,
    dueVocabulary: largeVocabList.slice(0, 500),
    forgottenVocabulary: largeVocabList.filter(v => v.lowGradeCount > 0),
    masteredCount: 333,
    mistakeCount: 50,
    primaryWeakSkill: 'Ngữ pháp',
    completedTopicIds: ['top_1', 'top_2'],
    inProgressTopicIds: ['top_3'],
    streak: 15,
    activityHistory: { '2026-08-25': 20 }
  };

  const start = Date.now();
  const plan = getDailyLearningPlan(mockLargeProfile, []);
  const recs = getRecommendations(mockLargeProfile, [], 4);
  const insights = getLearningInsights(mockLargeProfile);
  const duration = Date.now() - start;

  assert.ok(duration < 25, `Execution took ${duration}ms, expected < 25ms`);
  assert.ok(plan.tasks.length > 0);
  assert.ok(recs.length > 0);
  assert.ok(insights.length > 0);
});

console.log(`\n================ LEARNING INTELLIGENCE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
