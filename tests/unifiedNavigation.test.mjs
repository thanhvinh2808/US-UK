import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

console.log('================ RUNNING UNIFIED NAVIGATION & NAVBAR ARCHITECTURE TESTS ================\n');

const appPath = path.resolve(process.cwd(), 'src/App.jsx');
const appCode = fs.readFileSync(appPath, 'utf8');

const publicNavbarPath = path.resolve(process.cwd(), 'src/components/public/PublicNavbar.jsx');
const publicNavbarCode = fs.readFileSync(publicNavbarPath, 'utf8');

const appNavbarPath = path.resolve(process.cwd(), 'src/components/AppNavbar.jsx');
const appNavbarCode = fs.readFileSync(appNavbarPath, 'utf8');

// 1. Structural Separation of Public and Authenticated Navigation
runTest('1. App.jsx cleanly segregates LandingNavbar (Public screens) and AppNavbar (Workspace screens)', () => {
  assert.ok(appCode.includes('isPublicScreen'), 'App.jsx must define isPublicScreen guard');
  assert.ok(appCode.includes('<LandingPage'), 'App.jsx must render LandingPage for public landing');
  assert.ok(appCode.includes('<AppNavbar'), 'App.jsx must render AppNavbar for authenticated workspace');
  assert.ok(appCode.includes('!isPublicScreen &&'), 'AppNavbar must only render when !isPublicScreen');
});

// 2. Mutual Exclusivity (Never simultaneously rendered in DOM)
runTest('2. LandingNavbar and AppNavbar are mutually exclusive and never co-exist in DOM', () => {
  // Check that LandingPage, NewsHub, ArticleDetail use PublicNavbar and Workspace uses AppNavbar
  assert.ok(appCode.includes("activeScreen === 'landing' && ("), 'LandingPage rendered exclusively on landing');
  assert.ok(appCode.includes("activeScreen === 'news' && ("), 'NewsHub rendered exclusively on news');
  assert.ok(appCode.includes("activeScreen === 'article_detail' && ("), 'ArticleDetail rendered exclusively on article_detail');
});

// 3. LandingNavbar UI/UX and Feature Preservation
runTest('3. LandingNavbar preserves brand identity, desktop links, auth buttons, and mobile drawer', () => {
  assert.ok(publicNavbarCode.includes('V-English'), 'Must preserve V-English logo');
  assert.ok(publicNavbarCode.includes('Phương pháp SM-2'), 'Must preserve SM-2 navigation link');
  assert.ok(publicNavbarCode.includes('Bắt đầu học miễn phí'), 'Must preserve Register CTA button');
  assert.ok(publicNavbarCode.includes('Đăng nhập'), 'Must preserve Login CTA button');
  assert.ok(publicNavbarCode.includes('isMobileMenuOpen'), 'Must preserve responsive mobile drawer');
});

// 4. AppNavbar Feature Preservation
runTest('4. AppNavbar preserves Voice Tuner, XP/Streak pills, SyncStatus, and UserProfileMenu', () => {
  assert.ok(appNavbarCode.includes('qz-header-fixed'), 'AppNavbar must use fixed workspace header style');
  assert.ok(appNavbarCode.includes('qz-voice-tuner'), 'AppNavbar must contain Voice Tuner knob');
  assert.ok(appNavbarCode.includes('SyncStatus'), 'AppNavbar must contain SyncStatus badge');
  assert.ok(appNavbarCode.includes('UserProfileMenu'), 'AppNavbar must contain UserProfileMenu');
  assert.ok(appNavbarCode.includes('Flashcards'), 'AppNavbar must contain Flashcards nav item');
  assert.ok(appNavbarCode.includes('Sổ tay'), 'AppNavbar must contain Sổ tay nav item');
});

// 5. Logo Navigation Behavior
runTest('5. Logo in LandingNavbar navigates to landing and Logo in AppNavbar navigates to workspace dashboard', () => {
  assert.ok(publicNavbarCode.includes("handleNavClick('landing')"), 'LandingNavbar logo must navigate to landing');
  assert.ok(appNavbarCode.includes("onNavigate('dashboard')"), 'AppNavbar logo must navigate to dashboard');
  assert.ok(publicNavbarCode.includes('role="button"'), 'LandingNavbar logo must have accessible button role');
  assert.ok(appNavbarCode.includes('role="button"'), 'AppNavbar logo must have accessible button role');
});

// 6. Post-Login Transition Wiring
runTest('6. AuthModal onSuccess callback navigates to dashboard (#app) and triggers AppNavbar', () => {
  assert.ok(appCode.includes("onSuccess={() => handleNavigate('dashboard')}"), 'AuthModal onSuccess must call handleNavigate dashboard');
  assert.ok(appCode.includes("window.location.hash = 'app'"), 'handleNavigate dashboard must set window.location.hash to app');
});

// 7. Logout Redirection to Public Landing Entry
runTest('7. UserProfileMenu handles logout with redirect to landing screen', () => {
  const menuPath = path.resolve(process.cwd(), 'src/components/UserProfileMenu.jsx');
  const menuCode = fs.readFileSync(menuPath, 'utf8');
  assert.ok(menuCode.includes("onNavigate('landing')"), 'Logout must navigate to landing');
});

// 8. Initial Hash Hydration on F5 Refresh
runTest('8. F5 on #app initializes activeScreen directly to dashboard without navbar flash', () => {
  assert.ok(appCode.includes("hash === 'app' || hash === 'dashboard'"), 'App.jsx initializes dashboard directly from hash');
});

console.log(`\n================ UNIFIED NAVIGATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
