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

function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const [stats, setStats] = useState(() => storage.getUserStats());
  const [progress, setProgress] = useState(() => storage.getTopicProgress());
  const [savedVocabCount, setSavedVocabCount] = useState(() => storage.getSavedVocab().length);
  const [topicsList, setTopicsList] = useState(() => sortTopicsByLevel([...contentBank, ...storage.getCustomTopics()]));
  const [voiceAccent, setVoiceAccent] = useState(() => localStorage.getItem('eng_app_voice_accent') || 'US');
  const [designTheme, setDesignTheme] = useState(() => localStorage.getItem('eng_app_design_theme') || 'modern');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

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

  const theme = 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', designTheme);
    document.documentElement.setAttribute('data-accent', voiceAccent);
    localStorage.setItem('eng_app_theme', 'light');
    localStorage.setItem('eng_app_design_theme', designTheme);
  }, [voiceAccent, designTheme]);

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

  const refreshTopicsList = () => {
    setTopicsList(sortTopicsByLevel([...contentBank, ...storage.getCustomTopics()]));
    refreshState();
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setActiveScreen('topic_detail');
    setIsMobileMenuOpen(false);
  };

  const handleSelectModule = (moduleKey) => {
    setActiveScreen(moduleKey);
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = (screenKey) => {
    setActiveScreen(screenKey);
    setIsMobileMenuOpen(false);
  };

  const handleBackToDashboard = () => {
    refreshState();
    setActiveScreen('dashboard');
    setIsMobileMenuOpen(false);
  };

  const handleBackToTopicDetail = () => {
    refreshState();
    setActiveScreen('topic_detail');
    setIsMobileMenuOpen(false);
  };

  const calculateLevel = (points) => {
    if (points >= 1000) return 'B2';
    if (points >= 500) return 'B1';
    if (points >= 150) return 'A2';
    return 'A1';
  };

  useEffect(() => {
    const expectedLevel = calculateLevel(stats.points);
    if (expectedLevel !== stats.level) {
      storage.updateUserStats({ level: expectedLevel });
      setStats(prev => ({ ...prev, level: expectedLevel }));
    }
  }, [stats.points]);

  const [isExploreOpen, setIsExploreOpen] = useState(false);

  const handleNavigateWithClose = (screenKey) => {
    setActiveScreen(screenKey);
    setIsMobileMenuOpen(false);
    setIsExploreOpen(false);
  };

  return (
    <div className={`quizlet-app-layout accent-${voiceAccent.toLowerCase()}`}>
      {/* 📻 US-UK Dual Tone Header */}
      <header className="qz-header">
        <div className="qz-header-container">
          {/* Logo */}
          <div className="qz-brand" onClick={() => handleNavigateWithClose('dashboard')}>
            <div className="qz-logo-badge-dual">
              <span className="brand-uk">UK</span>
              <span className="brand-divider">/</span>
              <span className="brand-us">US</span>
            </div>
            <div className="qz-brand-text">
              <span className="qz-brand-title">Antigravity English</span>
            </div>
          </div>

          {/* 📻 COMPACT ANALOG RADIO DIAL SWITCHER (US ⇄ UK) */}
          <div 
            className="radio-dial-widget" 
            onClick={toggleVoiceAccent}
            title={`Kênh phát âm: ${voiceAccent === 'UK' ? '🇬🇧 Oxford BBC (98.5 MHz)' : '🇺🇸 Voice US (104.2 MHz)'} - Nhấp để xoay núm vặn`}
          >
            <div className={`radio-dial-knob-wrapper ${voiceAccent.toLowerCase()}`}>
              <div className="radio-knob-outer">
                <div className="radio-knob-line"></div>
              </div>
            </div>
            <span className={`channel-pill ${voiceAccent.toLowerCase()} active`}>
              {voiceAccent === 'UK' ? '🇬🇧 UK' : '🇺🇸 US'}
            </span>
          </div>

          <div className="design-theme-switcher" aria-label="Chọn giao diện">
            {[
              { key: 'modern', label: 'Modern' },
              { key: 'minimal', label: 'Minimal' },
              { key: 'glass', label: 'Glass' }
            ].map(option => (
              <button
                key={option.key}
                type="button"
                className={`design-theme-option ${designTheme === option.key ? 'active' : ''}`}
                onClick={() => setDesignTheme(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Clean Navigation Links */}
          <nav className="qz-nav-links">
            <button 
              className={`qz-nav-link ${activeScreen === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigateWithClose('dashboard')}
            >
              Trang chủ
            </button>
            <button 
              className={`qz-nav-link ${activeScreen === 'flashcards' ? 'active' : ''}`}
              onClick={() => handleNavigateWithClose('flashcards')}
            >
              Flashcards
            </button>

            {/* 🎯 Dropdown Option Select Menu */}
            <div className="qz-dropdown-wrapper">
              <button 
                className="qz-nav-link dropdown-trigger"
                onClick={() => setIsExploreOpen(!isExploreOpen)}
              >
                Chủ đề & Chức năng ▾
              </button>

              {isExploreOpen && (
                <div className="qz-dropdown-menu">
                  <div className="qz-dropdown-label">🎓 TÀI LIỆU HỌC TẬP</div>
                  <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('dashboard')}>
                    🏠 Trang chủ Dashboard
                  </button>
                  <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('flashcards')}>
                    ⚡ Ôn tập Flashcards (Leitner)
                  </button>
                  <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('notebook')}>
                    📙 Sổ tay từ vựng ({savedVocabCount})
                  </button>
                  <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('mistake_bank')}>
                    📌 Ngân hàng câu sai
                  </button>

                  <div className="qz-dropdown-label mt-2">🤖 CÔNG CỤ AI</div>
                  <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('translator')}>
                    🔍 Tra từ & Dịch AI Gemini [Ctrl+K]
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
                  <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('mini_games')}>
                    🕹️ Playzone Mini Games
                  </button>
                  <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('alphabet')}>
                    🔤 Bảng chữ cái US-UK
                  </button>
                  <button className="qz-dropdown-item" onClick={() => handleNavigateWithClose('admin')}>
                    ⚙️ Quản trị hệ thống
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* User Actions & Stats */}
          <div className="qz-user-actions">
            <button className="qz-create-btn" onClick={() => handleNavigateWithClose('admin')}>
              + Tạo bài
            </button>
            <div className="qz-stat-pill streak" title="Streak ngày">
              🔥 {stats.streak}d
            </div>
            <div className="qz-stat-pill xp" title="Điểm XP">
              ⭐ {stats.points} XP
            </div>
          </div>
        </div>
      </header>

      {/* ⚪ Main Content Area */}
      <main className="quizlet-workspace">
        <div className="quizlet-spacious-container">
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
                onOpenGlobalTranslator={() => setActiveScreen('translator')}
                onOpenNotebook={() => setActiveScreen('notebook')}
                onOpenFlashcards={() => setActiveScreen('flashcards')}
                onOpenMinimalPairs={() => setActiveScreen('minimal_pairs')}
                onOpenTensesHandbook={() => setActiveScreen('tenses_handbook')}
                onOpenIdiomsHandbook={() => setActiveScreen('idioms_handbook')}
                onOpenMiniGames={() => setActiveScreen('mini_games')}
                onOpenAlphabet={() => setActiveScreen('alphabet')}
              />
            )
          )}

          {activeScreen === 'reader' && (
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
        </div>
      </main>

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
                  onClick={() => handleNavigate(item.id)}
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
          className={`mobile-bottom-item ${activeScreen === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigate('dashboard')}
        >
          <span className="bottom-item-icon">
            <NavSvgIcon iconType="home" />
          </span>
          <span className="bottom-item-text">Trang chủ</span>
        </button>

        <button 
          className={`mobile-bottom-item ${activeScreen === 'translator' ? 'active' : ''}`}
          onClick={() => handleNavigate('translator')}
        >
          <span className="bottom-item-icon">
            <NavSvgIcon iconType="search" />
          </span>
          <span className="bottom-item-text">Tra từ AI</span>
        </button>

        <button 
          className={`mobile-bottom-item ${activeScreen === 'notebook' ? 'active' : ''}`}
          onClick={() => handleNavigate('notebook')}
        >
          <span className="bottom-item-icon">
            <NavSvgIcon iconType="notebook" />
          </span>
          <span className="bottom-item-text">Sổ tay</span>
        </button>

        <button 
          className={`mobile-bottom-item ${activeScreen === 'flashcards' ? 'active' : ''}`}
          onClick={() => handleNavigate('flashcards')}
        >
          <span className="bottom-item-icon">
            <NavSvgIcon iconType="flashcards" />
          </span>
          <span className="bottom-item-text">Flashcards</span>
        </button>

        <button 
          className={`mobile-bottom-item ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="bottom-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </span>
          <span className="bottom-item-text">Menu</span>
        </button>
      </nav>

      {/* Toast Notification Container */}
      {toast && (
        <Toast 
          key={toast.id} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

export default App;
