import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('================ RUNNING PRODUCTION ENVIRONMENT & SECURITY INVARIANT TESTS ================\n');

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

// 1. Production Environment Separation
runTest('1. Client code never imports or exposes server-only dotenv configuration', () => {
  const srcFiles = ['src/App.jsx', 'src/services/api.js', 'src/context/AuthContext.jsx'];
  srcFiles.forEach(relPath => {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const code = fs.readFileSync(fullPath, 'utf8');
      assert.ok(!code.includes("import dotenv from 'dotenv'"), `${relPath} must not import dotenv`);
      assert.ok(!code.includes('process.env.JWT_SECRET'), `${relPath} must not reference JWT_SECRET`);
      assert.ok(!code.includes('process.env.MONGODB_URI'), `${relPath} must not reference MONGODB_URI`);
    }
  });
});

// 2. Cookie Security Invariants
runTest('2. Server auth routes configure credentials: true and secure cookie handling', () => {
  const serverIndexPath = path.resolve(process.cwd(), 'server/index.js');
  assert.ok(fs.existsSync(serverIndexPath));
  const serverCode = fs.readFileSync(serverIndexPath, 'utf8');
  assert.ok(serverCode.includes('cookieParser()'), 'Server must use cookie-parser middleware');
  assert.ok(serverCode.includes('credentials: true'), 'Server CORS must allow credentials');
});

// 3. Robots.txt and Sitemap.xml Existence & Consistency
runTest('3. Production robots.txt and sitemap.xml exist and reference canonical domain', () => {
  const robotsPath = path.resolve(process.cwd(), 'public/robots.txt');
  const sitemapPath = path.resolve(process.cwd(), 'public/sitemap.xml');

  assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');
  assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');

  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  assert.ok(robotsContent.includes('Sitemap: https://v-english.app/sitemap.xml'));

  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert.ok(sitemapContent.includes('https://v-english.app/'));
});

// 4. No Hardcoded Database Credentials in Repository
runTest('4. No live database connection credentials committed in config files', () => {
  const dbConfigPath = path.resolve(process.cwd(), 'server/config/db.js');
  if (fs.existsSync(dbConfigPath)) {
    const dbCode = fs.readFileSync(dbConfigPath, 'utf8');
    assert.ok(!dbCode.includes('password123'), 'DB config must not contain hardcoded test passwords');
    assert.ok(dbCode.includes('process.env.MONGODB_URI'), 'DB config must read from process.env.MONGODB_URI');
  }
});

console.log(`\n================ PRODUCTION ENVIRONMENT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
