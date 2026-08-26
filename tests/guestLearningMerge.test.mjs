import assert from 'node:assert';
import { storage } from '../src/utils/storage/index.js';
import { setStorageScope, getScopedKey, isUserScope } from '../src/utils/storage/storageScope.js';
import {
  checkGuestDataExists,
  mergeGuestDataToAccount,
  clearGuestData,
  calculateStreakFromActivity,
  getMigrationJournal
} from '../src/utils/storage/guestMergeEngine.js';

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

// In-memory mock localStorage for Node.js test environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear()
};

console.log('================ RUNNING PHASE 16B GUEST MIGRATION & HARDENING TEST SUITE ================\n');

function resetAll() {
  mockStorage.clear();
  setStorageScope(null); // Guest scope
}

// TEST 1: Public features work without authentication
runTest('TEST 1: Storage scope starts as guest (no auth required) and provides guest-scoped keys', () => {
  resetAll();
  assert.strictEqual(isUserScope(), false, 'Default scope must not be user');
  assert.strictEqual(getScopedKey('saved_vocab'), 'eng_v2_guest_saved_vocab');
  assert.strictEqual(getScopedKey('topic_progress'), 'eng_v2_guest_topic_progress');
});

// TEST 2: Guest can save vocabulary and progress locally
runTest('TEST 2: Guest learns words and earns progress; data persists in guest storage namespace', () => {
  resetAll();

  // Guest saves 2 words
  storage.saveWord({ word: 'serendipity', ipa: '/ˌser.ənˈdɪp.ə.ti/', vietnamese: 'sự may mắn bất ngờ', repetition: 1 });
  storage.saveWord({ word: 'resilient', ipa: '/rɪˈzɪl.jənt/', vietnamese: 'kiên cường', repetition: 2 });

  // Guest completes reading & speaking in topic_1
  storage.updateTopicProgress('topic_1', 'reading');
  storage.updateTopicProgress('topic_1', 'speaking', 85);

  // Guest earns points
  storage.updateUserStats({ points: 50, streak: 1, lastActive: '2026-08-26T12:00:00.000Z', activityHistory: { '2026-08-26': 5 } });

  const guestWords = storage.getSavedVocab();
  const guestProg = storage.getTopicProgress();
  const guestStats = storage.getUserStats();

  assert.strictEqual(guestWords.length, 2, 'Guest should have 2 words');
  assert.strictEqual(guestProg.topic_1.is_reading_completed, true);
  assert.strictEqual(guestProg.topic_1.max_speaking_score, 85);
  assert.strictEqual(guestStats.points, 50);
  assert.strictEqual(checkGuestDataExists(), true, 'checkGuestDataExists must be true');
});

// TEST 3: Guest data persists across F5 refresh simulation
runTest('TEST 3: Guest data survives re-reading with new storage scope instantiation', () => {
  const rawVocab = JSON.parse(localStorage.getItem('eng_v2_guest_saved_vocab'));
  const rawProgress = JSON.parse(localStorage.getItem('eng_v2_guest_topic_progress'));

  assert.strictEqual(rawVocab.length, 2);
  assert.strictEqual(rawProgress.topic_1.max_speaking_score, 85);
});

// TEST 4: Guest Login Merges Data into Existing Account (Domain-Specific Rules)
runTest('TEST 4: Guest logs in to existing user account; merge engine unites vocabulary, maxes progress & stats', () => {
  const userId = 'user_abc_123';

  // Suppose User Account already had 1 different word and topic_1 speaking score = 60
  localStorage.setItem(getScopedKey('saved_vocab', userId), JSON.stringify([
    { word: 'ephemeral', ipa: '/ɪˈfem.ər.əl/', vietnamese: 'phù du', repetition: 3, lastReviewed: '2026-08-25T10:00:00.000Z' }
  ]));
  localStorage.setItem(getScopedKey('topic_progress', userId), JSON.stringify({
    topic_1: {
      is_reading_completed: false,
      max_speaking_score: 60,
      max_listening_score: 90
    },
    topic_2: {
      is_reading_completed: true,
      max_speaking_score: 75
    }
  }));
  localStorage.setItem(getScopedKey('user_stats', userId), JSON.stringify({
    points: 100,
    streak: 2,
    level: 'A2',
    lastActive: '2026-08-25T10:00:00.000Z',
    completedModules: 2,
    activityHistory: { '2026-08-25': 3, '2026-08-24': 2 }
  }));

  // Perform Merge
  const mergeResult = mergeGuestDataToAccount(userId);
  assert.strictEqual(mergeResult.merged, true, 'Merge must report success');
  assert.strictEqual(mergeResult.status, 'completed');

  // Verify User Scoped Data after merge
  const mergedVocab = JSON.parse(localStorage.getItem(getScopedKey('saved_vocab', userId)));
  const mergedProgress = JSON.parse(localStorage.getItem(getScopedKey('topic_progress', userId)));
  const mergedStats = JSON.parse(localStorage.getItem(getScopedKey('user_stats', userId)));

  // Vocab: Union of ('ephemeral') + ('serendipity', 'resilient') = 3 words
  assert.strictEqual(mergedVocab.length, 3, 'Must contain all 3 words');
  const wordNames = mergedVocab.map(w => w.word);
  assert.ok(wordNames.includes('ephemeral'));
  assert.ok(wordNames.includes('serendipity'));
  assert.ok(wordNames.includes('resilient'));

  // Topic Progress:
  // topic_1 reading: false (user) || true (guest) = true
  assert.strictEqual(mergedProgress.topic_1.is_reading_completed, true);
  // topic_1 speaking: max(60, 85) = 85
  assert.strictEqual(mergedProgress.topic_1.max_speaking_score, 85);
  // topic_1 listening: preserved 90 from account
  assert.strictEqual(mergedProgress.topic_1.max_listening_score, 90);
  // topic_2: preserved from account
  assert.strictEqual(mergedProgress.topic_2.is_reading_completed, true);

  // Stats: points = 100 + 50 = 150
  assert.strictEqual(mergedStats.points, 150);
  assert.strictEqual(mergedStats.level, 'A2');
  // Continuous streak: 2026-08-26 (guest), 2026-08-25 (user), 2026-08-24 (user) -> 3 consecutive days!
  assert.strictEqual(mergedStats.streak, 3);

  // Guest data should be safely cleared after successful migration
  assert.strictEqual(localStorage.getItem('eng_v2_guest_saved_vocab'), null);
  assert.strictEqual(checkGuestDataExists(), false, 'Guest data must be cleared after merge');
});

// TEST 5: Strict XP & History Idempotency (3x repeated merge)
runTest('TEST 5: Calling merge 3 times sequentially guarantees XP is never double-counted (150 -> 150 -> 150)', () => {
  const userId = 'user_abc_123';

  // Merge run #2
  const merge2 = mergeGuestDataToAccount(userId);
  assert.strictEqual(merge2.status, 'completed');
  let stats = JSON.parse(localStorage.getItem(getScopedKey('user_stats', userId)));
  assert.strictEqual(stats.points, 150, 'Points must remain 150 after 2nd merge');

  // Merge run #3
  const merge3 = mergeGuestDataToAccount(userId);
  assert.strictEqual(merge3.status, 'completed');
  stats = JSON.parse(localStorage.getItem(getScopedKey('user_stats', userId)));
  assert.strictEqual(stats.points, 150, 'Points must remain 150 after 3rd merge');

  const journal = getMigrationJournal(userId);
  assert.strictEqual(journal.status, 'completed');
  assert.strictEqual(journal.appliedGuestPoints, 50);
});

// TEST 6: Vocabulary SM-2 Mastery Preservation (No downgrade on merge)
runTest('TEST 6: SM-2 repetition and interval states are preserved without downgrade when merging duplicate words', () => {
  resetAll();
  const userId = 'user_sm2_test';

  // Guest learned 'tenacious' with repetition 4, lastReviewed = 2026-08-26
  storage.saveWord({
    word: 'tenacious',
    ipa: '/təˈneɪ.ʃəs/',
    vietnamese: 'kiên trì',
    repetition: 4,
    interval: 10,
    efactor: 2.6,
    lastReviewed: '2026-08-26T12:00:00.000Z'
  });

  // Account had 'tenacious' with lower mastery: repetition 1, lastReviewed = 2026-08-20
  localStorage.setItem(getScopedKey('saved_vocab', userId), JSON.stringify([
    {
      word: 'tenacious',
      ipa: '/təˈneɪ.ʃəs/',
      vietnamese: 'kiên trì',
      repetition: 1,
      interval: 1,
      efactor: 2.5,
      lastReviewed: '2026-08-20T10:00:00.000Z'
    }
  ]));

  mergeGuestDataToAccount(userId);

  const mergedVocab = JSON.parse(localStorage.getItem(getScopedKey('saved_vocab', userId)));
  assert.strictEqual(mergedVocab.length, 1);
  assert.strictEqual(mergedVocab[0].repetition, 4, 'Must preserve higher repetition 4');
  assert.strictEqual(mergedVocab[0].interval, 10, 'Must preserve higher interval 10');
  assert.strictEqual(mergedVocab[0].efactor, 2.6, 'Must preserve higher efactor 2.6');
  assert.strictEqual(mergedVocab[0].lastReviewed, '2026-08-26T12:00:00.000Z');
});

// TEST 7: Progress High-Water Mark (60 vs 90 -> 90; 90 vs 60 -> 90)
runTest('TEST 7: Topic progress preserves highest scores across all skill modules regardless of guest/account side', () => {
  resetAll();
  const userId = 'user_score_test';

  // Guest: topic_a speaking = 90, listening = 60; reading = true
  localStorage.setItem(getScopedKey('topic_progress', null), JSON.stringify({
    topic_a: { is_reading_completed: true, max_speaking_score: 90, max_listening_score: 60, max_writing_score: -1 }
  }));

  // Account: topic_a speaking = 60, listening = 90; writing = 80; grammar = true
  localStorage.setItem(getScopedKey('topic_progress', userId), JSON.stringify({
    topic_a: { is_reading_completed: false, is_grammar_completed: true, max_speaking_score: 60, max_listening_score: 90, max_writing_score: 80 }
  }));

  mergeGuestDataToAccount(userId);

  const mergedProgress = JSON.parse(localStorage.getItem(getScopedKey('topic_progress', userId)));
  assert.strictEqual(mergedProgress.topic_a.is_reading_completed, true);
  assert.strictEqual(mergedProgress.topic_a.is_grammar_completed, true);
  assert.strictEqual(mergedProgress.topic_a.max_speaking_score, 90, 'Speaking must be 90 (from guest)');
  assert.strictEqual(mergedProgress.topic_a.max_listening_score, 90, 'Listening must be 90 (from account)');
  assert.strictEqual(mergedProgress.topic_a.max_writing_score, 80, 'Writing must be 80 (from account)');
});

// TEST 8: Mistake Bank Deduplication
runTest('TEST 8: Mistake bank merges items uniquely by module + question + correctAnswer without duplication', () => {
  resetAll();
  const userId = 'user_mistake_test';

  // Guest has 2 mistakes
  storage.saveMistake({ module: 'flashcards', question: 'What is cat?', correctAnswer: 'Con mèo', userAnswer: 'Con chó' });
  storage.saveMistake({ module: 'grammar', question: 'He ___ to school.', correctAnswer: 'goes', userAnswer: 'go' });

  // Account already had the same flashcard mistake plus another one
  localStorage.setItem(getScopedKey('mistake_bank', userId), JSON.stringify([
    { id: 'm_acc_1', module: 'flashcards', question: 'What is cat?', correctAnswer: 'Con mèo', userAnswer: 'Con heo' },
    { id: 'm_acc_2', module: 'dictation', question: 'Listen carefully', correctAnswer: 'Hello world', userAnswer: 'Hello' }
  ]));

  mergeGuestDataToAccount(userId);

  const mergedMistakes = JSON.parse(localStorage.getItem(getScopedKey('mistake_bank', userId)));
  // Total unique mistakes: 'What is cat?' (1) + 'He ___ to school' (1) + 'Listen carefully' (1) = 3
  assert.strictEqual(mergedMistakes.length, 3, 'Must contain exactly 3 deduplicated mistakes');
});

// TEST 9: Offline Outbox Queue Forwarding & Deduplication
runTest('TEST 9: Guest outbox actions are moved to user outbox with deduplication', () => {
  resetAll();
  const userId = 'user_outbox_test';

  // Guest has 2 pending actions
  localStorage.setItem(getScopedKey('outbox_queue', null), JSON.stringify([
    { id: 'act_1', type: 'CARD_REVIEW', payload: { cardId: 'c_1', grade: 4 } },
    { id: 'act_2', type: 'CARD_REVIEW', payload: { cardId: 'c_2', grade: 5 } }
  ]));

  // Account already has act_1 (duplicate) and act_3 (unique)
  localStorage.setItem(getScopedKey('outbox_queue', userId), JSON.stringify([
    { id: 'act_1', type: 'CARD_REVIEW', payload: { cardId: 'c_1', grade: 4 } },
    { id: 'act_3', type: 'CARD_REVIEW', payload: { cardId: 'c_3', grade: 3 } }
  ]));

  mergeGuestDataToAccount(userId);

  const mergedOutbox = JSON.parse(localStorage.getItem(getScopedKey('outbox_queue', userId)));
  assert.strictEqual(mergedOutbox.length, 3, 'Must contain act_1, act_3, act_2 without duplicates');
  const actionIds = mergedOutbox.map(a => a.id);
  assert.ok(actionIds.includes('act_1'));
  assert.ok(actionIds.includes('act_2'));
  assert.ok(actionIds.includes('act_3'));
});

// TEST 10: Merge Failure Safety (Guest data never wiped on fatal error)
runTest('TEST 10: If merge fails (e.g. invalid target user ID), guest data is 100% preserved', () => {
  resetAll();
  storage.saveWord({ word: 'indispensable', ipa: '', vietnamese: 'không thể thiếu' });

  assert.strictEqual(checkGuestDataExists(), true);

  const failResult = mergeGuestDataToAccount(null);
  assert.strictEqual(failResult.merged, false);
  assert.strictEqual(failResult.status, 'failed');
  assert.strictEqual(checkGuestDataExists(), true, 'Guest data must remain untouched');
  assert.strictEqual(storage.getSavedVocab().length, 1);
});

// TEST 11: Accurate Continuous Calendar Streak Recalculation
runTest('TEST 11: calculateStreakFromActivity calculates legitimate continuous calendar streak', () => {
  // Reference date: 2026-08-26
  const refDate = new Date('2026-08-26T12:00:00.000Z');

  // Case A: Consecutive 4 days including today
  const histA = { '2026-08-26': 1, '2026-08-25': 2, '2026-08-24': 1, '2026-08-23': 3, '2026-08-21': 1 };
  assert.strictEqual(calculateStreakFromActivity(histA, refDate), 4, 'Streak must be 4 (23 to 26)');

  // Case B: No activity today, but active yesterday (consecutive 2 days)
  const histB = { '2026-08-25': 2, '2026-08-24': 1, '2026-08-20': 5 };
  assert.strictEqual(calculateStreakFromActivity(histB, refDate), 2, 'Streak must be 2 (24 to 25)');

  // Case C: Broken streak (last active 5 days ago)
  const histC = { '2026-08-20': 5, '2026-08-19': 3 };
  assert.strictEqual(calculateStreakFromActivity(histC, refDate), 0, 'Streak must be 0 (broken)');
});

// TEST 12: Multi-Tab & Storage Scope Isolation
runTest('TEST 12: User A, User B, and Guest namespaces are strictly isolated and never leak', () => {
  resetAll();

  // Guest
  setStorageScope(null);
  storage.saveWord({ word: 'guest_alpha' });

  // User 1
  setStorageScope('user_1');
  storage.saveWord({ word: 'user1_beta' });

  // User 2
  setStorageScope('user_2');
  storage.saveWord({ word: 'user2_gamma' });

  // Verify Guest
  setStorageScope(null);
  const gList = storage.getSavedVocab();
  assert.strictEqual(gList.length, 1);
  assert.strictEqual(gList[0].word, 'guest_alpha');

  // Verify User 1
  setStorageScope('user_1');
  const u1List = storage.getSavedVocab();
  assert.strictEqual(u1List.length, 1);
  assert.strictEqual(u1List[0].word, 'user1_beta');

  // Verify User 2
  setStorageScope('user_2');
  const u2List = storage.getSavedVocab();
  assert.strictEqual(u2List.length, 1);
  assert.strictEqual(u2List[0].word, 'user2_gamma');
});

// TEST 13: Token Security (Guest scope never stores JWT or credentials)
runTest('TEST 13: Guest storage keys never contain authentication tokens or credentials', () => {
  for (const [key, value] of mockStorage.entries()) {
    if (key.startsWith('eng_v2_guest_')) {
      assert.ok(!value.includes('Bearer'), `Guest key ${key} must not contain Bearer`);
      assert.ok(!value.includes('accessToken'), `Guest key ${key} must not contain accessToken`);
      assert.ok(!value.includes('password'), `Guest key ${key} must not contain password`);
    }
  }
});

// TEST 14: Logout transitions cleanly back to guest scope
runTest('TEST 14: Logout resets storage scope to guest without exposing previous account data', () => {
  setStorageScope(null);
  clearGuestData();

  assert.strictEqual(storage.getCurrentScope(), 'guest');
  assert.strictEqual(storage.getSavedVocab().length, 0);
  assert.strictEqual(storage.getUserStats().points, 0);
});

console.log(`\n================ PHASE 16B GUEST MIGRATION & HARDENING SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
