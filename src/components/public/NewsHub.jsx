import React, { useState, useMemo } from 'react';
import { newsArticles } from '../../data/newsArticles';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

export const NewsHub = ({
  onNavigate,
  onOpenAuth,
  onSelectArticle,
  voiceAccent = 'US',
  onToggleVoiceAccent
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useScrollReveal([selectedCategory, searchQuery]);

  const categories = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'IELTS Tips', label: 'IELTS Tips' },
    { id: 'Pronunciation', label: 'Phát âm US/UK' },
    { id: 'Grammar', label: 'Ngữ pháp' },
    { id: 'V-English News', label: 'Cập nhật V-English' }
  ];

  const filteredArticles = useMemo(() => {
    return newsArticles.filter(art => {
      const matchCategory = selectedCategory === 'ALL' || art.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.tags && art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const featuredArticle = newsArticles[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <PublicNavbar
        activeScreen="news"
        onNavigate={onNavigate}
        onOpenAuth={onOpenAuth}
        voiceAccent={voiceAccent}
        onToggleVoiceAccent={onToggleVoiceAccent}
      />

      {/* Header Banner */}
      <section className="pt-32 pb-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            V-ENGLISH ACADEMY & NEWS
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Tin tức, Mẹo học & Phương pháp Spaced Repetition
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Tổng hợp các bài viết học thuật chuyên sâu về IELTS, ngữ âm US/UK, cẩm nang 12 thì và khoa học ghi nhớ từ vựng.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-lg mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết, chủ đề (ví dụ: IELTS, SM-2, Thì, Phát âm)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 text-sm shadow-sm"
              />
              <span className="absolute left-4 top-3.5 text-slate-400 text-base">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Featured Article Card (When no search filter) */}
          {selectedCategory === 'ALL' && !searchQuery && featuredArticle && (
            <div
              onClick={() => onSelectArticle(featuredArticle.slug)}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-xl transition-all cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-8 items-center reveal-init group"
            >
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                    ⭐ Bài viết tiêu điểm
                  </span>
                  <span className="text-xs text-slate-400">• {featuredArticle.readingTime}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {featuredArticle.title}
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">
                    {featuredArticle.author.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{featuredArticle.author.name}</p>
                    <p className="text-[10px] text-slate-400">{featuredArticle.author.role}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white text-center flex flex-col justify-center items-center min-h-[180px] space-y-2">
                <span className="text-3xl">📚</span>
                <span className="text-sm font-bold">Đọc ngay bài viết</span>
                <span className="text-xs text-indigo-100 group-hover:translate-x-1 transition-transform">Nhấp để xem chi tiết →</span>
              </div>
            </div>
          )}

          {/* Articles Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {selectedCategory === 'ALL' ? 'Tất cả bài viết' : `Chuyên mục: ${selectedCategory}`}
              </h3>
              <span className="text-xs text-slate-500">
                {filteredArticles.length} bài viết
              </span>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
                <span className="text-4xl">🔍</span>
                <h4 className="text-base font-bold text-slate-800">Không tìm thấy bài viết phù hợp</h4>
                <p className="text-xs text-slate-500">Vui lòng thử lại với từ khóa khác hoặc chuyển chuyên mục.</p>
                <button
                  onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((art, idx) => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art.slug)}
                    className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between reveal-init group"
                    style={{ transitionDelay: `${idx * 60}ms` }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          art.categoryColor === 'indigo' ? 'bg-indigo-50 text-indigo-700' :
                          art.categoryColor === 'blue' ? 'bg-blue-50 text-blue-700' :
                          art.categoryColor === 'amber' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          {art.category}
                        </span>
                        <span className="text-slate-400 text-[11px]">{art.readingTime}</span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                        {art.title}
                      </h4>

                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{art.author.avatar}</span>
                        <span className="font-semibold text-slate-700 text-[11px]">{art.author.name}</span>
                      </div>
                      <span className="font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                        Đọc →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <PublicFooter onNavigate={onNavigate} onOpenAuth={onOpenAuth} />
    </div>
  );
};

export default NewsHub;
