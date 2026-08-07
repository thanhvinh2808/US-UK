import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { playSound, vibrate, speak } from '../utils/sounds';
import confetti from 'canvas-confetti';

export default function Pronunciation({ topic, onNavigateBack, showToast }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [checked, setChecked] = useState(false);
  const [sentenceScore, setSentenceScore] = useState(0);
  const [scores, setScores] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  const [isIOSSafari] = useState(() => {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);
  });

  useEffect(() => {
    if (isFinished) {
      const finalScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      if (finalScore >= 0.7) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        playSound('complete');
      }
    }
  }, [isFinished, scores]);

  const dialogue = topic.dialogues ? topic.dialogues[currentIdx] : null;
  const targetText = dialogue ? dialogue.text : (topic.title || '');

  const getCleanWords = (text) => {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
      .trim()
      .split(/\s+/);
  };

  const targetWords = getCleanWords(targetText);

  // Initialize Speech Recognition API with clean Toast error handling
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !isIOSSafari) {
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
          if (showToast) showToast("Vui lòng cấp quyền Microphone trong trình duyệt để luyện phát âm.", "error");
        } else if (e.error === 'no-speech') {
          if (showToast) showToast("Chưa nhận diện được giọng nói, vui lòng thử lại.", "info");
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);

      return () => {
        try {
          rec.abort();
        } catch (e) {
          // ignore cleanup abort errors
        }
      };
    } else {
      setRecognitionSupported(false);
    }
  }, [currentIdx]);

  const handleSpeakSample = () => {
    speak(targetText, { rate: 0.85 });
  };

  const handleToggleRecord = () => {
    if (!recognition) {
      if (showToast) showToast("Trình duyệt không hỗ trợ nhận diện giọng nói.", "error");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (e) {
        console.warn("Recognition start glitch:", e);
      }
    }
  };

  const evaluateSpeech = (transcript) => {
    const spokenWords = getCleanWords(transcript);
    const spokenPool = [...spokenWords]; // bản sao để "tiêu thụ" từng từ đã khớp

    let matchCount = 0;
    targetWords.forEach(word => {
      const idx = spokenPool.indexOf(word);
      if (idx !== -1) {
        matchCount++;
        spokenPool.splice(idx, 1); // xoá để tránh 1 từ nói ra được tính khớp nhiều lần
      }
    });

    const score = targetWords.length > 0 ? (matchCount / targetWords.length) : 0;
    setSentenceScore(score);
    setChecked(true);
    
    if (score >= 0.7) {
      playSound('correct');
      vibrate(50);
    } else {
      playSound('incorrect');
      vibrate([50, 50, 50]);
    }
  };

  const handleNext = () => {
    const updatedScores = [...scores, sentenceScore];
    setScores(updatedScores);

    const totalDialogues = topic.dialogues ? topic.dialogues.length : 1;

    if (currentIdx < totalDialogues - 1) {
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

    const totalDialogues = topic.dialogues ? topic.dialogues.length : 1;

    if (currentIdx < totalDialogues - 1) {
      setCurrentIdx(currentIdx + 1);
      setChecked(false);
      setSpokenText('');
    } else {
      const avgScore = updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;
      storage.updateTopicProgress(topic.id, 'speaking', avgScore);
      setIsFinished(true);
    }
  };

  const handleSimulateSpeech = (isPerfect) => {
    const simulatedText = isPerfect 
      ? targetText 
      : targetText.split(/\s+/).slice(0, Math.max(1, Math.ceil(targetWords.length * 0.5))).join(" ") + " incorrect words";
    
    setSpokenText(simulatedText);
    evaluateSpeech(simulatedText);
  };

  if (isFinished) {
    const finalScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
    const xpEarned = Math.round(finalScore * 100);

    return (
      <div className="pronunciation-finished bg-white p-8 text-center max-w-xl mx-auto mt-6 animate-slideup rounded-xl border border-light shadow-sm">
        <h2 className="text-2xl font-bold color-text-dark">
          Hoàn Thành Bài Luyện Phát Âm!
        </h2>
        <p className="color-text-muted text-sm mt-1 mb-6">Chủ đề: {topic.topic}</p>

        <div className="score-radial-progress p-6 bg-[#FAFBFD] mb-6 rounded-xl border border-light">
          <div className="text-4xl font-mono font-bold" style={{ color: 'var(--color-primary)' }}>
            {Math.round(finalScore * 100)}%
          </div>
          <div className="color-text-muted text-xs font-mono uppercase font-bold mt-1">Độ chính xác phát âm</div>
        </div>

        <p className="text-base font-semibold mb-8 color-text-main">
          Bạn nhận được <strong style={{ color: 'var(--color-primary)' }}>+{xpEarned} XP</strong> kinh nghiệm
        </p>

        <button 
          className="btn-primary w-full justify-center py-3 text-base" 
          onClick={onNavigateBack}
        >
          Quay lại Trang chủ
        </button>
      </div>
    );
  }

  const cleanSpokenWords = getCleanWords(spokenText);
  const totalDialogues = topic.dialogues ? topic.dialogues.length : 1;

  return (
    <div className="pronunciation-screen animate-slideup" style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Clean Navigation Header */}
      <div className="screen-header mb-6 flex justify-between items-center flex-wrap gap-4 bg-white p-5 rounded-xl border border-light shadow-sm">
        <button className="btn-secondary text-xs" onClick={onNavigateBack}>
          ← Quay lại
        </button>
        <div className="flex items-center gap-2">
          <span className="badge-level level-b2">
            {topic.level}
          </span>
          <span className="text-base font-bold color-text-dark">
            {topic.topic}
          </span>
        </div>
      </div>

      <div className="pronunciation-layout bg-white p-6 rounded-xl border border-light shadow-sm">
        {/* Progress Bar Header */}
        <div className="progress-bar-container mb-6">
          <div className="flex justify-between mb-2 text-xs font-bold">
            <span className="color-text-muted">Tiến độ bài học</span>
            <span style={{ color: 'var(--color-primary)' }}>Câu {currentIdx + 1} / {totalDialogues}</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '10px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${((currentIdx + 1) / totalDialogues) * 100}%`, 
                height: '100%', 
                background: 'var(--color-primary)',
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Target Sentence Display Card */}
        <div className="sentence-display-card p-6 mb-6 text-center glass" style={{ background: 'var(--bg-input)', borderRadius: '16px', border: '1.5px solid var(--border-light)' }}>
          {dialogue && (
            <div className="speaker-role mb-2 text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--color-primary)' }}>
              👤 Nhân vật: {dialogue.speaker}
            </div>
          )}
          <h2 className="target-pronounce-text mb-4" style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-text-main)', lineHeight: 1.4 }}>
            "{targetText}"
          </h2>
          
          <button 
            type="button"
            className="btn-secondary text-xs" 
            onClick={handleSpeakSample} 
            style={{ padding: '8px 18px', borderRadius: '10px', fontWeight: '700', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'var(--bg-card)' }}
          >
            🔊 Nghe câu mẫu chuẩn bản xứ (US)
          </button>
        </div>

        {/* Mic / Recording Section */}
        <div className="recording-section text-center mb-6">
          {isIOSSafari ? (
            <div className="alert-unsupported p-4 glass mb-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--color-error)', color: 'var(--color-error)', borderRadius: '12px', fontSize: '13px' }}>
              ⚠️ Trình duyệt Safari trên iOS hạn chế nhận diện giọng nói tự động. Bạn có thể dùng nút Giả lập bên dưới để kiểm tra giao diện bài tập.
            </div>
          ) : recognitionSupported ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <button 
                type="button"
                className={`mic-button ${isRecording ? 'recording' : ''}`}
                onClick={handleToggleRecord}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: isRecording ? 'var(--color-error)' : 'var(--color-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '32px',
                  cursor: 'pointer',
                  boxShadow: isRecording ? '0 0 24px rgba(239, 68, 68, 0.5)' : '0 6px 20px var(--color-primary-glow)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isRecording ? '⏹' : '🎙️'}
              </button>
              <p className="color-text-muted text-sm font-medium">
                {isRecording ? "Đang lắng nghe... Hãy đọc to câu tiếng Anh trên!" : "Bấm micro và đọc to câu tiếng Anh trên để hệ thống chấm điểm."}
              </p>
            </div>
          ) : (
            <div className="alert-unsupported p-4 glass mb-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: '12px', fontSize: '13px' }}>
              ⚠️ Web Speech API chưa được hỗ trợ trực tiếp. Dùng các nút thử nghiệm bên dưới để kiểm tra quy trình chấm điểm.
            </div>
          )}
        </div>

        {/* Developer / Browser Fallback Testing Tools — CHỈ hiện khi chạy dev build, không lộ ra production */}
        {import.meta.env.DEV && (
          <div className="simulation-tools mb-6 p-4 glass" style={{ background: 'var(--bg-input)', borderRadius: '12px', textAlign: 'center' }}>
            <span className="text-xs color-text-muted font-semibold block mb-2">[DEV ONLY] Thử nghiệm mô phỏng chấm điểm:</span>
            <div className="sim-buttons flex gap-3 justify-center flex-wrap">
              <button className="btn-secondary text-xs" onClick={() => handleSimulateSpeech(true)} style={{ padding: '6px 14px', borderRadius: '8px' }}>
                ✓ Mô phỏng phát âm chuẩn (100%)
              </button>
              <button className="btn-secondary text-xs" onClick={() => handleSimulateSpeech(false)} style={{ padding: '6px 14px', borderRadius: '8px' }}>
                ⚠ Mô phỏng phát âm chưa đạt (50%)
              </button>
            </div>
          </div>
        )}

        {/* Results assessment */}
        {checked && (
          <div className="assessment-results-card glass p-5 mb-6" style={{ background: 'var(--bg-card)', border: '2px solid var(--color-primary)', borderRadius: '16px' }}>
            <div className="score-summary mb-3 flex justify-between items-center">
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--color-text-main)' }}>Đánh giá kết quả đọc:</h4>
              <span className="text-xl font-bold" style={{ color: sentenceScore >= 0.7 ? 'var(--color-success)' : 'var(--color-error)' }}>
                {Math.round(sentenceScore * 100)}% Chính xác
              </span>
            </div>

            <div className="speech-matching-display mb-3">
              <strong className="text-xs color-text-muted uppercase block mb-2">Chi tiết từ phát âm đúng:</strong>
              <div className="feedback-words flex flex-wrap gap-2">
                {targetWords.map((word, index) => {
                  const wasSpoken = cleanSpokenWords.includes(word);
                  return (
                    <span 
                      key={index} 
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '700',
                        background: wasSpoken ? 'var(--color-success-glow)' : 'var(--color-error-glow)',
                        color: wasSpoken ? 'var(--color-success)' : 'var(--color-error)',
                        border: wasSpoken ? '1px solid var(--color-success)' : '1px solid var(--color-error)'
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>

            {spokenText && (
              <p className="italic text-xs color-text-muted mt-2" style={{ margin: 0 }}>
                Văn bản thu âm được: "{spokenText}"
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="action-buttons flex gap-3">
          {!checked ? (
            <button className="btn-secondary w-full justify-center py-3" onClick={handleSkip} style={{ borderRadius: '12px', fontWeight: '700' }}>
              Bỏ qua câu này
            </button>
          ) : (
            <button className="btn-primary w-full justify-center py-3" onClick={handleNext} style={{ borderRadius: '12px', background: 'var(--color-primary)', color: '#ffffff', fontWeight: '700' }}>
              {currentIdx < totalDialogues - 1 ? 'Câu tiếp theo ➔' : 'Xem tổng kết bài tập 🏆'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
