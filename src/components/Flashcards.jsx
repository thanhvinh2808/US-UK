import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { playSound, vibrate } from '../utils/sounds';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export default function Flashcards({ onNavigateBack, onSavedVocabChange, showToast }) {
  const [savedVocab] = useState(() => storage.getSavedVocab());
  const [cloudSets, setCloudSets] = useState([]);
  const [gameState, setGameState] = useState('settings'); // settings, playing, finished
  
  // Settings state
  const [quizMode, setQuizMode] = useState('mixed'); // mixed, choice, spelling
  const [quizLength, setQuizLength] = useState(10);
  const [selectedDeckId, setSelectedDeckId] = useState('all');
  const [customDecks] = useState(() => storage.getCustomDecks());
  
  // Game playing state
  const [quizWords, setQuizWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [isEngToVi, setIsEngToVi] = useState(true);
  const [isSpellingQuestion, setIsSpellingQuestion] = useState(false);
  const [activePool, setActivePool] = useState([]); // tracks active vocab list filtered by deck
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [spellingInput, setSpellingInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const [score, setScore] = useState(0);
  const [resultsList, setResultsList] = useState([]); // [{ word, correct, userAnswer, isSpelling }]

  const currentWord = quizWords[currentIndex];

  // Fetch MongoDB Cloud Study Sets on mount
  useEffect(() => {
    async function loadCloudSets() {
      const data = await api.getStudySets();
      if (data && Array.isArray(data) && data.length > 0) {
        setCloudSets(data);
      }
    }
    loadCloudSets();
  }, []);

  // Initialize and shuffle quiz words based on settings
  const handleStartQuiz = () => {
    let vocabToUse = [];

    if (selectedDeckId.startsWith('cloud_')) {
      const cloudId = selectedDeckId.replace('cloud_', '');
      const foundSet = cloudSets.find(s => s._id === cloudId);
      if (foundSet && foundSet.cards) {
        vocabToUse = foundSet.cards.map(c => ({
          _id: c._id,
          setId: foundSet._id,
          word: c.termEn,
          vietnamese: c.definitionVi,
          ipa: c.ipaUs || c.ipaUk,
          example: c.exampleEn,
          topic: foundSet.title
        }));
      }
    } else {
      vocabToUse = selectedDeckId === 'all' 
        ? savedVocab 
        : savedVocab.filter(item => item.deckId === selectedDeckId);
    }

    if (vocabToUse.length < 4) {
      alert("Bộ thẻ này cần có ít nhất 4 từ để chơi flashcards.");
      return;
    }
    
    // Shuffle and slice vocab list
    const shuffled = [...vocabToUse].sort(() => 0.5 - Math.random());
    const length = Math.min(quizLength, shuffled.length);
    const selected = shuffled.slice(0, length);
    
    setActivePool(vocabToUse);
    setQuizWords(selected);
    setCurrentIndex(0);
    setScore(0);
    setResultsList([]);
    setGameState('playing');
    setupQuestion(selected[0], 0, vocabToUse);
  };

  // Setup the current question properties
  const setupQuestion = (word, index, vocabToUse = activePool) => {
    setSelectedOption(null);
    setSpellingInput('');
    setChecked(false);
    setIsCorrect(false);

    // Determine if it is a spelling question
    let isSpelling = false;
    if (quizMode === 'spelling') {
      isSpelling = true;
    } else if (quizMode === 'mixed') {
      isSpelling = Math.random() > 0.5;
    }
    setIsSpellingQuestion(isSpelling);

    const pool = vocabToUse && vocabToUse.length >= 4 ? vocabToUse : savedVocab;

    if (!isSpelling) {
      // Multiple choice settings
      const engToVi = Math.random() > 0.5;
      setIsEngToVi(engToVi);
      
      // Generate 4 options
      const distractors = pool
        .filter(item => item.word.toLowerCase() !== word.word.toLowerCase())
        .map(item => engToVi ? item.vietnamese : item.word);
      
      const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
      const correctOption = engToVi ? word.vietnamese : word.word;
      
      const options = [correctOption, ...shuffledDistractors].sort(() => 0.5 - Math.random());
      setCurrentOptions(options);
    }
  };

  const handleSelectOption = (option) => {
    if (checked) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (checked) return;
    
    let correct = false;
    const answer = isSpellingQuestion ? spellingInput.trim() : selectedOption;
    
    if (!answer) {
      showToast("Vui lòng nhập hoặc chọn câu trả lời!", "info");
      return;
    }

    if (isSpellingQuestion) {
      correct = answer.toLowerCase() === currentWord.word.toLowerCase();
    } else {
      const correctAnswer = isEngToVi ? currentWord.vietnamese : currentWord.word;
      correct = answer === correctAnswer;
    }

    setIsCorrect(correct);
    setChecked(true);
    
    // Update score
    if (correct) {
      setScore(prev => prev + 1);
      playSound('correct');
      vibrate(50);
    } else {
      playSound('incorrect');
      vibrate([50, 50, 50]);
    }

    // Save result item for summary
    setResultsList(prev => [
      ...prev,
      {
        word: currentWord,
        correct,
        userAnswer: answer,
        isSpelling: isSpellingQuestion
      }
    ]);

    // Update SM-2 spaced repetition status in database
    const grade = correct ? 5 : 1; // 5 (Easy/Good) if correct, 1 (Again/Reset) if wrong
    storage.updateWordProgress(currentWord.word, grade);

    if (!correct) {
      storage.saveMistake({
        module: 'flashcards',
        skill: isSpellingQuestion ? 'Chính tả (Spelling)' : 'Từ vựng (Vocabulary)',
        question: isSpellingQuestion
          ? `Chính tả từ: "${currentWord.vietnamese || currentWord.word}"`
          : (isEngToVi ? `Nghĩa của từ: "${currentWord.word}"` : `Từ tiếng Anh của: "${currentWord.vietnamese}"`),
        userAnswer: answer,
        correctAnswer: isSpellingQuestion ? currentWord.word : (isEngToVi ? currentWord.vietnamese : currentWord.word)
      });
    }

    if (onSavedVocabChange) onSavedVocabChange();
  };

  const handleNextQuestion = () => {
    if (currentIndex < quizWords.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setupQuestion(quizWords[nextIndex], nextIndex);
    } else {
      // Finished
      setGameState('finished');
      const finalScoreRatio = (score + (isCorrect ? 0 : 0)) / quizWords.length; // score already updated
      if (finalScoreRatio >= 0.8) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        playSound('complete');
      }
    }
  };

  // Keyboard shortcut to select options (1-4), submit (Enter), or advance to next question
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;

      const activeTag = document.activeElement?.tagName;
      const isEditable = document.activeElement?.isContentEditable;
      const isTypingInField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || isEditable;

      // Don't trigger 1-4 shortcut if typing in any text input
      if (isTypingInField && !isSpellingQuestion) return;
      if (isSpellingQuestion && isTypingInField && e.key !== 'Enter') return;

      if (!checked && !isSpellingQuestion && !isTypingInField) {
        if (e.key === '1' && currentOptions[0]) handleSelectOption(currentOptions[0]);
        if (e.key === '2' && currentOptions[1]) handleSelectOption(currentOptions[1]);
        if (e.key === '3' && currentOptions[2]) handleSelectOption(currentOptions[2]);
        if (e.key === '4' && currentOptions[3]) handleSelectOption(currentOptions[3]);
      }

      if (e.key === 'Enter') {
        if (!checked) {
          if (isSpellingQuestion && spellingInput.trim()) {
            handleSubmitAnswer();
          } else if (!isSpellingQuestion && selectedOption && !isTypingInField) {
            handleSubmitAnswer();
          }
        } else {
          handleNextQuestion();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, checked, selectedOption, spellingInput, isSpellingQuestion, currentOptions]);

  // 1. Settings screen
  if (gameState === 'settings') {
    const canPlay = savedVocab.length >= 4;
    return (
      <div className="asymmetric-layout animate-slideup max-w-5xl mx-auto">
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
          <div className="hero-badge-tag">ANTIGRAVITY FLASHCARDS STUDIO</div>
          <h1 className="hero-main-title">Trắc nghiệm & Ôn tập từ vựng</h1>
          <p className="hero-main-sub">
            Ôn tập từ vựng đã lưu bằng hệ thống trắc nghiệm đa năng 4 lựa chọn và điền từ ngắt quãng Spaced Repetition.
          </p>
        </div>

        {/* 📐 Asymmetric 2-Column Split Body */}
        <div className="asymmetric-body-grid">
          {/* 📌 Left Narrow Vertical Stats Column */}
          <aside className="vertical-stats-sidebar">
            <div className="stats-sidebar-card glass">
              <h3 className="stats-sidebar-header">THỐNG KÊ FLASHCARDS</h3>
              
              <div className="vertical-stat-item notebook">
                <span className="stat-icon">📖</span>
                <div className="stat-info">
                  <span className="stat-value-mono">{savedVocab.length} từ</span>
                  <span className="stat-sub">Trong sổ tay cá nhân</span>
                </div>
              </div>

              <div className="vertical-stat-item level">
                <span className="stat-icon">☁️</span>
                <div className="stat-info">
                  <span className="stat-value-mono">{cloudSets.length} bộ</span>
                  <span className="stat-sub">Cloud Study Sets</span>
                </div>
              </div>

              <div className="vertical-stat-item streak">
                <span className="stat-icon">⚡</span>
                <div className="stat-info">
                  <span className="stat-value-mono">{quizMode.toUpperCase()}</span>
                  <span className="stat-sub">Chế độ đang chọn</span>
                </div>
              </div>
            </div>
          </aside>

          {/* 📚 Right Wide Main Workspace */}
          <main className="asymmetric-gallery-main">
            <div className="quiz-card glass p-8 text-center bg-white rounded-xl">
              <h2 className="text-2xl font-bold mb-2 color-text-dark" style={{ fontSize: '1.6rem', fontWeight: '800' }}>Cấu hình bài ôn tập</h2>
              <p className="color-text-muted text-xs mb-6" style={{ fontSize: '13px', fontWeight: '400' }}>
                Chọn bộ từ vựng, hình thức thử thách và số lượng câu để bắt đầu.
              </p>

              {!canPlay && (
                <div className="quiz-alert-info p-4 mb-6 text-left rounded-lg bg-amber-50 border-l-4 border-amber-500">
                  <strong className="block text-amber-900 text-sm mb-1">Chưa đủ từ vựng:</strong>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Bạn cần lưu ít nhất <strong>4 từ vựng</strong> vào sổ tay để kích hoạt tính năng Trắc nghiệm. Hiện tại bạn đã lưu <strong>{savedVocab.length}</strong> từ.
                  </p>
                  <p className="mt-2 text-xs text-amber-700">
                    Mẹo: Hãy mở bài đọc (Reading) và chạm vào từ mới để lưu vào sổ tay nhé!
                  </p>
                </div>
              )}

              {canPlay ? (
                <div className="quiz-settings-form text-left p-5 mb-6 bg-slate-50 rounded-lg">
                  <h3 className="text-xs font-mono font-bold mb-4 color-text-muted uppercase tracking-wider">CẤU HÌNH PHÒNG ĐẤU:</h3>
                  
                  {/* Mode Select */}
                  <div className="mb-4">
                    <label className="text-xs color-text-muted block mb-1 font-medium">Chế độ thử thách:</label>
                    <div className="quiz-modes-container flex gap-2">
                      <button 
                        className={`btn-secondary text-xs flex-1 ${quizMode === 'mixed' ? 'active' : ''}`}
                        onClick={() => setQuizMode('mixed')}
                      >
                        Hỗn hợp
                      </button>
                      <button 
                        className={`btn-secondary text-xs flex-1 ${quizMode === 'choice' ? 'active' : ''}`}
                        onClick={() => setQuizMode('choice')}
                      >
                        4 Đáp án
                      </button>
                      <button 
                        className={`btn-secondary text-xs flex-1 ${quizMode === 'spelling' ? 'active' : ''}`}
                        onClick={() => setQuizMode('spelling')}
                      >
                        Viết từ
                      </button>
                    </div>
                  </div>

                  {/* Deck Select */}
                  <div className="mb-4">
                    <label className="text-xs color-text-muted block mb-1 font-medium">Chọn bộ từ vựng (Custom Deck):</label>
                    <select
                      value={selectedDeckId}
                      onChange={(e) => setSelectedDeckId(e.target.value)}
                      className="search-input w-full"
                    >
                      <option value="all">Sổ tay cá nhân ({savedVocab.length} từ)</option>
                      
                      {cloudSets.length > 0 && (
                        <optgroup label="MongoDB Cloud Study Sets">
                          {cloudSets.map(set => (
                            <option key={set._id} value={`cloud_${set._id}`}>
                              {set.title} ({set.cards?.length || 0} từ) [{set.levelTag || 'C1'}]
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {customDecks.length > 0 && (
                        <optgroup label="Custom Decks">
                          {customDecks.map(deck => {
                            const count = savedVocab.filter(item => item.deckId === deck.id).length;
                            return (
                              <option key={deck.id} value={deck.id}>
                                {deck.name} ({count} từ)
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                    </select>
                    {selectedDeckId !== 'all' && savedVocab.filter(item => item.deckId === selectedDeckId).length < 4 && (
                      <small className="block mt-1 text-xs" style={{ color: 'var(--color-error)' }}>
                        Bộ từ này có ít hơn 4 từ. Hãy thêm thêm từ trước khi ôn tập!
                      </small>
                    )}
                  </div>

                  {/* Length Select */}
                  <div>
                    <label className="text-xs color-text-muted block mb-1 font-medium">Số lượng câu hỏi:</label>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20].map((num) => {
                        const currentPoolSize = selectedDeckId === 'all' 
                          ? savedVocab.length 
                          : (selectedDeckId.startsWith('cloud_') 
                            ? (cloudSets.find(s => s._id === selectedDeckId.replace('cloud_', ''))?.cards?.length || 0)
                            : savedVocab.filter(item => item.deckId === selectedDeckId).length);
                        const disabled = currentPoolSize < num;
                        return (
                          <button
                            key={num}
                            disabled={disabled}
                            className={`btn-secondary text-xs flex-1 ${quizLength === num ? 'active' : ''}`}
                            onClick={() => setQuizLength(num)}
                            style={{ opacity: disabled ? 0.4 : 1 }}
                          >
                            {num} câu
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              <button 
                className="btn-primary w-full justify-center py-3"
                disabled={!canPlay}
                onClick={handleStartQuiz}
                style={{ opacity: canPlay ? 1 : 0.5, cursor: canPlay ? 'pointer' : 'not-allowed' }}
              >
                Bắt đầu trắc nghiệm
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 2. Play screen
  if (gameState === 'playing' && currentWord) {
    return (
      <div className="quiz-screen animate-slideup max-w-xl mx-auto mt-6">
        {/* Header */}
        <div className="screen-header mb-4 flex justify-between items-center text-sm color-text-muted">
          <span>Câu hỏi <strong>{currentIndex + 1}</strong> / {quizWords.length}</span>
          <span>Điểm số: <strong style={{ color: 'var(--color-success)' }}>{score}</strong></span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container mb-6">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${((currentIndex) / quizWords.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="quiz-card glass p-6 mb-6">
          {/* Question Text */}
          <div className="question-prompt text-center mb-6">
            <span className="badge-pos mb-2" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-primary)', border: 'none' }}>
              {isSpellingQuestion ? 'Thử thách Viết' : 'Trắc nghiệm'}
            </span>
            
            <h2 className="mt-2 text-xl font-bold color-text-main leading-relaxed">
              {isSpellingQuestion ? (
                <>Dịch từ này sang tiếng Anh:</>
              ) : isEngToVi ? (
                <>Nghĩa của từ này là gì?</>
              ) : (
                <>Từ nào có nghĩa là:</>
              )}
            </h2>
            
            <h1 className="text-3xl font-extrabold text-gradient mt-4 mb-2">
              {isSpellingQuestion ? currentWord.vietnamese : (isEngToVi ? currentWord.word : currentWord.vietnamese)}
            </h1>

            {isSpellingQuestion && currentWord.ipa && (
              <span className="result-ipa mt-1">{currentWord.ipa}</span>
            )}
            
            <p className="color-text-muted text-xs mt-3">Chủ đề: {currentWord.topic}</p>
          </div>

          {/* Answer Input/Buttons */}
          {isSpellingQuestion ? (
            <div className="spelling-answer-container mb-6">
              <input
                type="text"
                className="translator-input w-full glass text-center font-bold"
                style={{ fontSize: '18px', padding: '12px' }}
                placeholder="Gõ từ tiếng Anh vào đây..."
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                disabled={checked}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          ) : (
            <div className="choice-options-grid flex flex-col gap-3 mb-6">
              {currentOptions.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrectAns = isEngToVi ? option === currentWord.vietnamese : option === currentWord.word;
                
                let btnStyle = {};
                let labelClass = "";
                
                if (checked) {
                  if (isCorrectAns) {
                    btnStyle = { borderColor: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' };
                  } else if (isSelected) {
                    btnStyle = { borderColor: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' };
                  } else {
                    btnStyle = { opacity: 0.5 };
                  }
                } else if (isSelected) {
                  btnStyle = { borderColor: 'var(--color-primary)', background: 'var(--color-primary-glow)' };
                }

                return (
                  <button
                    key={idx}
                    className="btn-secondary text-left w-full p-4 flex justify-between items-center transition-all"
                    style={{ borderRadius: 'var(--radius-md)', fontSize: '16px', fontWeight: '500', ...btnStyle }}
                    onClick={() => handleSelectOption(option)}
                    disabled={checked}
                  >
                    <span>{option}</span>
                    {checked && isCorrectAns && <span style={{ color: 'var(--color-success)' }}>✓</span>}
                    {checked && isSelected && !isCorrectAns && <span style={{ color: 'var(--color-error)' }}>✕</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Submission Feedback */}
          {checked && (
            <div 
              className="feedback-alert p-4 glass-glow rounded mb-6 animate-slideup"
              style={{ 
                borderLeft: `4px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
                background: isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)'
              }}
            >
              <h4 className="font-bold mb-1" style={{ color: isCorrect ? 'var(--color-success)' : 'var(--color-error)' }}>
                {isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
              </h4>
              <div className="text-sm color-text-main mt-2">
                <div>• Từ vựng: <strong>{currentWord.word}</strong> <span className="color-text-muted">{currentWord.ipa}</span></div>
                <div>• Nghĩa tiếng Việt: <strong>{currentWord.vietnamese}</strong></div>
                {currentWord.example && (
                  <div className="mt-2 italic text-xs color-text-muted">Ví dụ: "{currentWord.example}"</div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="action-area">
            {!checked ? (
              <button 
                className="btn-primary w-full justify-center py-3"
                disabled={isSpellingQuestion ? !spellingInput.trim() : !selectedOption}
                onClick={handleSubmitAnswer}
              >
                Kiểm tra câu trả lời
              </button>
            ) : (
              <button 
                className="btn-primary w-full justify-center py-3"
                onClick={handleNextQuestion}
              >
                {currentIndex < quizWords.length - 1 ? 'Tiếp theo →' : 'Xem kết quả kết thúc'}
              </button>
            )}
            <p className="text-center color-text-muted text-xxs mt-3">Mẹo: Bạn có thể nhấn phím <strong>Enter</strong> để kiểm tra nhanh và chuyển câu hỏi.</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Finished Summary screen
  if (gameState === 'finished') {
    const finalScore = score;
    const totalQuestions = quizWords.length;
    const percentage = Math.round((finalScore / totalQuestions) * 100);
    const xpEarned = finalScore * 15; // 15 XP per correct answer

    return (
      <div className="quiz-screen animate-slideup max-w-xl mx-auto mt-6">
        <div className="quiz-card glass p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base mb-3">✓</div>
          <h2 className="text-gradient mt-2 mb-2">Hoàn thành Trắc nghiệm!</h2>
          <p className="color-text-muted mb-6">Bạn đã kết thúc lượt ôn tập từ vựng cá nhân.</p>

          {/* Radial score progress */}
          <div className="score-radial-progress mb-6 flex flex-col items-center">
            <div className="score-percentage" style={{ fontSize: '42px', fontWeight: '900', color: percentage >= 80 ? 'var(--color-success)' : 'var(--color-secondary)' }}>
              {percentage}%
            </div>
            <div className="score-label mt-1 text-sm color-text-muted">Độ chính xác ({finalScore}/{totalQuestions} câu đúng)</div>
          </div>

          <p className="xp-gain-text mb-6">Bạn được cộng thêm <strong>+{xpEarned} XP</strong> vào tài khoản học.</p>

          {/* Detail Results Table */}
          <div className="results-summary-table text-left mb-8">
            <h3 className="text-sm font-semibold mb-3 color-text-main">CHI TIẾT BÀI LÀM:</h3>
            <div className="glass p-3 rounded" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {resultsList.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center py-2 border-b border-light last:border-0"
                  style={{ fontSize: '14px' }}
                >
                  <div>
                    <strong className={item.correct ? 'color-text-main' : 'color-text-muted'}>{item.word.word}</strong>
                    <span className="text-xs color-text-muted block">{item.word.vietnamese}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xxs badge-pos" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: 'none' }}>
                      {item.isSpelling ? 'Viết' : 'Trắc nghiệm'}
                    </span>
                    <span style={{ 
                      color: item.correct ? 'var(--color-success)' : 'var(--color-error)',
                      fontWeight: 'bold'
                    }}>
                      {item.correct ? 'Đúng' : 'Sai'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex-1 justify-center py-3" onClick={() => setGameState('settings')}>
              Luyện tập lại
            </button>
            <button className="btn-primary flex-1 justify-center py-3" onClick={onNavigateBack}>
              Quay về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
