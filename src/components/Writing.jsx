import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export default function Writing({ topic, onNavigateBack }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  // States for sentence_ordering
  const [orderedWords, setOrderedWords] = useState([]);
  
  // Assessment states
  const [checked, setChecked] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [scores, setScores] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const exercises = topic.writing_exercises;
  const exercise = exercises[currentIdx];

  // Reset answer states when moving to next exercise
  useEffect(() => {
    if (exercise) {
      setUserAnswer('');
      setOrderedWords([]);
      setChecked(false);
      setFeedback(null);
      setCurrentScore(0);
    }
  }, [currentIdx]);

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Word Tapping Logic for Sentence Ordering
  const handleWordTap = (word, wordIdx) => {
    if (orderedWords.some(w => w.idx === wordIdx)) return; // Prevent double taps
    setOrderedWords([...orderedWords, { word, idx: wordIdx }]);
  };

  const handleClearLastWord = () => {
    setOrderedWords(orderedWords.slice(0, -1));
  };

  const handleResetWords = () => {
    setOrderedWords([]);
  };

  // Free Writing assessment logic
  const checkFreeWriting = (text, ex) => {
    const cleanText = text.trim();
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const matchedKeywords = ex.required_keywords.filter(kw => 
      cleanText.toLowerCase().includes(kw.toLowerCase())
    );

    const meetsLength = wordCount >= ex.min_words;
    const hasKeyword = matchedKeywords.length > 0;

    // Award partial scores
    const score = (meetsLength ? 0.5 : 0) + (hasKeyword ? 0.5 : 0);

    return {
      passed: meetsLength && hasKeyword,
      meetsLength,
      wordCount,
      hasKeyword,
      matchedKeywords,
      score
    };
  };

  const handleCheck = () => {
    if (exercise.type === 'fill_blank') {
      const isCorrect = userAnswer.trim().toLowerCase() === exercise.answer.toLowerCase();
      setCurrentScore(isCorrect ? 1 : 0);
      setChecked(true);
      setFeedback({
        status: isCorrect ? 'correct' : 'incorrect',
        text: isCorrect 
          ? "Chính xác! Bạn chia động từ rất chuẩn." 
          : `Chưa chính xác. Động từ đúng phải là: "${exercise.answer}".`
      });
    } 
    else if (exercise.type === 'sentence_ordering') {
      const composed = orderedWords.map(w => w.word).join(' ').trim().toLowerCase().replace(/[.]/g, "");
      const target = exercise.answer.toLowerCase().replace(/[.]/g, "").trim();
      const isCorrect = composed === target;
      
      setCurrentScore(isCorrect ? 1 : 0);
      setChecked(true);
      setFeedback({
        status: isCorrect ? 'correct' : 'incorrect',
        text: isCorrect 
          ? "Chính xác! Cấu trúc câu ghép rất hoàn chỉnh." 
          : `Chưa chính xác. Câu đúng là: "${exercise.answer}"`
      });
    } 
    else if (exercise.type === 'free_writing') {
      const result = checkFreeWriting(userAnswer, exercise);
      setCurrentScore(result.score);
      setChecked(true);
      setFeedback({
        status: result.passed ? 'correct' : 'partial',
        text: result.passed 
          ? `Đạt yêu cầu! Bạn đã viết được ${result.wordCount} từ và tích hợp các từ khóa thành công.` 
          : `Bài viết chưa đạt đủ tiêu chí. Vui lòng rà soát lại số từ hoặc từ khóa bắt buộc.`
      });
    }
  };

  const handleNext = () => {
    const updatedScores = [...scores, currentScore];
    setScores(updatedScores);

    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Complete writing exercise
      const avgScore = updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;
      storage.updateTopicProgress(topic.id, 'writing', avgScore);
      setIsFinished(true);
    }
  };

  const handleSkip = () => {
    const updatedScores = [...scores, 0];
    setScores(updatedScores);

    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      const avgScore = updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;
      storage.updateTopicProgress(topic.id, 'writing', avgScore);
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const finalScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const xpEarned = Math.round(finalScore * 100);

    return (
      <div className="writing-finished glass-glow p-8 text-center max-w-xl mx-auto mt-10 animate-slideup">
        <span className="icon-huge">✍️</span>
        <h2 className="text-gradient mt-4 mb-2">Writing Lab Completed!</h2>
        <p className="color-text-muted mb-6">Topic: {topic.topic}</p>

        <div className="score-radial-progress mb-6">
          <div className="score-percentage">{Math.round(finalScore * 100)}%</div>
          <div className="score-label">Writing Score</div>
        </div>

        <p className="xp-gain-text mb-8">You earned <strong>+{xpEarned} XP</strong></p>

        <button className="btn-primary" onClick={onNavigateBack}>
          Quay lại Bảng bài học 🚀
        </button>
      </div>
    );
  }

  return (
    <div className="writing-screen animate-slideup">
      {/* Header */}
      <div className="screen-header mb-6">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Back to Dashboard
        </button>
        <div className="topic-meta">
          <span className="badge-level">{topic.level}</span>
          <span className="topic-name">{topic.topic}</span>
        </div>
      </div>

      <div className="writing-layout glass p-6 max-w-2xl mx-auto">
        <div className="progress-bar-container mb-6">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentIdx / exercises.length) * 100}%` }}
          />
          <span className="progress-text">Bài tập {currentIdx + 1} của {exercises.length}</span>
        </div>

        <h3 className="section-title mb-6">Writing & Grammar Lab</h3>

        {/* 1. FILL BLANK EXERCISE */}
        {exercise.type === 'fill_blank' && (
          <div className="exercise-card mb-6 animate-slideup">
            <p className="color-text-muted mb-4">Điền từ chia động từ đúng ngữ pháp vào chỗ trống:</p>
            
            <div className="sentence-fill-box p-5 glass mb-6 text-lg">
              <span>{exercise.sentence_parts[0]}</span>
              <input 
                type="text" 
                className="fill-blank-input inline-input glass" 
                placeholder="chia động từ..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={checked}
                style={{
                  borderBottom: checked ? '2px solid var(--color-text-muted)' : '2px solid var(--color-primary)',
                  display: 'inline-block',
                  width: '150px',
                  textAlign: 'center',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600'
                }}
              />
              <span>{exercise.sentence_parts[1]}</span>
            </div>

            {exercise.hint && !checked && (
              <p className="text-xs italic color-text-muted mb-4">💡 Gợi ý: {exercise.hint}</p>
            )}
          </div>
        )}

        {/* 2. SENTENCE ORDERING EXERCISE */}
        {exercise.type === 'sentence_ordering' && (
          <div className="exercise-card mb-6 animate-slideup">
            <p className="color-text-muted mb-4">Sắp xếp các từ dưới đây để tạo thành một câu hoàn chỉnh:</p>

            {/* Composed Sentence Display Box */}
            <div className="composed-sentence-box p-5 glass mb-6 min-h-20 text-lg font-semibold color-text-dark">
              {orderedWords.length > 0 ? (
                orderedWords.map(w => w.word).join(' ') + '.'
              ) : (
                <span className="color-text-muted italic text-base">Nhấp các nút từ bên dưới để ghép câu...</span>
              )}
            </div>

            {/* Tap controls */}
            {orderedWords.length > 0 && !checked && (
              <div className="flex gap-2 mb-6">
                <button className="btn-secondary text-xs" onClick={handleClearLastWord}>⌫ Xóa từ cuối</button>
                <button className="btn-secondary text-xs" onClick={handleResetWords}>🔄 Đặt lại từ đầu</button>
              </div>
            )}

            {/* Word Chips Pool */}
            <div className="words-pool flex flex-wrap gap-2 mb-6">
              {exercise.words.map((word, idx) => {
                const isSelected = orderedWords.some(w => w.idx === idx);
                return (
                  <button
                    key={idx}
                    className={`btn-secondary ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleWordTap(word, idx)}
                    disabled={isSelected || checked}
                    style={{
                      opacity: isSelected ? 0.3 : 1,
                      cursor: isSelected ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      padding: '8px 16px'
                    }}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. FREE WRITING EXERCISE */}
        {exercise.type === 'free_writing' && (
          <div className="exercise-card mb-6 animate-slideup">
            <p className="color-text-muted mb-3"><strong>Yêu cầu viết tự do:</strong></p>
            <div className="prompt-box p-4 glass-glow mb-4">
              <p className="color-text-dark font-semibold">{exercise.prompt_vi}</p>
            </div>

            {/* Keyword badges and status checking */}
            <div className="criteria-box flex flex-wrap gap-4 mb-4 text-xs">
              <span className="color-text-muted block w-full mb-1">Tiêu chí chấm điểm:</span>
              <div className="criterion-pill status-badge" style={{ borderColor: userAnswer.trim().split(/\s+/).filter(Boolean).length >= exercise.min_words ? 'var(--color-success)' : 'var(--border-light)' }}>
                📝 Độ dài: {userAnswer.trim().split(/\s+/).filter(Boolean).length} / {exercise.min_words} từ
              </div>
              <div className="criterion-pill status-badge" style={{ borderColor: exercise.required_keywords.some(kw => userAnswer.toLowerCase().includes(kw.toLowerCase())) ? 'var(--color-success)' : 'var(--border-light)' }}>
                🔑 Có chứa từ khóa bắt buộc
              </div>
            </div>

            <div className="keywords-required flex flex-wrap gap-2 mb-6">
              <span className="text-xs color-text-muted block w-full mb-1">Từ khóa gợi ý (Dùng ít nhất 1):</span>
              {exercise.required_keywords.map((kw, idx) => {
                const isIncluded = userAnswer.toLowerCase().includes(kw.toLowerCase());
                return (
                  <span 
                    key={idx} 
                    className="badge-level"
                    style={{ 
                      backgroundColor: isIncluded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: isIncluded ? 'var(--color-success)' : 'var(--color-text-muted)',
                      borderColor: isIncluded ? 'var(--color-success)' : 'var(--border-light)'
                    }}
                  >
                    {kw}
                  </span>
                );
              })}
            </div>

            <div className="input-box mb-6">
              <textarea
                className="dictation-textarea"
                placeholder="Write your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={checked}
              />
            </div>
          </div>
        )}

        {/* FEEDBACK ASSESSMENT BLOCK */}
        {checked && feedback && (
          <div className="assessment-results-card glass-glow p-5 mb-6 animate-slideup"
               style={{ borderLeft: `4px solid ${feedback.status === 'correct' ? 'var(--color-success)' : 'var(--color-error)'}` }}>
            <div className="score-summary mb-2">
              <h4 className="font-bold flex items-center gap-2">
                {feedback.status === 'correct' ? '🎉 Chính xác!' : '⚠️ Gợi ý bổ sung'}
              </h4>
            </div>
            <p className="color-text-muted mt-2 text-sm">{feedback.text}</p>

            {exercise.type !== 'free_writing' && (
              <div className="target-reveal mt-4 p-3 glass flex justify-between items-center">
                <div>
                  <strong>Đáp án chuẩn:</strong>
                  <p className="mt-1 color-text-main font-semibold">"{exercise.answer}"</p>
                </div>
                <button className="speak-btn-sm" onClick={() => handleSpeak(exercise.answer)} title="Nghe đáp án mẫu">
                  🔊
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action button bar */}
        <div className="action-buttons">
          {!checked ? (
            <>
              <button className="btn-secondary" onClick={handleSkip}>
                Skip Exercise
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCheck}
                disabled={
                  (exercise.type === 'fill_blank' && !userAnswer.trim()) ||
                  (exercise.type === 'sentence_ordering' && orderedWords.length === 0) ||
                  (exercise.type === 'free_writing' && !userAnswer.trim())
                }
              >
                Check Answer
              </button>
            </>
          ) : (
            <button className="btn-primary w-full justify-center" onClick={handleNext}>
              {currentIdx < exercises.length - 1 ? 'Bài tiếp theo →' : 'Xem kết quả chung'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
