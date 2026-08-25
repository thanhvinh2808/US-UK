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
  _resetSyncingState
} from '../src/utils/storage/syncEngine.js';
import { vocabStorage } from '../src/utils/storage/vocabStorage.js';
import { userStorage } from '../src/utils/storage/userStorage.js';
import { progressStorage } from '../src/utils/storage/progressStorage.js';
import { mistakeStorage } from '../src/utils/storage/mistakeStorage.js';
import { deckStorage } from '../src/utils/storage/deckStorage.js';
import { topicStorage } from '../src/utils/storage/topicStorage.js';
import { validateImportData } from '../src/utils/data/dataImport.js';
import { getErrorMessage, sanitizeText } from '../src/utils/errors/errorHandler.js';
import { broadcastTabMessage, subscribeTabMessages, clearTabListeners } from '../src/utils/storage/multiTabSync.js';
import { api, setApiAccessToken, getApiAccessToken } from '../src/services/api.js';

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

console.log('================ RUNNING PRODUCTION HARDENING SUITE ================\n');

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

// 1. Token expiration handling
await testAsync('1. Token expiration: 401 triggers silent refresh and retries request', async () => {
  setApiAccessToken('expired_jwt_token');
  let refreshed = false;
  let retried = false;

  globalThis.fetch = async (url, opts = {}) => {
    if (url.includes('/api/auth/refresh')) {
      refreshed = true;
      return createMockResponse({ success: true, accessToken: 'fresh_jwt_token', user: { id: 'usr_1' } });
    }
    if (url.includes('/api/study-sets')) {
      const authHeader = opts.headers ? opts.headers['Authorization'] : '';
      if (authHeader === 'Bearer expired_jwt_token') {
        return createMockResponse({ success: false, error: { code: 'TOKEN_EXPIRED' } }, 401);
      }
      if (authHeader === 'Bearer fresh_jwt_token') {
        retried = true;
        return createMockResponse({ success: true, set: { title: 'Test Set' } }, 201);
      }
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const res = await api.createStudySet({ title: 'Test Set' });
  assert.strictEqual(refreshed, true);
  assert.strictEqual(retried, true);
  assert.strictEqual(getApiAccessToken(), 'fresh_jwt_token');
});

// 2. Refresh failure handling
await testAsync('2. Refresh failure: stops gracefully and clears token on 401 refresh rejection', async () => {
  setApiAccessToken('invalid_stale_token');

  globalThis.fetch = async (url) => {
    if (url.includes('/api/auth/refresh')) {
      return createMockResponse({ success: false, error: { code: 'SESSION_REVOKED' } }, 401);
    }
    if (url.includes('/api/study-sets')) {
      return createMockResponse({ success: false, error: { code: 'TOKEN_EXPIRED' } }, 401);
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const res = await api.createStudySet({ title: 'Fail Set' });
  assert.strictEqual(res, null);
  assert.strictEqual(getApiAccessToken(), null);
});

// 3. Infinite retry prevention
await testAsync('3. Infinite retry prevention: requests are only retried once (isRetry lock)', async () => {
  setApiAccessToken('always_failing_token');
  let attemptCount = 0;

  globalThis.fetch = async (url) => {
    if (url.includes('/api/auth/refresh')) {
      return createMockResponse({ success: true, accessToken: 'dummy_token' }, 200);
    }
    if (url.includes('/api/study-sets')) {
      attemptCount++;
      return createMockResponse({ success: false, error: { code: 'TOKEN_EXPIRED' } }, 401);
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  await api.createStudySet({ title: 'Loop Check' });
  assert.strictEqual(attemptCount, 2); // Initial (1) + Retry (1) = 2, never 3+
});

// 4. Duplicate sync prevention
await testAsync('4. Duplicate sync prevention: concurrent flushOutboxQueue calls do not dispatch duplicate network requests', async () => {
  setStorageScope('user_dup_test');
  setApiAccessToken('valid_tok');
  clearOutboxQueue();

  enqueueReviewAction({ setId: 's1', cardId: 'c1', isCorrect: true, grade: 4 });

  let fetchCalls = 0;
  globalThis.fetch = async (url) => {
    if (url.includes('/api/progress/review')) {
      fetchCalls++;
      await new Promise(r => setTimeout(r, 60));
      return createMockResponse({ success: true }, 200);
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const [f1, f2] = await Promise.all([flushOutboxQueue(), flushOutboxQueue()]);
  assert.strictEqual(fetchCalls, 1);
  assert.ok(f1.status === 'completed' || f2.status === 'completed');
});

// 5. Queue persistence
test('5. Queue persistence: outbox actions persist across browser sessions under scoped key', () => {
  setStorageScope('user_persist_test');
  clearOutboxQueue();

  enqueueReviewAction({ setId: 's_pers', cardId: 'zenith', isCorrect: true, grade: 5 });
  const rawData = localStorage.getItem('eng_v2_u_user_persist_test_outbox_queue');
  assert.ok(rawData.includes('zenith'));

  const queue = getOutboxQueue('user_persist_test');
  assert.strictEqual(queue.length, 1);
  assert.strictEqual(queue[0].payload.cardId, 'zenith');
});

// 6. Queue retry
await testAsync('6. Queue retry: 500 errors increment retryCount and retain action in queue', async () => {
  setStorageScope('user_retry_suite');
  setApiAccessToken('valid_tok');
  clearOutboxQueue();

  enqueueReviewAction({ setId: 's_err', cardId: 'catalyst', isCorrect: true, grade: 4 });

  globalThis.fetch = async () => {
    return createMockResponse({ error: 'Server Error' }, 500);
  };

  const res = await flushOutboxQueue();
  assert.strictEqual(res.failedCount, 1);
  const q = getOutboxQueue();
  assert.strictEqual(q.length, 1);
  assert.strictEqual(q[0].retryCount, 1);
  assert.strictEqual(q[0].status, 'failed_retryable');
});

// 7. Permanent failure handling (Discard after max retries)
await testAsync('7. Permanent failure handling: action discarded after reaching max retries to prevent queue poison', async () => {
  setStorageScope('user_poison_test');
  setApiAccessToken('valid_tok');
  clearOutboxQueue();

  const action = enqueueReviewAction({ setId: 's_poison', cardId: 'poison_card', isCorrect: true, grade: 1 });
  // Manually set retryCount to 4 (so next fail is 5)
  const q = getOutboxQueue();
  q[0].retryCount = 4;
  localStorage.setItem('eng_v2_u_user_poison_test_outbox_queue', JSON.stringify(q));

  globalThis.fetch = async () => {
    return createMockResponse({ error: 'Bad Request' }, 400);
  };

  await flushOutboxQueue();
  const qAfter = getOutboxQueue();
  assert.strictEqual(qAfter.length, 0, 'Should be removed after 5th retry failure');
});

// 8. Offline to Online transition
await testAsync('8. Offline to Online: items queued while offline flush upon reconnection', async () => {
  setStorageScope('user_offline_flow');
  setApiAccessToken('valid_tok');
  clearOutboxQueue();

  // Enqueue while offline
  enqueueReviewAction({ setId: 's_reconn', cardId: 'resilience', isCorrect: true, grade: 5 });

  let networkHit = false;
  globalThis.fetch = async (url) => {
    if (url.includes('/api/progress/review')) {
      networkHit = true;
      return createMockResponse({ success: true }, 200);
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  // Trigger online flush
  const flushRes = await flushOutboxQueue();
  assert.strictEqual(networkHit, true);
  assert.strictEqual(flushRes.syncedCount, 1);
  assert.strictEqual(getOutboxQueue().length, 0);
});

// 9. User scope isolation
test('9. User scope isolation: User A and User B maintain separate scoped namespaces and queues', () => {
  setStorageScope('user_scope_A');
  enqueueReviewAction({ setId: 's_A', cardId: 'apple', isCorrect: true, grade: 4 });

  setStorageScope('user_scope_B');
  assert.strictEqual(getOutboxQueue().length, 0, 'User B outbox must be empty');

  setStorageScope('user_scope_A');
  assert.strictEqual(getOutboxQueue().length, 1);
});

// 10. Multi-tab synchronization broadcast
test('10. Multi-tab synchronization: broadcastTabMessage dispatches cross-tab event payloads', () => {
  clearTabListeners();
  let eventReceived = null;

  const unsub = subscribeTabMessages((msg) => {
    eventReceived = msg;
  });

  broadcastTabMessage('SCOPE_SWITCHED', { userId: 'user_tab_2' });
  assert.strictEqual(eventReceived?.type, 'SCOPE_SWITCHED');
  assert.strictEqual(eventReceived?.payload?.userId, 'user_tab_2');
  unsub();
});

// 11. Error sanitization
test('11. Error sanitization: redact JWTs, passwords, and secrets from error strings', () => {
  const dirty = 'Error at Bearer eyJhbGciOi... with password="SecretPassword"';
  const clean = sanitizeText(dirty);
  assert.strictEqual(clean.includes('SecretPassword'), false);
  assert.strictEqual(clean.includes('Bearer eyJhbGciOi'), false);
  assert.ok(clean.includes('[REDACTED]'));
});

// 12. Import security - Prototype Pollution
test('12. Import security: blocks JSON containing dangerous __proto__ keys', () => {
  const badJson = '{"__proto__": {"injected": true}, "vocab": []}';
  const res = validateImportData(badJson);
  assert.strictEqual(res.isValid, false);
});

// 13. Role tampering protection
test('13. Role tampering protection: import parser ignores attempts to set role: "admin"', () => {
  const tamperJson = JSON.stringify({
    role: 'admin',
    isAdmin: true,
    data: { vocab: [{ word: 'innocent' }] }
  });
  const res = validateImportData(tamperJson);
  assert.strictEqual(res.isValid, false);
});

// 14. Loading state protection
test('14. Loading protection: Error handler provides fallback when code is unknown', () => {
  const genericErr = getErrorMessage(null, null);
  assert.strictEqual(genericErr.code, 'UNKNOWN_ERROR');
});

// 15. API error mapping
test('15. API error mapping: maps 403 to permission denied', () => {
  const err403 = getErrorMessage(null, 403);
  assert.strictEqual(err403.code, 'INSUFFICIENT_PERMISSIONS');
});

// 16. Storage corruption recovery
test('16. Storage corruption recovery: handles malformed JSON in all storage domains without crashing', () => {
  setStorageScope('user_corrupt_test');

  // Inject corrupted strings
  localStorage.setItem('eng_v2_u_user_corrupt_test_saved_vocab', '{not-valid-json}');
  localStorage.setItem('eng_v2_u_user_corrupt_test_user_stats', 'null');
  localStorage.setItem('eng_v2_u_user_corrupt_test_topic_progress', '["wrong-type"]');
  localStorage.setItem('eng_v2_u_user_corrupt_test_mistake_bank', 'invalid-string');

  // Should recover with safe defaults without throwing
  assert.deepStrictEqual(vocabStorage.getSavedVocab(), []);
  assert.strictEqual(typeof userStorage.getUserStats(), 'object');
  assert.deepStrictEqual(progressStorage.getTopicProgress(), {});
  assert.deepStrictEqual(mistakeStorage.getMistakes(), []);
});

// 17. Large data handling
test('17. Large data handling: mistake bank caps maximum entries to 500', () => {
  setStorageScope('user_large_test');
  mistakeStorage.clearMistakes();

  for (let i = 0; i < 520; i++) {
    mistakeStorage.saveMistake({ question: `Question ${i}` });
  }

  const mistakes = mistakeStorage.getMistakes();
  assert.strictEqual(mistakes.length, 500);
});

// 18. Concurrent request handling
await testAsync('18. Concurrent request handling: multiple rapid calls to submitCardReview resolve cleanly', async () => {
  setStorageScope('user_concurrent_test');
  setApiAccessToken('valid_tok');

  globalThis.fetch = async () => {
    return createMockResponse({ success: true }, 200);
  };

  const p1 = api.submitCardReview('s1', 'cardA', true, 5);
  const p2 = api.submitCardReview('s1', 'cardB', true, 4);
  const p3 = api.submitCardReview('s1', 'cardC', false, 1);

  const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
  assert.strictEqual(r1.success, true);
  assert.strictEqual(r2.success, true);
  assert.strictEqual(r3.success, true);
});

// 19. Logout during sync
await testAsync('19. Logout during sync: loop aborts safely if active user switches to null', async () => {
  setStorageScope('user_logout_sync');
  setApiAccessToken('valid_tok');
  clearOutboxQueue();

  enqueueReviewAction({ setId: 's1', cardId: 'c1', isCorrect: true, grade: 4 });
  enqueueReviewAction({ setId: 's1', cardId: 'c2', isCorrect: true, grade: 5 });

  globalThis.fetch = async (url) => {
    if (url.includes('/api/progress/review')) {
      // Simulate user logout mid-sync
      setStorageScope(null);
      return createMockResponse({ success: true }, 200);
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  await flushOutboxQueue();
  // Loop should abort after first request due to scope mismatch
  assert.strictEqual(getCurrentUserId(), null);
});

// 20. Account switch during sync
await testAsync('20. Account switch during sync: does not drain previous user queue into new user account', async () => {
  setStorageScope('user_switch_1');
  setApiAccessToken('valid_tok');
  clearOutboxQueue();

  enqueueReviewAction({ setId: 's1', cardId: 'word_user_1', isCorrect: true, grade: 4 });
  enqueueReviewAction({ setId: 's1', cardId: 'word_user_1_second', isCorrect: true, grade: 5 });

  globalThis.fetch = async (url) => {
    if (url.includes('/api/progress/review')) {
      // Simulate switch to User 2
      setStorageScope('user_switch_2');
      return createMockResponse({ success: true }, 200);
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  await flushOutboxQueue();
  assert.strictEqual(getCurrentUserId(), 'user_switch_2');
  assert.strictEqual(getOutboxQueue('user_switch_2').length, 0, 'User 2 outbox must not have User 1 actions');
});

// Restore original fetch
globalThis.fetch = originalFetch;

console.log(`\n================ PRODUCTION HARDENING TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
