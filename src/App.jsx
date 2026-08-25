import React, { useState, useEffect } from 'react';
import { storage } from './utils/storage';
import Dashboard from './components/Dashboard';
import TopicDetail from './components/TopicDetail';
import VocabReader from './components/VocabReader';
import Dictation from './components/Dictation';
import Pronunciation from './components/Pronunciation';
import Flashcards from './components/Flashcards';
import VocabNotebook from './components/VocabNotebook';
import { contentBank } from './data/contentBank';
import { api } from './services/api';
import GrammarLab from './components/GrammarLab';
import Writing from './components/Writing';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import GlobalTranslator from './components/GlobalTranslator';
import TensesHandbook from './components/TensesHandbook';
import MinimalPairs from './components/MinimalPairs';
import Shadowing from './components/Shadowing';
import IdiomsHandbook from './components/IdiomsHandbook';
import MiniGames from './components/MiniGames';
import Alphabet from './components/Alphabet';
import MistakeBank from './components/MistakeBank';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import UserProfileMenu from './components/UserProfileMenu';
import SyncStatus from './components/SyncStatus';
import AccountSettings from './components/AccountSettings';
import SessionManager from './components/SessionManager';
import DataManagement from './components/DataManagement';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/public/LandingPage';
import NewsHub from './components/public/NewsHub';
import ArticleDetail from './components/public/ArticleDetail';
import AppSidebar from './components/AppSidebar';
import { checkLegacyDataExists, runLegacyMigration } from './utils/data/legacyMigration';
import './App.css';

const LEVEL_VALUES = {
  "A1": 1,
  "A2": 2,
  "B1": 3,
  "B2": 4,
  "C1": 5,
  "C2": 6
};

function sortTopicsByLevel(topics) {
  return [...topics].sort((a, b) => {
    const valA = LEVEL_VALUES[a.level] || 1;
    const valB = LEVEL_VALUES[b.level] || 1;
    return valA - valB;
  });
}

// Clean SVG Vector Icons Component for Professional UX
const NavSvgIcon = ({ iconType }) => {
  switch (iconType) {
    case 'home':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'search':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'notebook':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    case 'flashcards':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
    case 'pairs':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
    case 'tenses':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
    case 'idioms':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
    case 'games':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><circle cx="15" cy="11" r="1"/><circle cx="18" cy="13" r="1"/></svg>;
    case 'admin':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'alphabet':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V4"/><path d="M4 12h6"/><path d="M4 4h6a3 3 0 0 1 0 6H4"/><path d="M4 12h6a3 3 0 0 1 0 8H4"/><path d="M15 20l4-16 4 16"/><path d="M16.5 14h5"/></svg>;
    default:
      return null;
  }
};

const navMenuItems = [
  { id: 'dashboard', label: 'Trang chủ', iconType: 'home' },
  { id: 'translator', label: 'Tra từ AI', iconType: 'search' },
  { id: 'notebook', label: 'Sổ tay từ vựng', iconType: 'notebook' },
  { id: 'flashcards', label: 'Flashcards', iconType: 'flashcards' },
  { id: 'minimal_pairs', label: 'Minimal Pairs', iconType: 'pairs' },
  { id: 'tenses_handbook', label: '12 Thì Tiếng Anh', iconType: 'tenses' },
  { id: 'idioms_handbook', label: 'Idioms & Cụm từ', iconType: 'idioms' },
  { id: 'mini_games', label: 'Playzone Games', iconType: 'games' },
  { id: 'alphabet', label: 'Bảng chữ cái', iconType: 'alphabet' },
  { id: 'admin', label: 'Quản trị hệ thống', iconType: 'admin' },
];

function AppContent() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Default activeScreen: check URL hash / path or default to 'landing' for guest/public entry
  const [activeScreen, setActiveScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash === 'app' || hash === 'dashboard') return 'dashboard';
      if (hash === 'news') return 'news';
      if (hash.startsWith('article/')) return 'article_detail';
      if (hash === 'flashcards') return 'flashcards';
      if (hash === 'notebook') return 'notebook';
      if (hash === 'mistakes' || hash === 'mistake_bank') return 'mistake_bank';
      if (hash === 'translator') return 'translator';
      if (hash === 'tenses_handbook') return 'tenses_handbook';
      if (hash === 'idioms_handbook') return 'idioms_handbook';
      if (hash === 'minimal_pairs') return 'minimal_pairs';
      if (hash === 'mini_games') return 'mini_games';
      if (hash === 'alphabet') return 'alphabet';
      if (window.location.pathname.startsWith('/app')) return 'dashboard';
    }
    return 'landing';
  });
  const [selectedArticleSlug, setSelectedArticleSlug] = useState('ielts-reading-spaced-repetition');
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const [stats, setStats] = useState(() => storage.getUserStats());
  const [progress, setProgress] = useState(() => storage.getTopicProgress());
  const [savedVocabCount, setSavedVocabCount] = useState(() => storage.getSavedVocab().length);
  const [topicsList, setTopicsList] = useState(() => sortTopicsByLevel([...contentBank, ...storage.getCustomTopics()]));
  const [voiceAccent, setVoiceAccent] = useState(() => localStorage.getItem('eng_app_voice_accent') || 'US');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  // Synchronize activeScreen with browser hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash === 'landing' || hash === '') {
        setActiveScreen('landing');
      } else if (hash === 'app' || hash === 'dashboard') {
        setActiveScreen('dashboard');
      } else if (hash === 'news') {
        setActiveScreen('news');
      } else if (hash.startsWith('article/')) {
        const slug = hash.replace('article/', '');
        if (slug) setSelectedArticleSlug(slug);
        setActiveScreen('article_detail');
      } else if (hash) {
        setActiveScreen(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Safe automatic legacy storage migration on first mount
  useEffect(() => {
    if (checkLegacyDataExists()) {
      const res = runLegacyMigration();
      if (res.migrated && res.itemsMigrated > 0) {
        setStats(storage.getUserStats());
        setProgress(storage.getTopicProgress());
        setSavedVocabCount(storage.getSavedVocab().length);
        showToast(`Đã chuyển đổi an toàn ${res.itemsMigrated} mục dữ liệu cũ sang hệ thống V2!`, 'success');
      }
    }
  }, []);

  // Keyboard shortcut Ctrl + K / Cmd + K for AI Lexicon Studio
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveScreen('translator');
        showToast('Đã mở Tra từ AI [Ctrl + K]', 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOffline = () => showToast('Mất kết nối mạng. Một số tính năng có thể không hoạt động.', 'error');
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, []);

  useEffect(() => {
    const updatedStats = storage.recordActivity();
    setStats(updatedStats);
    setProgress(storage.getTopicProgress());
    setSavedVocabCount(storage.getSavedVocab().length);

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch real topics from MongoDB API if backend is running
  useEffect(() => {
    async function fetchRealTopics() {
      const serverTopics = await api.getTopics();
      if (serverTopics && Array.isArray(serverTopics) && serverTopics.length > 0) {
        const formattedApiTopics = serverTopics.map(t => ({
          ...t,
          id: t.slugId || t._id
        }));
        setTopicsList(sortTopicsByLevel([...formattedApiTopics, ...storage.getCustomTopics()]));
      }
    }
    fetchRealTopics();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', voiceAccent);
    localStorage.setItem('eng_app_voice_accent', voiceAccent);
  }, [voiceAccent]);

  const toggleVoiceAccent = () => {
    const newAccent = voiceAccent === 'US' ? 'UK' : 'US';
    setVoiceAccent(newAccent);
    localStorage.setItem('eng_app_voice_accent', newAccent);
    showToast(`Đã xoay núm đổi kênh giọng đọc sang ${newAccent === 'US' ? 'Giọng Mỹ (en-US) 🇺🇸' : 'Giọng Anh BBC (en-GB) 🇬🇧'}`, 'success');
  };

  const refreshState = () => {
    setStats(storage.getUserStats());
    setProgress(storage.getTopicProgress());
    setSavedVocabCount(storage.getSavedVocab().length);
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setActiveScreen('topic_detail');
  };

  const handleSelectModule = (moduleId) => {
    setActiveScreen(moduleId);
  };

  const handleBackToDashboard = () => {
    setSelectedTopic(null);
    handleNavigate('dashboard');
  };

  const handleBackToTopicDetail = () => {
    setActiveScreen('topic_detail');
  };

  const handleNavigate = (screenId) => {
    setSelectedTopic(null);
    setActiveScreen(screenId);
    if (typeof window !== 'undefined') {
      if (screenId === 'landing') {
        window.location.hash = '';
      } else if (screenId === 'dashboard') {
        window.location.hash = 'app';
      } else if (screenId === 'news') {
        window.location.hash = 'news';
      } else if (screenId === 'article_detail') {
        window.location.hash = `article/${selectedArticleSlug}`;
      } else {
        window.location.hash = screenId;
      }
    }
  };

  const handleNavigateWithClose = (screenId) => {
    handleNavigate(screenId);
    setIsMobileMenuOpen(false);
  };

  const refreshTopicsList = () => {
    setTopicsList(sortTopicsByLevel([...contentBank, ...storage.getCustomTopics()]));
  };

  // Is current screen in Public Marketing mode?
  const isPublicScreen = activeScreen === 'landing' || activeScreen === 'news' || activeScreen === 'article_detail';

  return (
    <div className="quizlet-app">
      {/* 🚀 Render Public Marketing Website Pages if in Public Mode */}
      {activeScreen === 'landing' && (
        <LandingPage
          onNavigate={handleNavigateWithClose}
          onOpenAuth={openAuthModal}
          voiceAccent={voiceAccent}
          onToggleVoiceAccent={toggleVoiceAccent}
        />
      )}

      {activeScreen === 'news' && (
        <NewsHub
          onNavigate={handleNavigateWithClose}
          onOpenAuth={openAuthModal}
          onSelectArticle={(slug) => {
            setSelectedArticleSlug(slug);
            setActiveScreen('article_detail');
          }}
          voiceAccent={voiceAccent}
          onToggleVoiceAccent={toggleVoiceAccent}
        />
      )}

      {activeScreen === 'article_detail' && (
        <ArticleDetail
          slug={selectedArticleSlug}
          onNavigate={handleNavigateWithClose}
          onOpenAuth={openAuthModal}
          onSelectArticle={(slug) => {
            setSelectedArticleSlug(slug);
            setActiveScreen('article_detail');
          }}
          showToast={showToast}
          voiceAccent={voiceAccent}
          onToggleVoiceAccent={toggleVoiceAccent}
        />
      )}

      {/* 🏛️ Render Authenticated Learning Workspace Layout when in App Mode */}
      {!isPublicScreen && (
        <>
          {/* Top Modern Header */}
          <header className="qz-header-fixed">
            <div className="qz-header-container">
              {/* Brand Logo & Wordmark */}
              <div 
                className="qz-brand cursor-pointer select-none" 
                onClick={() => handleNavigateWithClose('dashboard')}
                title="Về Trang chủ Workspace"
              >
                <div className="qz-logo-badge font-black">
                  V
                </div>
                <div className="flex flex-col">
                  <span className="qz-logo-text">V-English</span>
                  <span className="text-[9px] font-semibold text-indigo-500 uppercase tracking-widest hidden sm:inline -mt-1">
                    v2.0 Workspace
                  </span>
                </div>
              </div>

              {/* Analog Radio Dual-Dial Voice Knob */}
              <div className="qz-voice-tuner" onClick={toggleVoiceAccent} title="Nhấn để chuyển giọng Anh / Mỹ">
                <div className={`qz-tuner-knob ${voiceAccent === 'UK' ? 'pos-uk' : 'pos-us'}`}>
                  <div className="qz-knob-notch" />
                </div>
                <div className="qz-tuner-display">
                  <span className={`qz-tuner-freq ${voiceAccent === 'US' ? 'active-us' : ''}`}>98.6 US</span>
                  <span className="qz-tuner-sep">|</span>
                  <span className={`qz-tuner-freq ${voiceAccent === 'UK' ? 'active-uk' : ''}`}>104.2 UK</span>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="qz-nav-links">
                <button
                  className={`qz-nav-item ${activeScreen === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavigateWithClose('dashboard')}
                >
                  Trang chủ
                </button>
                <button
                  className={`qz-nav-item ${activeScreen === 'flashcards' ? 'active' : ''}`}
                  onClick={() => handleNavigateWithClose('flashcards')}
                >
                  Flashcards
                </button>
                <button
                  className={`qz-nav-item ${activeScreen === 'notebook' ? 'active' : ''}`}
                  onClick={() => handleNavigateWithClose('notebook')}
                >
                  Sổ tay
                </button>
                <button
                  className="qz-nav-item"
                  onClick={() => handleNavigateWithClose('news')}
                >
                  Tin tức & Mẹo
                </button>

                {/* Explore Dropdown */}
                <div className="qz-nav-dropdown-wrapper">
                  <button className="qz-nav-item qz-dropdown-trigger">
                    Chức năng ▾
                  </button>
                  <div className="qz-dropdown-menu">
                    <div className="qz-dropdown-label">⚡ HỌC TẬP & TỪ VỰNG</div>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('dashboard')}>
                      📚 Thư viện chủ đề
                    </button>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('flashcards')}>
                      ⚡ Flashcards Spaced Repetition
                    </button>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('notebook')}>
                      📙 Sổ tay từ vựng
                    </button>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('mistake_bank')}>
                      📌 Ngân hàng câu sai
                    </button>

                    <div className="qz-dropdown-label mt-2">🎙️ PHÁT ÂM & AI</div>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('translator')}>
                      🔍 Tra từ AI [Ctrl+K]
                    </button>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('minimal_pairs')}>
                      🎙️ Luyện phát âm Minimal Pairs
                    </button>

                    <div className="qz-dropdown-label mt-2">📘 NGỮ PHÁP & CỤM TỪ</div>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('tenses_handbook')}>
                      📖 12 Thì Tiếng Anh
                    </button>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('idioms_handbook')}>
                      💡 Idioms & Cụm từ thông dụng
                    </button>

                    <div className="qz-dropdown-label mt-2">🎮 KHÁC</div>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('landing')}>
                      ✨ Trang giới thiệu Public
                    </button>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('mini_games')}>
                      🕹️ Playzone Mini Games
                    </button>
                    <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('alphabet')}>
                      🔤 Bảng chữ cái US-UK
                    </button>
                    {isAdmin && (
                      <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('admin')}>
                        ⚙️ Quản trị hệ thống
                      </button>
                    )}
                  </div>
                </div>
              </nav>

              {/* User Actions & Stats */}
              <div className="qz-user-actions">
                <div className="qz-stat-pill streak" title="Streak ngày">
                  🔥 {stats.streak}d
                </div>
                <div className="qz-stat-pill xp" title="Điểm XP">
                  ⭐ {stats.points} XP
                </div>

                {/* Online / Offline / Sync Status Badge */}
                <SyncStatus />

                {/* Auth State: User Profile or Login Button */}
                {isAuthenticated ? (
                  <UserProfileMenu
                    onNavigate={handleNavigateWithClose}
                    showToast={showToast}
                    voiceAccent={voiceAccent}
                    onToggleVoiceAccent={toggleVoiceAccent}
                    onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
                    onOpenSessionManager={() => setIsSessionManagerOpen(true)}
                    onOpenDataManagement={() => setIsDataManagementOpen(true)}
                  />
                ) : (
                  <button
                    type="button"
                    className="qz-auth-btn"
                    onClick={() => openAuthModal('login')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>👤 Đăng nhập</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* 🏛️ Main Content Workspace Layout with Responsive 2-Column Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 items-start">
              {/* Left Column: Dedicated App Sidebar (Sticky on Desktop) */}
              <aside className="hidden lg:block sticky top-24">
                <AppSidebar
                  activeScreen={activeScreen}
                  onNavigate={handleNavigateWithClose}
                  isAdmin={isAdmin}
                  stats={stats}
                />
              </aside>

              {/* Right Column: App Screen Content */}
              <main className="min-w-0 w-full">
                {activeScreen === 'dashboard' && (
                  <Dashboard 
                    stats={stats}
                    progress={progress}
                    savedVocabCount={savedVocabCount}
                    onSelectTopic={handleSelectTopic}
                    onNavigate={handleNavigateWithClose}
                    topics={topicsList}
                  />
                )}

                {activeScreen === 'translator' && (
                  <GlobalTranslator 
                    isPageMode={true}
                    onNavigateBack={handleBackToDashboard}
                    onSavedVocabChange={refreshState}
                    showToast={showToast}
                  />
                )}

                {activeScreen === 'admin' && (
                  <AdminPanel 
                    onNavigateBack={handleBackToDashboard}
                    onTopicsListChange={refreshTopicsList}
                    onOpenAuthModal={openAuthModal}
                  />
                )}

                {activeScreen === 'topic_detail' && (
                  selectedTopic ? (
                    <TopicDetail 
                      topic={selectedTopic}
                      progress={progress}
                      onSelectModule={handleSelectModule}
                      onNavigateBack={handleBackToDashboard}
                    />
                  ) : (
                    <Dashboard 
                      topicsList={topicsList}
                      progress={progress}
                      savedVocabCount={savedVocabCount}
                      onSelectTopic={handleSelectTopic}
                      onNavigate={handleNavigateWithClose}
                    />
                  )
                )}

                {activeScreen === 'vocab_reader' && (
                  (selectedTopic || topicsList[0]) ? (
                    <VocabReader 
                      topic={selectedTopic || topicsList[0]}
                      onSavedVocabChange={refreshState}
                      onComplete={refreshState}
                      onNavigateBack={handleBackToTopicDetail}
                      showToast={showToast}
                    />
                  ) : null
                )}

                {activeScreen === 'dictation' && (
                  (selectedTopic || topicsList[0]) ? (
                    <Dictation 
                      topic={selectedTopic || topicsList[0]}
                      onNavigateBack={handleBackToTopicDetail}
                      showToast={showToast}
                    />
                  ) : null
                )}

                {activeScreen === 'pronunciation' && (
                  (selectedTopic || topicsList[0]) ? (
                    <Pronunciation 
                      topic={selectedTopic || topicsList[0]}
                      onNavigateBack={handleBackToTopicDetail}
                      showToast={showToast}
                    />
                  ) : null
                )}

                {activeScreen === 'grammar' && (
                  (selectedTopic || topicsList[0]) ? (
                    <GrammarLab
                      topic={selectedTopic || topicsList[0]}
                      onComplete={refreshState}
                      onNavigateBack={handleBackToTopicDetail}
                      showToast={showToast}
                    />
                  ) : null
                )}

                {activeScreen === 'writing' && (
                  (selectedTopic || topicsList[0]) ? (
                    <Writing
                      topic={selectedTopic || topicsList[0]}
                      onNavigateBack={handleBackToTopicDetail}
                      showToast={showToast}
                    />
                  ) : null
                )}

                {activeScreen === 'flashcards' && (
                  <Flashcards 
                    onNavigateBack={handleBackToDashboard}
                    onSavedVocabChange={refreshState}
                    showToast={showToast}
                  />
                )}

                {activeScreen === 'notebook' && (
                  <VocabNotebook 
                    onNavigateBack={handleBackToDashboard}
                    onSavedVocabChange={refreshState}
                    showToast={showToast}
                  />
                )}

                {activeScreen === 'alphabet' && (
                  <Alphabet 
                    onNavigateBack={handleBackToDashboard}
                  />
                )}

                {activeScreen === 'tenses_handbook' && (
                  <TensesHandbook 
                    onNavigateBack={handleBackToDashboard}
                  />
                )}

                {activeScreen === 'minimal_pairs' && (
                  <MinimalPairs 
                    onNavigateBack={handleBackToDashboard}
                  />
                )}

                {activeScreen === 'shadowing' && selectedTopic && (
                  <Shadowing 
                    topic={selectedTopic}
                    onNavigateBack={handleBackToTopicDetail}
                    showToast={showToast}
                  />
                )}

                {activeScreen === 'idioms_handbook' && (
                  <IdiomsHandbook 
                    onNavigateBack={handleBackToDashboard}
                  />
                )}

                {activeScreen === 'mini_games' && (
                  <MiniGames 
                    onNavigateBack={handleBackToDashboard}
                    showToast={showToast}
                  />
                )}

                {activeScreen === 'mistake_bank' && (
                  <MistakeBank 
                    onNavigateBack={handleBackToDashboard}
                  />
                )}
              </main>
            </div>
          </div>

          {/* 📱 Mobile Bottom Sheet Modal Menu */}
          {isMobileMenuOpen && (
            <div className="mobile-sheet-overlay" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="mobile-sheet-content glass animate-slideup" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-sheet-handle-bar" />
                <div className="mobile-sheet-header">
                  <h3 className="mobile-sheet-title">Dịch vụ & Chức năng</h3>
                  <button className="mobile-sheet-close" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
                </div>

                <div className="mobile-sheet-grid">
                  {navMenuItems.map((item) => (
                    <button
                      key={item.id}
                      className={`mobile-grid-card ${activeScreen === item.id ? 'active' : ''}`}
                      onClick={() => handleNavigateWithClose(item.id)}
                    >
                      <span className="mobile-card-icon">
                        <NavSvgIcon iconType={item.iconType} />
                      </span>
                      <span className="mobile-card-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 📱 Native Mobile Bottom Navigation Bar */}
          <nav className="mobile-bottom-bar glass">
            <button
              className={`mobile-tab-btn ${activeScreen === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigateWithClose('dashboard')}
            >
              <NavSvgIcon iconType="home" />
              <span>Trang chủ</span>
            </button>

            <button
              className={`mobile-tab-btn ${activeScreen === 'translator' ? 'active' : ''}`}
              onClick={() => handleNavigateWithClose('translator')}
            >
              <NavSvgIcon iconType="search" />
              <span>Tra từ</span>
            </button>

            <button
              className={`mobile-tab-btn ${activeScreen === 'flashcards' ? 'active' : ''}`}
              onClick={() => handleNavigateWithClose('flashcards')}
            >
              <NavSvgIcon iconType="flashcards" />
              <span>Flashcards</span>
            </button>

            <button
              className={`mobile-tab-btn ${activeScreen === 'notebook' ? 'active' : ''}`}
              onClick={() => handleNavigateWithClose('notebook')}
            >
              <NavSvgIcon iconType="notebook" />
              <span>Sổ tay</span>
            </button>

            <button
              className="mobile-tab-btn"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              <span>Menu</span>
            </button>
          </nav>
        </>
      )}

      {/* Global Modals */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => handleNavigate('dashboard')}
          showToast={showToast}
        />
      )}

      {isAccountSettingsOpen && (
        <AccountSettings
          isOpen={isAccountSettingsOpen}
          onClose={() => setIsAccountSettingsOpen(false)}
          showToast={showToast}
        />
      )}

      {isSessionManagerOpen && (
        <SessionManager
          isOpen={isSessionManagerOpen}
          onClose={() => setIsSessionManagerOpen(false)}
          showToast={showToast}
        />
      )}

      {isDataManagementOpen && (
        <DataManagement
          isOpen={isDataManagementOpen}
          onClose={() => setIsDataManagementOpen(false)}
          showToast={showToast}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
