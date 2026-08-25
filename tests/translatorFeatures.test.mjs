import assert from 'node:assert';
import { get12Tenses, getVerbBilingualExamples } from '../src/utils/helpers/conjugationEngine.js';

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

console.log("================ RUNNING END-TO-END TRANSLATOR VERIFICATION ================\n");

// 1. Regular verb: study
test("E2E - 12 Tenses for 'study'", () => {
  const t = get12Tenses("study");
  assert.strictEqual(t.present.simple.form, "study / studies");
  assert.strictEqual(t.present.continuous.form, "am / is / are studying");
  assert.strictEqual(t.past.simple.form, "studied");
  assert.strictEqual(t.past.continuous.form, "was / were studying");
  assert.strictEqual(t.future.simple.form, "will study");
  assert.strictEqual(t.future.perfect.form, "will have studied");
});

// 2. Irregular verb: write
test("E2E - 12 Tenses for 'write'", () => {
  const t = get12Tenses("write");
  assert.strictEqual(t.present.simple.form, "write / writes");
  assert.strictEqual(t.past.simple.form, "wrote");
  assert.strictEqual(t.present.perfect.form, "have / has written");
  assert.strictEqual(t.past.perfect.form, "had written");
  assert.strictEqual(t.future.simple.form, "will write");
});

// 3. Phrasal verb: look after
test("E2E - 12 Tenses for 'look after'", () => {
  const t = get12Tenses("look after");
  assert.strictEqual(t.present.simple.form, "look after / looks after");
  assert.strictEqual(t.past.simple.form, "looked after");
  assert.strictEqual(t.present.continuous.form, "am / is / are looking after");
});

// 4. Modal verb: must
test("E2E - Modal verb 'must'", () => {
  const t = get12Tenses("must");
  assert.strictEqual(t.isModal, true);
  assert.strictEqual(t.present.simple.form, "must");
  assert.strictEqual(t.past.simple.form, "had to / must");
});

// 5. Bilingual examples for multiple verbs
test("E2E - Bilingual examples generator", () => {
  const exStudy = getVerbBilingualExamples("study", "học tập");
  assert.strictEqual(exStudy.length, 2);
  assert.ok(exStudy[0].en.includes("studies") || exStudy[0].en.includes("study"));
  assert.ok(exStudy[0].vi.includes("học"));

  const exEat = getVerbBilingualExamples("eat", "ăn uống");
  assert.strictEqual(exEat.length, 2);
  assert.ok(exEat[0].en.length > 5);
  assert.ok(exEat[0].vi.length > 5);
});

// 6. Interactive Tokenizer regex sanity check
test("E2E - Tokenizer handles words and contractions", () => {
  const text = "She doesn't like apples, but she loves oranges!";
  const tokenRegex = /([a-zA-Z0-9'’]+|[^a-zA-Z0-9'’\s]+|\s+)/g;
  const tokens = text.match(tokenRegex);
  assert.ok(tokens.includes("doesn't"));
  assert.ok(tokens.includes("apples"));
  assert.ok(tokens.includes(","));
  assert.ok(tokens.includes("oranges"));
  assert.ok(tokens.includes("!"));
});

console.log(`\n================ E2E SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
