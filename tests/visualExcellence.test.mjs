import assert from 'node:assert';
import { newsArticles, getArticleBySlug, getRelatedArticles } from '../src/data/newsArticles.js';

console.log('================ RUNNING VISUAL EXCELLENCE & UX POLISH TESTS ================\n');

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

// 1. Editorial Quality & Structure
runTest('1. Every article contains a valid TOC structure with valid ids', () => {
  newsArticles.forEach(art => {
    assert.ok(Array.isArray(art.toc), `${art.slug} must have toc array`);
    assert.ok(art.toc.length >= 2, `${art.slug} must have at least 2 TOC entries`);
    art.toc.forEach(item => {
      assert.ok(item.id, 'TOC item must have id');
      assert.ok(item.text, 'TOC item must have text');
      // ID must not contain spaces
      assert.ok(!item.id.includes(' '), 'TOC id must not contain spaces');
    });
  });
});

// 2. Reading Time & Date Formatting
runTest('2. All articles have standard reading time and ISO published date', () => {
  newsArticles.forEach(art => {
    assert.match(art.readingTime, /\d+\s+phút\s+đọc/, `${art.slug} reading time format valid`);
    assert.match(art.publishedAt, /^\d{4}-\d{2}-\d{2}$/, `${art.slug} date format valid`);
  });
});

// 3. Category Color Assignment
runTest('3. All articles have valid categoryColor token mapping', () => {
  const allowedColors = new Set(['indigo', 'blue', 'amber', 'emerald']);
  newsArticles.forEach(art => {
    assert.ok(allowedColors.has(art.categoryColor), `${art.slug} must have a valid categoryColor`);
  });
});

// 4. Vocabulary Pronunciation Pairs
runTest('4. Phonetics articles contain clear US/UK transcription differences', () => {
  const phoneticsArt = getArticleBySlug('us-uk-pronunciation-differences');
  assert.ok(phoneticsArt);
  assert.ok(phoneticsArt.relatedVocabulary.length >= 3);
  phoneticsArt.relatedVocabulary.forEach(v => {
    assert.ok(v.word);
    assert.ok(v.ipa.includes('US:') || v.ipa.includes('/'));
    assert.ok(v.vietnamese);
  });
});

// 5. Related Articles Isolation
runTest('5. Related articles helper returns disjoint articles and obeys limit', () => {
  const related1 = getRelatedArticles('art_1', 2);
  assert.strictEqual(related1.length, 2);
  assert.ok(!related1.some(a => a.id === 'art_1'));

  const relatedAll = getRelatedArticles('art_2', 10);
  assert.ok(relatedAll.length <= newsArticles.length - 1);
  assert.ok(!relatedAll.some(a => a.id === 'art_2'));
});

console.log(`\n================ VISUAL EXCELLENCE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
