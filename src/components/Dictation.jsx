import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

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

export default function Dictation({ topic, onNavigateBack }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [showLetterHint, setShowLetterHint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [scores, setScores] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const dialogue = topic.dialogues[currentIdx];
  const targetText = dialogue ? dialogue.text : '';

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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(targetText);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // slower rate for dictation
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported on this browser.");
    }
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
      <div className="dictation-finished glass-glow p-8 text-center max-w-xl mx-auto mt-10 animate-slideup">
        <span className="icon-huge">🎉</span>
        <h2 className="text-gradient mt-4 mb-2">Dictation Completed!</h2>
        <p className="color-text-muted mb-6">Topic: {topic.topic}</p>
        
        <div className="score-radial-progress mb-6">
          <div className="score-percentage">{Math.round(finalScore * 100)}%</div>
          <div className="score-label">Accuracy</div>
        </div>

        <p className="xp-gain-text mb-8">You earned <strong>+{xpEarned} XP</strong></p>

        <button className="btn-primary" onClick={onNavigateBack}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Calculate matched indices for visualization
  const matchedIndices = checked ? alignWords(targetWords, userWords) : new Set();

  return (
    <div className="dictation-screen animate-slideup">
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

      <div className="dictation-layout glass p-6 max-w-3xl mx-auto">
        <div className="progress-bar-container mb-6">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentIdx / topic.dialogues.length) * 100}%` }}
          />
          <span className="progress-text">Sentence {currentIdx + 1} of {topic.dialogues.length}</span>
        </div>

        {/* Audio Player Card */}
        <div className="audio-card p-6 mb-6 text-center">
          <button className="audio-play-large" onClick={handleSpeak}>
            🔊 Play Audio
          </button>
          <p className="color-text-muted mt-2">Listen to the speaker and write down exactly what you hear.</p>
        </div>

        {/* Hints */}
        <div className="hints-box mb-6">
          <div className="hints-buttons mb-3">
            <button 
              className={`btn-hint ${showTranslation ? 'active' : ''}`}
              onClick={() => setShowTranslation(!showTranslation)}
            >
              💡 Show Translation
            </button>
            <button 
              className={`btn-hint ${showLetterHint ? 'active' : ''}`}
              onClick={() => setShowLetterHint(!showLetterHint)}
            >
              🔤 Show Spelling Hint
            </button>
          </div>

          {showTranslation && (
            <div className="hint-content translation-hint p-3 mb-2">
              🇻🇳 <strong>Nghĩa tiếng Việt:</strong> {dialogue.vietnamese}
            </div>
          )}

          {showLetterHint && (
            <div className="hint-content spelling-hint p-3">
              🧩 <strong>Gợi ý ký tự:</strong> <code>{getMaskedHint()}</code>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <div className="input-box mb-6">
          <textarea
            className="dictation-textarea"
            placeholder="Type what you hear..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={checked}
          />
        </div>

        {/* Inline word-by-word checking feedback */}
        {checked && (
          <div className="dictation-feedback glass p-4 mb-6">
            <h4 className="mb-2 text-sm color-text-muted">Assessment Feedback:</h4>
            <div className="feedback-words">
              {targetWords.map((word, index) => {
                const isCorrect = matchedIndices.has(index);
                return (
                  <span 
                    key={index} 
                    className={`feedback-word ${isCorrect ? 'correct' : 'incorrect'}`}
                    title={!isCorrect ? 'Missed or misspelled' : ''}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
            <div className="target-reveal mt-4 p-3 glass">
              <strong>Correct answer:</strong>
              <p className="mt-1 color-text-main font-semibold">{targetText}</p>
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
    </div>
  );
}
