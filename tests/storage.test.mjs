import assert from 'node:assert';

// Mock localStorage for Node environment testing
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;

import { storage, calculateSM2 } from '../src/utils/storage/index.js';

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

console.log("================ RUNNING STORAGE MODULE TESTS ================\n");

// 1. SM-2 Spaced Repetition calculation
test("SM-2 - calculateSM2 grade 4 (Good)", () => {
  const res = calculateSM2(4, 0, 1, 2.5);
  assert.strictEqual(res.repetitions, 1);
  assert.strictEqual(res.interval, 1);
  assert.ok(res.easinessFactor >= 2.5);
});

test("SM-2 - calculateSM2 grade 1 (Reset / Again)", () => {
  const res = calculateSM2(1, 3, 6, 2.5);
  assert.strictEqual(res.repetitions, 0);
  assert.strictEqual(res.interval, 0);
  assert.ok(res.easinessFactor <= 2.3);
});

// 2. User Storage
test("UserStorage - getUserStats and updateUserStats", () => {
  localStorage.clear();
  const stats = storage.getUserStats();
  assert.strictEqual(stats.streak, 0);
  assert.strictEqual(stats.points, 0);

  const updated = storage.updateUserStats({ points: 50, streak: 3 });
  assert.strictEqual(updated.points, 50);
  assert.strictEqual(updated.streak, 3);
  assert.strictEqual(storage.getUserStats().points, 50);
});

// 3. Vocab Storage
test("VocabStorage - saveWord, getSavedVocab, deleteWord", () => {
  localStorage.clear();
  assert.deepStrictEqual(storage.getSavedVocab(), []);

  storage.saveWord({ word: "apple", vietnamese: "quả táo", ipa: "/ˈæp.əl/" });
  let vocab = storage.getSavedVocab();
  assert.strictEqual(vocab.length, 1);
  assert.strictEqual(vocab[0].word, "apple");

  // Avoid duplicate
  storage.saveWord({ word: "apple", vietnamese: "quả táo mới" });
  vocab = storage.getSavedVocab();
  assert.strictEqual(vocab.length, 1);

  // Update progress
  storage.updateWordProgress("apple", 4);
  vocab = storage.getSavedVocab();
  assert.strictEqual(vocab[0].repetitions, 1);

  // Delete word
  storage.deleteWord("apple");
  assert.strictEqual(storage.getSavedVocab().length, 0);
});

// 4. Topic Progress & Custom Topics
test("ProgressStorage - updateTopicProgress", () => {
  localStorage.clear();
  const p = storage.updateTopicProgress("topic_1", "reading", 1);
  assert.strictEqual(p["topic_1"].is_reading_completed, true);
  assert.strictEqual(storage.getUserStats().points, 10);
});

test("TopicStorage - saveCustomTopic and deleteCustomTopic", () => {
  localStorage.clear();
  storage.saveCustomTopic({ id: "cust_1", title: "Custom Topic" });
  assert.strictEqual(storage.getCustomTopics().length, 1);
  assert.strictEqual(storage.getCustomTopics()[0].title, "Custom Topic");

  storage.deleteCustomTopic("cust_1");
  assert.strictEqual(storage.getCustomTopics().length, 0);
});

// 5. Mistake Storage
test("MistakeStorage - saveMistake, getMistakes, getWeaknessStats", () => {
  localStorage.clear();
  storage.saveMistake({ module: "grammar", skill: "Ngữ pháp", question: "He go?", correctAnswer: "He goes" });
  storage.saveMistake({ module: "grammar", skill: "Ngữ pháp", question: "She like?", correctAnswer: "She likes" });
  storage.saveMistake({ module: "pronunciation", skill: "Phát âm", question: "ship vs sheep" });

  const mistakes = storage.getMistakes();
  assert.strictEqual(mistakes.length, 3);

  const stats = storage.getWeaknessStats();
  assert.strictEqual(stats[0].skill, "Ngữ pháp");
  assert.strictEqual(stats[0].count, 2);
  assert.strictEqual(stats[1].skill, "Phát âm");
  assert.strictEqual(stats[1].count, 1);
});

console.log(`\n================ STORAGE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
