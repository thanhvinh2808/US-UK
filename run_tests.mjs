import { checkLocalGrammarErrors } from './src/utils/helpers/grammarChecker.js';

const tests = [
  // Bug 1: "do it"
  { input: "I can't do it", expected: "I can't do it" },
  { input: "you can do it", expected: "you can do it" },
  { input: "I want to do it", expected: "I want to do it" },
  { input: "please do it now", expected: "please do it now" },
  { input: "do he like it", expected: "does he like it" },

  // Bug 2: "was / is" in Wh-questions
  { input: "where he was", expected: "where he was" },
  { input: "where he is", expected: "where he is" },
  { input: "when she was born", expected: "when she was born" },

  // Bug 3: Subjunctive mood after suggest / recommend
  { input: "I suggest him to go", expected: "I suggest that he go" },
  { input: "I suggest that he goes", expected: "I suggest that he go" },
  { input: "I recommend her to study", expected: "I recommend that she study" },

  // Bug 4: Phonetic a / an
  { input: "a user account", expected: "a user account" },
  { input: "an user account", expected: "a user account" },
  { input: "a euro", expected: "a euro" },
  { input: "an euro", expected: "a euro" },
  { input: "a MBA degree", expected: "an MBA degree" },
  { input: "a hour", expected: "an hour" },
  { input: "a honest man", expected: "an honest man" },

  // Bug 5: "anh" -> "and" removal
  { input: "anh and I go to school", expected: "anh and I go to school" },
  { input: "I like him, anh", expected: "I like him, anh" },

  // Bug 6: Wh-question verb slicing on -es and -ies verbs
  { input: "where he go", expected: "where does he go" },
  { input: "where he goes", expected: "where does he go" },
  { input: "why he watches", expected: "why does he watch" },
  { input: "how he teaches", expected: "how does he teach" },
  { input: "when he catches", expected: "when does he catch" },
  { input: "where he studies", expected: "where does he study" },
  { input: "why he tries", expected: "why does he try" },
  { input: "how he cries", expected: "how does he cry" },
  { input: "where he carries", expected: "where does he carry" },
  { input: "why he worries", expected: "why does he worry" },
  { input: "how he fixes", expected: "how does he fix" },
  { input: "when he misses", expected: "when does he miss" }
];

let failed = 0;
console.log("================ RUNNING REGRESSION TESTS ================\n");
tests.forEach(({ input, expected }, idx) => {
  const res = checkLocalGrammarErrors(input);
  const actual = res.correctedText;
  if (actual === expected) {
    console.log(`✅ [PASS ${idx + 1}] "${input}" -> "${actual}"`);
  } else {
    console.error(`❌ [FAIL ${idx + 1}] "${input}" -> Actual: "${actual}" | Expected: "${expected}"`);
    failed++;
  }
});

console.log("\n================ TEST SUMMARY ================");
if (failed === 0) {
  console.log(`🎉 ALL ${tests.length} REGRESSION TESTS PASSED CLEANLY!\n`);
  process.exit(0);
} else {
  console.error(`💥 ${failed} / ${tests.length} TESTS FAILED.\n`);
  process.exit(1);
}
