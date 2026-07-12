import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export default function Pronunciation({ topic, onNavigateBack }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [checked, setChecked] = useState(false);
  const [sentenceScore, setSentenceScore] = useState(0);
  const [scores, setScores] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const dialogue = topic.dialogues[currentIdx];
  const targetText = dialogue ? dialogue.text : '';

  const getCleanWords = (text) => {
    return text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
      .trim()
      .split(/\s+/);
  };

  const targetWords = getCleanWords(targetText);

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'en-US';
      rec.interimResults = false;

      rec.onstart = () => {
        setIsRecording(true);
        setSpokenText('');
        setChecked(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        evaluateSpeech(transcript);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        setIsRecording(false);
        if (e.error === 'not-allowed') {
          alert("Microphone permission denied. Please enable mic access.");
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    } else {
      setRecognitionSupported(false);
    }
  }, [currentIdx]);

  const handleSpeakSample = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(targetText);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleRecord = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const evaluateSpeech = (transcript) => {
    const spokenWords = getCleanWords(transcript);
    
    // Evaluate word by word
    let matchCount = 0;
    targetWords.forEach(word => {
      if (spokenWords.includes(word)) {
        matchCount++;
      }
    });

    const score = matchCount / targetWords.length;
    setSentenceScore(score);
    setChecked(true);
  };

  const handleNext = () => {
    const updatedScores = [...scores, sentenceScore];
    setScores(updatedScores);

    if (currentIdx < topic.dialogues.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setChecked(false);
      setSpokenText('');
    } else {
      const avgScore = updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;
      storage.updateTopicProgress(topic.id, 'speaking', avgScore);
      setIsFinished(true);
    }
  };

  const handleSkip = () => {
    const updatedScores = [...scores, 0];
    setScores(updatedScores);

    if (currentIdx < topic.dialogues.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setChecked(false);
      setSpokenText('');
    } else {
      const avgScore = updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;
      storage.updateTopicProgress(topic.id, 'speaking', avgScore);
      setIsFinished(true);
    }
  };

  // Mock simulation for development/testing or unsupported browsers
  const handleSimulateSpeech = (isPerfect) => {
    const simulatedText = isPerfect 
      ? targetText 
      : targetText.split(/\s+/).slice(0, Math.ceil(targetWords.length * 0.7)).join(" ") + " other random words";
    
    setSpokenText(simulatedText);
    evaluateSpeech(simulatedText);
  };

  if (isFinished) {
    const finalScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const xpEarned = Math.round(finalScore * 100);

    return (
      <div className="pronunciation-finished glass-glow p-8 text-center max-w-xl mx-auto mt-10 animate-slideup">
        <span className="icon-huge">🏆</span>
        <h2 className="text-gradient mt-4 mb-2">Speaking Practice Completed!</h2>
        <p className="color-text-muted mb-6">Topic: {topic.topic}</p>

        <div className="score-radial-progress mb-6">
          <div className="score-percentage">{Math.round(finalScore * 100)}%</div>
          <div className="score-label">Pronunciation Score</div>
        </div>

        <p className="xp-gain-text mb-8">You earned <strong>+{xpEarned} XP</strong></p>

        <button className="btn-primary" onClick={onNavigateBack}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const cleanSpokenWords = getCleanWords(spokenText);

  return (
    <div className="pronunciation-screen animate-slideup">
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

      <div className="pronunciation-layout glass p-6 max-w-3xl mx-auto">
        <div className="progress-bar-container mb-6">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentIdx / topic.dialogues.length) * 100}%` }}
          />
          <span className="progress-text">Sentence {currentIdx + 1} of {topic.dialogues.length}</span>
        </div>

        {/* Target Sentence Display Card */}
        <div className="sentence-display-card p-6 mb-6 text-center">
          <div className="speaker-role mb-2">{dialogue.speaker}</div>
          <h2 className="target-pronounce-text mb-4">"{targetText}"</h2>
          
          <button className="row-speak-btn" onClick={handleSpeakSample} title="Listen Native Pronunciation">
            🔊 Listen to speaker
          </button>
        </div>

        {/* Mic / Recording Section */}
        <div className="recording-section text-center mb-6">
          {recognitionSupported ? (
            <>
              <button 
                className={`mic-button ${isRecording ? 'recording' : ''}`}
                onClick={handleToggleRecord}
              >
                {isRecording ? '⏹' : '🎤'}
              </button>
              <p className="color-text-muted mt-3">
                {isRecording ? "Listening... Speak now!" : "Click the mic and read the sentence aloud."}
              </p>
            </>
          ) : (
            <div className="alert-unsupported p-4 glass mb-4">
              ⚠️ Web Speech API is not supported on this browser (use Chrome or Safari). You can use simulation buttons below to test the interface.
            </div>
          )}

          {/* Sóng âm giả lập khi đang ghi âm */}
          {isRecording && (
            <div className="voice-waves mt-4">
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
          )}
        </div>

        {/* Simulation testing tools */}
        <div className="simulation-tools mb-6">
          <span className="text-sm color-text-muted block mb-2">Simulate Speaking (For Testing):</span>
          <div className="sim-buttons flex gap-3 justify-center">
            <button className="btn-secondary text-xs" onClick={() => handleSimulateSpeech(true)}>Simulate Correct Pronunciation</button>
            <button className="btn-secondary text-xs" onClick={() => handleSimulateSpeech(false)}>Simulate Imperfect Pronunciation</button>
          </div>
        </div>

        {/* Results assessment */}
        {checked && (
          <div className="assessment-results-card glass-glow p-5 mb-6">
            <div className="score-summary mb-4 flex justify-between items-center">
              <h4>Accuracy Rating:</h4>
              <span className="text-xl font-bold" style={{ color: sentenceScore >= 0.8 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {Math.round(sentenceScore * 100)}% Match
              </span>
            </div>

            <div className="speech-matching-display mb-4">
              <strong>Your Speech Analysis:</strong>
              <div className="feedback-words mt-2">
                {targetWords.map((word, index) => {
                  const wasSpoken = cleanSpokenWords.includes(word);
                  return (
                    <span 
                      key={index} 
                      className={`feedback-word ${wasSpoken ? 'correct' : 'incorrect'}`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>

            <p className="italic text-sm color-text-muted mt-2">Spoken transcript: "{spokenText}"</p>
          </div>
        )}

        {/* Actions bar */}
        <div className="action-buttons">
          {!checked ? (
            <button className="btn-secondary" onClick={handleSkip}>
              Skip Sentence
            </button>
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
