import assert from 'node:assert';
import {
  setStorageScope,
  getCurrentUserId,
  getCurrentScope,
  isUserScope,
  getScopedKey
} from '../src/utils/storage/storageScope.js';
import {
  getOutboxQueue,
  enqueueReviewAction,
  removeActionFromQueue,
  clearOutboxQueue,
  flushOutboxQueue,
  hydrateFromServer,
  _resetSyncingState
} from '../src/utils/storage/syncEngine.js';
import { vocabStorage } from '../src/utils/storage/vocabStorage.js';
import { userStorage } from '../src/utils/storage/userStorage.js';
import { progressStorage } from '../src/utils/storage/progressStorage.js';
import { mistakeStorage } from '../src/utils/storage/mistakeStorage.js';
import { deckStorage } from '../src/utils/storage/deckStorage.js';
import { calculateSM2 } from '../src/utils/storage/sm2.js';
import { api, setApiAccessToken } from '../src/services/api.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    _resetSyncingState();
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    _resetSyncingState();
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('================ RUNNING PHASE 4 DATA SYNC & PERSISTENCE SUITE ================\n');

// Mock localStorage in Node environment
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

// Store original fetch
const originalFetch = globalThis.fetch;

// Helper to create mock Response object
function createMockResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    clone() {
      return createMockResponse(data, status);
    },
    json: async () => data,
    text: async () => JSON.stringify(data)
  };
}

// 1. User A local data isolation
test('1. User A local data isolation: data written under user_A scope stays in eng_v2_u_user_A_*', () => {
  localStorage.clear();
  setStorageScope('user_A');

  assert.strictEqual(getCurrentUserId(), 'user_A');
  assert.strictEqual(isUserScope(), true);
  assert.strictEqual(getScopedKey('saved_vocab'), 'eng_v2_u_user_A_saved_vocab');

  vocabStorage.saveWord({
    word: 'ephemeral',
    ipa: '/ɪˈfem.ər.əl/',
    vietnamese: 'phù du, chóng tàn'
  });

  const rawUserAData = localStorage.getItem('eng_v2_u_user_A_saved_vocab');
  assert.ok(rawUserAData, 'User A vocab must be persisted under scoped key');
  assert.ok(rawUserAData.includes('ephemeral'));

  const userAVocab = vocabStorage.getSavedVocab();
  assert.strictEqual(userAVocab.length, 1);
  assert.strictEqual(userAVocab[0].word, 'ephemeral');
});

// 2. User B local data isolation
test('2. User B local data isolation: switching to user_B does NOT see User A vocab and writes to eng_v2_u_user_B_*', () => {
  setStorageScope('user_B');

  assert.strictEqual(getCurrentUserId(), 'user_B');
  assert.strictEqual(getScopedKey('saved_vocab'), 'eng_v2_u_user_B_saved_vocab');

  const userBVocabInitial = vocabStorage.getSavedVocab();
  assert.strictEqual(userBVocabInitial.length, 0, 'User B must not see User A vocabulary');

  vocabStorage.saveWord({
    word: 'serendipity',
    ipa: '/ˌser.ənˈdɪp.ə.ti/',
    vietnamese: 'sự tình cờ may mắn'
  });

  const rawUserBData = localStorage.getItem('eng_v2_u_user_B_saved_vocab');
  assert.ok(rawUserBData.includes('serendipity'));
  assert.strictEqual(rawUserBData.includes('ephemeral'), false, 'User B storage must not contain User A words');

  // Verify User A still intact
  setStorageScope('user_A');
  const userAReloaded = vocabStorage.getSavedVocab();
  assert.strictEqual(userAReloaded.length, 1);
  assert.strictEqual(userAReloaded[0].word, 'ephemeral');
});

// 3. Guest data isolation
test('3. Guest data isolation: unauthenticated guest writes to eng_v2_guest_* without polluting user accounts', () => {
  setStorageScope(null);

  assert.strictEqual(getCurrentUserId(), null);
  assert.strictEqual(getCurrentScope(), 'guest');
  assert.strictEqual(isUserScope(), false);
  assert.strictEqual(getScopedKey('saved_vocab'), 'eng_v2_guest_saved_vocab');

  vocabStorage.saveWord({
    word: 'wanderlust',
    vietnamese: 'niềm đam mê du lịch'
  });

  const guestData = localStorage.getItem('eng_v2_guest_saved_vocab');
  assert.ok(guestData.includes('wanderlust'));

  // Ensure neither User A nor User B has wanderlust
  assert.strictEqual(localStorage.getItem('eng_v2_u_user_A_saved_vocab').includes('wanderlust'), false);
  assert.strictEqual(localStorage.getItem('eng_v2_u_user_B_saved_vocab').includes('wanderlust'), false);
});

// 4. Logout scope switching
test('4. Logout scope switching: setStorageScope(null) switches back to guest namespace cleanly', () => {
  setStorageScope('temp_user_123');
  assert.strictEqual(getCurrentScope(), 'temp_user_123');

  // Simulate logout
  setStorageScope(null);
  assert.strictEqual(getCurrentScope(), 'guest');
  assert.strictEqual(getScopedKey('user_stats'), 'eng_v2_guest_user_stats');
});

// 5. Offline outbox queuing
test('5. Offline outbox queuing: review action is saved into persistent scoped outbox queue', () => {
  setStorageScope('user_offline_test');
  clearOutboxQueue();

  vocabStorage.saveWord({ word: 'resilient', vietnamese: 'kiên cường' });

  // Update progress (Grade 4)
  vocabStorage.updateWordProgress('resilient', 4, 'ielts_deck_1');

  const queue = getOutboxQueue();
  assert.strictEqual(queue.length, 1);
  assert.strictEqual(queue[0].type, 'CARD_REVIEW');
  assert.strictEqual(queue[0].payload.cardId, 'resilient');
  assert.strictEqual(queue[0].payload.grade, 4);
  assert.strictEqual(queue[0].payload.isCorrect, true);
  assert.strictEqual(queue[0].payload.setId, 'ielts_deck_1');
});

// 6. Online auto flush
await testAsync('6. Online auto flush: flushOutboxQueue flushes items to API and empties queue on 200 OK', async () => {
  setStorageScope('user_sync_test');
  setApiAccessToken('valid_mock_token');
  clearOutboxQueue();

  enqueueReviewAction({
    setId: 'set_1',
    cardId: 'ubiquitous',
    isCorrect: true,
    grade: 5
  });

  assert.strictEqual(getOutboxQueue().length, 1);

  let syncedEndpointCalled = false;
  globalThis.fetch = async (url, opts) => {
    if (url.includes('/api/progress/review')) {
      syncedEndpointCalled = true;
      assert.strictEqual(opts.method, 'POST');
      assert.strictEqual(opts.headers['Authorization'], 'Bearer valid_mock_token');
      const body = JSON.parse(opts.body);
      assert.strictEqual(body.cardId, 'ubiquitous');
      assert.strictEqual(body.grade, 5);
      return createMockResponse({ success: true, message: 'Review recorded' }, 200);
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  const syncResult = await flushOutboxQueue();
  assert.strictEqual(syncedEndpointCalled, true);
  assert.strictEqual(syncResult.syncedCount, 1);
  assert.strictEqual(getOutboxQueue().length, 0, 'Queue must be empty after successful flush');
});

// 7. Idempotent sync
test('7. Idempotent sync: multiple reviews for same card deduplicate into single latest state in outbox', () => {
  setStorageScope('user_dedup_test');
  clearOutboxQueue();

  enqueueReviewAction({ setId: 'set_a', cardId: 'meticulous', isCorrect: false, grade: 2, timestamp: 1000 });
  enqueueReviewAction({ setId: 'set_a', cardId: 'meticulous', isCorrect: true, grade: 4, timestamp: 2000 });

  const queue = getOutboxQueue();
  assert.strictEqual(queue.length, 1, 'Should contain only the latest state for meticulous');
  assert.strictEqual(queue[0].payload.grade, 4);
  assert.strictEqual(queue[0].payload.isCorrect, true);
});

// 8. Server hydration
await testAsync('8. Server hydration: hydrateFromServer merges remote SM-2 stats into local vocab', async () => {
  setStorageScope('user_hydrate_test');
  setApiAccessToken('valid_token');

  vocabStorage.saveWord({
    word: 'pragmatic',
    vietnamese: 'thực dụng, thực tế',
    repetitions: 0,
    interval: 1,
    easinessFactor: 2.5,
    nextReviewDate: 1000
  });

  const futureReviewTime = Date.now() + 86400000 * 6;
  globalThis.fetch = async (url) => {
    if (url.includes('/api/progress/my-progress')) {
      return createMockResponse({
        progress: [{
          cardId: 'pragmatic',
          setId: 'vocab_notebook',
          repetitions: 3,
          interval: 6,
          easinessFactor: 2.6,
          timesReviewed: 3,
          lastReviewedAt: new Date(Date.now()).toISOString(),
          nextReviewAt: new Date(futureReviewTime).toISOString(),
          status: 'mastered'
        }]
      }, 200);
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  const result = await hydrateFromServer(vocabStorage.getSavedVocab, vocabStorage.setSavedVocabDirect);
  assert.strictEqual(result.hydrated, true);
  assert.strictEqual(result.updatedWordsCount, 1);

  const hydratedWord = vocabStorage.getSavedVocab().find(w => w.word === 'pragmatic');
  assert.strictEqual(hydratedWord.repetitions, 3);
  assert.strictEqual(hydratedWord.interval, 6);
  assert.strictEqual(hydratedWord.status, 'mastered');
});

// 9. Timestamp LWW conflict resolution
await testAsync('9. Timestamp LWW conflict: local wins if local review timestamp is strictly newer than server', async () => {
  setStorageScope('user_lww_test');
  setApiAccessToken('valid_token');

  // Local card was reviewed just now
  const now = Date.now();
  vocabStorage.saveWord({
    word: 'lucid',
    vietnamese: 'rõ ràng, minh bạch',
    repetitions: 5,
    interval: 15,
    easinessFactor: 2.8,
    savedAt: now,
    nextReviewDate: now + 86400000 * 15
  });

  // Server has older review from 3 days ago
  const oldServerReviewTime = new Date(now - 86400000 * 3).toISOString();
  globalThis.fetch = async (url) => {
    if (url.includes('/api/progress/my-progress')) {
      return createMockResponse({
        progress: [{
          cardId: 'lucid',
          repetitions: 1,
          interval: 1,
          easinessFactor: 2.5,
          lastReviewedAt: oldServerReviewTime,
          nextReviewAt: oldServerReviewTime,
          status: 'learning'
        }]
      }, 200);
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  const result = await hydrateFromServer(vocabStorage.getSavedVocab, vocabStorage.setSavedVocabDirect);
  assert.strictEqual(result.hydrated, true);
  assert.strictEqual(result.updatedWordsCount, 0, 'Local record must NOT be overwritten by older server record');

  const preservedWord = vocabStorage.getSavedVocab().find(w => w.word === 'lucid');
  assert.strictEqual(preservedWord.repetitions, 5);
});

// 10. Duplicate worker prevention
await testAsync('10. Duplicate worker prevention: simultaneous flushOutboxQueue calls trigger only 1 active sync worker', async () => {
  setStorageScope('user_worker_mutex_test');
  setApiAccessToken('valid_token');
  clearOutboxQueue();

  enqueueReviewAction({ setId: 'set_1', cardId: 'tenacious', isCorrect: true, grade: 4 });

  let fetchCount = 0;
  globalThis.fetch = async (url) => {
    if (url.includes('/api/progress/review')) {
      fetchCount++;
      await new Promise(r => setTimeout(r, 60));
      return createMockResponse({ success: true }, 200);
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  // Launch 2 flushes concurrently
  const [res1, res2] = await Promise.all([
    flushOutboxQueue(),
    flushOutboxQueue()
  ]);

  assert.ok(res1.status === 'completed' || res2.status === 'completed');
  assert.ok(res1.status === 'already_syncing' || res2.status === 'already_syncing');
  assert.strictEqual(fetchCount, 1, 'Only 1 network request should be dispatched across concurrent calls');
});

// 11. Failed sync retry
await testAsync('11. Failed sync retry: 500 error increments retryCount and retains item in queue for next flush', async () => {
  setStorageScope('user_retry_test');
  setApiAccessToken('valid_token');
  clearOutboxQueue();

  enqueueReviewAction({ setId: 'set_err', cardId: 'epiphany', isCorrect: true, grade: 5 });

  globalThis.fetch = async () => {
    return createMockResponse({ success: false, error: 'Server Error' }, 500);
  };

  const syncResult = await flushOutboxQueue();
  assert.strictEqual(syncResult.syncedCount, 0);
  assert.strictEqual(syncResult.failedCount, 1);

  const queueAfterFail = getOutboxQueue();
  assert.strictEqual(queueAfterFail.length, 1);
  assert.strictEqual(queueAfterFail[0].retryCount, 1);
});

// 12. 401 refresh during sync
await testAsync('12. 401 refresh during sync: expired token automatically refreshes and completes sync request', async () => {
  setStorageScope('user_401_sync_test');
  setApiAccessToken('expired_sync_token');
  clearOutboxQueue();

  enqueueReviewAction({ setId: 'set_401', cardId: 'profound', isCorrect: true, grade: 4 });

  let refreshCalled = false;
  let retrySucceeded = false;
  const newRefreshedToken = 'refreshed_access_token_during_sync';

  globalThis.fetch = async (url, opts) => {
    if (url.includes('/api/auth/refresh')) {
      refreshCalled = true;
      return createMockResponse({ success: true, accessToken: newRefreshedToken, user: { id: 'user_401_sync_test' } }, 200);
    }

    if (url.includes('/api/progress/review')) {
      if (opts.headers['Authorization'] === 'Bearer expired_sync_token') {
        return createMockResponse({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } }, 401);
      } else if (opts.headers['Authorization'] === `Bearer ${newRefreshedToken}`) {
        retrySucceeded = true;
        return createMockResponse({ success: true, message: 'Review saved with fresh token' }, 200);
      }
    }

    throw new Error(`Unexpected URL ${url}`);
  };

  const syncResult = await flushOutboxQueue();
  assert.strictEqual(refreshCalled, true, 'Refresh must be called upon 401');
  assert.strictEqual(retrySucceeded, true, 'Retry with new token must succeed');
  assert.strictEqual(syncResult.syncedCount, 1);
  assert.strictEqual(getOutboxQueue().length, 0);
});

// 13. SM-2 algorithm integrity
test('13. SM-2 integrity: calculateSM2 produces exact SuperMemo-2 mathematical intervals and ease factors', () => {
  // Test Grade 4 (Good)
  const step1 = calculateSM2(4, 0, 1, 2.5);
  assert.strictEqual(step1.repetitions, 1);
  assert.strictEqual(step1.interval, 1);
  assert.strictEqual(step1.easinessFactor, 2.5);

  const step2 = calculateSM2(4, 1, 1, 2.5);
  assert.strictEqual(step2.repetitions, 2);
  assert.strictEqual(step2.interval, 6);

  const step3 = calculateSM2(4, 2, 6, 2.5);
  assert.strictEqual(step3.repetitions, 3);
  assert.strictEqual(step3.interval, 15); // Math.round(6 * 2.5) = 15

  // Test Grade 1 (Reset / Again)
  const resetStep = calculateSM2(1, 3, 15, 2.5);
  assert.strictEqual(resetStep.repetitions, 0);
  assert.strictEqual(resetStep.interval, 0);
  assert.strictEqual(resetStep.easinessFactor, 2.3);
});

// 14. Vocab & Grammar regression
test('14. Vocab & Grammar regression: topic progress, mistakes, custom decks function under scoped storage', () => {
  setStorageScope('user_regression_test');

  // Topic Progress
  progressStorage.updateTopicProgress('topic_custom_1', 'reading', 10);
  const prog = progressStorage.getTopicProgress();
  assert.strictEqual(prog['topic_custom_1']?.is_reading_completed, true);

  // Mistake Bank
  mistakeStorage.saveMistake({
    module: 'grammar',
    skill: 'Ngữ pháp',
    question: 'She go to school',
    correctAnswer: 'She goes to school'
  });
  const mistakes = mistakeStorage.getMistakes();
  assert.strictEqual(mistakes.length, 1);
  assert.strictEqual(mistakes[0].question, 'She go to school');

  // Custom Decks
  deckStorage.saveCustomDeck({ id: 'deck_oxford_5000', name: 'Oxford 5000' });
  const decks = deckStorage.getCustomDecks();
  assert.strictEqual(decks.length, 1);
  assert.strictEqual(decks[0].name, 'Oxford 5000');

  // User Stats & Activity
  userStorage.updateUserStats({ points: 250 });
  const stats = userStorage.getUserStats();
  assert.strictEqual(stats.points, 250);
});

// Restore original fetch
globalThis.fetch = originalFetch;

console.log(`\n================ DATA SYNC TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
if (failed > 0) {
  process.exit(1);
}
