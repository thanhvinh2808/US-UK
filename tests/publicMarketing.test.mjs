import test from 'node:test';
import assert from 'node:assert';
import { newsArticles, getArticleBySlug, getRelatedArticles } from '../src/data/newsArticles.js';

console.log('================ RUNNING PUBLIC MARKETING & NEWS TESTS ================\n');

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

// 1. Articles Dataset Integrity
runTest('1. News Articles Bank contains at least 5 structured educational articles', () => {
  assert.ok(Array.isArray(newsArticles));
  assert.ok(newsArticles.length >= 5);
  
  newsArticles.forEach(art => {
    assert.ok(art.id, 'Article must have id');
    assert.ok(art.slug, 'Article must have slug');
    assert.ok(art.title, 'Article must have title');
    assert.ok(art.category, 'Article must have category');
    assert.ok(art.readingTime, 'Article must have readingTime');
    assert.ok(art.publishedAt, 'Article must have publishedAt');
    assert.ok(art.author && art.author.name, 'Article must have author');
    assert.ok(art.content, 'Article must have content body');
    assert.ok(Array.isArray(art.tags) && art.tags.length > 0, 'Article must have tags');
    assert.ok(Array.isArray(art.toc) && art.toc.length > 0, 'Article must have TOC');
  });
});

// 2. Query Article by Slug
runTest('2. getArticleBySlug returns matching article or null', () => {
  const art1 = getArticleBySlug('ielts-reading-spaced-repetition');
  assert.ok(art1);
  assert.strictEqual(art1.id, 'art_1');
  assert.strictEqual(art1.category, 'IELTS Tips');

  const art2 = getArticleBySlug('us-uk-pronunciation-differences');
  assert.ok(art2);
  assert.strictEqual(art2.id, 'art_2');

  const notFound = getArticleBySlug('non-existent-slug');
  assert.strictEqual(notFound, null);
});

// 3. Related Articles Helper
runTest('3. getRelatedArticles excludes current article and limits count', () => {
  const related = getRelatedArticles('art_1', 2);
  assert.strictEqual(related.length, 2);
  assert.ok(!related.some(r => r.id === 'art_1'));
});

// 4. Vocabulary Callout Structure
runTest('4. Vocabulary callouts contain required fields (word, ipa, vietnamese, example)', () => {
  const artWithVocab = newsArticles.find(a => a.relatedVocabulary && a.relatedVocabulary.length > 0);
  assert.ok(artWithVocab, 'At least one article has related vocabulary callout');

  artWithVocab.relatedVocabulary.forEach(v => {
    assert.ok(v.word, 'Vocab must have word');
    assert.ok(v.ipa, 'Vocab must have ipa');
    assert.ok(v.vietnamese, 'Vocab must have vietnamese');
    assert.ok(v.example, 'Vocab must have example');
  });
});

// 5. Category coverage
runTest('5. Articles cover all required learning categories (IELTS, Pronunciation, Grammar, News)', () => {
  const categories = new Set(newsArticles.map(a => a.category));
  assert.ok(categories.has('IELTS Tips'));
  assert.ok(categories.has('Pronunciation'));
  assert.ok(categories.has('Grammar'));
  assert.ok(categories.has('V-English News'));
});

console.log(`\n================ PUBLIC MARKETING TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
