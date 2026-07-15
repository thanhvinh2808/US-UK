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
import GrammarLab from './components/GrammarLab';
import Writing from './components/Writing';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import GlobalTranslator from './components/GlobalTranslator';
import TensesHandbook from './components/TensesHandbook';
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
    return valA - valB; // Low to high
  });
}

function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard'); // dashboard, topic_detail, reader, dictation, pronunciation, flashcards, notebook
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const [stats, setStats] = useState(() => storage.getUserStats());
  const [progress, setProgress] = useState(() => storage.getTopicProgress());
  const [savedVocabCount, setSavedVocabCount] = useState(() => storage.getSavedVocab().length);
  const [topicsList, setTopicsList] = useState(() => sortTopicsByLevel([...contentBank, ...storage.getCustomTopics()]));
  const [theme, setTheme] = useState(() => localStorage.getItem('eng_app_theme') || 'light');
  
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  // Check network status
  useEffect(() => {
    const handleOffline = () => showToast('Mất kết nối mạng. Một số tính năng có thể không hoạt động.', 'error');
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, []);

  // Initialize and track daily activity
  useEffect(() => {
    const updatedStats = storage.recordActivity();
    setStats(updatedStats);
    setProgress(storage.getTopicProgress());
    setSavedVocabCount(storage.getSavedVocab().length);
  }, []);

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('eng_app_theme', newTheme);
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
  };

  const handleSelectModule = (moduleKey) => {
    setActiveScreen(moduleKey);
  };

  const handleNavigate = (screenKey) => {
    setActiveScreen(screenKey);
  };

  const handleBackToDashboard = () => {
    refreshState();
    setActiveScreen('dashboard');
  };

  const handleBackToTopicDetail = () => {
    refreshState();
    setActiveScreen('topic_detail');
  };

  // Determine user level letter based on experience points
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

  return (
    <div className="app-container">
      {/* Sleek Glassmorphism Topbar */}
      <header className="app-topbar glass mb-8">
        <div className="logo-container" onClick={handleBackToDashboard}>
          <span className="logo-text text-gradient" style={{ fontWeight: '800', letterSpacing: '-0.03em' }}>V-English</span>
        </div>

        <div className="user-status-bar">
          <button 
            className="btn-secondary" 
            onClick={toggleTheme}
            title="Chuyển chế độ sáng/tối"
            style={{ 
              padding: '6px 12px', 
              fontSize: '14px', 
              borderRadius: 'var(--radius-sm)',
              borderColor: 'var(--border-glow)',
              background: 'rgba(245, 158, 11, 0.05)',
              cursor: 'pointer'
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => handleNavigate('admin')}
            style={{ 
              padding: '6px 12px', 
              fontSize: '13px', 
              borderRadius: 'var(--radius-sm)',
              borderColor: 'var(--border-glow)',
              background: 'rgba(168, 85, 247, 0.05)'
            }}
          >
            Admin
          </button>
          <div className="status-badge streak" title="Daily study streak">
            Streak: {stats.streak} Days
          </div>
          <div className="status-badge xp" title="Experience Points">
            {stats.points} XP
          </div>
          <div className="status-badge" title="Current Level">
            Level {stats.level}
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="app-main-content">
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

        {activeScreen === 'tenses_handbook' && (
          <TensesHandbook 
            onNavigateBack={handleBackToDashboard}
          />
        )}
      </main>
      
      {/* Global Dictionary/Translation Floating Widget */}
      <GlobalTranslator 
        onSavedVocabChange={refreshState} 
        showToast={showToast} 
      />

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
