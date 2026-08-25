# V-English — Production Go-Live Checklist

## 1. Environment & Infrastructure
- [x] `.env.example` verified with complete variable definitions.
- [x] Zero real production secrets committed to repository.
- [x] HTTPS configured and enforced with HTTP -> HTTPS 301 redirection.
- [x] Secure HttpOnly Cookie handling enabled.
- [x] Reverse Proxy / CORS origin whitelist configured.

## 2. Health & Monitoring
- [x] Health check endpoint `GET /health` responding `{ "status": "OK" }`.
- [x] Safe logging active (sensitive fields automatically redacted).
- [x] Production Error Boundary active (user-friendly recovery screen without stack trace leaks).

## 3. Core Features & Learning Flow
- [x] Public Marketing Landing Page, News Hub, and Article Reader operational.
- [x] Spaced Repetition SM-2 algorithm intact and verified.
- [x] Flashcards keyboard navigation (`Space`, `1-4`, `Enter`) guarded against form inputs.
- [x] Sổ tay từ vựng (Vocab Notebook) with smart filters (Due, Worst, Mastered) and US/UK pronunciation.
- [x] Mistake Bank grouping mistakes by skill (Grammar, Pronunciation, Vocabulary, Spelling).
- [x] Offline Outbox queueing mutations and syncing seamlessly upon reconnection.
- [x] Data backup (Export JSON) and restore (Import JSON) protected against Prototype Pollution.

## 4. Quality & Compliance
- [x] Automated test suites: 100% PASS (0 failed, 0 skipped).
- [x] Production build: PASS (`npm run build` completed cleanly).
- [x] Linter: PASS (`npm run lint` clean).
- [x] Accessibility: WCAG 2.2 AA compliant with full keyboard support and `prefers-reduced-motion`.
- [x] SEO: Meta tags, OpenGraph, Twitter card, Canonical (`https://v-english.app/`), JSON-LD, `robots.txt`, and `sitemap.xml`.
- [x] Responsive Design: Verified on 320px, 375px, 414px, 768px, 1024px, 1280px, 1440px, 1920px with zero horizontal overflow.
