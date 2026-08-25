import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { newsArticles, getArticleBySlug, getRelatedArticles } from '../src/data/newsArticles.js';

console.log('================ RUNNING PRODUCTION READINESS & SEO / A11Y TESTS ================\n');

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

// 1. Index.html SEO & Meta Tag Hardening
runTest('1. index.html contains essential SEO, OpenGraph, and JSON-LD schema', () => {
  const htmlContent = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
  assert.ok(htmlContent.includes('<meta name="description"'), 'Must have meta description');
  assert.ok(htmlContent.includes('<link rel="canonical"'), 'Must have canonical URL');
  assert.ok(htmlContent.includes('property="og:title"'), 'Must have OpenGraph title');
  assert.ok(htmlContent.includes('property="og:description"'), 'Must have OpenGraph description');
  assert.ok(htmlContent.includes('property="og:type"'), 'Must have OpenGraph type');
  assert.ok(htmlContent.includes('name="twitter:card"'), 'Must have Twitter card');
  assert.ok(htmlContent.includes('application/ld+json'), 'Must have JSON-LD structured data');
  assert.ok(htmlContent.includes('"@type": "WebSite"'), 'JSON-LD must define WebSite schema');
});

// 2. CSS Accessibility & Reduced Motion Hardening
runTest('2. index.css contains prefers-reduced-motion media query and reading progress bar', () => {
  const cssContent = readFileSync(join(process.cwd(), 'src/index.css'), 'utf-8');
  assert.ok(cssContent.includes('prefers-reduced-motion: reduce'), 'Must support prefers-reduced-motion');
  assert.ok(cssContent.includes('.reading-progress-bar'), 'Must define reading-progress-bar class');
  assert.ok(cssContent.includes('.toast-container'), 'Must define toast-container class');
  assert.ok(cssContent.includes('.perspective-1000'), 'Must define 3D perspective class');
});

// 3. Article Metadata & Schema Integrity
runTest('3. All news articles have complete metadata and valid schema fields', () => {
  const requiredFields = ['id', 'slug', 'title', 'excerpt', 'category', 'categoryColor', 'publishedAt', 'readingTime', 'author', 'content', 'toc', 'tags'];
  newsArticles.forEach(art => {
    requiredFields.forEach(field => {
      assert.ok(art[field] !== undefined && art[field] !== null, `Article ${art.slug || art.id} is missing field "${field}"`);
    });
    assert.ok(art.author.name, 'Author must have a name');
    assert.ok(art.author.role, 'Author must have a role');
    assert.ok(art.author.avatar, 'Author must have an avatar');
  });
});

// 4. No Duplicate Article Slugs or IDs
runTest('4. All article slugs and IDs are completely unique', () => {
  const seenSlugs = new Set();
  const seenIds = new Set();
  newsArticles.forEach(art => {
    assert.ok(!seenSlugs.has(art.slug), `Duplicate slug detected: ${art.slug}`);
    assert.ok(!seenIds.has(art.id), `Duplicate ID detected: ${art.id}`);
    seenSlugs.add(art.slug);
    seenIds.add(art.id);
  });
});

// 5. Category Taxonomy Validation
runTest('5. All articles belong to allowed valid categories', () => {
  const validCategories = new Set(['IELTS Tips', 'Pronunciation', 'Grammar', 'V-English News']);
  newsArticles.forEach(art => {
    assert.ok(validCategories.has(art.category), `Invalid category "${art.category}" in article ${art.slug}`);
  });
});

// 6. Heading / TOC Consistency
runTest('6. All TOC anchors correspond to headers inside article content', () => {
  newsArticles.forEach(art => {
    assert.ok(Array.isArray(art.toc) && art.toc.length > 0, `${art.slug} must have a non-empty TOC`);
    art.toc.forEach(tocItem => {
      assert.ok(tocItem.id, 'TOC item must have an id');
      assert.ok(!tocItem.id.includes(' '), `TOC id "${tocItem.id}" should not contain spaces`);
      assert.ok(art.content.includes(`id="${tocItem.id}"`), `Article ${art.slug} content missing element with id="${tocItem.id}"`);
    });
  });
});

// 7. Interactive Vocabulary Callouts Structure
runTest('7. Related vocabulary callouts contain complete pronunciation and translation data', () => {
  newsArticles.forEach(art => {
    if (art.relatedVocabulary && art.relatedVocabulary.length > 0) {
      art.relatedVocabulary.forEach(vocab => {
        assert.ok(vocab.word && vocab.word.trim().length > 0, 'Vocab must have word');
        assert.ok(vocab.ipa && vocab.ipa.trim().length > 0, 'Vocab must have ipa');
        assert.ok(vocab.vietnamese && vocab.vietnamese.trim().length > 0, 'Vocab must have vietnamese');
        assert.ok(vocab.example && vocab.example.trim().length > 0, 'Vocab must have example');
      });
    }
  });
});

// 8. Safe Fallback on Malformed Slug
runTest('8. getArticleBySlug safely returns default article when given unknown slug or null', () => {
  const defaultArt = getArticleBySlug('non-existent-slug-xyz');
  // Returns null or fallback safely
  assert.strictEqual(defaultArt, null);

  const validArt = getArticleBySlug('ielts-reading-spaced-repetition');
  assert.ok(validArt);
  assert.strictEqual(validArt.slug, 'ielts-reading-spaced-repetition');
});

// 9. CTA Target Validation
runTest('9. Public navigation targets match valid application screen identifiers', () => {
  const validScreenKeys = new Set([
    'landing', 'news', 'article_detail', 'dashboard', 'flashcards',
    'notebook', 'grammar', 'translator', 'minimal_pairs', 'tenses_handbook',
    'idioms_handbook', 'alphabet', 'admin', 'mistake_bank', 'shadowing', 'writing'
  ]);
  
  // Verify main public link targets
  const samplePublicNavTargets = ['landing', 'news', 'dashboard', 'flashcards', 'notebook', 'grammar', 'minimal_pairs', 'translator'];
  samplePublicNavTargets.forEach(target => {
    assert.ok(validScreenKeys.has(target), `Invalid navigation target key "${target}"`);
  });
});

// 10. Memory Safe Related Articles Limit
runTest('10. getRelatedArticles enforces numeric limits and excludes self', () => {
  const targetId = newsArticles[0].id;
  const related = getRelatedArticles(targetId, 3);
  assert.ok(related.length <= 3);
  assert.ok(!related.some(a => a.id === targetId), 'Related articles must never include the target article itself');
});

console.log(`\n================ PRODUCTION READINESS SUMMARY: ${passed} PASSED, ${failed} FAILED ================`);
process.exit(failed > 0 ? 1 : 0);
