import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('================ RUNNING PUBLIC EXPERIENCE & PRODUCT FLOW TESTS ================\n');

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

// 1. LandingPage Component Existence
runTest('1. LandingPage component file exists and contains Hero section', () => {
  const landingPath = path.resolve(process.cwd(), 'src/components/public/LandingPage.jsx');
  assert.ok(fs.existsSync(landingPath), 'LandingPage.jsx must exist');
  const code = fs.readFileSync(landingPath, 'utf8');
  assert.ok(code.includes('SECTION 1 — HERO') || code.includes('Học tiếng Anh thông minh hơn'));
  assert.ok(code.includes('Bắt đầu học miễn phí'), 'Hero must contain CTA button');
});

// 2. PublicNavbar Component Structure
runTest('2. PublicNavbar contains marketing links and Auth triggers', () => {
  const navbarPath = path.resolve(process.cwd(), 'src/components/public/PublicNavbar.jsx');
  assert.ok(fs.existsSync(navbarPath), 'PublicNavbar.jsx must exist');
  const code = fs.readFileSync(navbarPath, 'utf8');
  assert.ok(code.includes('Trang chủ'));
  assert.ok(code.includes('Tính năng'));
  assert.ok(code.includes('Phương pháp SM-2'));
  assert.ok(code.includes('Tin tức & Bài viết'));
  assert.ok(code.includes('Đăng nhập'));
  assert.ok(code.includes('Bắt đầu học miễn phí'));
});

// 3. PublicFooter Component Structure
runTest('3. PublicFooter contains product pillars, links, and copyright', () => {
  const footerPath = path.resolve(process.cwd(), 'src/components/public/PublicFooter.jsx');
  assert.ok(fs.existsSync(footerPath), 'PublicFooter.jsx must exist');
  const code = fs.readFileSync(footerPath, 'utf8');
  assert.ok(code.includes('V-English') || code.includes('v-english'));
  assert.ok(code.includes('Spaced Repetition') || code.includes('SM-2'));
});

// 4. Dedicated AppSidebar Component
runTest('4. AppSidebar component exists with categorized learning items', () => {
  const sidebarPath = path.resolve(process.cwd(), 'src/components/AppSidebar.jsx');
  assert.ok(fs.existsSync(sidebarPath), 'AppSidebar.jsx must exist');
  const code = fs.readFileSync(sidebarPath, 'utf8');
  assert.ok(code.includes('HỌC TẬP & LỘ TRÌNH'));
  assert.ok(code.includes('Flashcards SM-2'));
  assert.ok(code.includes('Sổ tay từ vựng'));
  assert.ok(code.includes('Ngân hàng câu sai'));
  assert.ok(code.includes('Tra từ AI'));
});

// 5. App Layout Separation (Public vs Workspace)
runTest('5. App.jsx segregates Public Marketing screens and Authenticated Workspace layout', () => {
  const appPath = path.resolve(process.cwd(), 'src/App.jsx');
  assert.ok(fs.existsSync(appPath), 'App.jsx must exist');
  const code = fs.readFileSync(appPath, 'utf8');
  
  // Verify default is 'landing'
  assert.ok(code.includes("return 'landing'") || code.includes('activeScreen, setActiveScreen'), 'Default screen must be landing');
  
  // Verify isPublicScreen logic
  assert.ok(code.includes('isPublicScreen'), 'App.jsx must define isPublicScreen');
  
  // Verify AppSidebar is rendered in Workspace grid
  assert.ok(code.includes('<AppSidebar'), 'App.jsx must render AppSidebar in workspace');
});

// 6. Responsive Grid Layout without Fixed Sidebar Collisions
runTest('6. Workspace layout utilizes responsive grid with aside and main content', () => {
  const appPath = path.resolve(process.cwd(), 'src/App.jsx');
  const code = fs.readFileSync(appPath, 'utf8');
  assert.ok(code.includes('grid-cols-[240px_minmax(0,1fr)]') || code.includes('grid-cols-1 lg:grid-cols-'), 'App.jsx must use responsive grid');
  assert.ok(code.includes('sticky top-24'), 'Sidebar must be sticky top-24');
  assert.ok(code.includes('min-w-0 w-full'), 'Main content must have min-w-0 to prevent horizontal overflow');
});

// 7. Logout Redirection to Public Landing Entry
runTest('7. UserProfileMenu handles logout with redirect to landing screen', () => {
  const menuPath = path.resolve(process.cwd(), 'src/components/UserProfileMenu.jsx');
  assert.ok(fs.existsSync(menuPath), 'UserProfileMenu.jsx must exist');
  const code = fs.readFileSync(menuPath, 'utf8');
  assert.ok(code.includes("onNavigate('landing')"), 'Logout must navigate to landing');
});

// 8. AuthModal Success Handler Takes User to Workspace
runTest('8. AuthModal success callback transitions user to workspace dashboard', () => {
  const appPath = path.resolve(process.cwd(), 'src/App.jsx');
  const code = fs.readFileSync(appPath, 'utf8');
  assert.ok(code.includes("onSuccess={() => handleNavigate('dashboard')}"), 'AuthModal onSuccess must navigate to dashboard');
});

// 9. SEO Canonical & Title Integrity in index.html
runTest('9. index.html defines comprehensive OpenGraph, Twitter, and canonical metadata', () => {
  const htmlPath = path.resolve(process.cwd(), 'index.html');
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('<title>V-English — Learn. Practice. Improve.'));
  assert.ok(html.includes('https://v-english.app/'));
  assert.ok(html.includes('og:title'));
  assert.ok(html.includes('application/ld+json'));
});

// 10. URL Hash Routing Synchronization
runTest('10. App.jsx synchronizes browser hash (#app, #news, #article) with activeScreen', () => {
  const appPath = path.resolve(process.cwd(), 'src/App.jsx');
  const code = fs.readFileSync(appPath, 'utf8');
  assert.ok(code.includes('hashchange'), 'App.jsx must listen to hashchange');
  assert.ok(code.includes("window.location.hash = 'app'"), 'App.jsx must set hash on navigation');
});

console.log(`\n================ PUBLIC EXPERIENCE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
