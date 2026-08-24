import assert from 'node:assert';
import {
  get12Tenses,
  getVerbBilingualExamples,
  conjugateWithCompromise,
  getSForm,
  getPastForm,
  getIngForm
} from '../src/utils/helpers/conjugationEngine.js';

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

console.log("================ RUNNING CONJUGATION ENGINE TESTS ================\n");

// 1. Regular Verb: "play"
test("12 Tenses - Regular verb 'play'", () => {
  const tenses = get12Tenses("play");
  assert.ok(tenses, "Result should not be null");
  assert.ok(tenses.present && tenses.past && tenses.future, "Should contain present, past, future");

  // Present
  assert.strictEqual(tenses.present.simple.form, "play / plays");
  assert.strictEqual(tenses.present.simple.nameEn, "Present Simple");
  assert.strictEqual(tenses.present.simple.nameVi, "Hiện tại đơn");
  assert.strictEqual(tenses.present.continuous.form, "am / is / are playing");
  assert.strictEqual(tenses.present.perfect.form, "have / has played");
  assert.strictEqual(tenses.present.perfect_continuous.form, "have / has been playing");

  // Past
  assert.strictEqual(tenses.past.simple.form, "played");
  assert.strictEqual(tenses.past.simple.nameEn, "Past Simple");
  assert.strictEqual(tenses.past.continuous.form, "was / were playing");
  assert.strictEqual(tenses.past.perfect.form, "had played");
  assert.strictEqual(tenses.past.perfect_continuous.form, "had been playing");

  // Future
  assert.strictEqual(tenses.future.simple.form, "will play");
  assert.strictEqual(tenses.future.simple.nameEn, "Future Simple");
  assert.strictEqual(tenses.future.continuous.form, "will be playing");
  assert.strictEqual(tenses.future.perfect.form, "will have played");
  assert.strictEqual(tenses.future.perfect_continuous.form, "will have been playing");
});

// 2. Irregular Verb: "go"
test("12 Tenses - Irregular verb 'go'", () => {
  const tenses = get12Tenses("go");
  assert.ok(tenses, "Result should not be null");
  assert.strictEqual(tenses.present.simple.form, "go / goes");
  assert.strictEqual(tenses.past.simple.form, "went");
  assert.strictEqual(tenses.present.perfect.form, "have / has gone");
});

// 3. Phrasal Verb: "take off"
test("12 Tenses - Phrasal verb 'take off'", () => {
  const tenses = get12Tenses("take off");
  assert.ok(tenses, "Result should not be null");
  assert.strictEqual(tenses.present.simple.form, "take off / takes off");
  assert.strictEqual(tenses.past.simple.form, "took off");
  assert.strictEqual(tenses.present.perfect.form, "have / has taken off");
  assert.strictEqual(tenses.present.continuous.form, "am / is / are taking off");
});

// 4. Modal Verb: "can"
test("12 Tenses - Modal verb 'can'", () => {
  const tenses = get12Tenses("can");
  assert.ok(tenses, "Result should not be null");
  assert.ok(tenses.isModal, "Should flag as modal");
  assert.strictEqual(tenses.present.simple.form, "can");
  assert.strictEqual(tenses.past.simple.form, "could");
});

// 5. Special Verb: "be"
test("12 Tenses - Special verb 'be'", () => {
  const tenses = get12Tenses("be");
  assert.ok(tenses, "Result should not be null");
  assert.strictEqual(tenses.present.simple.form, "am / is / are");
  assert.strictEqual(tenses.past.simple.form, "was / were");
  assert.strictEqual(tenses.present.perfect.form, "have / has been");
});

// 6. Bilingual Examples: "play" & "read"
test("Bilingual Examples - 'play'", () => {
  const examples = getVerbBilingualExamples("play", "chơi");
  assert.ok(Array.isArray(examples) && examples.length === 2, "Should return 2 examples");
  assert.ok(examples[0].en && examples[0].vi, "Example 1 should have en and vi");
  assert.ok(examples[1].en && examples[1].vi, "Example 2 should have en and vi");
});

console.log(`\n================ TESTS RESULT: ${passed} PASSED, ${failed} FAILED ================`);
if (failed > 0) process.exit(1);
