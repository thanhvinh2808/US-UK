import React from 'react';
import { contentBank } from '../data/contentBank';
import { storage } from '../utils/storage';

const LEVEL_VALUES = {
  "A1": 1,
  "A2": 2,
  "B1": 3,
  "B2": 4,
  "C1": 5,
  "C2": 6
};

export default function Dashboard({ stats, progress, savedVocabCount, onSelectTopic, onNavigate, topics = [] }) {
  // Calculate review items due for today using storage utility
  const now = Date.now();
  const reviewsDue = stats ? storage.getSavedVocab()
    .filter(item => !item.nextReviewDate || new Date(item.nextReviewDate) <= now).length : 0;

  return (
    <div className="dashboard animate-slideup">
      {/* Header section */}
      <div className="dashboard-header glass p-6 mb-8">
        <div>
          <h1 className="glow-text text-gradient">Welcome back, Language Learner!</h1>
          <p className="color-text-muted mt-2">Ready to level up your English skills today? Choose a topic below or review your vocabulary.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={() => onNavigate('flashcards')}
            disabled={reviewsDue === 0}
            style={{ 
              background: reviewsDue > 0 ? 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)' : 'rgba(255,255,255,0.05)',
              boxShadow: reviewsDue > 0 ? '0 0 20px rgba(6, 182, 212, 0.4)' : 'none'
            }}
          >
            Review Cards {reviewsDue > 0 && <span className="badge-count">{reviewsDue}</span>}
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('notebook')}>
            Notebook ({savedVocabCount})
          </button>
          <button 
            className="btn-secondary flex items-center gap-1" 
            onClick={() => onNavigate('tenses_handbook')}
            style={{ 
              border: '1px solid var(--color-primary)', 
              background: 'rgba(59, 130, 246, 0.08)',
              color: 'var(--color-primary)'
            }}
          >
            📚 12 Thì Tiếng Anh
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid mb-8">
        <div className="stat-card glass-glow p-5">
          <div className="stat-info">
            <h3>{stats.streak} Days</h3>
            <p>Daily Streak</p>
          </div>
        </div>
        <div className="stat-card glass p-5">
          <div className="stat-info">
            <h3>{stats.points} XP</h3>
            <p>Total Experience Points</p>
          </div>
        </div>
        <div className="stat-card glass p-5">
          <div className="stat-info">
            <h3>{savedVocabCount} Words</h3>
            <p>Saved in Notebook</p>
          </div>
        </div>
        <div className="stat-card glass p-5">
          <div className="stat-info">
            <h3>{stats.completedModules}</h3>
            <p>Modules Completed</p>
          </div>
        </div>
      </div>

      {/* Topic List */}
      <h2 className="section-title mb-6">Learning Path</h2>
      <div className="topics-grid">
        {topics.map((topic) => {
          const topicProg = progress[topic.id] || {
            is_reading_completed: false,
            max_speaking_score: 0,
            max_listening_score: 0
          };

          // Lock validation based on current stats level
          const userLevelVal = LEVEL_VALUES[stats.level] || 1;
          const topicLevelVal = LEVEL_VALUES[topic.level] || 1;
          const isLocked = topicLevelVal > userLevelVal;

          return (
            <div 
              key={topic.id} 
              className="topic-card glass p-6"
              style={{ 
                opacity: isLocked ? 0.65 : 1, 
                transition: 'var(--transition)'
              }}
            >
              <div className="topic-card-header mb-4">
                <span className={`badge-level level-${topic.level.toLowerCase()}`}>{topic.level}</span>
                {isLocked ? (
                  <span className="badge-level font-bold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Locked</span>
                ) : (
                  <span className="topic-category">{topic.topic}</span>
                )}
              </div>
              <h3 className="topic-title mb-2">{topic.title}</h3>
              <p className="topic-desc mb-6 color-text-muted">
                {topic.reading_passage.slice(0, 100)}...
              </p>

              {/* Module status checkmarks */}
              <div className="topic-modules-status mb-6">
                <div className={`status-item ${topicProg.is_reading_completed ? 'completed' : ''}`}>
                  <span className="status-icon">R</span>
                  <div className="status-text">
                    <span className="label">Reading & Vocab</span>
                    <span className="value">{topicProg.is_reading_completed ? "Completed (+10 XP)" : "Not started"}</span>
                  </div>
                </div>

                <div className={`status-item ${topicProg.max_listening_score > 0 ? 'completed' : ''}`}>
                  <span className="status-icon">D</span>
                  <div className="status-text">
                    <span className="label">Dictation / Listening</span>
                    <span className="value">
                      {topicProg.max_listening_score > 0 
                        ? `Best Score: ${Math.round(topicProg.max_listening_score * 100)}%` 
                        : "Not started"}
                    </span>
                  </div>
                </div>

                <div className={`status-item ${topicProg.max_speaking_score > 0 ? 'completed' : ''}`}>
                  <span className="status-icon">S</span>
                  <div className="status-text">
                    <span className="label">Pronunciation / Speaking</span>
                    <span className="value">
                      {topicProg.max_speaking_score > 0 
                        ? `Best Score: ${Math.round(topicProg.max_speaking_score * 100)}%` 
                        : "Not started"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Topic or Locked indicator */}
              {isLocked ? (
                <button 
                  className="btn-secondary w-full justify-center"
                  style={{ cursor: 'not-allowed', color: 'var(--color-text-muted)' }}
                  disabled
                >
                  Locked (Requires Level {topic.level})
                </button>
              ) : (
                <button 
                  className="btn-primary w-full justify-center"
                  onClick={() => onSelectTopic(topic)}
                >
                  Start Learning
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
