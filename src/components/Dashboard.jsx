import React, { useState, useMemo } from 'react';
import { storage } from '../utils/storage';

export default function Dashboard({ 
  stats = { streak: 1, level: 'A2', points: 0, completedModules: 0 }, 
  progress = {}, 
  savedVocabCount = 0, 
  onSelectTopic, 
  onNavigate, 
  topics = [], 
  topicsList = [] 
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const safeTopics = useMemo(() => {
    if (Array.isArray(topics) && topics.length > 0) return topics;
    if (Array.isArray(topicsList) && topicsList.length > 0) return topicsList;
    return [];
  }, [topics, topicsList]);

  // Calculate review items due for today using storage utility
  const now = Date.now();
  const reviewsDue = useMemo(() => {
    try {
      return storage.getSavedVocab().filter(item => !item.nextReviewDate || new Date(item.nextReviewDate) <= now).length;
    } catch (e) {
      return 0;
    }
  }, [now]);

  const mistakesCount = useMemo(() => {
    try {
      return storage.getMistakes().length;
    } catch (e) {
      return 0;
    }
  }, []);

  // Filter topics by selected level tag
  const filteredTopics = useMemo(() => {
    if (selectedFilter === 'ALL') return safeTopics;
    return safeTopics.filter(t => t && t.level === selectedFilter);
  }, [safeTopics, selectedFilter]);

  // Find active/featured in-progress topic (or default to first topic)
  const featuredTopic = useMemo(() => {
    if (!filteredTopics || filteredTopics.length === 0) return null;
    const inProgress = filteredTopics.find(t => {
      const p = (progress || {})[t.id || t._id];
      return p && (!p.is_reading_completed || p.max_listening_score >= 0 || p.max_speaking_score >= 0);
    });
    return inProgress || filteredTopics[0];
  }, [filteredTopics, progress]);

  // Remaining compact topics
  const compactTopics = useMemo(() => {
    if (!featuredTopic || !filteredTopics) return filteredTopics || [];
    return filteredTopics.filter(t => t && (t.id || t._id) !== (featuredTopic.id || featuredTopic._id));
  }, [filteredTopics, featuredTopic]);

  const safeStats = stats || { streak: 1, level: 'A2', points: 0, completedModules: 0 };

  // Top 1 kỹ năng đang yếu nhất, lấy từ Ngân hàng câu sai, để hiện cảnh báo nhanh trên Dashboard
  const topWeakness = useMemo(() => {
    try {
      const list = storage.getWeaknessStats();
      return list.length > 0 ? list[0] : null;
    } catch (e) {
      return null;
    }
  }, [safeStats]);

  return (
    <div className="dashboard-asymmetric-layout animate-slideup">
      
      {/* 🚀 Top Headline Hero Banner */}
      <div className="asymmetric-hero-banner">
        <div className="hero-badge-tag">ANTIGRAVITY LEARNING STUDIO</div>
        <h1 className="hero-main-title">
          Sẵn sàng nâng tầm tiếng Anh hôm nay?
        </h1>
        <p className="hero-main-sub">
          Luyện nghe, phát âm chuẩn US-UK và ghi nhớ từ vựng với thuật toán ngắt quãng Spaced Repetition.
        </p>
      </div>

      {/* 📐 Asymmetric 2-Column Split Body */}
      <div className="asymmetric-body-grid">
        
        {/* 📌 Left Narrow Vertical Stats Column (Dồn dọc 1 cột hẹp) */}
        <aside className="vertical-stats-sidebar">
          <div className="stats-sidebar-card">
            <h3 className="stats-sidebar-header">BẢNG THỐNG KÊ</h3>
            
            <div className="vertical-stat-item streak">
              <span className="stat-icon">🔥</span>
              <div className="stat-info">
                <span className="stat-value-mono">{safeStats.streak || 0} ngày</span>
                <span className="stat-sub">Chuỗi học liên tiếp</span>
              </div>
            </div>

            <div className="vertical-stat-item level">
              <span className="stat-icon">🎓</span>
              <div className="stat-info">
                <span className="stat-value-mono">Level {safeStats.level || 'A2'}</span>
                <span className="stat-sub">{safeStats.points || 0} XP tích lũy</span>
              </div>
            </div>

            <div className="vertical-stat-item notebook">
              <span className="stat-icon">📖</span>
              <div className="stat-info">
                <span className="stat-value-mono">{savedVocabCount} từ</span>
                <span className="stat-sub">Từ vựng trong sổ tay</span>
              </div>
            </div>

            <div className="vertical-stat-item completed">
              <span className="stat-icon">✨</span>
              <div className="stat-info">
                <span className="stat-value-mono">{safeStats.completedModules || 0} bài</span>
                <span className="stat-sub">Đã hoàn thành</span>
              </div>
            </div>

            {topWeakness ? (
              <div
                className="vertical-stat-item weakness cursor-pointer"
                onClick={() => onNavigate && onNavigate('mistake_bank')}
                title="Bấm để mở Ngân hàng câu sai và ôn lại"
                style={{ cursor: 'pointer' }}
              >
                <span className="stat-icon">📌</span>
                <div className="stat-info">
                  <span className="stat-value-mono" style={{ fontSize: '13px' }}>Đang yếu: {topWeakness.skill}</span>
                  <span className="stat-sub">{topWeakness.count} câu sai — bấm để ôn lại</span>
                </div>
              </div>
            ) : (
              <div 
                className="vertical-stat-item cursor-pointer" 
                onClick={() => onNavigate && onNavigate('mistake_bank')}
                title="Mở Ngân hàng câu sai"
                style={{ cursor: 'pointer' }}
              >
                <span className="stat-icon">📌</span>
                <div className="stat-info">
                  <span className="stat-value-mono">{mistakesCount} câu sai</span>
                  <span className="stat-sub">Ngân hàng câu sai</span>
                </div>
              </div>
            )}

            <div className="sidebar-action-box mt-4">
              {reviewsDue > 0 ? (
                <button className="btn-primary w-full justify-center" onClick={() => onNavigate('flashcards')}>
                  🔥 Ôn tập {reviewsDue} từ
                </button>
              ) : (
                <button className="btn-secondary w-full justify-center" onClick={() => onNavigate('translator')}>
                  🔍 Tra từ AI [Ctrl+K]
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* 📚 Right Wide Asymmetric Lessons Gallery */}
        <main className="asymmetric-gallery-main">
          
          {/* Gallery Header & Filters */}
          <div className="gallery-top-bar">
            <div>
              <h2 className="gallery-section-title">Danh mục bài học</h2>
              <p className="gallery-section-sub">Bài đang học hiển thị thẻ ưu tiên lớn, bài chưa học dạng thẻ nhỏ gọn</p>
            </div>

            {/* Level Filter Pills */}
            <div className="gallery-level-filters">
              {['ALL', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                <button
                  key={lvl}
                  className={`gallery-filter-pill ${selectedFilter === lvl ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(lvl)}
                >
                  {lvl === 'ALL' ? 'Tất cả' : lvl}
                </button>
              ))}
            </div>
          </div>

          {/* 🌟 FEATURED / IN-PROGRESS LARGE CARD */}
          {featuredTopic && (
            <div className="featured-large-card" onClick={() => onSelectTopic && onSelectTopic(featuredTopic)}>
              <div className="featured-card-badge">
                <span>🔥 BÀI ĐANG HỌC DỞ</span>
                <span className="featured-level">{featuredTopic.level || 'A2'}</span>
              </div>

              <h3 className="featured-card-title">{featuredTopic.title || 'Bài đọc học tiếng Anh'}</h3>
              <span className="featured-card-category">{featuredTopic.topicCategory || featuredTopic.topic || 'Chủ đề'}</span>
              
              <p className="featured-card-snippet">
                {featuredTopic.reading_passage ? featuredTopic.reading_passage.slice(0, 160) + '...' : ''}
              </p>

              <div className="featured-card-footer">
                <span className="featured-terms-count font-mono">
                  📚 {(featuredTopic.default_vocabs || []).length || 6} thuật ngữ IPA
                </span>
                <button className="btn-primary featured-start-btn">
                  Tiếp tục học ngay ➔
                </button>
              </div>
            </div>
          )}

          {/* 📦 COMPACT UNSTUDIED CARDS GRID */}
          <div className="compact-cards-grid mt-6">
            {compactTopics.map((topic, idx) => {
              if (!topic) return null;
              const topicProg = (progress || {})[topic.id || topic._id] || { is_reading_completed: false };
              const titleStr = topic.title || '';
              const catStr = topic.topicCategory || topic.topic || '';
              const levelStr = topic.level || '';
              
              const isUKTopic = titleStr.includes('London') || catStr.includes('UK') || levelStr.includes('C1') || levelStr.includes('C2');
              const cardClass = isUKTopic ? 'uk-accent-card' : 'us-accent-card';

              return (
                <div 
                  key={topic.id || topic._id || idx}
                  className={`compact-lesson-card ${cardClass}`}
                  onClick={() => onSelectTopic && onSelectTopic(topic)}
                >
                  <div className="compact-card-top flex justify-between items-center mb-2">
                    <span className="compact-flag-tag">
                      {isUKTopic ? '🇬🇧 UK Accent' : '🇺🇸 US Accent'}
                    </span>
                    <span className="compact-level-badge">{levelStr || 'A2'}</span>
                  </div>

                  <h4 className="compact-card-title">{titleStr || 'Bài đọc từ vựng'}</h4>
                  <p className="compact-card-sub">{catStr || 'Tổng hợp'}</p>

                  <div className="compact-card-bottom flex justify-between items-center mt-3 pt-3">
                    {topicProg.is_reading_completed ? (
                      <span className="compact-done-tag">✓ Đã hoàn thành</span>
                    ) : (
                      <span className="compact-action-link">Bắt đầu học ➔</span>
                    )}
                    <span className="text-xs color-text-muted font-mono">
                      {(topic.default_vocabs || []).length || 6} từ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </main>

      </div>

    </div>
  );
}
