import React, { useMemo } from 'react';
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

  // Generate data for GitHub-like activity heatmap
  const heatmapGrid = useMemo(() => {
    const history = stats?.activityHistory || {};
    const grid = [];
    const today = new Date();
    
    // Start date is exactly 364 days ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);
    
    // Align starting date to Sunday of that week
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const oneDayMs = 24 * 60 * 60 * 1000;
    let currentDate = new Date(startDate.getTime());
    
    // 53 columns (weeks)
    for (let w = 0; w < 53; w++) {
      const week = [];
      // 7 rows (Sunday - Saturday)
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.getFullYear() + '-' + 
                        String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(currentDate.getDate()).padStart(2, '0');
        const count = history[dateStr] || 0;
        
        week.push({
          date: dateStr,
          count: count,
          dayLabel: currentDate.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', weekday: 'short' })
        });
        currentDate = new Date(currentDate.getTime() + oneDayMs);
      }
      grid.push(week);
    }
    return grid;
  }, [stats?.activityHistory]);

  return (
    <div className="dashboard animate-slideup">
      {/* Header section */}
      <div className="dashboard-header glass p-6 mb-8">
        <div>
          <h1 className="glow-text text-gradient">Welcome back, Language Learner!</h1>
          <p className="color-text-muted mt-2">Ready to level up your English skills today? Choose a topic below or review your vocabulary.</p>
        </div>
        <div className="header-actions flex flex-wrap gap-2 mt-4 md:mt-0">
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
            onClick={() => onNavigate('minimal_pairs')}
            style={{ 
              border: '1px solid var(--color-primary)', 
              background: 'rgba(124, 58, 237, 0.08)',
              color: 'var(--color-primary)'
            }}
          >
            🎙️ Minimal Pairs
          </button>

          <button 
            className="btn-secondary flex items-center gap-1" 
            onClick={() => onNavigate('idioms_handbook')}
            style={{ 
              border: '1px solid var(--color-secondary)', 
              background: 'rgba(245, 158, 11, 0.08)',
              color: 'var(--color-secondary)'
            }}
          >
            📙 Idioms & Phrasal Verbs
          </button>

          <button 
            className="btn-secondary flex items-center gap-1" 
            onClick={() => onNavigate('mini_games')}
            style={{ 
              border: '1px solid var(--color-success)', 
              background: 'rgba(16, 185, 129, 0.08)',
              color: 'var(--color-success)'
            }}
          >
            🎮 Playzone (Games)
          </button>

          <button 
            className="btn-secondary flex items-center gap-1" 
            onClick={() => onNavigate('tenses_handbook')}
            style={{ 
              border: '1px solid rgba(59, 130, 246, 0.5)', 
              background: 'rgba(59, 130, 246, 0.08)',
              color: '#3b82f6'
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

      {/* GitHub-like Activity Heatmap */}
      <div className="activity-heatmap-box glass p-6 mb-8">
        <h3 className="text-sm font-semibold mb-2 color-text-main flex items-center gap-2">
          📊 Lịch sử học tập & rèn luyện (Last 365 Days)
        </h3>
        <p className="text-xs color-text-muted mb-4">
          Độ đậm nhạt của các ô vuông thể hiện mức độ học tập hằng ngày của bạn qua các bài học, luyện phát âm và trắc nghiệm.
        </p>
        
        <div className="heatmap-scroll-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
          <div className="heatmap-grid" style={{ 
            display: 'grid', 
            gridTemplateRows: 'repeat(7, 12px)', 
            gridAutoFlow: 'column', 
            gridAutoColumns: '12px',
            gap: '3px',
            minWidth: '780px'
          }}>
            {heatmapGrid.map((week, wIdx) => 
              week.map((day, dIdx) => {
                let cellBg = 'rgba(255, 255, 255, 0.05)';
                if (day.count > 0) {
                  if (day.count <= 2) cellBg = 'rgba(159, 122, 234, 0.3)'; // light purple
                  else if (day.count <= 5) cellBg = 'rgba(159, 122, 234, 0.6)'; // medium purple
                  else cellBg = 'rgba(124, 58, 237, 1)'; // dark primary purple
                }
                
                return (
                  <div 
                    key={`${wIdx}-${dIdx}`}
                    style={{ 
                      backgroundColor: cellBg, 
                      borderRadius: '2px', 
                      width: '12px', 
                      height: '12px'
                    }}
                    title={`${day.dayLabel}: ${day.count} hoạt động`}
                  />
                );
              })
            )}
          </div>
        </div>
        
        {/* Heatmap Legend */}
        <div className="flex justify-end gap-2 items-center text-xs color-text-muted mt-3">
          <span>Ít học</span>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(159, 122, 234, 0.3)' }}></div>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(159, 122, 234, 0.6)' }}></div>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(124, 58, 237, 1)' }}></div>
          <span>Chăm chỉ 🔥</span>
        </div>
      </div>

      {/* Topic List */}
      <h2 className="section-title mb-6">Learning Path</h2>
      <div className="topics-grid">
        {topics.map((topic) => {
          const topicProg = progress[topic.id] || {
            is_reading_completed: false,
            max_speaking_score: -1,
            max_listening_score: -1
          };

          const maxListening = topicProg.max_listening_score !== undefined ? topicProg.max_listening_score : -1;
          const maxSpeaking = topicProg.max_speaking_score !== undefined ? topicProg.max_speaking_score : -1;

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

                <div className={`status-item ${maxListening >= 0 ? 'completed' : ''}`}>
                  <span className="status-icon">D</span>
                  <div className="status-text">
                    <span className="label">Dictation / Listening</span>
                    <span className="value">
                      {maxListening >= 0 
                        ? `Best Score: ${Math.round(maxListening * 100)}%` 
                        : "Not started"}
                    </span>
                  </div>
                </div>

                <div className={`status-item ${maxSpeaking >= 0 ? 'completed' : ''}`}>
                  <span className="status-icon">S</span>
                  <div className="status-text">
                    <span className="label">Pronunciation / Speaking</span>
                    <span className="value">
                      {maxSpeaking >= 0 
                        ? `Best Score: ${Math.round(maxSpeaking * 100)}%` 
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
