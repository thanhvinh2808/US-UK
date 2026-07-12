import React, { useState } from 'react';
import { storage } from '../utils/storage';

export default function VocabNotebook({ onNavigateBack, onSavedVocabChange }) {
  const [vocabList, setVocabList] = useState(() => storage.getSavedVocab());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, learning, mastered

  const handleSpeak = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDelete = (wordText) => {
    if (window.confirm(`Are you sure you want to remove "${wordText}" from your notebook?`)) {
      const newList = storage.deleteWord(wordText);
      setVocabList(newList);
      onSavedVocabChange();
    }
  };

  const handleResetWord = (wordObj) => {
    // Reset SM-2 values to initial state
    const updatedList = storage.resetWord(wordObj.word);
    setVocabList(updatedList);
    onSavedVocabChange();
  };

  // Filter & Search Logic
  const filteredVocab = vocabList.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.vietnamese.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'mastered') return matchesSearch && item.status === 'mastered';
    if (filterStatus === 'learning') return matchesSearch && item.status === 'learning';
    return matchesSearch;
  });

  const masteredCount = vocabList.filter(item => item.status === 'mastered').length;
  const learningCount = vocabList.filter(item => item.status === 'learning').length;

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
            <p className="color-text-muted text-sm">Total Words Saved</p>
          </div>
          <div className="notebook-stat-box text-center p-4 glass">
            <h3 style={{ color: 'var(--color-success)' }}>{masteredCount}</h3>
            <p className="color-text-muted text-sm">Mastered Words</p>
          </div>
          <div className="notebook-stat-box text-center p-4 glass">
            <h3 style={{ color: 'var(--color-warning)' }}>{learningCount}</h3>
            <p className="color-text-muted text-sm">Learning Words</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="toolbar mb-6 flex flex-wrap gap-4 justify-between items-center">
          <input 
            type="text" 
            placeholder="Search words or meanings..."
            className="search-input glass"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="filter-buttons flex gap-2">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({vocabList.length})
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'learning' ? 'active' : ''}`}
              onClick={() => setFilterStatus('learning')}
            >
              Learning ({learningCount})
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'mastered' ? 'active' : ''}`}
              onClick={() => setFilterStatus('mastered')}
            >
              Mastered ({masteredCount})
            </button>
          </div>
        </div>

        {/* Vocabulary List Table */}
        {filteredVocab.length === 0 ? (
          <div className="text-center p-10 color-text-muted">
            <span className="icon-huge block mb-2">🔍</span>
            No vocabulary matches found. Start reading passages to save new words!
          </div>
        ) : (
          <div className="vocab-table-container">
            <table className="vocab-table">
              <thead>
                <tr>
                  <th>Word</th>
                  <th>IPA</th>
                  <th>Meaning</th>
                  <th>Next Review</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVocab.map((item, index) => {
                  const isDue = new Date(item.nextReviewDate) <= Date.now();
                  
                  return (
                    <tr key={index} className="vocab-row-tr">
                      <td data-label="Word" className="word-td">
                        <strong className="word-text-large">{item.word}</strong>
                        <button className="speak-btn-sm" onClick={() => handleSpeak(item.word)}>🔊</button>
                      </td>
                      <td data-label="IPA"><code className="ipa-code">{item.ipa}</code></td>
                      <td data-label="Meaning">
                        <span className="translation-text">{item.vietnamese}</span>
                        {item.example && <p className="example-text color-text-muted italic text-xs mt-1">"{item.example}"</p>}
                      </td>
                      <td data-label="Next Review">
                        {isDue ? (
                          <span className="due-badge">Due Now</span>
                        ) : (
                          <span className="future-date">{new Date(item.nextReviewDate).toLocaleDateString()}</span>
                        )}
                      </td>
                      <td data-label="Status">
                        <span className={`status-pill ${item.status}`}>
                          {item.status}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="row-actions flex gap-2">
                          <button className="btn-row-action reset" onClick={() => handleResetWord(item)} title="Reset Spaced Repetition">
                            🔄 Reset
                          </button>
                          <button className="btn-row-action delete" onClick={() => handleDelete(item.word)} title="Remove Word">
                            🗑️ Delete
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
