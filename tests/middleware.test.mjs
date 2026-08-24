import assert from 'node:assert';
import jwt from '../server/node_modules/jsonwebtoken/index.js';
import { authenticate } from '../server/middleware/authenticate.js';
import { requireRole } from '../server/middleware/requireRole.js';
import { validateRegister, validateLogin } from '../server/middleware/validateAuth.js';
import { createRateLimiter } from '../server/middleware/rateLimiter.js';

// Setup environment for testing
const TEST_JWT_SECRET = 'test_secret_key_for_unit_tests_only_64_characters_length_required';
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

// Mock Express response helper
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
    }
  };
  return res;
}

console.log('================ RUNNING AUTH MIDDLEWARE TESTS ================\n');

// 1. authenticate - Missing token
test('authenticate - Missing Authorization header returns 401 MISSING_TOKEN', () => {
  const req = { headers: {} };
  const res = createMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error.code, 'MISSING_TOKEN');
});

// 2. authenticate - Malformed header
test('authenticate - Malformed Bearer header returns 401 INVALID_TOKEN', () => {
  const req = { headers: { authorization: 'Basic 12345' } };
  const res = createMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error.code, 'INVALID_TOKEN');
});

// 3. authenticate - Invalid token signature
test('authenticate - Invalid JWT signature returns 401 INVALID_TOKEN', () => {
  const req = { headers: { authorization: 'Bearer invalid.token.signature' } };
  const res = createMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error.code, 'INVALID_TOKEN');
});

// 4. authenticate - Expired token
test('authenticate - Expired JWT returns 401 TOKEN_EXPIRED', () => {
  const expiredToken = jwt.sign(
    { sub: 'user_123', username: 'john', role: 'user' },
    TEST_JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '-1s' }
  );

  const req = { headers: { authorization: `Bearer ${expiredToken}` } };
  const res = createMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error.code, 'TOKEN_EXPIRED');
});

// 5. authenticate - Valid token populates req.user
test('authenticate - Valid JWT populates req.user with sub, username, role', () => {
  const validToken = jwt.sign(
    { sub: 'user_456', username: 'vinh_test', role: 'user' },
    TEST_JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '15m' }
  );

  const req = { headers: { authorization: `Bearer ${validToken}` } };
  const res = createMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
  assert.deepStrictEqual(req.user, {
    id: 'user_456',
    username: 'vinh_test',
    role: 'user'
  });
});

// 6. requireRole - Unauthenticated
test('requireRole - Missing req.user returns 401 UNAUTHENTICATED', () => {
  const req = {};
  const res = createMockRes();
  let nextCalled = false;

  const mw = requireRole('admin');
  mw(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.error.code, 'UNAUTHENTICATED');
});

// 7. requireRole - Insufficient permissions
test('requireRole - User with role "user" denied access to "admin" with 403 INSUFFICIENT_PERMISSIONS', () => {
  const req = { user: { id: 'u1', username: 'alice', role: 'user' } };
  const res = createMockRes();
  let nextCalled = false;

  const mw = requireRole('admin');
  mw(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.body.error.code, 'INSUFFICIENT_PERMISSIONS');
});

// 8. requireRole - Admin authorized
test('requireRole - User with role "admin" allowed access to "admin"', () => {
  const req = { user: { id: 'admin_1', username: 'boss', role: 'admin' } };
  const res = createMockRes();
  let nextCalled = false;

  const mw = requireRole('admin');
  mw(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
});

// 9. validateAuth - Register validation and Mass Assignment
test('validateRegister - Rejects weak password missing number', () => {
  const req = { body: { username: 'testuser', email: 'test@example.com', password: 'onlyletters' } };
  const res = createMockRes();
  let nextCalled = false;

  validateRegister(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'WEAK_PASSWORD');
});

test('validateRegister - Mass Assignment: Strips forbidden fields like role: "admin"', () => {
  const req = {
    body: {
      username: 'hacker_boy',
      email: 'hacker@test.com',
      password: 'SafePassword123',
      role: 'admin',
      mustResetPassword: true,
      failedLoginAttempts: 99
    }
  };
  const res = createMockRes();
  let nextCalled = false;

  validateRegister(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.body.role, undefined);
  assert.strictEqual(req.body.mustResetPassword, undefined);
  assert.strictEqual(req.body.failedLoginAttempts, undefined);
  assert.strictEqual(req.body.username, 'hacker_boy');
});

// 10. rateLimiter - Exceeding limit returns 429
test('rateLimiter - Exceeding max requests returns 429 RATE_LIMIT_EXCEEDED with Retry-After header', () => {
  const limiter = createRateLimiter({
    windowMs: 10000,
    max: 2,
    keyGenerator: () => 'test_client_ip',
    prefix: 'test'
  });

  const req = { ip: '1.2.3.4' };
  let res1 = createMockRes();
  let res2 = createMockRes();
  let res3 = createMockRes();

  limiter(req, res1, () => {});
  assert.strictEqual(res1.statusCode, 200);

  limiter(req, res2, () => {});
  assert.strictEqual(res2.statusCode, 200);

  limiter(req, res3, () => {});
  assert.strictEqual(res3.statusCode, 429);
  assert.strictEqual(res3.body.error.code, 'RATE_LIMIT_EXCEEDED');
  assert.ok(res3.headers['Retry-After'] !== undefined);
});

console.log(`\n================ MIDDLEWARE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
if (failed > 0) process.exit(1);
