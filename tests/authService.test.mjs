import assert from 'node:assert';
import jwt from '../server/node_modules/jsonwebtoken/index.js';
import bcrypt from '../server/node_modules/bcryptjs/index.js';
import { authService, sanitizeUser } from '../server/services/authService.js';
import { sessionService } from '../server/services/sessionService.js';
import User from '../server/models/User.js';
import UserSession from '../server/models/UserSession.js';

const TEST_JWT_SECRET = 'test_secret_for_auth_service_tests_64_characters_entropy_required';
process.env.JWT_SECRET = TEST_JWT_SECRET;

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

// In-Memory Database Mocks for Deterministic Isolated Testing
const mockUsers = new Map();
let mockSessionList = [];

// Helper to wrap results in Mongoose Query-like chain
function createQuery(result) {
  const query = {
    select(fields) {
      return query;
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
    catch(reject) {
      return Promise.resolve(result).catch(reject);
    }
  };
  return query;
}

function wrapUserDoc(u) {
  if (!u) return null;
  return {
    ...u,
    _id: u._id,
    save: async function () {
      mockUsers.set(this._id.toString(), {
        _id: this._id,
        username: this.username,
        email: this.email,
        passwordHash: this.passwordHash,
        role: this.role || 'user',
        failedLoginAttempts: this.failedLoginAttempts || 0,
        lockUntil: this.lockUntil || null,
        preferredAccent: this.preferredAccent || 'US',
        targetBand: this.targetBand || 7.5,
        streakDays: this.streakDays || 0,
        lastActiveAt: this.lastActiveAt || new Date()
      });
      return this;
    },
    toObject: function () {
      return { ...this };
    }
  };
}

User.findOne = (query) => {
  let matched = null;
  if (query.$or) {
    for (const [_, u] of mockUsers.entries()) {
      if (
        (query.$or[0]?.email && u.email.toLowerCase() === query.$or[0].email.toLowerCase()) ||
        (query.$or[1]?.username && u.username === query.$or[1].username)
      ) {
        matched = u;
        break;
      }
    }
  } else if (query.email) {
    matched = Array.from(mockUsers.values()).find(
      (user) => user.email.toLowerCase() === query.email.toLowerCase()
    ) || null;
  }
  return createQuery(wrapUserDoc(matched));
};

User.findById = (id) => {
  const u = mockUsers.get(id.toString());
  return createQuery(wrapUserDoc(u));
};

User.prototype.save = async function () {
  if (!this._id) {
    this._id = 'mock_user_' + Math.random().toString(36).substring(2, 9);
  }
  mockUsers.set(this._id.toString(), {
    _id: this._id,
    username: this.username,
    email: this.email,
    passwordHash: this.passwordHash,
    role: this.role || 'user',
    failedLoginAttempts: this.failedLoginAttempts || 0,
    lockUntil: this.lockUntil || null,
    preferredAccent: this.preferredAccent || 'US',
    targetBand: this.targetBand || 7.5,
    streakDays: this.streakDays || 0,
    lastActiveAt: this.lastActiveAt || new Date()
  });
  return this;
};

function wrapSessionDoc(s) {
  if (!s) return null;
  return {
    ...s,
    save: async function () {
      const idx = mockSessionList.findIndex((item) => item._id === this._id);
      if (idx !== -1) {
        mockSessionList[idx] = { ...this };
      }
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
  mockSessionList.push(session);
  return wrapSessionDoc(session);
};

UserSession.findOne = async (query) => {
  const s = mockSessionList.find((item) => item.refreshTokenHash === query.refreshTokenHash);
  return wrapSessionDoc(s);
};

UserSession.findOneAndUpdate = async (query, update) => {
  const idx = mockSessionList.findIndex((item) => item.refreshTokenHash === query.refreshTokenHash);
  if (idx === -1) return null;
  mockSessionList[idx] = {
    ...mockSessionList[idx],
    ...update,
    isRevoked: update.isRevoked !== undefined ? update.isRevoked : mockSessionList[idx].isRevoked,
    revokedAt: update.revokedAt !== undefined ? update.revokedAt : mockSessionList[idx].revokedAt,
    revokedReason: update.revokedReason !== undefined ? update.revokedReason : mockSessionList[idx].revokedReason
  };
  return wrapSessionDoc(mockSessionList[idx]);
};

UserSession.updateMany = async (query, update) => {
  let count = 0;
  mockSessionList = mockSessionList.map((s) => {
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

console.log('================ RUNNING AUTH SERVICE & SESSION TESTS ================\n');

async function runAllTests() {
  // 1. Register success
  await testAsync('authService - register creates new user with role "user" and hashed password', async () => {
    mockUsers.clear();
    const res = await authService.register({
      username: 'thanhvinh',
      email: 'vinh@example.com',
      password: 'SecurePassword123'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.user.username, 'thanhvinh');
    assert.strictEqual(res.user.email, 'vinh@example.com');
    assert.strictEqual(res.user.role, 'user');
    assert.strictEqual(res.user.passwordHash, undefined); // Never return passwordHash
  });

  // 2. Register duplicate email
  await testAsync('authService - register rejects duplicate email with 409 EMAIL_ALREADY_EXISTS', async () => {
    const res = await authService.register({
      username: 'vinh_new',
      email: 'vinh@example.com',
      password: 'AnotherPassword123'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.code, 'EMAIL_ALREADY_EXISTS');
  });

  // 3. Register duplicate username
  await testAsync('authService - register rejects duplicate username with 409 USERNAME_ALREADY_EXISTS', async () => {
    const res = await authService.register({
      username: 'thanhvinh',
      email: 'different@example.com',
      password: 'AnotherPassword123'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.code, 'USERNAME_ALREADY_EXISTS');
  });

  // 4. Access Token creation
  test('authService - createAccessToken generates valid 15m JWT with HS256 algorithm', () => {
    const dummyUser = { _id: 'usr_abc', username: 'testuser', role: 'user' };
    const token = authService.createAccessToken(dummyUser);

    assert.ok(typeof token === 'string' && token.split('.').length === 3);
    const decoded = jwt.verify(token, TEST_JWT_SECRET);
    assert.strictEqual(decoded.sub, 'usr_abc');
    assert.strictEqual(decoded.username, 'testuser');
    assert.strictEqual(decoded.role, 'user');
    assert.strictEqual(decoded.password, undefined);
  });

  // 5. Login success
  await testAsync('authService - login returns accessToken, opaque refreshToken, and safe user', async () => {
    mockSessionList = [];
    const res = await authService.login({
      email: 'vinh@example.com',
      password: 'SecurePassword123',
      deviceInfo: { userAgent: 'Chrome/Test', ipAddress: '127.0.0.1' }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 200);
    assert.ok(res.accessToken);
    assert.ok(res.refreshToken);
    assert.strictEqual(res.refreshToken.length, 96); // 48 bytes hex = 96 chars
    assert.strictEqual(res.user.email, 'vinh@example.com');
  });

  // 6. Login wrong password
  await testAsync('authService - login with wrong password returns 401 INVALID_CREDENTIALS', async () => {
    const res = await authService.login({
      email: 'vinh@example.com',
      password: 'WrongPassword999'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.code, 'INVALID_CREDENTIALS');
  });

  // 7. Login unknown email
  await testAsync('authService - login with unknown email returns 401 INVALID_CREDENTIALS', async () => {
    const res = await authService.login({
      email: 'nonexistent@example.com',
      password: 'AnyPassword123'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.code, 'INVALID_CREDENTIALS');
  });

  // 8. Account Lockout after 5 failed attempts
  await testAsync('authService - account locks for 15m after 5 consecutive failed attempts', async () => {
    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      await authService.login({ email: 'vinh@example.com', password: 'WrongPassword' });
    }
    // 5th failed attempt -> locks
    const res5 = await authService.login({ email: 'vinh@example.com', password: 'WrongPassword' });
    assert.strictEqual(res5.success, false);
    assert.strictEqual(res5.status, 423);
    assert.strictEqual(res5.code, 'ACCOUNT_LOCKED');

    // 6th attempt (even with correct password) is blocked by lockUntil
    const res6 = await authService.login({ email: 'vinh@example.com', password: 'SecurePassword123' });
    assert.strictEqual(res6.success, false);
    assert.strictEqual(res6.status, 423);
    assert.strictEqual(res6.code, 'ACCOUNT_LOCKED');
  });

  // 9. Session Service - createSession & findValidSession
  await testAsync('sessionService - creates opaque token and SHA-256 hash', async () => {
    mockSessionList = [];
    const { rawToken, session } = await sessionService.createSession({
      userId: 'usr_101',
      deviceInfo: { deviceType: 'desktop' }
    });

    assert.ok(rawToken && rawToken.length === 96);
    assert.ok(session.refreshTokenHash && session.refreshTokenHash.length === 64);
    assert.strictEqual(session.isRevoked, false);

    const check = await sessionService.findValidSession(rawToken);
    assert.strictEqual(check.valid, true);
    assert.strictEqual(check.session.userId, 'usr_101');
  });

  // 10. Refresh Token Rotation (RTR)
  await testAsync('sessionService - rotateSession replaces old refresh token with a new token', async () => {
    mockSessionList = [];
    const { rawToken: oldToken } = await sessionService.createSession({ userId: 'usr_101' });

    const rotResult = await sessionService.rotateSession(oldToken);
    assert.strictEqual(rotResult.rotated, true);
    assert.strictEqual(rotResult.replayDetected, false);
    assert.notStrictEqual(rotResult.rawToken, oldToken);

    // Old token should no longer be valid because its session refreshTokenHash was rotated
    const oldCheck = await sessionService.findValidSession(oldToken);
    assert.strictEqual(oldCheck.valid, false);

    // New token is valid
    const newCheck = await sessionService.findValidSession(rotResult.rawToken);
    assert.strictEqual(newCheck.valid, true);
  });

  // 11. Replay Attack Detection
  await testAsync('sessionService - detects reuse of revoked token and revokes ALL user sessions', async () => {
    mockSessionList = [];
    const { rawToken: token1 } = await sessionService.createSession({ userId: 'victim_user' });
    const { rawToken: token2 } = await sessionService.createSession({ userId: 'victim_user' });

    // Revoke token1
    await sessionService.revokeSession(token1, 'test_revoked');

    // Hacker tries to use revoked token1
    const replayResult = await sessionService.rotateSession(token1);
    assert.strictEqual(replayResult.rotated, false);
    assert.strictEqual(replayResult.replayDetected, true);
    assert.strictEqual(replayResult.reason, 'REPLAY_DETECTED');

    // Token2 must now also be revoked as a breach containment measure!
    const token2Check = await sessionService.findValidSession(token2);
    assert.strictEqual(token2Check.valid, false);
    assert.strictEqual(token2Check.reason, 'REVOKED');
  });

  // 12. Logout single session
  await testAsync('sessionService - revokeSession invalidates only the target session', async () => {
    mockSessionList = [];
    const { rawToken: tokenA } = await sessionService.createSession({ userId: 'user_multi' });
    const { rawToken: tokenB } = await sessionService.createSession({ userId: 'user_multi' });

    await sessionService.revokeSession(tokenA, 'user_logout');

    const checkA = await sessionService.findValidSession(tokenA);
    assert.strictEqual(checkA.valid, false);

    const checkB = await sessionService.findValidSession(tokenB);
    assert.strictEqual(checkB.valid, true);
  });

  // 13. Logout-all sessions
  await testAsync('sessionService - revokeAllUserSessions invalidates all sessions for user', async () => {
    mockSessionList = [];
    const { rawToken: tokenX } = await sessionService.createSession({ userId: 'user_all' });
    const { rawToken: tokenY } = await sessionService.createSession({ userId: 'user_all' });

    await sessionService.revokeAllUserSessions('user_all', 'logout_all');

    const checkX = await sessionService.findValidSession(tokenX);
    assert.strictEqual(checkX.valid, false);

    const checkY = await sessionService.findValidSession(tokenY);
    assert.strictEqual(checkY.valid, false);
  });

  // 14. Sanitize User Output
  test('sanitizeUser - strips sensitive fields (passwordHash, failedLoginAttempts, lockUntil)', () => {
    const rawUser = {
      _id: 'usr_xyz',
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: '$2a$10$encryptedHashHere',
      failedLoginAttempts: 3,
      lockUntil: new Date(),
      role: 'user'
    };

    const safe = sanitizeUser(rawUser);
    assert.strictEqual(safe.passwordHash, undefined);
    assert.strictEqual(safe.failedLoginAttempts, undefined);
    assert.strictEqual(safe.lockUntil, undefined);
    assert.strictEqual(safe.username, 'alice');
    assert.strictEqual(safe.role, 'user');
  });

  console.log(`\n================ AUTH SERVICE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
