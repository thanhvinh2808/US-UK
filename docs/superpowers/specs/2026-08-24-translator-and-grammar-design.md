# Design Spec: Translator Upgrade & Interactive Word Lookup (Phase 1) + Grammar & IELTS Expansion (Phase 2)

Date: 2026-08-24
Status: Approved

## 1. Overview & Goals
Upgrade the Antigravity English web application with advanced usability and educational features:
- **Phase 1 (Translator & Interactive Features)**:
  1. **12 Verb Tenses & Forms**: When a verb is queried in `GlobalTranslator`, display a complete, clean, and organized grid of all 12 English tenses grouped by Present, Past, and Future.
  2. **Bilingual Examples for Verbs**: Provide 2 real-world example sentences using the verb, with accurate Vietnamese translations and audio playback.
  3. **Interactive Word Tokens in Translated Sentences**: When translating a full sentence or multi-word phrase, make individual English words interactive. Hovering (on desktop) or clicking/tapping (on mobile/desktop) on any word displays an instant popover with:
     - Quick Vietnamese translation of the individual word
     - Pronunciation audio button (US/UK)
     - Button to save directly to Vocab Notebook or view detailed dictionary entry
- **Phase 2 (Grammar & IELTS Topics Expansion)**:
  - Enrich the Grammar Lab with advanced IELTS structures (Band 6.5 - 8.0+).
  - Expand topic bank with global IELTS topics, collocations, and idioms.

---

## 2. Phase 1 Technical Architecture

### 2.1 12 Tenses Grid Component & Engine
- **Engine**: Extend `src/utils/helpers/conjugationEngine.js` to ensure 100% complete 12 tenses for regular, irregular, and phrasal verbs:
  - Present: Simple, Continuous, Perfect, Perfect Continuous
  - Past: Simple, Continuous, Perfect, Perfect Continuous
  - Future: Simple, Continuous, Perfect, Perfect Continuous
- **UI Component**: Enhance the `⚡ Chia 12 Thì & Dạng từ` tab in `src/components/GlobalTranslator.jsx`:
  - 3-column or responsive card layout grouping Present (4 tenses), Past (4 tenses), Future (4 tenses).
  - Clean tag styling with tense names (EN + VI) and conjugated forms.

### 2.2 2 Bilingual Example Sentences for Verbs
- In the `📖 Nghĩa & Từ loại` or `⚡ Chia 12 Thì` tab:
  - If a verb is queried, generate or fetch 2 distinct example sentences illustrating common usage in different tenses or contexts.
  - Each example contains English text, Vietnamese translation, and audio TTS button.

### 2.3 Interactive Sentence Words (`InteractiveSentence.jsx` or inline token renderer)
- Create a dedicated component or tokenized renderer:
  - Splits English text into punctuation-aware tokens (words + separators).
  - Hover / Click on a word triggers a floating Popover (`WordPopup`).
  - Fetches fast translation for the hovered word (with in-memory cache to prevent redundant API calls).
  - Provides a single-click TTS speak button (`speak(word, 'US')`) and a Save button (`storage.saveWord(...)`).

---

## 3. Phase 2 Technical Architecture (Grammar & IELTS Topics)
- Expand `src/data/` with IELTS Grammar topics and high-band collocations/idioms.
- Integrate into Grammar Lab & Topic Selector.

---

## 4. Verification & Testing
- Unit / helper tests for `conjugationEngine.js` with various verb types (regular, irregular, modal, phrasal).
- Component tests for sentence tokenization and popup triggering.
- End-to-end user verification for hover/click interaction and audio playback.
