import React, { useState, useEffect, useRef } from 'react';
import { speak, playSound, vibrate } from '../utils/sounds';
import confetti from 'canvas-confetti';

export default function Shadowing({ topic, onNavigateBack, showToast }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [checked, setChecked] = useState(false);
  
  // Reflex & Shadowing performance states
  const [latency, setLatency] = useState(null); // in ms
  const [wordsCaught, setWordsCaught] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [matchingWords, setMatchingWords] = useState([]); // indices of matched words
  const [reflexGrade, setReflexGrade] = useState(''); // 'excellent', 'good', 'slow'
  const [accuracyScore, setAccuracyScore] = useState(0); // overall percentage
  
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [recognition, setRecognition] = useState(null);
  
  const audioEndTimeRef = useRef(0);
  const speechDetectedTimeRef = useRef(0);

  const dialogue = topic.dialogues[currentIdx];
  const targetText = dialogue ? dialogue.text : '';

  const getCleanWords = (text) => {
    return text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0);
  };

  const targetWords = getCleanWords(targetText);

  // Setup speech recognition
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
        setLatency(null);
        speechDetectedTimeRef.current = 0;
      };

      rec.onresult = (event) => {
        // Record timestamp of first speech detection
        if (speechDetectedTimeRef.current === 0) {
          speechDetectedTimeRef.current = Date.now();
        }
        
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        evaluateShadowing(transcript);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        setIsRecording(false);
        setIsPlayingAudio(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        setIsPlayingAudio(false);
      };

      setRecognition(rec);

      return () => {
        try {
          rec.abort();
        } catch (e) {}
      };
    } else {
      setRecognitionSupported(false);
    }
  }, [currentIdx]);

  // Start the shadowing cycle
  const handleStartShadowing = () => {
    if (!recognition) {
      alert("Speech recognition is not supported on this browser.");
      return;
    }
    
    setIsPlayingAudio(true);
    setChecked(false);
    setSpokenText('');
    setLatency(null);
    
    const accent = localStorage.getItem('eng_app_voice_accent') || 'US';
    
    // Play sentence
    speak(targetText, {
      accent,
      rate: 0.9,
      onstart: () => {
        setIsPlayingAudio(true);
      },
      onend: () => {
        // Capture end of speech
        audioEndTimeRef.current = Date.now();
        setIsPlayingAudio(false);
        
        // Auto-start recording immediately for shadowing
        try {
          recognition.start();
        } catch (e) {
          console.warn("Recognition already started or error:", e);
        }
      }
    });
  };

  const evaluateShadowing = (transcript) => {
    // 1. Calculate Latency (speaking reflex)
    const detected = speechDetectedTimeRef.current || Date.now();
    const delay = detected - audioEndTimeRef.current;
    setLatency(delay);

    // Rate the reflex
    if (delay <= 1000) {
      setReflexGrade('excellent'); // Under 1.0s
    } else if (delay <= 2500) {
      setReflexGrade('good'); // 1.0s - 2.5s
    } else {
      setReflexGrade('slow'); // > 2.5s
    }

    // 2. Evaluate words caught
    const spokenWords = getCleanWords(transcript);
    const matchedIndices = [];
    let matchCount = 0;

    targetWords.forEach((word, idx) => {
      // Find matches sequentially or general inclusion
      if (spokenWords.includes(word)) {
        matchedIndices.push(idx);
        matchCount++;
      }
    });

    setMatchingWords(matchedIndices);
    setWordsCaught(matchCount);
    setTotalWords(targetWords.length);

    const accuracy = matchCount / targetWords.length;
    setAccuracyScore(accuracy);
    setChecked(true);

    // Audio cues
    if (accuracy >= 0.75) {
      playSound('correct');
      vibrate(50);
    } else {
      playSound('incorrect');
      vibrate([50, 50]);
    }
  };

  const handleNext = () => {
    if (currentIdx < topic.dialogues.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setChecked(false);
      setSpokenText('');
      setLatency(null);
    } else {
      // Finished all dialogue shadowing! Give points
      playSound('complete');
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
      showToast("Chúc mừng! Bạn đã hoàn thành bài luyện nói đuổi Shadowing!", "success");
      onNavigateBack();
    }
  };

  const handleSelectSentence = (idx) => {
    setCurrentIdx(idx);
    setChecked(false);
    setSpokenText('');
    setLatency(null);
  };

  return (
    <div className="shadowing-screen animate-slideup p-6 glass">
      <div className="flex justify-between items-center mb-6">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Back to Topic Detail
        </button>
        <h2 className="glow-text text-gradient">Shadowing Reflex - Luyện Nói Đuổi</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Sentences List */}
        <div className="lg:col-span-1 glass p-5 flex flex-col gap-4 max-h-[500px] overflow-y-auto">
          <h3 className="font-bold border-b border-light pb-2">Danh sách câu nói</h3>
          <div className="flex flex-col gap-2">
            {topic.dialogues.map((dlg, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSentence(idx)}
                className={`p-3 rounded-md cursor-pointer transition flex items-center justify-between gap-3 ${currentIdx === idx ? 'glass-glow border-primary' : 'hover:bg-white/5'}`}
                style={{
                  borderLeft: currentIdx === idx ? '4px solid var(--color-primary)' : '4px solid transparent',
                  background: currentIdx === idx ? 'var(--color-primary-glow)' : ''
                }}
              >
                <div className="flex-1">
                  <span className="text-xs color-text-muted font-bold block">Câu {idx + 1} ({dlg.speaker}):</span>
                  <p className="text-sm line-clamp-1 color-text-dark font-medium">{dlg.text}</p>
                </div>
                <span className="text-xs color-text-muted">💬</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Working Area */}
        <div className="lg:col-span-2 glass p-6 flex flex-col gap-6 justify-between">
          <div className="flex items-center justify-between border-b border-light pb-3">
            <span className="badge-level">Câu {currentIdx + 1} / {topic.dialogues.length}</span>
            <span className="text-sm color-text-muted font-bold">Người nói: {dialogue?.speaker}</span>
          </div>

          {/* Sentence Display with word-by-word highlights if evaluated */}
          <div className="text-center py-8">
            <p className="text-sm color-text-muted italic mb-3">"{dialogue?.translation}"</p>
            <div className="flex flex-wrap justify-center gap-2 text-2xl font-extrabold leading-relaxed">
              {targetWords.map((word, idx) => {
                const isMatched = matchingWords.includes(idx);
                let color = 'var(--color-text-dark)';
                if (checked) {
                  color = isMatched ? 'var(--color-success)' : 'var(--color-error)';
                }
                return (
                  <span 
                    key={idx} 
                    style={{ 
                      color: color,
                      textDecoration: checked && !isMatched ? 'line-through' : 'none',
                      transition: 'color 0.3s'
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Shadowing trigger */}
          <div className="flex flex-col items-center gap-4 py-4">
            {!isRecording && !isPlayingAudio ? (
              <button 
                className="btn-primary py-4 px-8 font-bold text-lg rounded-full flex items-center gap-2"
                onClick={handleStartShadowing}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #06b6d4 100%)',
                  boxShadow: '0 0 25px rgba(124, 58, 237, 0.3)',
                  transform: 'scale(1.05)',
                  transition: 'all 0.2s'
                }}
              >
                🎧 Phát câu & Bắt đầu Shadowing
              </button>
            ) : isPlayingAudio ? (
              <div className="flex flex-col items-center gap-2">
                <div className="spinner mb-2"></div>
                <span className="text-sm font-semibold color-primary pulse">Đang phát mẫu... Lắng nghe thật kỹ! 🔊</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="pulse-circle mb-2">🎙️</div>
                <span className="text-sm font-semibold text-rose-500 pulse">NÓI ĐUỔI THEO NGAY! (Microphone đang bật...) 🔴</span>
              </div>
            )}
            
            <p className="text-xs color-text-muted max-w-sm text-center">
              * Hệ thống sẽ phát câu tiếng Anh mẫu. Ngay khi âm kết thúc, mic sẽ tự động kích hoạt. Bạn cần nói đuổi theo nhanh và chính xác nhất có thể!
            </p>
          </div>

          {/* Metrics Score Card */}
          {checked && (
            <div className="metrics-card glass-glow border border-light p-4 rounded-md animate-slideup grid grid-cols-3 gap-4 text-center">
              {/* Reflex Speed */}
              <div className="metric-box">
                <div className="text-xs color-text-muted uppercase font-bold mb-1">Tốc độ Phản xạ</div>
                <div className="text-lg font-bold" style={{ 
                  color: reflexGrade === 'excellent' ? 'var(--color-success)' : reflexGrade === 'good' ? 'var(--color-secondary)' : 'var(--color-error)'
                }}>
                  {(latency / 1000).toFixed(2)}s
                </div>
                <span className="text-[10px] color-text-muted italic">
                  {reflexGrade === 'excellent' ? '⚡ Siêu nhanh (Đỉnh)' : reflexGrade === 'good' ? '👍 Ổn định (Tốt)' : '🐢 Hơi chậm (Cố lên)'}
                </span>
              </div>

              {/* Words caught */}
              <div className="metric-box border-x border-light">
                <div className="text-xs color-text-muted uppercase font-bold mb-1">Từ bắt kịp</div>
                <div className="text-lg font-bold color-text-dark">
                  {wordsCaught} / {totalWords}
                </div>
                <span className="text-[10px] color-text-muted block">
                  Đạt {Math.round(accuracyScore * 100)}% số từ
                </span>
              </div>

              {/* Accuracy Grade */}
              <div className="metric-box">
                <div className="text-xs color-text-muted uppercase font-bold mb-1">Đánh giá chung</div>
                <div className="text-lg font-bold" style={{
                  color: accuracyScore >= 0.8 ? 'var(--color-success)' : accuracyScore >= 0.5 ? 'var(--color-secondary)' : 'var(--color-error)'
                }}>
                  {accuracyScore >= 0.8 ? 'Đạt (Pass)' : accuracyScore >= 0.5 ? 'Tạm ổn' : 'Cần thử lại'}
                </div>
                <span className="text-[10px] color-text-muted italic">
                  {accuracyScore >= 0.8 ? 'Excellent Shadow!' : 'Keep practicing!'}
                </span>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between items-center border-t border-light pt-4 mt-2">
            <button
              disabled={currentIdx === 0}
              className="btn-secondary"
              onClick={() => {
                setCurrentIdx(currentIdx - 1);
                setChecked(false);
                setSpokenText('');
                setLatency(null);
              }}
            >
              ← Câu trước
            </button>

            {checked && (
              <button className="btn-primary" onClick={handleNext}>
                {currentIdx < topic.dialogues.length - 1 ? "Tiếp theo →" : "Hoàn thành 🏁"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
