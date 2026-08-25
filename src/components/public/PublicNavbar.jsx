import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export const PublicNavbar = ({
  activeScreen,
  onNavigate,
  onOpenAuth,
  voiceAccent = 'US',
  onToggleVoiceAccent
}) => {
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleNavClick = (screenKey, hash = null) => {
    setIsMobileMenuOpen(false);
    if (hash && activeScreen === 'landing') {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    onNavigate(screenKey);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3'
          : 'bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            V
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                V-English
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200/60">
                v2.0
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-500 hidden sm:inline -mt-0.5">
              Learn. Practice. Improve.
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => handleNavClick('landing')}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeScreen === 'landing'
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => handleNavClick('landing', 'features')}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Tính năng
          </button>
          <button
            onClick={() => handleNavClick('landing', 'science')}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
          >
            Phương pháp SM-2
          </button>
          <button
            onClick={() => handleNavClick('news')}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeScreen === 'news' || activeScreen === 'article_detail'
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            Tin tức & Bài viết
          </button>
          <button
            onClick={() => handleNavClick('dashboard')}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors flex items-center gap-1.5"
          >
            <span>🚀</span> Ứng dụng học
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Accent Switcher */}
          {onToggleVoiceAccent && (
            <button
              onClick={onToggleVoiceAccent}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
              title="Đổi giọng đọc US / UK"
            >
              <span>{voiceAccent === 'UK' ? '🇬🇧 UK' : '🇺🇸 US'}</span>
            </button>
          )}

          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <span>Vào ứng dụng học</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-sm font-bold transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all"
              >
                Bắt đầu học miễn phí
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Mở menu điều hướng"
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-fadeIn">
          <div className="space-y-1">
            <button
              onClick={() => handleNavClick('landing')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              🏠 Trang chủ
            </button>
            <button
              onClick={() => handleNavClick('landing', 'features')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ⚡ Tính năng nổi bật
            </button>
            <button
              onClick={() => handleNavClick('landing', 'science')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              🧠 Phương pháp SM-2
            </button>
            <button
              onClick={() => handleNavClick('news')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              📰 Tin tức & Bài viết
            </button>
            <button
              onClick={() => handleNavClick('dashboard')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
              🚀 Mở Workspace học tập
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('dashboard');
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm text-center shadow-md shadow-indigo-500/20"
              >
                Tiếp tục học ({user?.username})
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20"
                >
                  Bắt đầu học miễn phí
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
