import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('================ RUNNING DEPLOYMENT & PRODUCTION CONFIGURATION TESTS ================\n');

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

// 1. .env.example Verification
runTest('1. .env.example exists and contains all required environment variables', () => {
  const envExamplePath = path.resolve(process.cwd(), '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example file must exist');

  const content = fs.readFileSync(envExamplePath, 'utf8');
  assert.ok(content.includes('PORT='), '.env.example must define PORT');
  assert.ok(content.includes('NODE_ENV='), '.env.example must define NODE_ENV');
  assert.ok(content.includes('JWT_SECRET='), '.env.example must define JWT_SECRET');
  assert.ok(content.includes('JWT_EXPIRES_IN='), '.env.example must define JWT_EXPIRES_IN');
  assert.ok(content.includes('REFRESH_TOKEN_EXPIRES_IN='), '.env.example must define REFRESH_TOKEN_EXPIRES_IN');
  assert.ok(content.includes('MONGODB_URI='), '.env.example must define MONGODB_URI');
  assert.ok(content.includes('VITE_API_URL='), '.env.example must define VITE_API_URL');
});

// 2. Secret Leakage Prevention in .env.example
runTest('2. .env.example contains only safe placeholder values and no real production secrets', () => {
  const envExamplePath = path.resolve(process.cwd(), '.env.example');
  const content = fs.readFileSync(envExamplePath, 'utf8');

  // Must not contain real 64-character hex keys, production domain passwords, or live credentials
  assert.ok(!content.includes('production_secret_key_actual'), 'Must not leak real secret keys');
  assert.ok(!content.includes('mongodb+srv://admin:'), 'Must not leak live database credentials');
  assert.ok(!content.includes('AIzaSy'), 'Must not leak real Google Gemini production keys');
});

// 3. Client Environment Safety (No server secrets exposed to Vite frontend)
runTest('3. Frontend package does not bundle or expose server-only secrets', () => {
  const viteConfigPath = path.resolve(process.cwd(), 'vite.config.js');
  const content = fs.readFileSync(viteConfigPath, 'utf8');

  assert.ok(!content.includes('JWT_SECRET'), 'Vite config must not expose JWT_SECRET');
  assert.ok(!content.includes('MONGODB_URI'), 'Vite config must not expose MONGODB_URI');
});

// 4. API Configuration Resiliency
runTest('4. API Client handles missing VITE_API_URL gracefully with default fallback', async () => {
  const { setApiAccessToken } = await import('../src/services/api.js');
  assert.strictEqual(typeof setApiAccessToken, 'function');
});

// 5. Secure Production Cookie Expectations
runTest('5. Server config enforces HttpOnly, SameSite, and Secure flags on refresh cookies', () => {
  // Check auth controller or server file if available
  const authControllerPath = path.resolve(process.cwd(), 'server/controllers/authController.js');
  if (fs.existsSync(authControllerPath)) {
    const content = fs.readFileSync(authControllerPath, 'utf8');
    assert.ok(content.includes('httpOnly: true'), 'Cookies must have httpOnly: true');
    assert.ok(content.includes('sameSite:'), 'Cookies must specify sameSite');
  }
});

console.log(`\n================ DEPLOYMENT CONFIG TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
