import assert from 'node:assert';
import { buildExportData } from '../src/utils/data/dataExport.js';
import { validateImportData, executeDataImport } from '../src/utils/data/dataImport.js';

console.log('================ RUNNING DATA RECOVERY & BACKUP VALIDATION TESTS ================\n');

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

// 1. Export Data Schema & Completeness
runTest('1. buildExportData generates complete, structured backup payload', () => {
  const exportPayload = buildExportData();
  assert.strictEqual(typeof exportPayload, 'object');
  assert.strictEqual(exportPayload.app, 'Antigravity English V2');
  assert.strictEqual(exportPayload.version, '2.0.0');
  assert.ok(exportPayload.exportedAt);
  assert.ok(exportPayload.metadata);
  assert.ok(exportPayload.data);
  assert.ok(Array.isArray(exportPayload.data.vocab));
  assert.ok(Array.isArray(exportPayload.data.mistakes));
  assert.ok(Array.isArray(exportPayload.data.decks));
});

// 2. Reject Malformed JSON Strings
runTest('2. validateImportData safely rejects non-JSON strings with clear error messages', () => {
  const malformedInput = '{ corrupt_json: true, ... ';
  const result = validateImportData(malformedInput);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.error && result.error.includes('JSON'));
});

// 3. Prevent Prototype Pollution
runTest('3. validateImportData blocks prototype pollution attempts (__proto__, constructor)', () => {
  const pollutionPayload = '{"__proto__": {"isAdmin": true}, "data": {"vocab": [{"word": "test"}]}}';
  const result = validateImportData(pollutionPayload);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.error.includes('không an toàn') || result.error.includes('không được phép'));
});

// 4. Strip Privilege Escalation Fields
runTest('4. validateImportData blocks attempts to import forbidden keys (role, isAdmin, accessToken)', () => {
  const escalationPayload = {
    role: 'admin',
    isAdmin: true,
    data: { vocab: [{ word: 'hack' }] }
  };
  const result = validateImportData(escalationPayload);
  assert.strictEqual(result.isValid, false);
});

// 5. Valid Backup Import & Sanitization
runTest('5. validateImportData successfully parses and bounds valid backup records', () => {
  const validPayload = {
    app: 'Antigravity English V2',
    version: '2.0.0',
    data: {
      vocab: [
        {
          word: '  perseverance  ',
          ipa: '/ˌpɜːsɪˈvɪərəns/',
          vietnamese: 'tính kiên trì',
          repetitions: 3,
          interval: 6,
          easinessFactor: 2.6
        }
      ],
      mistakes: [
        {
          module: 'grammar',
          skill: 'Ngữ pháp',
          question: 'She ___ to Paris last year.',
          userAnswer: 'go',
          correctAnswer: 'went'
        }
      ],
      decks: [
        {
          id: 'deck_ielts',
          name: 'IELTS Academic',
          icon: '🎓'
        }
      ]
    }
  };

  const result = validateImportData(validPayload);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.summary.vocabCount, 1);
  assert.strictEqual(result.summary.mistakeCount, 1);
  assert.strictEqual(result.summary.deckCount, 1);
  assert.strictEqual(result.sanitizedData.vocab[0].word, 'perseverance', 'Word must be trimmed');
});

// 6. Safe Empty Backup Handling
runTest('6. validateImportData handles empty collections without crashing', () => {
  const emptyPayload = { data: { vocab: [], mistakes: [], decks: [] } };
  const result = validateImportData(emptyPayload);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.summary.vocabCount, 0);
});

// 7. Data Merge Execution
runTest('7. executeDataImport returns success summary with imported counts', () => {
  const sanitized = {
    vocab: [{ word: 'resilience', ipa: '', vietnamese: 'sự kiên cường', repetitions: 0, interval: 1, easinessFactor: 2.5 }],
    mistakes: [],
    decks: []
  };

  const importResult = executeDataImport(sanitized);
  assert.strictEqual(importResult.success, true);
  assert.ok(typeof importResult.importedCounts.vocab === 'number');
});

console.log(`\n================ DATA RECOVERY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
