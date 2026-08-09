import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { speak, speakCompare, playSound, vibrate } from '../utils/sounds';

export default function VocabNotebook({ onNavigateBack, onSavedVocabChange, showToast }) {
  const [vocabList, setVocabList] = useState(() => storage.getSavedVocab());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, learning, mastered, worst
  
  // Custom Deck States
  const [customDecks, setCustomDecks] = useState(() => storage.getCustomDecks());
  const [selectedDeckFilter, setSelectedDeckFilter] = useState('all'); // all, or deckId
  const [newDeckName, setNewDeckName] = useState('');
  const [showCreateDeck, setShowCreateDeck] = useState(false);

  const handleSpeak = (word, accent = 'US') => {
    speak(word, { accent, rate: 0.85 });
  };

  const handleSpeakCompare = (word) => {
    speakCompare(word);
  };

  const handleDelete = (wordText) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa từ "${wordText}" khỏi sổ tay?`)) {
      try {
        const newList = storage.deleteWord(wordText);
        setVocabList(newList);
        onSavedVocabChange();
        if (showToast) showToast(`Đã xóa từ "${wordText}"`, 'success');
      } catch (e) {
        if (showToast) showToast('Không thể xóa từ, vui lòng thử lại', 'error');
      }
    }
  };

  const handleResetWord = (wordObj) => {
    try {
      const updatedList = storage.resetWord(wordObj.word);
      setVocabList(updatedList);
      onSavedVocabChange();
      if (showToast) showToast(`Đã reset trạng thái ôn tập cho từ "${wordObj.word}"`, 'success');
    } catch (e) {
      if (showToast) showToast('Không thể reset trạng thái, vui lòng thử lại', 'error');
    }
  };

  // Custom Decks actions
  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;
    const newDeck = {
      id: 'deck_' + Date.now(),
      name: newDeckName.trim()
    };
    const updated = storage.saveCustomDeck(newDeck);
    setCustomDecks(updated);
    setNewDeckName('');
    setShowCreateDeck(false);
    if (showToast) showToast(`Đã tạo bộ từ vựng "${newDeck.name}"`, 'success');
  };

  const handleDeleteDeck = (deckId, deckName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ từ vựng "${deckName}"? Các từ trong bộ này sẽ được đưa về mặc định (không xóa khỏi sổ tay).`)) {
      const updated = storage.deleteCustomDeck(deckId);
      setCustomDecks(updated);
      setVocabList(storage.getSavedVocab());
      if (selectedDeckFilter === deckId) {
        setSelectedDeckFilter('all');
      }
      if (showToast) showToast(`Đã xóa bộ từ vựng "${deckName}"`, 'success');
    }
  };

  const handleAssignWordDeck = (wordText, deckId) => {
    const targetDeck = customDecks.find(d => d.id === deckId);
    const deckName = targetDeck ? targetDeck.name : null;
    const updated = storage.assignWordToDeck(wordText, deckId || null, deckName);
    setVocabList(updated);
    if (showToast) showToast(`Đã xếp từ vào bộ "${deckName || 'Mặc định'}"`, 'success');
  };

  // Filter & Search Logic
  const getFilteredVocab = () => {
    let list = [...vocabList];

    // Filter by Deck
    if (selectedDeckFilter !== 'all') {
      list = list.filter(item => item.deckId === selectedDeckFilter);
    }

    // Filter by Status / Worst words
    if (filterStatus === 'mastered') {
      list = list.filter(item => item.status === 'mastered');
    } else if (filterStatus === 'learning') {
      list = list.filter(item => item.status === 'learning');
    } else if (filterStatus === 'worst') {
      // Get top 10 words user forgot most (lowGradeCount > 0)
      list = list
        .filter(item => item.lowGradeCount > 0)
        .sort((a, b) => (b.lowGradeCount || 0) - (a.lowGradeCount || 0))
        .slice(0, 10);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.word || '').toLowerCase().includes(q) || 
        (item.vietnamese || '').toLowerCase().includes(q)
      );
    }

    return list;
  };

  const filteredVocab = getFilteredVocab();
  const masteredCount = vocabList.filter(item => item.status === 'mastered').length;
  const learningCount = vocabList.filter(item => item.status === 'learning').length;

  return (
    <div className="notebook-screen animate-slideup max-w-6xl mx-auto">
      {/* Back button top-left */}
      {onNavigateBack && (
        <button 
          className="btn-secondary text-xs mb-4" 
          onClick={onNavigateBack}
          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          ← Quay lại Dashboard
        </button>
      )}

      {/* 🚀 Top Headline Hero Banner */}
      <div className="asymmetric-hero-banner">
        <div className="hero-badge-tag">PERSONAL VOCABULARY NOTEBOOK</div>
        <h1 className="hero-main-title">Sổ Tay Từ Vựng Cá Nhân</h1>
        <p className="hero-main-sub">
          Quản lý, tạo bộ thẻ ghi nhớ (Custom Decks) và theo dõi thuật toán lặp lại ngắt quãng Spaced Repetition (SM-2).
        </p>
      </div>

      {/* 📐 Asymmetric 2-Column Split Body */}
      <div className="asymmetric-body-grid">
        {/* 📌 Left Sidebar Metrics & Quick Action */}
        <aside className="vertical-stats-sidebar">
          <div className="stats-sidebar-card glass">
            <h3 className="stats-sidebar-header">THỐNG KÊ TỪ VỰNG</h3>
            
            <div className="vertical-stat-item notebook">
              <span className="stat-icon">📚</span>
              <div className="stat-info">
                <span className="stat-value-mono">{vocabList.length} từ</span>
                <span className="stat-sub">Tổng số từ đã lưu</span>
              </div>
            </div>

            <div className="vertical-stat-item completed">
              <span className="stat-icon">✅</span>
              <div className="stat-info">
                <span className="stat-value-mono" style={{ color: 'var(--color-success)' }}>{masteredCount} từ</span>
                <span className="stat-sub">Đã thuộc (Mastered)</span>
              </div>
            </div>

            <div className="vertical-stat-item streak">
              <span className="stat-icon">⏳</span>
              <div className="stat-info">
                <span className="stat-value-mono" style={{ color: 'var(--color-warning)' }}>{learningCount} từ</span>
                <span className="stat-sub">Đang học (Learning)</span>
              </div>
            </div>

            <div className="sidebar-action-box mt-2">
              <button className="btn-primary w-full justify-center text-xs" onClick={() => onNavigateToFlashcards && onNavigateToFlashcards()}>
                🔥 Ôn tập Flashcards ngay
              </button>
            </div>
          </div>
        </aside>

        {/* 📚 Right Main Workspace */}
        <main className="asymmetric-gallery-main">

      {/* 🗂️ Custom Decks Bar */}
      <div className="bg-white p-5 rounded-xl mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider color-text-muted">
            Bộ thẻ tự tạo (Custom Decks)
          </h3>
          <button 
            className="btn-secondary text-xs py-1 px-3"
            onClick={() => setShowCreateDeck(!showCreateDeck)}
          >
            {showCreateDeck ? 'Đóng' : '+ Tạo bộ thẻ mới'}
          </button>
        </div>

        {showCreateDeck && (
          <div className="flex gap-2 max-w-md mb-4 animate-slideup">
            <input
              type="text"
              placeholder="Tên bộ mới (vd: Phỏng vấn, IELTS Reading...)"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              className="search-input flex-1 text-xs"
            />
            <button className="btn-primary text-xs py-2 px-4" onClick={handleCreateDeck}>
              Tạo bộ
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDeckFilter('all')}
            className={`gallery-filter-pill ${selectedDeckFilter === 'all' ? 'active' : ''}`}
          >
            Tất cả bộ ({vocabList.length})
          </button>

          {customDecks.map(deck => {
            const count = vocabList.filter(item => item.deckId === deck.id).length;
            return (
              <div 
                key={deck.id} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition text-xs font-medium cursor-pointer ${
                  selectedDeckFilter === deck.id 
                    ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]' 
                    : 'bg-[#F2F5FA] text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span onClick={() => setSelectedDeckFilter(deck.id)}>
                  {deck.name} ({count})
                </span>
                <span 
                  onClick={() => handleDeleteDeck(deck.id, deck.name)}
                  className="text-red-500 hover:text-red-700 font-bold ml-1"
                  title="Xóa bộ này"
                >
                  ✕
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔍 Search & Filter Toolbar */}
      <div className="bg-white p-5 rounded-xl mb-6 shadow-sm flex flex-wrap gap-4 justify-between items-center">
        <input 
          type="text" 
          placeholder="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt..."
          className="search-input max-w-md w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <button 
            className={`gallery-filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Tất cả ({vocabList.length})
          </button>
          <button 
            className={`gallery-filter-pill ${filterStatus === 'learning' ? 'active' : ''}`}
            onClick={() => setFilterStatus('learning')}
          >
            Đang học ({learningCount})
          </button>
          <button 
            className={`gallery-filter-pill ${filterStatus === 'mastered' ? 'active' : ''}`}
            onClick={() => setFilterStatus('mastered')}
          >
            Đã thuộc ({masteredCount})
          </button>
          <button 
            className={`gallery-filter-pill ${filterStatus === 'worst' ? 'active' : ''}`}
            onClick={() => setFilterStatus('worst')}
          >
            Top 10 hay quên
          </button>
        </div>
      </div>

      {/* 📋 Notion / Sheets Clean Table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {filteredVocab.length === 0 ? (
          <div className="text-center py-16 color-text-muted">
            <p className="text-sm font-medium">Không tìm thấy từ vựng nào khớp với bộ lọc.</p>
            <p className="text-xs text-slate-400 mt-1">Hãy đọc thêm bài viết hoặc tạo bộ thẻ mới!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F2F5FA] border-b border-light text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Từ vựng</th>
                  <th className="py-3 px-5">Phiên âm (IPA)</th>
                  <th className="py-3 px-5">Ý nghĩa & Ví dụ</th>
                  <th className="py-3 px-5">Bộ thẻ (Deck)</th>
                  <th className="py-3 px-5">Tiến độ SM-2</th>
                  <th className="py-3 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVocab.map((item, index) => {
                  return (
                    <tr key={item.id || index} className="hover:bg-[#EEF3FA] transition duration-150">
                      
                      {/* Từ vựng + Nút phát âm */}
                      <td className="py-4 px-5">
                        <strong className="text-base font-bold color-text-dark block">
                          {item.word || '(Trống)'}
                        </strong>
                        <div className="flex gap-1.5 mt-2">
                          <button 
                            className="text-[11px] font-semibold bg-[#F2F5FA] hover:bg-slate-200 px-2 py-0.5 rounded color-text-main"
                            onClick={() => handleSpeak(item.word, 'US')} 
                            title="Nghe giọng Mỹ"
                          >
                            🇺🇸 US
                          </button>
                          <button 
                            className="text-[11px] font-semibold bg-[#F2F5FA] hover:bg-slate-200 px-2 py-0.5 rounded color-text-main"
                            onClick={() => handleSpeak(item.word, 'UK')} 
                            title="Nghe giọng Anh"
                          >
                            🇬🇧 UK
                          </button>
                          <button 
                            className="text-[11px] font-semibold bg-[#F2F5FA] hover:bg-slate-200 px-2 py-0.5 rounded color-text-main"
                            onClick={() => handleSpeakCompare(item.word)} 
                            title="So sánh US-UK"
                          >
                            🆚
                          </button>
                        </div>
                      </td>

                      {/* IPA Code */}
                      <td className="py-4 px-5 font-mono text-xs text-slate-500 italic">
                        {item.ipa ? item.ipa : '—'}
                      </td>

                      {/* Meaning & Example */}
                      <td className="py-4 px-5 max-w-xs">
                        <span className="text-sm font-semibold color-text-main block">
                          {item.vietnamese || '—'}
                        </span>
                        {item.example && (
                          <p className="text-xs color-text-muted italic mt-1 leading-snug">
                            "{item.example}"
                          </p>
                        )}
                      </td>

                      {/* Custom Deck Assign */}
                      <td className="py-4 px-5">
                        <select
                          value={item.deckId || ''}
                          onChange={(e) => handleAssignWordDeck(item.word, e.target.value)}
                          className="search-input text-xs py-1 px-2"
                        >
                          <option value="">(Mặc định)</option>
                          {customDecks.map(deck => (
                            <option key={deck.id} value={deck.id}>
                              {deck.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* SM-2 Progress */}
                      <td className="py-4 px-5 font-mono text-xs">
                        <div className="text-slate-600">Lượt học: <strong>{item.repetitions || 0}</strong></div>
                        <div className={(item.lowGradeCount || 0) > 0 ? 'text-red-600 font-bold mt-0.5' : 'text-slate-400 mt-0.5'}>
                          Số lần quên: {item.lowGradeCount || 0}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex gap-2">
                          <button 
                            className="btn-secondary text-xs py-1 px-2.5"
                            onClick={() => handleResetWord(item)} 
                            title="Reset Spaced Repetition"
                          >
                            Reset
                          </button>
                          <button 
                            className="text-xs py-1 px-2.5 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold transition"
                            onClick={() => handleDelete(item.word)} 
                            title="Xóa từ vựng"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  </div>
</div>
  );
}
