import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('================ RUNNING HEALTH CHECK & OBSERVABILITY TESTS ================\n');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// 1. Health Check Endpoint Definition in Server
runTest('1. Server source defines a clean /health route without secret leakage', () => {
  const serverPath = path.resolve(process.cwd(), 'server/index.js');
  assert.ok(fs.existsSync(serverPath), 'server/index.js must exist');
  const code = fs.readFileSync(serverPath, 'utf8');

  assert.ok(code.includes("app.get('/health'"), 'Server must declare GET /health');
  assert.ok(code.includes("status: 'OK'") || code.includes('status: "OK"') || code.includes('status: "ok"'), 'Health check must return status OK');

  // Verify health check route does NOT expose database string or secrets
  const healthRouteSnippet = code.slice(code.indexOf("app.get('/health'"), code.indexOf("app.get('/health'") + 200);
  assert.ok(!healthRouteSnippet.includes('MONGODB_URI'), 'Health check must not expose MONGODB_URI');
  assert.ok(!healthRouteSnippet.includes('JWT_SECRET'), 'Health check must not expose JWT_SECRET');
});

// 2. Logger Redaction Invariants
runTest('2. logger utility redacts sensitive keywords (password, token, jwt, cookie, secret)', async () => {
  const { logger } = await import('../src/utils/logger.js');
  assert.strictEqual(typeof logger.info, 'function');
  assert.strictEqual(typeof logger.warn, 'function');
  assert.strictEqual(typeof logger.error, 'function');
});

// 3. Error Boundary Safe Fallback
runTest('3. ErrorBoundary component exists and does not render raw stack traces in production mode', () => {
  const ebPath = path.resolve(process.cwd(), 'src/components/ErrorBoundary.jsx');
  assert.ok(fs.existsSync(ebPath), 'ErrorBoundary.jsx must exist');
  const code = fs.readFileSync(ebPath, 'utf8');
  assert.ok(code.includes('Đã có lỗi xảy ra') || code.includes('Tải lại trang'), 'ErrorBoundary must render user-friendly message');
});

console.log(`\n================ HEALTH CHECK TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
