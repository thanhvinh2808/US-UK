# Translator Upgrade & Interactive Word Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Translator module with a complete 12-tense conjugation grid, 2 bilingual example sentences per verb, and interactive hover/click word popups with instant translation and pronunciation audio for sentences.

**Architecture:** 
1. Extend `conjugationEngine.js` to guarantee all 12 standard English tenses and bilingual example generation.
2. Build an `InteractiveSentence` component that splits sentence text into interactive word tokens with an accessible floating popover (instant translation, TTS audio, save word).
3. Integrate the 12-tense cards, bilingual examples, and `InteractiveSentence` into `GlobalTranslator.jsx`.

**Tech Stack:** React 19, Tailwind CSS v4, Compromise NLP, Web Speech Synthesis API, Google Translate API / Dictionary API.

**Spec:** `docs/superpowers/specs/2026-08-24-translator-and-grammar-design.md`

## Global Constraints
- Node.js 18+ and React 19 compatibility.
- Preserve existing local storage and state management structures.
- Support both desktop (hover) and mobile (tap/click) for interactive tokens.

---

### Task 1: Complete 12 Tenses Conjugation & Bilingual Examples Engine

**Files:**
- Modify: `src/utils/helpers/conjugationEngine.js`
- Test: `tests/conjugationEngine.test.js` or `run_tests.mjs`

**Interfaces:**
- Produces: `get12Tenses(verb)` returning an object with 12 tenses grouped into `present`, `past`, `future`, each with 4 tenses `simple`, `continuous`, `perfect`, `perfect_continuous`.
- Produces: `getVerbBilingualExamples(verb, vietnameseMeaning)` returning 2 bilingual sentences `[{ en, vi }]`.

- [ ] **Step 1: Write the failing unit test for 12 tenses and bilingual examples**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement 12 tenses calculation and bilingual example generator in `conjugationEngine.js`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 2: Interactive Word Token Popover Component (`InteractiveSentence.jsx`)

**Files:**
- Create: `src/components/InteractiveSentence.jsx`
- Create: `src/components/InteractiveSentence.css`

**Interfaces:**
- Consumes: `text` (string), `lang` ('en' | 'vi'), `onWordClick` (callback), `showToast` (callback).
- Produces: `<InteractiveSentence text={...} isEnglish={true} ... />` rendering words as interactive tokens with a popover showing translation, IPA, audio button, and save button.

- [ ] **Step 1: Create `InteractiveSentence.jsx` with tokenization, translation cache, and popover**
- [ ] **Step 2: Add styles in `InteractiveSentence.css` for clean tooltips, hover highlights, and mobile touch support**
- [ ] **Step 3: Test tokenization with complex punctuation, contractions, and multi-line text**
- [ ] **Step 4: Commit changes**

---

### Task 3: GlobalTranslator UI Integration & 12 Tense Grid

**Files:**
- Modify: `src/components/GlobalTranslator.jsx`
- Modify: `src/App.css` (or translator styles)

**Interfaces:**
- Consumes: `InteractiveSentence`, `get12Tenses`, `getVerbBilingualExamples`.
- Produces: Updated `GlobalTranslator` rendering interactive sentences on query & result, a 3-column responsive 12-tense grid, and 2 bilingual examples with audio.

- [ ] **Step 1: Update `GlobalTranslator.jsx` to incorporate `InteractiveSentence` for English inputs and outputs**
- [ ] **Step 2: Replace the basic 3-tense section in `GlobalTranslator.jsx` with the comprehensive 12-tense grid**
- [ ] **Step 3: Add the 2 bilingual example sentences section with pronunciation audio triggers**
- [ ] **Step 4: Verify UI responsiveness across desktop and mobile screen sizes**
- [ ] **Step 5: Commit changes**

---

### Task 4: End-to-End Verification & Quality Review

**Files:**
- All touched files in Task 1-3.

- [ ] **Step 1: Run linter and tests**
- [ ] **Step 2: Test single verbs (e.g., "play", "write", "understand") - verify 12 tenses & 2 bilingual examples**
- [ ] **Step 3: Test long sentences (e.g., "Artificial intelligence is transforming how people learn new languages") - verify hover popups and individual word audio**
- [ ] **Step 4: Verify and document complete results**
