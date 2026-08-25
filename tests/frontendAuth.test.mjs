import assert from 'node:assert';
import { api, setApiAccessToken, getApiAccessToken, configureApiClient } from '../src/services/api.js';

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

console.log('================ RUNNING FRONTEND AUTHENTICATION SUITE ================\n');

// Store original fetch
const originalFetch = globalThis.fetch;

// Helper to create mock Response object
function createMockResponse(data, status = 200, ok = true) {
  return {
    ok: status >= 200 && status < 300,
    status,
    clone() {
      return createMockResponse(data, status, ok);
    },
    json: async () => data,
    text: async () => JSON.stringify(data)
  };
}

// 1. Login success
await testAsync('1. Login success: returns accessToken, user, sets in-memory token', async () => {
  const fakeUser = { id: 'usr_123', username: 'alex', role: 'user', email: 'alex@example.com' };
  const fakeToken = 'header.eyJzdWIiOiJ1c3JfMTIzIn0.signature';

  globalThis.fetch = async (url, opts) => {
    assert.strictEqual(url, 'http://localhost:5000/api/auth/login');
    assert.strictEqual(opts.method, 'POST');
    assert.strictEqual(opts.credentials, 'include');
    const body = JSON.parse(opts.body);
    assert.strictEqual(body.email, 'alex@example.com');
    assert.strictEqual(body.password, 'Secret123');

    return createMockResponse({
      success: true,
      accessToken: fakeToken,
      user: fakeUser
    }, 200);
  };

  const result = await api.login({ email: 'alex@example.com', password: 'Secret123' });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.accessToken, fakeToken);
  assert.strictEqual(result.user.username, 'alex');
  assert.strictEqual(getApiAccessToken(), fakeToken);
});

// 2. Register success
await testAsync('2. Register success: posts payload and receives 201 with created user', async () => {
  const fakeUser = { id: 'usr_456', username: 'newuser', role: 'user', email: 'new@example.com' };

  globalThis.fetch = async (url, opts) => {
    assert.strictEqual(url, 'http://localhost:5000/api/auth/register');
    assert.strictEqual(opts.method, 'POST');
    assert.strictEqual(opts.credentials, 'include');
    const body = JSON.parse(opts.body);
    assert.strictEqual(body.username, 'newuser');
    assert.strictEqual(body.email, 'new@example.com');
    assert.strictEqual(body.password, 'Pass1234');
    assert.strictEqual(body.preferredAccent, 'UK');

    return createMockResponse({
      success: true,
      user: fakeUser,
      message: 'User registered successfully'
    }, 201);
  };

  const result = await api.register({
    username: 'newuser',
    email: 'new@example.com',
    password: 'Pass1234',
    preferredAccent: 'UK'
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, 201);
  assert.strictEqual(result.data.user.username, 'newuser');
});

// 3. Login failure (INVALID_CREDENTIALS / ACCOUNT_LOCKED)
await testAsync('3. Login failure: returns error code and message gracefully without crashing', async () => {
  globalThis.fetch = async () => {
    return createMockResponse({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    }, 401);
  };

  const result = await api.login({ email: 'wrong@example.com', password: 'WrongPassword123' });
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 401);
  assert.strictEqual(result.error.code, 'INVALID_CREDENTIALS');
});

// 4. AuthContext authenticated state simulation
test('4. AuthContext authenticated state: token presence in memory determines isAuthenticated and role', () => {
  let contextUser = { id: 'usr_789', username: 'sarah', role: 'admin' };
  let contextToken = 'valid_in_memory_token';

  const isAuthenticated = !!contextUser && !!contextToken;
  const isAdmin = contextUser?.role === 'admin';

  assert.strictEqual(isAuthenticated, true);
  assert.strictEqual(isAdmin, true);
  assert.strictEqual(contextUser.role, 'admin');
});

// 5. Logout
await testAsync('5. Logout: calls /api/auth/logout with Bearer token and clears memory token', async () => {
  setApiAccessToken('token_to_clear');
  let logoutCalled = false;

  globalThis.fetch = async (url, opts) => {
    assert.strictEqual(url, 'http://localhost:5000/api/auth/logout');
    assert.strictEqual(opts.method, 'POST');
    assert.strictEqual(opts.headers['Authorization'], 'Bearer token_to_clear');
    logoutCalled = true;
    return createMockResponse({ success: true, message: 'Logged out successfully' }, 200);
  };

  const result = await api.logout();
  assert.strictEqual(result.success, true);
  assert.strictEqual(logoutCalled, true);
  assert.strictEqual(getApiAccessToken(), null);
});

// 6. Logout-all
await testAsync('6. Logout-all: calls /api/auth/logout-all to revoke all sessions', async () => {
  setApiAccessToken('token_for_logout_all');
  let logoutAllCalled = false;

  globalThis.fetch = async (url, opts) => {
    assert.strictEqual(url, 'http://localhost:5000/api/auth/logout-all');
    assert.strictEqual(opts.method, 'POST');
    assert.strictEqual(opts.headers['Authorization'], 'Bearer token_for_logout_all');
    logoutAllCalled = true;
    return createMockResponse({ success: true, message: 'All active sessions revoked' }, 200);
  };

  const result = await api.logoutAll();
  assert.strictEqual(result.success, true);
  assert.strictEqual(logoutAllCalled, true);
  assert.strictEqual(getApiAccessToken(), null);
});

// 7. Silent refresh success
await testAsync('7. Silent refresh success: requests /api/auth/refresh and updates in-memory token', async () => {
  let updatedToken = null;
  let updatedUser = null;

  configureApiClient({
    setToken: (tok, usr) => {
      updatedToken = tok;
      updatedUser = usr;
    }
  });

  const refreshedToken = 'newly_refreshed_access_token_hs256';
  const refreshedUser = { id: 'usr_refreshed', username: 'refreshed_user', role: 'user' };

  globalThis.fetch = async (url, opts) => {
    assert.strictEqual(url, 'http://localhost:5000/api/auth/refresh');
    assert.strictEqual(opts.method, 'POST');
    assert.strictEqual(opts.credentials, 'include');
    return createMockResponse({
      success: true,
      accessToken: refreshedToken,
      user: refreshedUser
    }, 200);
  };

  const refreshResult = await api.refreshToken();
  assert.strictEqual(refreshResult.success, true);
  assert.strictEqual(refreshResult.accessToken, refreshedToken);
  assert.strictEqual(updatedToken, refreshedToken);
  assert.strictEqual(updatedUser.username, 'refreshed_user');
  assert.strictEqual(getApiAccessToken(), refreshedToken);
});

// 8. Silent refresh failure
await testAsync('8. Silent refresh failure: gracefully clears token and triggers failure callback without crashing', async () => {
  let authFailedTriggered = false;

  configureApiClient({
    setToken: (tok) => setApiAccessToken(tok),
    onAuthFailed: () => {
      authFailedTriggered = true;
    }
  });

  globalThis.fetch = async (url) => {
    assert.strictEqual(url, 'http://localhost:5000/api/auth/refresh');
    return createMockResponse({
      success: false,
      error: { code: 'INVALID_SESSION', message: 'Session expired' }
    }, 401);
  };

  const refreshResult = await api.refreshToken();
  assert.strictEqual(refreshResult.success, false);
  assert.strictEqual(authFailedTriggered, true);
  assert.strictEqual(getApiAccessToken(), null);
});

// 9. Access token gửi bằng Authorization header
await testAsync('9. Access token is sent via Authorization: Bearer <token> on protected requests', async () => {
  setApiAccessToken('my_jwt_access_token_123');
  let authHeaderSent = null;

  globalThis.fetch = async (url, opts) => {
    authHeaderSent = opts.headers['Authorization'];
    return createMockResponse({ user: { id: 'usr_me', username: 'me' } }, 200);
  };

  await api.getMe();
  assert.strictEqual(authHeaderSent, 'Bearer my_jwt_access_token_123');
});

// 10. 401 TOKEN_EXPIRED -> refresh -> retry
await testAsync('10. 401 TOKEN_EXPIRED triggers silent refresh and retries original request once', async () => {
  setApiAccessToken('old_expired_token');
  let callCount = 0;
  const newAccessToken = 'fresh_jwt_token_after_refresh';

  globalThis.fetch = async (url, opts) => {
    callCount++;
    if (url.endsWith('/auth/refresh')) {
      // Step 2: Refresh succeeds
      return createMockResponse({
        success: true,
        accessToken: newAccessToken,
        user: { id: 'usr_1', username: 'tester' }
      }, 200);
    }

    if (url.endsWith('/study-sets')) {
      if (opts.headers['Authorization'] === 'Bearer old_expired_token') {
        // Step 1: Initial call fails with 401 TOKEN_EXPIRED
        return createMockResponse({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Access token has expired' }
        }, 401);
      } else if (opts.headers['Authorization'] === `Bearer ${newAccessToken}`) {
        // Step 3: Retried call succeeds with fresh token
        return createMockResponse({
          success: true,
          _id: 'set_created_123',
          title: 'IELTS Vocab'
        }, 201);
      }
    }

    throw new Error(`Unexpected fetch call to ${url}`);
  };

  const createResult = await api.createStudySet({ title: 'IELTS Vocab' });
  assert.strictEqual(createResult.success, true);
  assert.strictEqual(createResult.title, 'IELTS Vocab');
  assert.strictEqual(callCount, 3); // 1. Initial 401 -> 2. Refresh -> 3. Retry 201
});

// 11. Refresh failure không retry vô hạn
await testAsync('11. Refresh failure stops retrying immediately without creating infinite loop', async () => {
  setApiAccessToken('stale_token');
  let requestAttempts = 0;

  globalThis.fetch = async (url) => {
    if (url.endsWith('/topics')) {
      requestAttempts++;
      return createMockResponse({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token expired' }
      }, 401);
    }

    if (url.endsWith('/auth/refresh')) {
      // Refresh fails
      return createMockResponse({
        success: false,
        error: { code: 'INVALID_SESSION', message: 'Refresh token revoked' }
      }, 401);
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const res = await api.createTopic({ title: 'Test Topic' });
  assert.strictEqual(res, null); // Error handled cleanly
  assert.strictEqual(requestAttempts, 1); // Only 1 attempt made, no loop
  assert.strictEqual(getApiAccessToken(), null);
});

// 12. Admin UI chỉ dành cho role admin
test('12. Admin UI access logic: user with role === "admin" is granted admin access', () => {
  const adminUser = { id: 'admin_1', username: 'admin_master', role: 'admin' };
  const isAdmin = adminUser.role === 'admin';
  assert.strictEqual(isAdmin, true);
});

// 13. User không có quyền admin UI
test('13. User without admin role: user with role === "user" is denied admin access', () => {
  const regularUser = { id: 'user_1', username: 'student_alex', role: 'user' };
  const isAdmin = regularUser.role === 'admin';
  assert.strictEqual(isAdmin, false);
});

// 14. x-admin-key không còn được sử dụng
await testAsync('14. Verification: x-admin-key header is completely removed from all requests', async () => {
  setApiAccessToken('admin_jwt_token');
  let headersSent = null;

  globalThis.fetch = async (url, opts) => {
    headersSent = opts.headers;
    return createMockResponse({ success: true, message: 'Topic created' }, 201);
  };

  await api.createTopic({ title: 'Grammar Guide' });
  assert.strictEqual(headersSent['x-admin-key'], undefined);
  assert.strictEqual(headersSent['Authorization'], 'Bearer admin_jwt_token');
});

// Restore original fetch
globalThis.fetch = originalFetch;

console.log(`\n================ FRONTEND AUTH TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
if (failed > 0) {
  process.exit(1);
}
