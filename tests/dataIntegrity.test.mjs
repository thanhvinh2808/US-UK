import assert from 'node:assert';
import { setStorageScope } from '../src/utils/storage/storageScope.js';
import { vocabStorage } from '../src/utils/storage/vocabStorage.js';
import { deckStorage } from '../src/utils/storage/deckStorage.js';
import { buildExportData } from '../src/utils/data/dataExport.js';
import { validateImportData, executeDataImport } from '../src/utils/data/dataImport.js';
import { checkLegacyDataExists, runLegacyMigration } from '../src/utils/data/legacyMigration.js';

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

console.log('================ RUNNING DATA INTEGRITY & MIGRATION TESTS ================\n');

// Mock localStorage
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

// 1. Data export structure and metadata
test('1. Data Export: outputs standard schema with version and metadata', () => {
  localStorage.clear();
  setStorageScope('user_export_test');

  vocabStorage.saveWord({ word: 'serene', vietnamese: 'thanh bình' });
  deckStorage.saveCustomDeck({ id: 'd_1', name: 'IELTS Advanced' });

  const exportObj = buildExportData();
  assert.strictEqual(exportObj.app, 'Antigravity English V2');
  assert.strictEqual(exportObj.version, '2.0.0');
  assert.strictEqual(exportObj.scope, 'user');
  assert.strictEqual(exportObj.metadata.totalVocab, 1);
  assert.strictEqual(exportObj.metadata.totalDecks, 1);
  assert.strictEqual(exportObj.data.vocab[0].word, 'serene');
});

// 2. Data import validation - Valid JSON
test('2. Data Import Validation: successfully parses and sanitizes valid learning JSON', () => {
  const validJson = JSON.stringify({
    data: {
      vocab: [
        { word: 'altruistic', ipa: '/ˌæl.truˈɪs.tɪk/', vietnamese: 'vị tha', repetitions: 2, interval: 6 }
      ],
      decks: [
        { id: 'deck_c1', name: 'C1 Vocabulary', icon: '⭐' }
      ]
    }
  });

  const val = validateImportData(validJson);
  assert.strictEqual(val.isValid, true);
  assert.strictEqual(val.summary.vocabCount, 1);
  assert.strictEqual(val.summary.deckCount, 1);
  assert.strictEqual(val.sanitizedData.vocab[0].word, 'altruistic');
});

// 3. Data import security - Prototype pollution rejection
test('3. Data Import Security: blocks JSON attempting prototype pollution (__proto__)', () => {
  const maliciousJson = '{"__proto__": {"isAdmin": true}, "vocab": []}';
  const val = validateImportData(maliciousJson);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.error.includes('Prototype Pollution') || val.error.includes('không an toàn'));
});

// 4. Data import security - Sensitive field stripping
test('4. Data Import Security: blocks JSON containing unauthorized role or identity fields', () => {
  const injectionJson = JSON.stringify({
    role: 'admin',
    isAdmin: true,
    data: {
      vocab: [{ word: 'test' }]
    }
  });

  const val = validateImportData(injectionJson);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.error.includes('nhạy cảm'));
});

// 5. Data import execution - Merge without duplicate
test('5. Data Import Merge: merges incoming words into active storage without duplicates', () => {
  setStorageScope('user_import_merge_test');
  vocabStorage.setSavedVocabDirect([{ word: 'existing_word', vietnamese: 'đã có' }]);

  const importPayload = {
    vocab: [
      { word: 'existing_word', vietnamese: 'cập nhật' },
      { word: 'brand_new_word', vietnamese: 'mới toanh' }
    ],
    decks: [{ id: 'deck_new', name: 'New Deck' }],
    mistakes: []
  };

  const exec = executeDataImport(importPayload);
  assert.strictEqual(exec.success, true);
  assert.strictEqual(exec.importedCounts.vocab, 1, 'Only non-existing words should be added');

  const allVocab = vocabStorage.getSavedVocab();
  assert.strictEqual(allVocab.length, 2);
});

// 6. Safe legacy migration detection
test('6. Legacy Storage Migration: detects existing un-migrated eng_app_* data', () => {
  localStorage.clear();
  localStorage.setItem('eng_app_saved_vocab', JSON.stringify([{ word: 'legacy_word' }]));

  const exists = checkLegacyDataExists();
  assert.strictEqual(exists, true);
});

// 7. Safe legacy migration execution
test('7. Legacy Storage Migration: migrates legacy data to scoped namespace and flags completion', () => {
  const result = runLegacyMigration('guest');
  assert.strictEqual(result.migrated, true);
  assert.strictEqual(result.itemsMigrated, 1);

  const guestData = localStorage.getItem('eng_v2_guest_saved_vocab');
  assert.ok(guestData.includes('legacy_word'));

  // Ensure second run does not re-migrate
  const existsAfter = checkLegacyDataExists();
  assert.strictEqual(existsAfter, false);
});

console.log(`\n================ DATA INTEGRITY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
if (failed > 0) {
  process.exit(1);
}
