import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { playSound, vibrate } from '../utils/sounds';
import confetti from 'canvas-confetti';

export default function Flashcards({ onNavigateBack, onSavedVocabChange, showToast }) {
  const [savedVocab, setSavedVocab] = useState(() => storage.getSavedVocab());
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

  // Initialize and shuffle quiz words based on settings
  const handleStartQuiz = () => {
    const vocabToUse = selectedDeckId === 'all' 
      ? savedVocab 
      : savedVocab.filter(item => item.deckId === selectedDeckId);

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
    onSavedVocabChange();
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

  // Keyboard shortcut to submit or skip to next question
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;
      if (e.key === 'Enter') {
        if (!checked) {
          if (isSpellingQuestion && spellingInput.trim()) {
            handleSubmitAnswer();
          } else if (!isSpellingQuestion && selectedOption) {
            handleSubmitAnswer();
          }
        } else {
          handleNextQuestion();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, checked, selectedOption, spellingInput, isSpellingQuestion]);

  // 1. Settings screen
  if (gameState === 'settings') {
    const canPlay = savedVocab.length >= 4;
    return (
      <div className="quiz-screen animate-slideup max-w-xl mx-auto mt-6">
        <div className="screen-header mb-6 flex justify-between items-center">
          <button className="btn-secondary" onClick={onNavigateBack}>
            ← Quay về trang chủ
          </button>
          <span className="badge-level">Đấu trường</span>
        </div>

        <div className="quiz-card glass p-8 text-center">
          <span className="icon-huge">🎯</span>
          <h2 className="text-gradient mt-4 mb-2">Đấu trường Trắc nghiệm từ vựng</h2>
          <p className="color-text-muted mb-6">Ôn tập các từ vựng bạn đã lưu bằng chế độ trắc nghiệm đa năng và điền từ thông minh.</p>

          {canPlay ? (
            <div className="quiz-settings-form text-left glass p-5 mb-6">
              <h3 className="text-sm font-semibold mb-4 color-text-main">CẤU HÌNH PHÒNG ĐẤU:</h3>
              
              {/* Mode Select */}
              <div className="mb-4">
                <label className="text-xs color-text-muted block mb-1">Chế độ thử thách:</label>
                <div className="flex gap-2">
                  <button 
                    className={`btn-secondary text-xs flex-1 ${quizMode === 'mixed' ? 'active pulse-border' : ''}`}
                    style={{ borderColor: quizMode === 'mixed' ? 'var(--color-primary)' : '' }}
                    onClick={() => setQuizMode('mixed')}
                  >
                    🎲 Hỗn hợp
                  </button>
                  <button 
                    className={`btn-secondary text-xs flex-1 ${quizMode === 'choice' ? 'active pulse-border' : ''}`}
                    style={{ borderColor: quizMode === 'choice' ? 'var(--color-primary)' : '' }}
                    onClick={() => setQuizMode('choice')}
                  >
                    🔘 Trắc nghiệm 4 đáp án
                  </button>
                  <button 
                    className={`btn-secondary text-xs flex-1 ${quizMode === 'spelling' ? 'active pulse-border' : ''}`}
                    style={{ borderColor: quizMode === 'spelling' ? 'var(--color-primary)' : '' }}
                    onClick={() => setQuizMode('spelling')}
                  >
                    ✍️ Tự gõ từ (Viết)
                  </button>
                </div>
              </div>

              {/* Deck Select */}
              <div className="mb-4">
                <label className="text-xs color-text-muted block mb-1">Chọn bộ từ vựng (Custom Deck):</label>
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="btn-secondary w-full"
                  style={{ padding: '8px 12px', background: 'var(--bg-dark)', color: 'var(--color-text-main)', border: '1px solid var(--border-light)' }}
                >
                  <option value="all">Tất cả thẻ từ vựng ({savedVocab.length})</option>
                  {customDecks.map(deck => {
                    const count = savedVocab.filter(item => item.deckId === deck.id).length;
                    return (
                      <option key={deck.id} value={deck.id}>
                        📦 {deck.name} ({count} từ)
                      </option>
                    );
                  })}
                </select>
                {selectedDeckId !== 'all' && savedVocab.filter(item => item.deckId === selectedDeckId).length < 4 && (
                  <small className="block mt-1" style={{ color: 'var(--color-error)' }}>
                    ⚠️ Bộ từ này có ít hơn 4 từ. Hãy thêm thêm từ trước khi ôn tập!
                  </small>
                )}
              </div>

              {/* Length Select */}
              <div>
                <label className="text-xs color-text-muted block mb-1">Số lượng câu hỏi:</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((num) => {
                    const currentPoolSize = selectedDeckId === 'all' 
                      ? savedVocab.length 
                      : savedVocab.filter(item => item.deckId === selectedDeckId).length;
                    const disabled = currentPoolSize < num;
                    return (
                      <button
                        key={num}
                        disabled={disabled}
                        className={`btn-secondary text-xs flex-1 ${quizLength === num ? 'active pulse-border' : ''}`}
                        style={{ 
                          borderColor: quizLength === num ? 'var(--color-primary)' : '',
                          opacity: disabled ? 0.3 : 1
                        }}
                        onClick={() => setQuizLength(num)}
                      >
                        {num} câu
                      </button>
                    );
                  })}
                </div>
                <small className="color-text-muted mt-2 block text-xs">
                  (Từ có thể ôn tập trong bộ đã chọn: <strong>{
                    selectedDeckId === 'all' 
                      ? savedVocab.length 
                      : savedVocab.filter(item => item.deckId === selectedDeckId).length
                  }</strong> từ)
                </small>
              </div>
            </div>
          ) : (
            <div className="alert-unsupported p-5 glass mb-6 text-center">
              ⚠️ <strong>Không đủ từ vựng:</strong> Bạn cần lưu ít nhất <strong>4 từ vựng</strong> vào sổ tay để kích hoạt tính năng Trắc nghiệm. Hiện tại bạn mới lưu <strong>{savedVocab.length}</strong> từ.
              <p className="mt-2 text-xs color-text-muted">Mẹo: Hãy đọc các bài viết (Reading) và chạm vào từ mới để lưu từ vào sổ tay nhé!</p>
            </div>
          )}

          <button 
            className="btn-primary w-full justify-center py-3" 
            disabled={!canPlay}
            onClick={handleStartQuiz}
          >
            🚀 Bắt đầu đấu trường
          </button>
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
              {isSpellingQuestion ? '✍️ Thử thách Viết' : '🔘 Trắc nghiệm chọn'}
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
                {isCorrect ? '🎉 Trả lời chính xác!' : '😢 Trả lời sai mất rồi'}
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
          <span className="icon-huge">{percentage >= 80 ? '🏆' : '👍'}</span>
          <h2 className="text-gradient mt-4 mb-2">Hoàn thành Trắc nghiệm!</h2>
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
            <h3 className="text-sm font-semibold mb-3 color-text-main">CHI TIẾT PHÒNG ĐẤU:</h3>
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
              🔄 Luyện lại
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
