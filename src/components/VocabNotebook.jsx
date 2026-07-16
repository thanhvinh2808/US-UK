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
        item.word.toLowerCase().includes(q) || 
        item.vietnamese.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const filteredVocab = getFilteredVocab();
  const masteredCount = vocabList.filter(item => item.status === 'mastered').length;
  const learningCount = vocabList.filter(item => item.status === 'learning').length;
  const worstCount = vocabList.filter(item => item.lowGradeCount > 0).length;

  return (
    <div className="notebook-screen animate-slideup">
      {/* Header */}
      <div className="screen-header mb-6">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Back to Dashboard
        </button>
        <div className="topic-meta">
          <span className="badge-level">Vocab</span>
          <span className="topic-name">Vocabulary Notebook</span>
        </div>
      </div>

      <div className="notebook-layout glass p-6">
        {/* Notebook Stats */}
        <div className="notebook-stats-grid mb-6">
          <div className="notebook-stat-box text-center p-4 glass">
            <h3>{vocabList.length}</h3>
            <p className="color-text-muted text-sm">Tổng số từ đã lưu</p>
          </div>
          <div className="notebook-stat-box text-center p-4 glass">
            <h3 style={{ color: 'var(--color-success)' }}>{masteredCount}</h3>
            <p className="color-text-muted text-sm">Đã thuộc (Mastered)</p>
          </div>
          <div className="notebook-stat-box text-center p-4 glass">
            <h3 style={{ color: 'var(--color-warning)' }}>{learningCount}</h3>
            <p className="color-text-muted text-sm">Đang học (Learning)</p>
          </div>
        </div>

        {/* Custom Decks Section */}
        <div className="custom-decks-manager glass p-4 mb-6 border border-light rounded-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold color-text-main">🗂️ Bộ thẻ tự tạo (Custom Decks)</h3>
            <button 
              className="btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '11px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}
              onClick={() => setShowCreateDeck(!showCreateDeck)}
            >
              {showCreateDeck ? 'Đóng' : '+ Tạo bộ từ mới'}
            </button>
          </div>

          {showCreateDeck && (
            <div className="flex gap-2 max-w-md mb-4 animate-slideup">
              <input
                type="text"
                placeholder="Nhập tên bộ từ vựng (vd: Phỏng vấn, Đi du lịch...)"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="translation-text-input"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              />
              <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={handleCreateDeck}>
                Tạo
              </button>
            </div>
          )}

          {customDecks.length === 0 ? (
            <p className="text-xs color-text-muted">Bạn chưa tạo bộ từ vựng riêng nào. Tạo bộ thẻ để lọc và luyện flashcards hiệu quả hơn!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDeckFilter('all')}
                className={`filter-btn text-xs py-1 px-3 ${selectedDeckFilter === 'all' ? 'active' : ''}`}
              >
                Tất cả bộ ({vocabList.length})
              </button>
              {customDecks.map(deck => {
                const count = vocabList.filter(item => item.deckId === deck.id).length;
                return (
                  <div key={deck.id} className="flex items-center gap-1 glass p-1 rounded" style={{ background: selectedDeckFilter === deck.id ? 'var(--color-primary-glow)' : 'rgba(255,255,255,0.02)', border: selectedDeckFilter === deck.id ? '1px solid var(--color-primary)' : '1px solid var(--border-light)' }}>
                    <button
                      onClick={() => setSelectedDeckFilter(deck.id)}
                      className="text-xs font-semibold px-2 cursor-pointer color-text-dark"
                      style={{ border: 'none', background: 'transparent' }}
                    >
                      📦 {deck.name} ({count})
                    </button>
                    <button 
                      onClick={() => handleDeleteDeck(deck.id, deck.name)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold px-1"
                      title="Xóa bộ thẻ này"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="toolbar mb-6 flex flex-wrap gap-4 justify-between items-center">
          <input 
            type="text" 
            placeholder="Tìm kiếm từ hoặc nghĩa..."
            className="search-input glass"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="filter-buttons flex gap-2">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Tất cả ({vocabList.length})
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'learning' ? 'active' : ''}`}
              onClick={() => setFilterStatus('learning')}
            >
              Đang học ({learningCount})
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'mastered' ? 'active' : ''}`}
              onClick={() => setFilterStatus('mastered')}
            >
              Đã thuộc ({masteredCount})
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'worst' ? 'active' : ''}`}
              onClick={() => setFilterStatus('worst')}
              style={{ 
                color: filterStatus === 'worst' ? '' : 'var(--color-error)',
                border: filterStatus === 'worst' ? '' : '1px dashed var(--color-error)',
                background: filterStatus === 'worst' ? 'rgba(239, 68, 68, 0.1)' : ''
              }}
            >
              🔴 Top 10 hay quên nhất
            </button>
          </div>
        </div>

        {/* Vocabulary List Table */}
        {filteredVocab.length === 0 ? (
          <div className="text-center p-10 color-text-muted">
            <span className="icon-huge block mb-2">🔍</span>
            Không tìm thấy từ vựng nào khớp với bộ lọc. Hãy đọc thêm bài đọc hoặc chọn bộ thẻ khác!
          </div>
        ) : (
          <div className="vocab-table-container">
            <table className="vocab-table">
              <thead>
                <tr>
                  <th>Từ vựng</th>
                  <th>Phiên âm (IPA)</th>
                  <th>Ý nghĩa</th>
                  <th>Phân bộ (Deck)</th>
                  <th>Thống kê</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredVocab.map((item, index) => {
                  const isDue = new Date(item.nextReviewDate) <= Date.now();
                  
                  return (
                    <tr key={index} className="vocab-row-tr">
                      <td data-label="Từ vựng" className="word-td">
                        <strong className="word-text-large">{item.word}</strong>
                        <div className="flex gap-1 mt-1">
                          <button className="speak-btn-sm" onClick={() => handleSpeak(item.word, 'US')} title="Mỹ (US)">🇺🇸</button>
                          <button className="speak-btn-sm" onClick={() => handleSpeak(item.word, 'UK')} title="Anh (UK)">🇬🇧</button>
                          <button className="speak-btn-sm" onClick={() => handleSpeakCompare(item.word)} title="So sánh">🆚</button>
                        </div>
                      </td>
                      <td data-label="IPA"><code className="ipa-code">{item.ipa}</code></td>
                      <td data-label="Ý nghĩa">
                        <span className="translation-text">{item.vietnamese}</span>
                        {item.example && <p className="example-text color-text-muted italic text-xs mt-1">"{item.example}"</p>}
                      </td>
                      <td data-label="Phân bộ">
                        <select
                          value={item.deckId || ''}
                          onChange={(e) => handleAssignWordDeck(item.word, e.target.value)}
                          className="btn-secondary text-xs"
                          style={{ padding: '4px 8px', background: 'var(--bg-dark)' }}
                        >
                          <option value="">(Không có bộ)</option>
                          {customDecks.map(deck => (
                            <option key={deck.id} value={deck.id}>
                              {deck.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Thống kê" className="text-xs color-text-muted">
                        <div>Lượt học: {item.repetitions || 0}</div>
                        <div style={{ color: (item.lowGradeCount || 0) > 0 ? 'var(--color-error)' : '' }}>
                          Số lần quên: <strong>{item.lowGradeCount || 0}</strong>
                        </div>
                      </td>
                      <td data-label="Hành động">
                        <div className="row-actions flex gap-2">
                          <button className="btn-row-action reset" onClick={() => handleResetWord(item)} title="Reset Spaced Repetition">
                            🔄 Reset
                          </button>
                          <button className="btn-row-action delete" onClick={() => handleDelete(item.word)} title="Xóa từ vựng">
                            🗑️ Xóa
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
    </div>
  );
}
