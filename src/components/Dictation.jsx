import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { playSound, vibrate, speak } from '../utils/sounds';
import confetti from 'canvas-confetti';

// LCS-based word alignment helper to prevent index mismatch from single mistakes
function alignWords(targetWords, userWords) {
  const m = targetWords.length;
  const n = userWords.length;
  const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (targetWords[i - 1] === userWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  let i = m;
  let j = n;
  const matchedIndices = new Set();
  while (i > 0 && j > 0) {
    if (targetWords[i - 1] === userWords[j - 1]) {
      matchedIndices.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return matchedIndices;
}

export default function Dictation({ topic, onNavigateBack, showToast }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [showLetterHint, setShowLetterHint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [scores, setScores] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  
  const textareaRef = useRef(null);

  const handleFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  useEffect(() => {
    if (isFinished) {
      const finalScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (finalScore >= 0.8) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        playSound('complete');
      }
    }
  }, [isFinished, scores]);

  const dialogues = topic?.dialogues || [];
  const dialogue = dialogues[currentIdx] || null;
  const targetText = dialogue ? dialogue.text : (topic?.topic || '');

  // Clean words list for comparison
  const getCleanWords = (text) => {
    return text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
      .trim()
      .split(/\s+/);
  };

  const targetWords = getCleanWords(targetText);
  const userWords = getCleanWords(userInput);

  const handleSpeak = () => {
    speak(targetText, { rate: 0.85 });
  };

  // Play automatically when dialogue index changes
  useEffect(() => {
    if (dialogue) {
      handleSpeak();
      setUserInput('');
      setShowTranslation(false);
      setShowLetterHint(false);
      setChecked(false);
      setCurrentScore(0);
    }
  }, [currentIdx]);

  const handleCheck = () => {
    const matched = alignWords(targetWords, userWords);
    const score = matched.size / targetWords.length;
    setCurrentScore(score);
    setChecked(true);
    
    if (score >= 0.8) {
      playSound('correct');
      vibrate(50);
    } else {
      playSound('incorrect');
      vibrate([50, 50, 50]);
    }
  };

  const handleNext = () => {
    const updatedScores = [...scores, currentScore];
    setScores(updatedScores);

    if (currentIdx < topic.dialogues.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Calculate final score
      const averageScore = updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;
      storage.updateTopicProgress(topic.id, 'listening', averageScore);
      setIsFinished(true);
    }
  };

  const handleSkip = () => {
    const updatedScores = [...scores, 0];
    setScores(updatedScores);
    
    if (currentIdx < topic.dialogues.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      const averageScore = updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;
      storage.updateTopicProgress(topic.id, 'listening', averageScore);
      setIsFinished(true);
    }
  };

  // Generate blank hints: H_ _ _ o!
  const getMaskedHint = () => {
    return targetText.split(/\s+/).map(word => {
      const firstLetter = word.slice(0, 1);
      const remainingLetters = word.slice(1).replace(/[a-zA-Z]/g, "_");
      return firstLetter + remainingLetters;
    }).join(" ");
  };

  if (isFinished) {
    const finalScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const xpEarned = Math.round(finalScore * 100);

    return (
      <div className="dictation-finished glass bg-white p-8 text-center max-w-xl mx-auto mt-10 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold color-text-dark mb-2">Hoàn thành bài chính tả!</h2>
        <p className="color-text-muted text-sm mb-6">Chủ đề: {topic.topic}</p>
        
        <div className="score-radial-progress p-6 bg-[#FAFBFD] rounded-xl mb-6">
          <div className="text-4xl font-mono font-bold" style={{ color: 'var(--color-primary)' }}>{Math.round(finalScore * 100)}%</div>
          <div className="text-xs font-mono font-bold color-text-muted uppercase mt-1">Độ chính xác</div>
        </div>

        <p className="xp-gain-text mb-8">Bạn được cộng <strong>+{xpEarned} XP</strong> kinh nghiệm</p>

        <button className="btn-primary w-full justify-center" onClick={onNavigateBack}>
          Quay lại Trang chủ
        </button>
      </div>
    );
  }

  // Calculate matched indices for visualization
  const matchedIndices = checked ? alignWords(targetWords, userWords) : new Set();

  return (
    <div className="dictation-screen animate-slideup max-w-5xl mx-auto">
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
        <div className="hero-badge-tag">DICTATION CONSOLE — LEVEL {topic.level || 'B2'}</div>
        <h1 className="hero-main-title">{topic.topic || 'Luyện Nghe Chép Chính Tả'}</h1>
        <p className="hero-main-sub">
          Luyện phản xạ nghe chi tiết từng từ bản xứ, điền gợi ý từ vựng và nhận điểm phản hồi từng ký tự.
        </p>
      </div>

      {/* 📐 Asymmetric 2-Column Split Body */}
      <div className="asymmetric-body-grid">
        {/* 📌 Left Sidebar Stats */}
        <aside className="vertical-stats-sidebar">
          <div className="stats-sidebar-card glass">
            <h3 className="stats-sidebar-header">TIẾN TRÌNH CHÉP CHÍNH TẢ</h3>
            
            <div className="vertical-stat-item streak">
              <span className="stat-icon">🎧</span>
              <div className="stat-info">
                <span className="stat-value-mono">{currentIdx + 1} / {topic.dialogues.length}</span>
                <span className="stat-sub">Câu thoại chép chính tả</span>
              </div>
            </div>

            <div className="vertical-stat-item level">
              <span className="stat-icon">🎓</span>
              <div className="stat-info">
                <span className="stat-value-mono">Level {topic.level || 'B2'}</span>
                <span className="stat-sub">{topic.title || 'Bài tập chính tả'}</span>
              </div>
            </div>

            <div className="vertical-stat-item completed">
              <span className="stat-icon">💡</span>
              <div className="stat-info">
                <span className="stat-value-mono">Smart Hints</span>
                <span className="stat-sub">Gợi ý nghĩa & từ đầu</span>
              </div>
            </div>
          </div>
        </aside>

        {/* 📚 Right Main Workspace */}
        <main className="asymmetric-gallery-main">
          <div className="dictation-layout glass bg-white p-6 rounded-xl shadow-sm">
        <div className="progress-bar-container mb-6">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentIdx / topic.dialogues.length) * 100}%` }}
          />
          <span className="progress-text font-mono text-xs">Câu {currentIdx + 1} / {topic.dialogues.length}</span>
        </div>

        {/* Audio Player Card */}
        <div className="audio-card bg-[#FAFBFD] p-6 mb-6 text-center rounded-lg">
          <button className="btn-primary py-3 px-6 justify-center mx-auto" onClick={handleSpeak}>
            🔊 Nghe giọng đọc
          </button>
          <p className="color-text-muted text-xs mt-3">Lắng nghe cẩn thận và gõ lại chính xác những gì bạn nghe được.</p>
        </div>

        {/* Hints */}
        <div className="hints-box mb-6">
          <div className="hints-buttons mb-3 flex gap-2">
            <button 
              className={`btn-secondary text-xs ${showTranslation ? 'active' : ''}`}
              onClick={() => setShowTranslation(!showTranslation)}
            >
              Hiển thị dịch nghĩa
            </button>
            <button 
              className={`btn-secondary text-xs ${showLetterHint ? 'active' : ''}`}
              onClick={() => setShowLetterHint(!showLetterHint)}
            >
              Gợi ý ký tự
            </button>
          </div>

          {showTranslation && (
            <div className="hint-content translation-hint p-3 mb-2 bg-slate-50 rounded text-xs">
              <strong>Nghĩa tiếng Việt:</strong> {dialogue.vietnamese}
            </div>
          )}

          {showLetterHint && (
            <div className="hint-content spelling-hint p-3 bg-slate-50 rounded text-xs font-mono">
              <strong>Gợi ý:</strong> <code>{getMaskedHint()}</code>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <div className="input-box mb-6">
          <textarea
            ref={textareaRef}
            onFocus={handleFocus}
            className="dictation-textarea search-input w-full p-4 text-base"
            placeholder="Gõ từ bạn nghe được tại đây..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={checked}
            rows={3}
          />
        </div>

        {/* Inline word-by-word checking feedback */}
        {checked && (
          <div className="dictation-feedback bg-[#FAFBFD] p-4 mb-6 rounded-lg">
            <h4 className="mb-2 text-xs font-mono font-bold color-text-muted uppercase">Đánh giá phát âm:</h4>
            <div className="feedback-words flex flex-wrap gap-1.5">
              {targetWords.map((word, index) => {
                const isCorrect = matchedIndices.has(index);
                return (
                  <span 
                    key={index} 
                    className={`px-2 py-1 rounded text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}
                    title={!isCorrect ? 'Từ bị gõ sai hoặc thiếu' : ''}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
            <div className="target-reveal mt-4 p-3 bg-white rounded text-xs">
              <strong>Đáp án chính xác:</strong>
              <p className="mt-1 color-text-main font-bold">{targetText}</p>
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div className="action-buttons">
          {!checked ? (
            <>
              <button className="btn-secondary" onClick={handleSkip}>
                Skip
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCheck}
                disabled={!userInput.trim()}
              >
                Check Answer
              </button>
            </>
          ) : (
            <button className="btn-primary w-full justify-center" onClick={handleNext}>
              {currentIdx < topic.dialogues.length - 1 ? 'Next Sentence →' : 'View Results'}
            </button>
          )}
        </div>
        </div>
      </main>
    </div>
  </div>
  );
}
