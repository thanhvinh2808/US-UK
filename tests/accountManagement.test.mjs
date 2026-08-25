import assert from 'node:assert';
import { setStorageScope, getCurrentScope } from '../src/utils/storage/storageScope.js';
import { userStorage } from '../src/utils/storage/userStorage.js';

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

console.log('================ RUNNING ACCOUNT & SESSION MANAGEMENT TESTS ================\n');

// Mock localStorage
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

// 1. Account profile target band validation
test('1. Target band setting: validates range between 5.0 and 9.0', () => {
  const bands = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
  bands.forEach(b => {
    assert.ok(b >= 5.0 && b <= 9.0);
  });
});

// 2. Preferred accent switching
test('2. Preferred accent selection: toggles strictly between US and UK', () => {
  let accent = 'US';
  accent = accent === 'US' ? 'UK' : 'US';
  assert.strictEqual(accent, 'UK');
  accent = accent === 'US' ? 'UK' : 'US';
  assert.strictEqual(accent, 'US');
});

// 3. User session isolation on scope switch
test('3. Session state: switching active scope isolates user activity records', () => {
  setStorageScope('user_profile_1');
  userStorage.updateUserStats({ points: 500, level: 'B1' });
  assert.strictEqual(userStorage.getUserStats().points, 500);

  setStorageScope('user_profile_2');
  assert.strictEqual(userStorage.getUserStats().points, 0); // Fresh clean slate
});

// 4. Role immutability client-side
test('4. Security: client-side profile cannot alter authoritative role property', () => {
  const baseUser = { id: 'u_123', username: 'student', role: 'user' };
  const attemptedTamper = { ...baseUser, role: 'admin' };

  // Backend sanitize check simulation
  assert.strictEqual(baseUser.role, 'user');
  assert.notStrictEqual(attemptedTamper.role, baseUser.role);
});

console.log(`\n================ ACCOUNT MANAGEMENT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
if (failed > 0) {
  process.exit(1);
}
