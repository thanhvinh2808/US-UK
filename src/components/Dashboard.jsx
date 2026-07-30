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
      {/* Clean Welcome Banner */}
      <div className="dashboard-header glass p-6 mb-8 flex justify-between items-center flex-wrap gap-4" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-light)' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ fontSize: '1.7rem', fontWeight: '800', margin: 0, color: 'var(--color-text-main)' }}>
            Xin chào! Cùng rèn luyện phản xạ tiếng Anh hôm nay 🚀
          </h1>
          <p className="color-text-muted text-sm mt-1.5" style={{ margin: 0 }}>
            Lựa chọn chủ đề bên dưới để luyện nghe, nói, viết hoặc tra cứu từ mới bằng trí tuệ nhân tạo Gemini AI.
          </p>
        </div>
        
        {reviewsDue > 0 ? (
          <button 
            className="btn-primary" 
            onClick={() => onNavigate('flashcards')}
            style={{ 
              background: 'var(--color-primary)',
              color: '#ffffff',
              borderRadius: '12px',
              fontWeight: '700',
              padding: '12px 22px',
              boxShadow: '0 4px 16px var(--color-primary-glow)'
            }}
          >
            🔥 Ôn tập {reviewsDue} từ cần nhớ
          </button>
        ) : (
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate('translator')}
            style={{ 
              border: '1.5px solid var(--color-primary)',
              color: 'var(--color-primary)',
              borderRadius: '12px',
              fontWeight: '700',
              padding: '10px 18px'
            }}
          >
            🔍 Tra từ AI [Ctrl + K]
          </button>
        )}
      </div>

      {/* Professional Stats Cards Row */}
      <div className="stats-grid mb-8">
        <div className="stat-card glass p-5" style={{ borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <div className="stat-info w-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="color-text-muted text-xs font-semibold uppercase">Chuỗi Học Tập</span>
              <span style={{ fontSize: '18px' }}>🔥</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '4px', margin: 0 }}>
              {stats.streak} ngày liên tiếp
            </h3>
            <p className="text-xs color-text-muted mt-1">Duy trì thói quen học mỗi ngày</p>
          </div>
        </div>

        <div className="stat-card glass p-5" style={{ borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <div className="stat-info w-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="color-text-muted text-xs font-semibold uppercase">Cấp Độ Hiện Tại</span>
              <span style={{ fontSize: '18px' }}>🎯</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '4px', margin: 0 }}>
              Level {stats.level} ({stats.points} XP)
            </h3>
            {/* XP Progress Bar - tính % tiến trình TRONG cấp độ hiện tại (khớp ngưỡng lên cấp thật ở App.jsx: A1 0-149, A2 150-499, B1 500-999, B2 1000+),
                thay vì lấy điểm/1000 một cách cứng nhắc bất kể đang ở cấp nào (gây hiển thị sai lệch, ví dụ B1 600 điểm trước đây hiện 60% dù thực tế mới đi được 20% chặng đường tới B2) */}
            {(() => {
              const LEVEL_THRESHOLDS = [
                { level: 'A1', min: 0, next: 150 },
                { level: 'A2', min: 150, next: 500 },
                { level: 'B1', min: 500, next: 1000 },
                { level: 'B2', min: 1000, next: null } // cấp cao nhất, không còn ngưỡng tiếp theo
              ];
              const current = LEVEL_THRESHOLDS.find(l => l.level === stats.level) || LEVEL_THRESHOLDS[0];
              const progressPct = current.next
                ? Math.min(100, Math.max(0, ((stats.points - current.min) / (current.next - current.min)) * 100))
                : 100;
              return (
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${progressPct}%`, 
                    height: '100%', 
                    background: 'var(--color-primary)',
                    borderRadius: '10px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              );
            })()}
          </div>
        </div>

        <div className="stat-card glass p-5" style={{ borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <div className="stat-info w-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="color-text-muted text-xs font-semibold uppercase">Sổ Tay Từ Vựng</span>
              <span style={{ fontSize: '18px' }}>📙</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '4px', margin: 0 }}>
              {savedVocabCount} từ đã lưu
            </h3>
            <p className="text-xs color-text-muted mt-1">Sẵn sàng ôn luyện lại</p>
          </div>
        </div>

        <div className="stat-card glass p-5" style={{ borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <div className="stat-info w-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="color-text-muted text-xs font-semibold uppercase">Bài Học Hoàn Thành</span>
              <span style={{ fontSize: '18px' }}>✨</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '4px', margin: 0 }}>
              {stats.completedModules} bài học
            </h3>
            <p className="text-xs color-text-muted mt-1">Tích lũy kiến thức mỗi ngày</p>
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
                let cellBg = 'var(--bg-input)';
                if (day.count > 0) {
                  if (day.count <= 2) cellBg = 'var(--color-primary-glow)';
                  else if (day.count <= 5) cellBg = 'var(--color-primary-light)';
                  else cellBg = 'var(--color-primary)';
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
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--bg-input)' }}></div>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-primary-glow)' }}></div>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-primary-light)' }}></div>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-primary)' }}></div>
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
