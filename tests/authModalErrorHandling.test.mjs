import assert from 'node:assert';
import { api } from '../src/services/api.js';

let passed = 0;
let failed = 0;

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

console.log('================ RUNNING AUTH MODAL & ERROR HANDLING TEST SUITE ================\n');

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

// TEST 1: Register new email
await testAsync('TEST 1: Register new email sends exactly 1 request and returns 201 success', async () => {
  let callCount = 0;
  globalThis.fetch = async (url, opts) => {
    callCount++;
    assert.strictEqual(url, 'http://localhost:5000/api/auth/register');
    assert.strictEqual(opts.method, 'POST');
    return createMockResponse({
      success: true,
      user: { id: 'u_1', username: 'newuser1', email: 'new1@example.com' },
      message: 'User registered successfully'
    }, 201);
  };

  const result = await api.register({
    username: 'newuser1',
    email: 'new1@example.com',
    password: 'Password123'
  });

  assert.strictEqual(callCount, 1, 'Must only send 1 register request');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.status, 201);
  assert.strictEqual(result.user.username, 'newuser1');
});

// TEST 2: Register existing email returns 409 and specific Vietnamese message, NOT 'Login failed'
await testAsync('TEST 2: Register existing email returns 409 with EMAIL_ALREADY_EXISTS and specific message', async () => {
  let callCount = 0;
  globalThis.fetch = async (url) => {
    callCount++;
    assert.strictEqual(url, 'http://localhost:5000/api/auth/register');
    return createMockResponse({
      success: false,
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email address is already in use'
      }
    }, 409);
  };

  const result = await api.register({
    username: 'someone',
    email: 'existing@example.com',
    password: 'Password123'
  });

  assert.strictEqual(callCount, 1, 'Must only send 1 request');
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 409);
  assert.strictEqual(result.error.code, 'EMAIL_ALREADY_EXISTS');
  assert.notStrictEqual(result.error.message, 'Login failed');
  assert.ok(result.error.message.includes('Email') || result.error.message.includes('email'));
});

// TEST 3: Register existing username returns 409 and USERNAME_ALREADY_EXISTS
await testAsync('TEST 3: Register existing username returns 409 with USERNAME_ALREADY_EXISTS', async () => {
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount++;
    return createMockResponse({
      success: false,
      error: {
        code: 'USERNAME_ALREADY_EXISTS',
        message: 'Username is already taken'
      }
    }, 409);
  };

  const result = await api.register({
    username: 'taken_user',
    email: 'diff@example.com',
    password: 'Password123'
  });

  assert.strictEqual(callCount, 1);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 409);
  assert.strictEqual(result.error.code, 'USERNAME_ALREADY_EXISTS');
  assert.notStrictEqual(result.error.message, 'Login failed');
});

// TEST 4: Login correct account
await testAsync('TEST 4: Login correct account returns 200 and access token', async () => {
  let callCount = 0;
  globalThis.fetch = async (url) => {
    callCount++;
    assert.strictEqual(url, 'http://localhost:5000/api/auth/login');
    return createMockResponse({
      success: true,
      accessToken: 'valid_jwt_token',
      user: { id: 'u_login', username: 'validuser', email: 'valid@example.com' }
    }, 200);
  };

  const result = await api.login({
    email: 'valid@example.com',
    password: 'CorrectPassword123'
  });

  assert.strictEqual(callCount, 1);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.accessToken, 'valid_jwt_token');
});

// TEST 5: Login wrong password
await testAsync('TEST 5: Login wrong password returns 401 and INVALID_CREDENTIALS', async () => {
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount++;
    return createMockResponse({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    }, 401);
  };

  const result = await api.login({
    email: 'valid@example.com',
    password: 'WrongPassword'
  });

  assert.strictEqual(callCount, 1);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 401);
  assert.strictEqual(result.error.code, 'INVALID_CREDENTIALS');
});

// TEST 6: Network / server unavailable
await testAsync('TEST 6: Network error returns status 0 and NETWORK_ERROR without throwing unhandled exceptions', async () => {
  globalThis.fetch = async () => {
    throw new Error('Failed to fetch (ECONNREFUSED)');
  };

  const result = await api.register({
    username: 'offline_user',
    email: 'offline@example.com',
    password: 'Password123'
  });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.status, 0);
  assert.strictEqual(result.error.code, 'NETWORK_ERROR');
});

// TEST 7: Double-submit prevention guard simulation
await testAsync('TEST 7: Double submission guard blocks concurrent rapid clicks', async () => {
  let serverHits = 0;
  globalThis.fetch = async () => {
    serverHits++;
    await new Promise(r => setTimeout(r, 50));
    return createMockResponse({
      success: true,
      user: { id: 'u_double', username: 'double', email: 'double@example.com' }
    }, 201);
  };

  // Simulate isSubmittingRef synchronous guard
  let isSubmittingRef = { current: false };
  async function simulateUserSubmit() {
    if (isSubmittingRef.current) return { blocked: true };
    isSubmittingRef.current = true;
    try {
      return await api.register({
        username: 'double',
        email: 'double@example.com',
        password: 'Password123'
      });
    } finally {
      isSubmittingRef.current = false;
    }
  }

  // Simulate two immediate concurrent clicks
  const [res1, res2] = await Promise.all([
    simulateUserSubmit(),
    simulateUserSubmit()
  ]);

  assert.strictEqual(serverHits, 1, 'Only exactly 1 request must reach server during rapid double-click');
  assert.ok((res1.blocked && res2.success) || (res2.blocked && res1.success), 'One click must succeed and second click must be blocked by guard');
});

// TEST 8: Backend payload without explicit 'success: true' (res.ok = true) is treated as success (NOT Login failed)
await testAsync('TEST 8: Backend HTTP 200 without explicit success boolean is recognized as success', async () => {
  globalThis.fetch = async () => {
    return createMockResponse({
      user: { id: 'u_trans', username: 'transition_user', email: 'trans@example.com' },
      accessToken: 'header.payload.signature',
      message: 'Login successful'
    }, 200);
  };

  const result = await api.login({
    email: 'trans@example.com',
    password: 'Password123'
  });

  assert.strictEqual(result.success, true, 'Must evaluate to success: true');
  assert.strictEqual(result.accessToken, 'header.payload.signature');
  assert.strictEqual(result.user.username, 'transition_user');
});

// TEST 9: Full Post-Login Transition simulation
await testAsync('TEST 9: Successful login executes onSuccess exactly once, closes modal, and sets screen to app (#app)', async () => {
  let modalOpen = true;
  let activeScreen = 'landing';
  let hash = '';
  let onSuccessCalls = 0;
  let onCloseCalls = 0;

  function handleNavigate(screenId) {
    activeScreen = screenId;
    hash = screenId === 'dashboard' ? 'app' : screenId;
  }

  function handleAuthSuccess(user) {
    onSuccessCalls++;
    modalOpen = false;
    handleNavigate('dashboard');
  }

  function onClose() {
    onCloseCalls++;
    modalOpen = false;
  }

  // Simulate user submitting valid credentials in AuthModal
  globalThis.fetch = async () => {
    return createMockResponse({
      user: { id: 'u_nav', username: 'nav_user', email: 'nav@example.com' },
      accessToken: 'valid_access_token',
      message: 'Login successful'
    }, 200);
  };

  const result = await api.login({ email: 'nav@example.com', password: 'Password123' });
  if (result.success) {
    handleAuthSuccess(result.user);
    onClose();
  }

  assert.strictEqual(onSuccessCalls, 1, 'onSuccess must be called exactly once');
  assert.strictEqual(onCloseCalls, 1, 'onClose must be called');
  assert.strictEqual(modalOpen, false, 'AuthModal must be closed');
  assert.strictEqual(activeScreen, 'dashboard', 'activeScreen must become dashboard');
  assert.strictEqual(hash, 'app', 'hash must become app');
});

console.log('\n================ AUTH MODAL & ERROR HANDLING TESTS FINISHED ================');
console.log(`Passed: ${passed}/${passed + failed}`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
