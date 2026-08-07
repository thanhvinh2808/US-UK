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

function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const [stats, setStats] = useState(() => storage.getUserStats());
  const [progress, setProgress] = useState(() => storage.getTopicProgress());
  const [savedVocabCount, setSavedVocabCount] = useState(() => storage.getSavedVocab().length);
  const [topicsList, setTopicsList] = useState(() => sortTopicsByLevel([...contentBank, ...storage.getCustomTopics()]));
  const [theme, setTheme] = useState(() => localStorage.getItem('eng_app_theme') || 'light');
  const [voiceAccent, setVoiceAccent] = useState(() => localStorage.getItem('eng_app_voice_accent') || 'US');
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('eng_app_theme', newTheme);
  };

  const toggleVoiceAccent = () => {
    const newAccent = voiceAccent === 'US' ? 'UK' : 'US';
    setVoiceAccent(newAccent);
    localStorage.setItem('eng_app_voice_accent', newAccent);
    showToast(`Đã đổi giọng đọc mặc định sang ${newAccent === 'US' ? 'Mỹ (en-US) 🇺🇸' : 'Anh (en-GB) 🇬🇧'}`, 'success');
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

  const navMenuItems = [
    { id: 'dashboard', iconType: 'home', label: 'Trang chủ Dashboard' },
    { id: 'alphabet', iconType: 'alphabet', label: 'Bảng chữ cái' },
    { id: 'translator', iconType: 'search', label: 'Tra từ & Dịch AI', badge: 'Ctrl+K' },
    { id: 'notebook', iconType: 'notebook', label: `Sổ tay từ (${savedVocabCount})` },
    { id: 'flashcards', iconType: 'flashcards', label: 'Ôn tập Flashcards' },
    { id: 'minimal_pairs', iconType: 'pairs', label: 'Luyện phát âm Pairs' },
    { id: 'tenses_handbook', iconType: 'tenses', label: '12 Thì Tiếng Anh' },
    { id: 'idioms_handbook', iconType: 'idioms', label: 'Idioms & Cụm từ' },
    { id: 'mini_games', iconType: 'games', label: 'Playzone Mini Games' },
    { id: 'admin', iconType: 'settings', label: 'Quản trị hệ thống' },
  ];

  return (
    <div className="app-layout-dock">
      {/* 🟢 Desktop Left Sidebar Control Dock */}
      <aside className="app-sidebar-dock glass">
        <div className="sidebar-header" onClick={handleBackToDashboard}>
          <div className="brand-logo-pill">
            <span className="brand-icon">V</span>
            <span className="brand-name">V-English</span>
          </div>
          <span className="brand-subtitle">EdTech Learning Studio</span>
        </div>

        {/* Navigation Items (Single Line, Clean Vector SVG Icons) */}
        <nav className="sidebar-nav">
          {navMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`sidebar-nav-item ${activeScreen === item.id ? 'active' : ''}`}
            >
              <span className="nav-item-icon">
                <NavSvgIcon iconType={item.iconType} />
              </span>
              <span className="nav-item-label">{item.label}</span>
              {item.badge && <span className="nav-shortcut-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Utility Controls */}
        <div className="sidebar-footer">
          <div className="sidebar-stats-row">
            <div className="stat-badge-mini" title="Daily Streak">
              Streak: <strong>{stats.streak}d</strong>
            </div>
            <div className="stat-badge-mini" title="Experience Points">
              XP: <strong>{stats.points}</strong>
            </div>
            <div className="stat-badge-mini" title="Level">
              Level: <strong>{stats.level}</strong>
            </div>
          </div>

          <div className="sidebar-actions-row">
            <button 
              className="sidebar-action-btn" 
              onClick={toggleTheme}
              title="Đổi giao diện Sáng / Tối"
            >
              {theme === 'light' ? '🌙 Chế độ tối' : '☀️ Chế độ sáng'}
            </button>

            <button 
              className="sidebar-action-btn" 
              onClick={toggleVoiceAccent}
              title="Đổi giọng phát âm US / UK"
            >
              {voiceAccent === 'US' ? '🇺🇸 Giọng US' : '🇬🇧 Giọng UK'}
            </button>
          </div>
        </div>
      </aside>

      {/* 🔵 Right Workspace Main Content Area */}
      <div className="app-workspace">
        {/* Active Screen Router */}
        <main className="workspace-main">
          {activeScreen === 'dashboard' && (
            <Dashboard 
              stats={stats}
              progress={progress}
              savedVocabCount={savedVocabCount}
              onSelectTopic={handleSelectTopic}
              onNavigate={handleNavigate}
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

          {activeScreen === 'topic_detail' && selectedTopic && (
            <TopicDetail 
              topic={selectedTopic}
              progress={progress}
              onSelectModule={handleSelectModule}
              onNavigateBack={handleBackToDashboard}
            />
          )}

          {activeScreen === 'reader' && selectedTopic && (
            <VocabReader 
              topic={selectedTopic}
              onSavedVocabChange={refreshState}
              onComplete={refreshState}
              onNavigateBack={handleBackToTopicDetail}
              showToast={showToast}
            />
          )}

          {activeScreen === 'dictation' && selectedTopic && (
            <Dictation 
              topic={selectedTopic}
              onNavigateBack={handleBackToTopicDetail}
              showToast={showToast}
            />
          )}

          {activeScreen === 'pronunciation' && selectedTopic && (
            <Pronunciation 
              topic={selectedTopic}
              onNavigateBack={handleBackToTopicDetail}
              showToast={showToast}
            />
          )}

          {activeScreen === 'grammar' && selectedTopic && (
            <GrammarLab
              topic={selectedTopic}
              onComplete={refreshState}
              onNavigateBack={handleBackToTopicDetail}
              showToast={showToast}
            />
          )}

          {activeScreen === 'writing' && selectedTopic && (
            <Writing
              topic={selectedTopic}
              onNavigateBack={handleBackToTopicDetail}
              showToast={showToast}
            />
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
        </main>
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
