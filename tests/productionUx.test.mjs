import assert from 'node:assert';
import { getErrorMessage, sanitizeText, ERROR_CODES } from '../src/utils/errors/errorHandler.js';

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

console.log('================ RUNNING PRODUCTION UX & ERROR HANDLING TESTS ================\n');

// 1. Error message mapping - 401 Unauthenticated
test('1. Error Handler: maps 401 to friendly Vietnamese message', () => {
  const err = getErrorMessage(null, 401);
  assert.strictEqual(err.code, 'UNAUTHENTICATED');
  assert.strictEqual(err.message, ERROR_CODES.UNAUTHENTICATED);
});

// 2. Error message mapping - 403 Permission Denied
test('2. Error Handler: maps 403 to permission denied message', () => {
  const err = getErrorMessage(null, 403);
  assert.strictEqual(err.code, 'INSUFFICIENT_PERMISSIONS');
  assert.strictEqual(err.message, ERROR_CODES.INSUFFICIENT_PERMISSIONS);
});

// 3. Error message mapping - 429 Rate limited
test('3. Error Handler: maps 429 to rate limit message', () => {
  const err = getErrorMessage(null, 429);
  assert.strictEqual(err.code, 'RATE_LIMITED');
  assert.ok(err.message.includes('quá nhanh'));
});

// 4. Error message mapping - 500 Server Error
test('4. Error Handler: maps 500 to safe server error message without stack trace', () => {
  const err = getErrorMessage(null, 500);
  assert.strictEqual(err.code, 'SERVER_ERROR');
  assert.strictEqual(err.message, ERROR_CODES.SERVER_ERROR);
});

// 5. Error message mapping - Network Error
test('5. Error Handler: maps fetch failed network error to offline message', () => {
  const networkErr = new Error('fetch failed');
  const err = getErrorMessage(networkErr);
  assert.strictEqual(err.code, 'NETWORK_ERROR');
  assert.strictEqual(err.message, ERROR_CODES.NETWORK_ERROR);
});

// 6. Security sanitization - Token redaction
test('6. Error Sanitizer: redacts Bearer JWT tokens from error text', () => {
  const rawLog = 'Failed request: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';
  const cleanLog = sanitizeText(rawLog);
  assert.strictEqual(cleanLog.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), false);
  assert.ok(cleanLog.includes('[REDACTED]'));
});

// 7. Security sanitization - Password/Secret redaction
test('7. Error Sanitizer: redacts passwords and secrets from error strings', () => {
  const rawLog = 'Connection error with password="SuperSecretPassword123" and secret="admin_secret_key"';
  const cleanLog = sanitizeText(rawLog);
  assert.strictEqual(cleanLog.includes('SuperSecretPassword123'), false);
  assert.strictEqual(cleanLog.includes('admin_secret_key'), false);
});

console.log(`\n================ PRODUCTION UX TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
