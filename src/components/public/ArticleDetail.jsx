import React, { useState, useEffect, useRef } from 'react';
import { getArticleBySlug, getRelatedArticles } from '../../data/newsArticles';
import { useAuth } from '../../context/AuthContext';
import { vocabStorage } from '../../utils/storage/vocabStorage';
import { speak } from '../../utils/sounds';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

export const ArticleDetail = ({
  slug,
  onNavigate,
  onOpenAuth,
  onSelectArticle,
  showToast,
  voiceAccent = 'US',
  onToggleVoiceAccent
}) => {
  const { isAuthenticated } = useAuth();
  const [savedWords, setSavedWords] = useState(new Set());
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const progressBarRef = useRef(null);

  const article = getArticleBySlug(slug) || getArticleBySlug('ielts-reading-spaced-repetition');
  const relatedArticles = article ? getRelatedArticles(article.id, 2) : [];

  // Update document title and dynamic Article JSON-LD structured data for SEO
  useEffect(() => {
    if (article) {
      document.title = `${article.title} — V-English Editorial`;
      
      const scriptId = 'article-jsonld-schema';
      let scriptEl = document.getElementById(scriptId);
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': article.title,
        'description': article.excerpt,
        'datePublished': article.publishedAt,
        'author': {
          '@type': 'Person',
          'name': article.author?.name || 'V-English Editorial Team'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'V-English',
          'url': 'https://v-english.app/'
        }
      });
    }

    return () => {
      document.title = 'V-English — Learn. Practice. Improve. (Nền Tảng Học Tiếng Anh Thông Minh)';
      const scriptEl = document.getElementById('article-jsonld-schema');
      if (scriptEl) scriptEl.remove();
    };
  }, [article]);

  // Lightweight reading progress handler using requestAnimationFrame (zero continuous React re-renders)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (progressBarRef.current) {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBarRef.current.style.width = `${Math.min(100, Math.max(0, progress))}%`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!article) return null;

  const handleSpeak = (text, accent = 'US') => {
    speak(text, { accent, rate: 0.85 });
  };

  const handleSaveWord = (vocabItem) => {
    if (!isAuthenticated) {
      if (showToast) showToast('Vui lòng đăng nhập để lưu từ vào Sổ tay cá nhân!', 'info');
      onOpenAuth('login');
      return;
    }

    vocabStorage.saveWord({
      word: vocabItem.word,
      ipa: vocabItem.ipa,
      vietnamese: vocabItem.vietnamese,
      example: vocabItem.example,
      topic: 'News & Articles'
    });

    setSavedWords(prev => new Set([...prev, vocabItem.word]));
    if (showToast) {
      showToast(`Đã lưu "${vocabItem.word}" vào Sổ tay từ vựng! 📙`, 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 🚀 Top Lightweight Reading Progress Indicator */}
      <div className="reading-progress-container">
        <div ref={progressBarRef} className="reading-progress-bar" />
      </div>

      {/* Navigation */}
      <PublicNavbar
        activeScreen="article_detail"
        onNavigate={onNavigate}
        onOpenAuth={onOpenAuth}
        voiceAccent={voiceAccent}
        onToggleVoiceAccent={onToggleVoiceAccent}
      />

      {/* Main Container */}
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap">
            <button
              onClick={() => onNavigate('landing')}
              className="hover:text-indigo-600 transition-colors"
            >
              Trang chủ
            </button>
            <span>/</span>
            <button
              onClick={() => onNavigate('news')}
              className="hover:text-indigo-600 transition-colors"
            >
              Tin tức & Bài viết
            </button>
            <span>/</span>
            <span className="text-slate-800 font-semibold truncate max-w-xs sm:max-w-md">
              {article.title}
            </span>
          </nav>

          {/* Article Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm mb-10 space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {article.category}
              </span>
              <span className="text-xs text-slate-400">• {article.readingTime}</span>
              <span className="text-xs text-slate-400">• Ngày đăng: {article.publishedAt}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {article.title}
            </h1>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-lg shadow-inner">
                {article.author.avatar}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{article.author.name}</p>
                <p className="text-[11px] text-slate-500">{article.author.role}</p>
              </div>
            </div>
          </div>

          {/* Article Body Grid (Main Content + Sticky TOC) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Mobile TOC Accordion */}
              {article.toc && article.toc.length > 0 && (
                <div className="lg:hidden bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-800"
                  >
                    <span>📑 Mục lục bài viết</span>
                    <span>{isMobileTocOpen ? '▲' : '▼'}</span>
                  </button>
                  {isMobileTocOpen && (
                    <ul className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-indigo-600">
                      {article.toc.map(item => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            onClick={() => setIsMobileTocOpen(false)}
                            className="block py-1 hover:underline"
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Main HTML Article Content */}
              <div
                className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm prose prose-slate max-w-[740px] space-y-4 text-sm sm:text-base leading-[1.75] text-slate-700"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Interactive Vocabulary Callouts Section */}
              {article.relatedVocabulary && article.relatedVocabulary.length > 0 && (
                <div className="bg-indigo-50/70 rounded-3xl p-6 sm:p-8 border border-indigo-100 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📙</span>
                      <h3 className="text-base font-bold text-slate-900">
                        Từ vựng học thuật quan trọng trong bài
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-100">
                      {article.relatedVocabulary.length} từ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {article.relatedVocabulary.map((vocab, vIdx) => {
                      const isSaved = savedWords.has(vocab.word);
                      return (
                        <div
                          key={vIdx}
                          className="bg-white rounded-2xl p-5 border border-indigo-100/80 shadow-sm space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-black text-slate-900">
                                {vocab.word}
                              </h4>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSpeak(vocab.word, 'US')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                  title="Nghe giọng Mỹ"
                                >
                                  🇺🇸 US
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSpeak(vocab.word, 'UK')}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                  title="Nghe giọng Anh"
                                >
                                  🇬🇧 UK
                                </button>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {vocab.ipa}
                            </span>
                            <p className="text-xs font-semibold text-emerald-700 mt-1">
                              {vocab.vietnamese}
                            </p>
                            <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2 rounded-xl">
                              "{vocab.example}"
                            </p>
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => handleSaveWord(vocab)}
                              disabled={isSaved}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                isSaved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                              }`}
                            >
                              <span>{isSaved ? '✓ Đã lưu vào Sổ tay' : '+ Lưu vào Sổ tay'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {article.tags && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-xs font-bold text-slate-400">Tags:</span>
                  {article.tags.map(t => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom In-Article CTA */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-xl">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    ÁP DỤNG NGAY
                  </span>
                  <h3 className="text-xl font-bold">
                    Luyện tập từ vựng bài đọc này với Flashcards SM-2
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Bắt đầu phiên ôn tập ngắt quãng để ghi nhớ toàn bộ từ vựng học thuật một cách bền vững.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => onNavigate('flashcards')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs shadow-md transition-colors"
                  >
                    Mở Flashcards ôn tập ⚡
                  </button>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                  >
                    Vào Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sticky Sidebar Column (Desktop Table of Contents & Related) */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-6">
              {/* Table of Contents Box */}
              {article.toc && article.toc.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>📑</span> Mục lục bài viết
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {article.toc.map(item => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="block text-slate-600 hover:text-indigo-600 hover:font-semibold transition-colors leading-relaxed"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Articles Box */}
              {relatedArticles.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>📰</span> Bài viết liên quan
                  </h4>
                  <div className="space-y-3">
                    {relatedArticles.map(rel => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectArticle(rel.slug)}
                        className="p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors space-y-1"
                      >
                        <span className="text-[10px] font-bold text-indigo-600">{rel.category}</span>
                        <h5 className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-indigo-600 transition-colors">
                          {rel.title}
                        </h5>
                        <span className="text-[10px] text-slate-400">{rel.readingTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      {/* Footer */}
      <PublicFooter onNavigate={onNavigate} onOpenAuth={onOpenAuth} />
    </div>
  );
};

export default ArticleDetail;
