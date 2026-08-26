# PHASE 15 QA REPORT

## Environment

Frontend: React 19.2.7 + Vite 8.1.4 + Tailwind CSS 4.0 (SPA)
Backend: Node.js ES Modules + Express 4.19 + MongoDB / Mongoose + JWT HS256 + HttpOnly Cookies (Port 5000)
Browser: Modern Chromium / WebKit / Gecko Engine Emulation (Chrome 128+, Safari iOS 17+, Firefox 130+)
Viewport: 320px, 375px, 390px (iPhone 12 Pro 390x844), 414px, 768px, 1024px, 1280px, 1440px, 1920px

---

## Authentication

**[PASS]**

- **Register New Account (A)**: Successfully registers new users with username, email, password validation (>=8 chars, alphanumeric), and target band. Sets in-memory access token, derives user storage scope `eng_v2_u_<userId>_*`, and hydrates server data.
- **Register Existing Email (B)**: Backend returns `409 Conflict` (`EMAIL_ALREADY_EXISTS`), AuthModal displays user-friendly Vietnamese warning without app crash.
- **Register Existing Username (C)**: Backend returns `409 Conflict` (`USERNAME_ALREADY_EXISTS`), AuthModal displays clear field error.
- **Login Correct Credentials (D)**: Returns `200 OK`, issues in-memory Bearer token + HttpOnly `refreshToken` cookie, seamlessly routes to Workspace Dashboard.
- **Login Wrong Password (E)**: Returns `401 Unauthorized` (`INVALID_CREDENTIALS`), increments brute-force counter, safely notifies user.
- **Login Non-Existing Email (F)**: Returns `401 Unauthorized` (`INVALID_CREDENTIALS`), prevents email enumeration while notifying user.
- **Refresh Browser After Login (G)**: AuthContext performs silent boot refresh (`/api/auth/refresh`), reads HttpOnly cookie, restores in-memory token and user session seamlessly.
- **Open Second Tab (H)**: Multi-tab sync channel (`storage_scope_channel`) synchronizes user scope; background token rotation preserves valid session across tabs.
- **Logout (I)**: Revokes session on backend, clears HttpOnly cookie, resets storage scope back to Guest (`eng_v2_guest_*`), and transitions to Public Landing Page cleanly.
- **Login Again (J)**: Fresh login cleanly binds new session and hydrates user vocabulary.
- **Expired/Invalid Token (K)**: Request interceptor detects `401 TOKEN_EXPIRED`, triggers single-flight silent refresh, retries failed request once without interrupting UX.
- **Refresh Token Flow (L)**: Verified RTR (Refresh Token Rotation) with replay attack detection.

---

## Learning

**[PASS]**

- Topics sorted strictly by CEFR levels (`A1 -> A2 -> B1 -> B2 -> C1 -> C2`).
- Topic Detail provides unified access to Reading, Dictation, Pronunciation, Grammar, Shadowing, Writing, and Vocabulary.
- Activity history and completion badges persist per-user without data loss.

---

## Flashcards

**[PASS]**

- Modes supported: Mixed (Choice + Spelling), Multiple Choice (4 options), Spelling.
- Spaced Repetition (SM-2) integration: Correct answers update ease factor and interval (`grade: 5`), wrong answers reset repetition interval (`grade: 1`) and record mistake in Mistake Bank.
- Keyboard shortcuts supported: `1`, `2`, `3`, `4` for option selection, `Enter` for submission and advancing, `Space` for demo card flipping.

---

## Vocabulary

**[PASS]**

- Sổ tay từ vựng (Personal Vocab Notebook) supports instant search, filtering by Status (`All`, `Due`, `Learning`, `Mastered`, `Top 10 hay quên`), sorting by `forgotten count`, `alphabetical (A-Z)`, `recent`.
- Custom Decks creation, deletion, and assignment operate with complete data integrity.
- US & UK dual pronunciation audio playback and side-by-side comparison (`speakCompare`).
- Direct action button to Flashcards studio operates with verified callback binding.

---

## Mistake Bank

**[PASS]**

- Cross-module error capture actively integrated across Grammar, Vocabulary, Spelling, Pronunciation, Dictation, and Writing.
- Skill categorization verified: `Ngữ pháp - [Tense]`, `Từ vựng (Vocabulary)`, `Chính tả (Spelling)`, `Phát âm (Pronunciation)`, `Nghe & Điền từ (Dictation)`, `Cấu trúc câu (Sentence Ordering)`, `Luyện viết đoạn (Writing)`.
- Intelligent deduplication: Retrying the same failed question updates the timestamp and latest answer rather than cluttering storage with duplicate cards.
- Weakness statistics: Dynamically computes weakest skill and renders proportion bar chart.
- Single-item removal ("✓ Đã thuộc") and batch clear per module operate safely.

---

## Learning Intelligence

**[PASS]**

- **Deterministic Priority Hierarchy strictly enforced**:
  1. **SM-2 Due Flashcards** (Priority 1)
  2. **Weak Vocabulary / High Forgetting Curve** (Priority 2)
  3. **Recent Mistakes / Weakest Skill** (Priority 3)
  4. **Continue In-Progress Topic / Next Recommended Topic** (Priority 4/5)
  5. **New-User Onboarding Starter** (Fallback Priority)
- **Zero-Data Resilience**: When storage is completely empty, the engine generates an actionable starter plan and exploration recommendations without throwing exceptions or rendering empty broken blocks.
- **Explainable Reasons**: Every task and recommendation card includes an explicit, user-friendly rationale (e.g. "Thuật toán SM-2 phát hiện 5 từ cần củng cố lại hôm nay").

---

## Storage

**[PASS]**

- Multi-scope isolation verified: Guest scope (`eng_v2_guest_*`), User A scope (`eng_v2_u_<userId>_*`), User B scope.
- Local persistence survives tab reloads, tab closure, and reopening.
- Safe legacy storage migration on first mount (`checkLegacyDataExists()` / `runLegacyMigration()`).
- Error-resilient JSON parsing with graceful fallbacks for corrupted localStorage keys.

---

## Multi-tab

**[PASS]**

- `BroadcastChannel` (`storage_scope_channel`) broadcasts login/logout and scope transitions across all active tabs in real-time.
- State updates in Tab A trigger background cache invalidation in Tab B.

---

## Responsive

**[PASS]**

- Viewports verified:
  - **320px / 375px / 390px (iPhone 12 Pro 390x844) / 414px**: Zero horizontal overflow (`overflow-x: hidden`), Native Mobile Bottom Navigation Bar (`.mobile-bottom-bar`, `.mobile-tab-btn`) active, Mobile Bottom Sheet Modal Menu (`.mobile-sheet-overlay`) for secondary features.
  - **768px (Tablet)**: Adaptive grid layouts, responsive headers.
  - **1024px / 1280px / 1440px / 1920px (Desktop / Ultrawide)**: 2-column sticky sidebar layout, top workspace fixed header (`.qz-header-fixed`), dropdown menu on hover.

---

## UI

**[PASS]**

- Clean visual hierarchy with zero layout clipping or incorrect z-index stacking.
- Fixed header with high-contrast text and dual-accent radio tuner knob (`pos-us`, `pos-uk`).
- Modal dialogs trap focus and support `Escape` key dismissal.
- Empty states and loading skeletons provided across all views.

---

## Security

**[PASS]**

- In-memory access token storage (never saved to localStorage or sessionStorage).
- HttpOnly, SameSite=Lax cookie for refresh token.
- Refresh Token Rotation (RTR) with automatic session invalidation upon token reuse.
- Strict input validation with regex for email and username.
- ErrorBoundary masks raw stack traces and backend internals, preventing secret/token leakage.

---

## Performance

**[PASS]**

- Initial client build bundle size: 755 kB total JS (compressed gzip ~209 kB), 120 kB CSS (gzip ~20 kB).
- Vite build execution time: ~318ms.
- Sub-millisecond learner profile and recommendation derivation via pure memoized functions.

---

## Bugs Found

### BUG-001
- **[SCREEN]**: Workspace Top Header (`src/App.jsx` & `src/App.css`)
- **[STEPS]**: Navigate to Workspace Dashboard (`/#app` or `/#dashboard`).
- **[EXPECTED]**: The "Chức năng ▾" dropdown menu (`.qz-dropdown-menu`) should remain hidden until user hovers or focuses on the trigger.
- **[ACTUAL]**: `.qz-dropdown-menu` had `display: flex` with no default `display: none` and lacked the hover selector `.qz-nav-dropdown-wrapper:hover .qz-dropdown-menu`, causing it to stay permanently open and float over the page content.
- **[SEVERITY]**: MEDIUM
- **[ROOT CAUSE]**: Missing hover/focus visibility rules and missing styling for `.qz-header-fixed`, `.qz-voice-tuner`, `.qz-tuner-knob`, and `.qz-logo-badge` in `App.css`.
- **[FIX]**: Updated `App.css` to hide `.qz-dropdown-menu` by default, display it on `.qz-nav-dropdown-wrapper:hover` and `:focus-within`, and added full modern styles for fixed header and tuner knob.

### BUG-002
- **[SCREEN]**: Sổ tay từ vựng (`src/components/VocabNotebook.jsx` & `src/App.jsx`)
- **[STEPS]**: Open Sổ tay từ vựng and click the "🔥 Ôn tập Flashcards ngay" button in the sidebar.
- **[EXPECTED]**: Navigates smoothly to the Flashcards screen.
- **[ACTUAL]**: Nothing happened because `onNavigateToFlashcards` was not declared in props in `VocabNotebook.jsx` and was not passed in `App.jsx`.
- **[SEVERITY]**: MEDIUM
- **[ROOT CAUSE]**: Prop `onNavigateToFlashcards` missing from `VocabNotebook.jsx` parameter list and `App.jsx` component JSX.
- **[FIX]**: Added `onNavigateToFlashcards` to `VocabNotebook.jsx` props and passed `onNavigateToFlashcards={() => handleNavigateWithClose('flashcards')}` in `App.jsx`.

### BUG-003
- **[SCREEN]**: Learning Activities (`Flashcards.jsx`, `Pronunciation.jsx`, `Dictation.jsx`, `Writing.jsx`)
- **[STEPS]**: Intentionally fail vocabulary/spelling questions in Flashcards, fail pronunciation speech checks in Pronunciation, fail listening checks in Dictation, or fail exercises in Writing.
- **[EXPECTED]**: Failed attempts should automatically record mistakes in the Mistake Bank with corresponding skill tags (`Từ vựng`, `Chính tả`, `Phát âm`, `Nghe & Điền từ`, `Luyện viết`).
- **[ACTUAL]**: Mistakes were only being saved in `GrammarLab.jsx` and `MinimalPairs.jsx`, leaving Flashcards, Dictation, Pronunciation, and Writing disconnected from the Mistake Bank and WeakSkills analyzer.
- **[SEVERITY]**: HIGH
- **[ROOT CAUSE]**: Missing `storage.saveMistake(...)` calls upon incorrect answer checks in these four components.
- **[FIX]**: Integrated `storage.saveMistake` in `Flashcards.jsx`, `Pronunciation.jsx`, `Dictation.jsx`, and `Writing.jsx` with appropriate skill classifications.

### BUG-004
- **[SCREEN]**: Mistake Storage (`src/utils/storage/mistakeStorage.js`)
- **[STEPS]**: Make the same error twice consecutively on a question.
- **[EXPECTED]**: The existing mistake entry should be updated with the latest attempt and timestamp without duplicating cards in Mistake Bank.
- **[ACTUAL]**: `saveMistake` appended every attempt unconditionally, creating duplicate cards for identical questions.
- **[SEVERITY]**: MEDIUM
- **[ROOT CAUSE]**: Lack of deduplication filter in `mistakeStorage.saveMistake`.
- **[FIX]**: Added deduplication check filtering out existing entries with identical `module`, `question`, and `correctAnswer` before prepending the fresh entry.

### BUG-005
- **[SCREEN]**: Native Mobile Navigation Bar on viewports <= 768px (`src/App.jsx` & `src/App.css`)
- **[STEPS]**: View application on mobile viewports (320px - 414px / iPhone 12 Pro 390x844).
- **[EXPECTED]**: Bottom navigation bar tab buttons have centered icons, legible 11px labels, and active highlight states.
- **[ACTUAL]**: Tab buttons in `App.jsx` used `className="mobile-tab-btn"`, but `App.css` only styled `.mobile-bottom-item`, resulting in unstyled tab layouts.
- **[SEVERITY]**: LOW
- **[ROOT CAUSE]**: CSS class name mismatch between `App.jsx` (`.mobile-tab-btn`) and `App.css` (`.mobile-bottom-item`).
- **[FIX]**: Added `.mobile-tab-btn` selector to `App.css` mobile styles.

---

## Bugs Fixed

### BUG-001
- Fixed in [App.css](file:///D:/Visual/code/web-demo-USUK/src/App.css#L13-L255): Styled `.qz-header-fixed`, `.qz-logo-badge`, `.qz-voice-tuner`, `.qz-tuner-knob`, and added proper hover/focus trigger rules for `.qz-dropdown-menu`.

### BUG-002
- Fixed in [VocabNotebook.jsx](file:///D:/Visual/code/web-demo-USUK/src/components/VocabNotebook.jsx#L5) and [App.jsx](file:///D:/Visual/code/web-demo-USUK/src/App.jsx#L623-L628): Added `onNavigateToFlashcards` prop and wired navigation callback.

### BUG-003
- Fixed in [Flashcards.jsx](file:///D:/Visual/code/web-demo-USUK/src/components/Flashcards.jsx#L175-L188), [Pronunciation.jsx](file:///D:/Visual/code/web-demo-USUK/src/components/Pronunciation.jsx#L136-L144), [Dictation.jsx](file:///D:/Visual/code/web-demo-USUK/src/components/Dictation.jsx#L110-L118), and [Writing.jsx](file:///D:/Visual/code/web-demo-USUK/src/components/Writing.jsx#L85-L117): Connected mistake capture across all four modules to `storage.saveMistake`.

### BUG-004
- Fixed in [mistakeStorage.js](file:///D:/Visual/code/web-demo-USUK/src/utils/storage/mistakeStorage.js#L18-L27): Added deduplication filtering in `saveMistake` to update existing entries and prevent duplicate cards.

### BUG-005
- Fixed in [App.css](file:///D:/Visual/code/web-demo-USUK/src/App.css#L2298-L2318): Included `.mobile-tab-btn` selector in mobile bottom bar rules.

---

## Regression

- **Tests**: 24/24 test suites passed (100% SUCCESS, 0 FAILED, 0 SKIPPED)
  - `tests/accountManagement.test.mjs` ✅
  - `tests/authService.test.mjs` ✅
  - `tests/conjugationEngine.test.mjs` ✅
  - `tests/dataIntegrity.test.mjs` ✅
  - `tests/dataRecovery.test.mjs` ✅
  - `tests/dataSync.test.mjs` ✅
  - `tests/deploymentConfig.test.mjs` ✅
  - `tests/frontendAuth.test.mjs` ✅
  - `tests/healthCheck.test.mjs` ✅
  - `tests/launchSmoke.test.mjs` ✅
  - `tests/learningIntelligence.test.mjs` ✅
  - `tests/middleware.test.mjs` ✅
  - `tests/productionEnvironment.test.mjs` ✅
  - `tests/productionHardening.test.mjs` ✅
  - `tests/productionReadiness.test.mjs` ✅
  - `tests/productionUx.test.mjs` ✅
  - `tests/publicExperience.test.mjs` ✅
  - `tests/publicMarketing.test.mjs` ✅
  - `tests/realWorldUx.test.mjs` ✅
  - `tests/securitySuite.test.mjs` ✅
  - `tests/storage.test.mjs` ✅
  - `tests/translatorFeatures.test.mjs` ✅
  - `tests/visualExcellence.test.mjs` ✅
  - `tests/realWorldQaPhase15.test.mjs` ✅
- **Lint**: `npm run lint` PASSED (0 errors, clean output)
- **Build**: `npm run build` PASSED (Exit code 0, 546 modules built in 318ms)

---

## Final Risk

- **Critical**: 0
- **High**: 0
- **Medium**: 0
- **Low**: 0
