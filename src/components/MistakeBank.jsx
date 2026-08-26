import React, { useState, useMemo } from 'react';
import { storage } from '../utils/storage';
import { speak } from '../utils/sounds';

// Map module -> nhãn hiển thị + icon, dùng để lọc theo kỹ năng
const MODULE_META = {
  grammar: { label: 'Ngữ pháp', icon: '📝' },
  minimal_pairs: { label: 'Phát âm - Phân biệt âm', icon: '🎧' },
  pronunciation: { label: 'Phát âm', icon: '🗣️' },
  flashcards: { label: 'Từ vựng', icon: '🃏' },
  shadowing: { label: 'Nói đuổi', icon: '🔁' },
  dictation: { label: 'Nghe & Điền từ', icon: '✍️' },
  khac: { label: 'Khác', icon: '📌' },
};

export default function MistakeBank({ onNavigateBack }) {
  const [mistakes, setMistakes] = useState(() => storage.getMistakes());
  const [filterModule, setFilterModule] = useState('all');
  const [revealedId, setRevealedId] = useState(null);

  const weaknessStats = useMemo(() => {
    const counts = {};
    mistakes.forEach(m => {
      if (m && m.skill) {
        counts[m.skill] = (counts[m.skill] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);
  }, [mistakes]);

  const moduleCounts = useMemo(() => {
    const counts = {};
    mistakes.forEach(m => { counts[m.module] = (counts[m.module] || 0) + 1; });
    return counts;
  }, [mistakes]);

  const filtered = filterModule === 'all'
    ? mistakes
    : mistakes.filter(m => m.module === filterModule);

  const handleDelete = (id) => {
    const updated = storage.deleteMistake(id);
    setMistakes(updated);
  };

  const handleClearAll = () => {
    if (!window.confirm('Xoá toàn bộ câu sai đã lưu? Hành động này không thể hoàn tác.')) return;
    const updated = storage.clearMistakes(filterModule === 'all' ? null : filterModule);
    setMistakes(updated);
  };

  const availableModules = Object.keys(moduleCounts);

  return (
    <div className="mistake-bank-screen animate-slideup max-w-6xl mx-auto">
      {onNavigateBack && (
        <button
          className="btn-secondary text-xs mb-4"
          onClick={onNavigateBack}
          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          ← Quay lại Dashboard
        </button>
      )}

      <div className="page-header glass p-6 mb-6 rounded-xl" style={{ background: 'var(--bg-card)' }}>
        <span className="badge-level level-b1 mb-2 inline-block">ÔN TẬP</span>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '4px 0 0 0' }}>
          Ngân Hàng Câu Sai
        </h1>
        <p className="color-text-muted" style={{ margin: '6px 0 0 0', fontSize: '13px', lineHeight: 1.5 }}>
          Mọi câu bạn từng làm sai ở các bài luyện tập được tự động lưu tại đây, để bạn ôn lại đúng chỗ mình còn yếu thay vì học lan man.
        </p>
      </div>

      {/* Thống kê điểm yếu theo kỹ năng */}
      {weaknessStats.length > 0 && (
        <div className="glass p-5 mb-6 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Phân tích điểm cần củng cố</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {weaknessStats.map(({ skill, count }) => {
              const maxCount = weaknessStats[0].count;
              const widthPct = Math.max(8, Math.round((count / maxCount) * 100));
              return (
                <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '160px', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>{skill}</span>
                  <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: '6px', height: '20px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      background: 'var(--color-uk, var(--color-primary))',
                      borderRadius: '6px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <span style={{ width: '32px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bộ lọc theo module */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn-secondary text-xs ${filterModule === 'all' ? 'active' : ''}`}
            onClick={() => setFilterModule('all')}
            style={filterModule === 'all' ? { border: '2px solid var(--color-primary)' } : {}}
          >
            Tất cả ({mistakes.length})
          </button>
          {availableModules.map(mod => (
            <button
              key={mod}
              className={`btn-secondary text-xs ${filterModule === mod ? 'active' : ''}`}
              onClick={() => setFilterModule(mod)}
              style={filterModule === mod ? { border: '2px solid var(--color-primary)' } : {}}
            >
              {MODULE_META[mod]?.icon || '📌'} {MODULE_META[mod]?.label || mod} ({moduleCounts[mod]})
            </button>
          ))}
        </div>
        {mistakes.length > 0 && (
          <button className="btn-secondary text-xs" onClick={handleClearAll} style={{ color: '#C23B3B' }}>
            🗑️ Xoá {filterModule === 'all' ? 'tất cả' : 'mục này'}
          </button>
        )}
      </div>

      {/* Danh sách câu sai */}
      {filtered.length === 0 ? (
        <div className="glass p-8 text-center rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🎉</span>
          <h3 style={{ fontWeight: '700', marginBottom: '4px' }}>
            {mistakes.length === 0 ? 'Chưa có câu sai nào được lưu!' : 'Không có câu sai nào trong mục này'}
          </h3>
          <p className="color-text-muted" style={{ fontSize: '13px' }}>
            Hãy tiếp tục luyện tập ở các module Ngữ pháp, Phát âm, Từ vựng... — câu nào làm sai sẽ tự động xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((m) => (
            <div key={m.id} className="glass p-4 rounded-xl" style={{ background: 'var(--bg-card)' }}>
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <span className="badge-level level-a2" style={{ fontSize: '10px', marginBottom: '6px', display: 'inline-block' }}>
                    {MODULE_META[m.module]?.icon || '📌'} {m.skill}
                  </span>
                  <p style={{ fontWeight: '600', fontSize: '15px', margin: '4px 0' }}>{m.question}</p>

                  {revealedId === m.id ? (
                    <div style={{ marginTop: '8px', fontSize: '13px' }}>
                      {m.userAnswer && (
                        <p style={{ color: '#C23B3B', margin: '2px 0' }}>
                          ❌ Bạn đã trả lời: <strong>{m.userAnswer}</strong>
                        </p>
                      )}
                      {m.correctAnswer && (
                        <p style={{ color: 'var(--color-success, #1E8A5F)', margin: '2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ✅ Đáp án đúng: <strong>{m.correctAnswer}</strong>
                          <button
                            onClick={() => speak(m.correctAnswer)}
                            title="Nghe phát âm"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                          >
                            🔊
                          </button>
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => setRevealedId(m.id)}
                      style={{ marginTop: '6px' }}
                    >
                      👁️ Xem đáp án
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  title="Đã ôn xong, xoá khỏi danh sách"
                  className="btn-secondary text-xs"
                  style={{ flexShrink: 0 }}
                >
                  ✓ Đã thuộc
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
