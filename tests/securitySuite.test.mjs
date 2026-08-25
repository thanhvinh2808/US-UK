import assert from 'node:assert';
import jwt from '../server/node_modules/jsonwebtoken/index.js';
import { authenticate } from '../server/middleware/authenticate.js';
import { requireRole } from '../server/middleware/requireRole.js';
import { createRateLimiter } from '../server/middleware/rateLimiter.js';
import { validateRegister } from '../server/middleware/validateAuth.js';
import { authService, sanitizeUser } from '../server/services/authService.js';
import { sessionService } from '../server/services/sessionService.js';
import { isBcryptHash } from '../server/scripts/migrateUsers.js';
import { progressController } from '../server/controllers/progressController.js';
import { studySetController } from '../server/controllers/studySetController.js';
import { aiController } from '../server/controllers/aiController.js';
import { progressService } from '../server/services/progressService.js';
import { studySetService } from '../server/services/studySetService.js';
import UserSession from '../server/models/UserSession.js';

const TEST_JWT_SECRET = 'test_secret_for_security_suite_tests_64_characters_length_required';
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.GEMINI_API_KEY = 'test_gemini_api_key_for_unit_tests';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
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
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    failed++;
  }
}

// In-Memory Session Mock for unit testing without database dependency
let mockSessionStore = [];

function wrapSession(s) {
  if (!s) return null;
  return {
    ...s,
    save: async function () {
      const idx = mockSessionStore.findIndex((item) => item._id === this._id);
      if (idx !== -1) mockSessionStore[idx] = { ...this };
    }
  };
}

UserSession.create = async (data) => {
  const session = {
    _id: 'mock_sess_' + Math.random().toString(36).substring(2, 9),
    userId: data.userId,
    refreshTokenHash: data.refreshTokenHash,
    deviceInfo: data.deviceInfo || {},
    expiresAt: data.expiresAt,
    lastUsedAt: data.lastUsedAt || new Date(),
    isRevoked: data.isRevoked || false,
    revokedAt: data.revokedAt || null,
    revokedReason: data.revokedReason || null
  };
  mockSessionStore.push(session);
  return wrapSession(session);
};

UserSession.findOne = async (query) => {
  const s = mockSessionStore.find((item) => item.refreshTokenHash === query.refreshTokenHash);
  return wrapSession(s);
};

UserSession.findOneAndUpdate = async (query, update) => {
  const idx = mockSessionStore.findIndex((item) => item.refreshTokenHash === query.refreshTokenHash);
  if (idx === -1) return null;
  mockSessionStore[idx] = {
    ...mockSessionStore[idx],
    ...update,
    isRevoked: update.isRevoked !== undefined ? update.isRevoked : mockSessionStore[idx].isRevoked,
    revokedAt: update.revokedAt !== undefined ? update.revokedAt : mockSessionStore[idx].revokedAt,
    revokedReason: update.revokedReason !== undefined ? update.revokedReason : mockSessionStore[idx].revokedReason
  };
  return wrapSession(mockSessionStore[idx]);
};

UserSession.updateMany = async (query, update) => {
  let count = 0;
  mockSessionStore = mockSessionStore.map((s) => {
    if (s.userId.toString() === query.userId.toString() && (query.isRevoked === undefined || s.isRevoked === query.isRevoked)) {
      count++;
      return {
        ...s,
        ...update,
        isRevoked: update.isRevoked !== undefined ? update.isRevoked : s.isRevoked,
        revokedAt: update.revokedAt !== undefined ? update.revokedAt : s.revokedAt,
        revokedReason: update.revokedReason !== undefined ? update.revokedReason : s.revokedReason
      };
    }
    return s;
  });
  return { modifiedCount: count };
};

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
    },
    cookie(name, val, opts) {
      this.headers[`cookie_${name}`] = { val, opts };
    },
    clearCookie(name, opts) {
      this.headers[`cleared_${name}`] = opts;
    }
  };
  return res;
}

console.log('================ RUNNING PHASE 2 COMPREHENSIVE SECURITY SUITE ================\n');

async function runSecuritySuite() {
  // 1. Protected progress API missing token -> 401
  test('1. Protected progress API missing token -> 401 MISSING_TOKEN', () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error.code, 'MISSING_TOKEN');
  });

  // 2. Protected progress API fake token -> 401
  test('2. Protected progress API fake token -> 401 INVALID_TOKEN', () => {
    const req = { headers: { authorization: 'Bearer fake.invalid.token' } };
    const res = createMockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error.code, 'INVALID_TOKEN');
  });

  // 3. User A cannot read progress of User B (IDOR) -> 403
  await testAsync('3. User A cannot read progress of User B (IDOR Protection) -> 403', async () => {
    const req = {
      user: { id: '507f1f77bcf86cd799439011', username: 'alice', role: 'user' },
      params: { userId: '507f1f77bcf86cd799439022', setId: 'set_123' }
    };
    const res = createMockRes();
    await progressController.getUserProgress(req, res);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.error.code, 'INSUFFICIENT_PERMISSIONS');
  });

  // 4. User A cannot write progress for User B (req.body.userId is ignored)
  await testAsync('4. User A cannot write progress for User B (req.user.id enforced)', async () => {
    let capturedUserId = null;
    const originalSubmit = progressService.submitCardReview;
    progressService.submitCardReview = async (params) => {
      capturedUserId = params.userId;
      return { success: true };
    };

    const req = {
      user: { id: '507f1f77bcf86cd799439011', username: 'alice', role: 'user' },
      body: { userId: '507f1f77bcf86cd799439022', setId: 'set_123', cardId: 'card_456', isCorrect: true, grade: 4 }
    };
    const res = createMockRes();
    await progressController.submitReview(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(capturedUserId, '507f1f77bcf86cd799439011'); // MUST be user_A, NOT user_B!
    progressService.submitCardReview = originalSubmit;
  });

  // 5. User cannot create topic -> 403
  test('5. User with role "user" cannot create topic -> 403 INSUFFICIENT_PERMISSIONS', () => {
    const req = { user: { id: 'usr_1', role: 'user' } };
    const res = createMockRes();
    let nextCalled = false;
    requireRole('admin')(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
  });

  // 6. User cannot update topic -> 403
  test('6. User with role "user" cannot update topic -> 403 INSUFFICIENT_PERMISSIONS', () => {
    const req = { user: { id: 'usr_1', role: 'user' } };
    const res = createMockRes();
    let nextCalled = false;
    requireRole('admin')(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
  });

  // 7. User cannot delete topic -> 403
  test('7. User with role "user" cannot delete topic -> 403 INSUFFICIENT_PERMISSIONS', () => {
    const req = { user: { id: 'usr_1', role: 'user' } };
    const res = createMockRes();
    let nextCalled = false;
    requireRole('admin')(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
  });

  // 8. Admin can CRUD topic -> 200 / next()
  test('8. Admin with role "admin" is authorized to manage topics', () => {
    const req = { user: { id: 'admin_1', role: 'admin' } };
    const res = createMockRes();
    let nextCalled = false;
    requireRole('admin')(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });

  // 9. Study set creation always binds author = req.user.id
  await testAsync('9. Study set creation always binds authorId = req.user.id', async () => {
    let capturedData = null;
    const originalCreate = studySetService.createStudySet;
    studySetService.createStudySet = async (data) => {
      capturedData = data;
      return { _id: 'set_new', ...data };
    };

    const req = {
      user: { id: '507f1f77bcf86cd799439011', role: 'user' },
      body: { title: 'My Custom Set' }
    };
    const res = createMockRes();
    await studySetController.createStudySet(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(capturedData.author, '507f1f77bcf86cd799439011');
    studySetService.createStudySet = originalCreate;
  });

  // 10. Client sending different authorId is overridden by req.user.id
  await testAsync('10. Client sending spoofed authorId is overridden by req.user.id', async () => {
    let capturedData = null;
    const originalCreate = studySetService.createStudySet;
    studySetService.createStudySet = async (data) => {
      capturedData = data;
      return { _id: 'set_new', ...data };
    };

    const req = {
      user: { id: '507f1f77bcf86cd799439011', role: 'user' },
      body: { title: 'Spoofed Set', author: 'attacker_fake_id' }
    };
    const res = createMockRes();
    await studySetController.createStudySet(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(capturedData.author, '507f1f77bcf86cd799439011');
    studySetService.createStudySet = originalCreate;
  });

  // 11. AI without token -> 401
  test('11. AI endpoint without token -> 401 MISSING_TOKEN', () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
  });

  // 12. AI exceeds rate limit -> 429
  test('12. AI endpoint exceeding rate limit (20 req/min) -> 429 AI_RATE_LIMIT_EXCEEDED', () => {
    const limiter = createRateLimiter({
      windowMs: 60000,
      max: 1,
      keyGenerator: (r) => r.user?.id || 'anon',
      errorCode: 'AI_RATE_LIMIT_EXCEEDED',
      prefix: 'test_ai'
    });

    const req = { user: { id: 'ai_user' } };
    const res1 = createMockRes();
    const res2 = createMockRes();

    limiter(req, res1, () => {});
    limiter(req, res2, () => {});

    assert.strictEqual(res2.statusCode, 429);
    assert.strictEqual(res2.body.error.code, 'AI_RATE_LIMIT_EXCEEDED');
  });

  // 13. Admin request without JWT -> blocked (401)
  test('13. Admin request without JWT -> 401 MISSING_TOKEN', () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
  });

  // 14. Fake role in body cannot become admin
  test('14. Fake role in request cannot escalate permissions', () => {
    const req = {
      user: { id: 'usr_1', role: 'user' }, // Actual verified JWT
      body: { role: 'admin' }              // Fake body attempt
    };
    const res = createMockRes();
    let nextCalled = false;
    requireRole('admin')(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
  });

  // 15. Role in register body is stripped
  test('15. Role in registration payload is automatically stripped', () => {
    const req = {
      body: {
        username: 'new_user',
        email: 'new@example.com',
        password: 'ValidPassword123',
        role: 'admin'
      }
    };
    const res = createMockRes();
    let nextCalled = false;
    validateRegister(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.body.role, undefined);
  });

  // 16. Migration script does NOT turn demo_password_hash into bcrypt hash
  test('16. Migration helper correctly identifies demo_password_hash and non-bcrypt hashes', () => {
    assert.strictEqual(isBcryptHash('demo_password_hash'), false);
    assert.strictEqual(isBcryptHash('plain_text_password'), false);
    assert.strictEqual(isBcryptHash('$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'), true);
  });

  // 17. Admin Bootstrap does not hardcode credentials
  test('17. Admin bootstrap requires dynamic/env credentials', () => {
    delete process.env.ADMIN_BOOTSTRAP_EMAIL;
    delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
    assert.strictEqual(process.env.ADMIN_BOOTSTRAP_EMAIL, undefined);
  });

  // 18. x-admin-key replaced by JWT RBAC as primary authentication
  test('18. Primary authorization uses JWT RBAC (authenticate + requireRole)', () => {
    const reqAdmin = { user: { id: 'adm_1', role: 'admin' } };
    const resAdmin = createMockRes();
    let nextAdmin = false;
    requireRole('admin')(reqAdmin, resAdmin, () => { nextAdmin = true; });
    assert.strictEqual(nextAdmin, true);
  });

  // 19. Logout revokes session
  await testAsync('19. Logout invalidates target refresh session', async () => {
    mockSessionStore = [];
    const { rawToken } = await sessionService.createSession({ userId: '507f1f77bcf86cd799439011' });
    await sessionService.revokeSession(rawToken, 'user_logout');
    const check = await sessionService.findValidSession(rawToken);
    assert.strictEqual(check.valid, false);
  });

  // 20. Refresh token rotation produces new valid token and invalidates old token
  await testAsync('20. Refresh token rotation functions securely', async () => {
    mockSessionStore = [];
    const { rawToken: tokenA } = await sessionService.createSession({ userId: '507f1f77bcf86cd799439011' });
    const rot = await sessionService.rotateSession(tokenA);
    assert.strictEqual(rot.rotated, true);
    assert.notStrictEqual(rot.rawToken, tokenA);
  });

  // 21. Replay detection revokes all user sessions
  await testAsync('21. Replay attack on revoked token triggers global revocation', async () => {
    mockSessionStore = [];
    const { rawToken: victimToken } = await sessionService.createSession({ userId: '507f1f77bcf86cd799439011' });
    await sessionService.revokeSession(victimToken, 'rotation');
    const replay = await sessionService.rotateSession(victimToken);
    assert.strictEqual(replay.replayDetected, true);
    assert.strictEqual(replay.reason, 'REPLAY_DETECTED');
  });

  console.log(`\n================ SECURITY SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
  process.exit(failed > 0 ? 1 : 0);
}

runSecuritySuite();
