import React, { useState, useEffect } from 'react';
import { speak, speakCompare, playSound, vibrate } from '../utils/sounds';
import confetti from 'canvas-confetti';

const MINIMAL_PAIRS_DATA = [
  {
    id: 'th_unvoiced_voiced',
    title: 'Âm /θ/ và /ð/',
    description: 'Cách đặt lưỡi: Cắn nhẹ lưỡi giữa hai hàm răng và thổi hơi. /θ/ là âm vô thanh (chỉ có hơi thoát ra, ví dụ: thin), còn /ð/ là âm hữu thanh (rung dây thanh quản, ví dụ: then).',
    phonetics: ['/θ/', '/ð/'],
    pairs: [
      { word1: 'thin', word2: 'then', ipa1: '/θɪn/', ipa2: '/ðen/', mean1: 'mỏng, gầy', mean2: 'sau đó' },
      { word1: 'think', word2: 'this', ipa1: '/θɪŋk/', ipa2: '/ðɪs/', mean1: 'suy nghĩ', mean2: 'đây, này' },
      { word1: 'path', word2: 'pathway', ipa1: '/pɑːθ/', ipa2: '(/ð/ in paths)', mean1: 'con đường', mean2: 'lối đi' },
      { word1: 'three', word2: 'there', ipa1: '/θriː/', ipa2: '/ðeə(r)/', mean1: 'số ba', mean2: 'ở đó' },
      { word1: 'bath', word2: 'bathe', ipa1: '/bɑːθ/', ipa2: '/beɪð/', mean1: 'bồn tắm', mean2: 'tắm rửa' }
    ]
  },
  {
    id: 's_sh',
    title: 'Âm /s/ và /ʃ/',
    description: 'Âm /s/ là âm xì hơi nhẹ bình thường (như chữ s tiếng Việt nhưng nhẹ hơn). Âm /ʃ/ là âm s nặng (chu môi tròn và xì hơi mạnh ra ngoài, giống như đang ra hiệu giữ trật tự "suỵt").',
    phonetics: ['/s/', '/ʃ/'],
    pairs: [
      { word1: 'sip', word2: 'ship', ipa1: '/sɪp/', ipa2: '/ʃɪp/', mean1: 'hớp nước', mean2: 'tàu thủy' },
      { word1: 'seat', word2: 'sheet', ipa1: '/siːt/', ipa2: '/ʃiːt/', mean1: 'chỗ ngồi', mean2: 'tờ giấy/ga giường' },
      { word1: 'sort', word2: 'short', ipa1: '/sɔːt/', ipa2: '/ʃɔːt/', mean1: 'loại, phân loại', mean2: 'ngắn, thấp' },
      { word1: 'sign', word2: 'shine', ipa1: '/saɪn/', ipa2: '/ʃaɪn/', mean1: 'ký tên/biển báo', mean2: 'tỏa sáng' },
      { word1: 'sell', word2: 'shell', ipa1: '/sel/', ipa2: '/ʃel/', mean1: 'bán', mean2: 'vỏ sò' }
    ]
  },
  {
    id: 'l_n',
    title: 'Âm /l/ và /n/',
    description: 'Lỗi phát âm rất phổ biến ở một số vùng Việt Nam. Âm /l/ (âm bên): đầu lưỡi chạm nướu trên và cho luồng hơi thoát qua 2 bên lưỡi. Âm /n/ (âm mũi): lưỡi chặn khoang miệng và hơi đi ra từ mũi.',
    phonetics: ['/l/', '/n/'],
    pairs: [
      { word1: 'light', word2: 'night', ipa1: '/laɪt/', ipa2: '/naɪt/', mean1: 'ánh sáng', mean2: 'ban đêm' },
      { word1: 'line', word2: 'nine', ipa1: '/laɪn/', ipa2: '/naɪn/', mean1: 'đường kẻ', mean2: 'số chín' },
      { word1: 'low', word2: 'no', ipa1: '/ləʊ/', ipa2: '/nəʊ/', mean1: 'thấp', mean2: 'không' },
      { word1: 'late', word2: 'name', ipa1: '/leɪt/', ipa2: '/neɪm/', mean1: 'muộn', mean2: 'tên' },
      { word1: 'lead', word2: 'need', ipa1: '/liːd/', ipa2: '/niːd/', mean1: 'dẫn đầu', mean2: 'cần thiết' }
    ]
  },
  {
    id: 'z_s_ending',
    title: 'Âm cuối /z/ và /s/',
    description: 'Rất nhiều học viên quên âm cuối hoặc xì hơi tùy tiện. Âm /s/ là vô thanh (chỉ xì hơi), còn /z/ là hữu thanh (xì hơi kèm rung thanh quản). Việc phân biệt giúp giao tiếp chuẩn xác.',
    phonetics: ['/s/', '/z/'],
    pairs: [
      { word1: 'bus', word2: 'buzz', ipa1: '/bʌs/', ipa2: '/bʌz/', mean1: 'xe buýt', mean2: 'tiếng vo ve' },
      { word1: 'place', word2: 'plays', ipa1: '/pleɪs/', ipa2: '/pleɪz/', mean1: 'địa điểm', mean2: 'chơi (ngôi 3 số ít)' },
      { word1: 'ice', word2: 'eyes', ipa1: '/aɪs/', ipa2: '/aɪz/', mean1: 'nước đá', mean2: 'đôi mắt' },
      { word1: 'peace', word2: 'peas', ipa1: '/piːs/', ipa2: '/piːz/', mean1: 'hòa bình', mean2: 'đậu hà lan' },
      { word1: 'price', word2: 'prize', ipa1: '/praɪs/', ipa2: '/praɪz/', mean1: 'giá cả', mean2: 'giải thưởng' }
    ]
  },
  {
    id: 't_d_ending',
    title: 'Âm cuối /t/ và /d/',
    description: 'Âm cuối trong tiếng Anh quyết định nghĩa từ. Âm /t/ vô thanh (bật hơi nhẹ từ đầu lưỡi chạm răng trên), /d/ hữu thanh (bật hơi nhẹ kết hợp rung cổ họng).',
    phonetics: ['/t/', '/d/'],
    pairs: [
      { word1: 'bat', word2: 'bad', ipa1: '/bæt/', ipa2: '/bæd/', mean1: 'con dơi/cây gậy', mean2: 'tồi tệ, xấu' },
      { word1: 'wet', word2: 'wed', ipa1: '/wet/', ipa2: '/wed/', mean1: 'ẩm ướt', mean2: 'kết hôn' },
      { word1: 'cart', word2: 'card', ipa1: '/kɑːt/', ipa2: '/kɑːd/', mean1: 'xe đẩy hàng', mean2: 'thẻ, danh thiếp' },
      { word1: 'neat', word2: 'need', ipa1: '/niːt/', ipa2: '/niːd/', mean1: 'ngăn nắp', mean2: 'nhu cầu/cần' },
      { word1: 'seat', word2: 'seed', ipa1: '/siːt/', ipa2: '/siːd/', mean1: 'chỗ ngồi', mean2: 'hạt giống' }
    ]
  },
  {
    id: 'ee_i',
    title: 'Âm /iː/ (i dài) và /ɪ/ (i ngắn)',
    description: 'Âm /iː/ phát âm kéo dài môi hơi cười rộng. Âm /ɪ/ là âm i ngắn phát âm dứt khoát, cơ miệng lỏng hơn và hơi lai giữa i và ê.',
    phonetics: ['/iː/', '/ɪ/'],
    pairs: [
      { word1: 'seat', word2: 'sit', ipa1: '/siːt/', ipa2: '/sɪt/', mean1: 'chỗ ngồi', mean2: 'ngồi xuống' },
      { word1: 'sheep', word2: 'ship', ipa1: '/ʃiːp/', ipa2: '/ʃɪp/', mean1: 'con cừu', mean2: 'tàu thủy' },
      { word1: 'feet', word2: 'fit', ipa1: '/fiːt/', ipa2: '/fɪt/', mean1: 'bàn chân', mean2: 'vừa vặn, khỏe' },
      { word1: 'reach', word2: 'rich', ipa1: '/riːtʃ/', ipa2: '/rɪtʃ/', mean1: 'chạm đến', mean2: 'giàu có' },
      { word1: 'feel', word2: 'fill', ipa1: '/fiːl/', ipa2: '/fɪl/', mean1: 'cảm nhận', mean2: 'lấp đầy' }
    ]
  }
];

export default function MinimalPairs({ onNavigateBack }) {
  const [selectedGroup, setSelectedGroup] = useState(MINIMAL_PAIRS_DATA[0]);
  const [activeTab, setActiveTab] = useState('learn'); // learn, listen_quiz, speak_quiz
  
  // States for Listening Quiz
  const [quizPair, setQuizPair] = useState(null);
  const [targetWord, setTargetWord] = useState('');
  const [quizAccent, setQuizAccent] = useState('US');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [feedback, setFeedback] = useState('');
  
  // States for Speaking Practice
  const [speakPair, setSpeakPair] = useState(null);
  const [speakTarget, setSpeakTarget] = useState(''); // word1 or word2
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [speakScore, setSpeakScore] = useState(null); // 'perfect', 'poor', etc
  const [recognition, setRecognition] = useState(null);

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
        setSpeakScore(null);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        setSpokenText(transcript);
        evaluatePronunciation(transcript);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  // Generate new quiz item
  const generateQuiz = (group) => {
    const currentGroup = group || selectedGroup;
    const randomIndex = Math.floor(Math.random() * currentGroup.pairs.length);
    const pair = currentGroup.pairs[randomIndex];
    const isWord1 = Math.random() < 0.5;
    const target = isWord1 ? pair.word1 : pair.word2;
    const randomAccent = Math.random() < 0.5 ? 'US' : 'UK';
    
    setQuizPair(pair);
    setTargetWord(target);
    setQuizAccent(randomAccent);
    setSelectedAnswer(null);
    setFeedback('');

    // Speak automatically
    setTimeout(() => {
      speak(target, { accent: randomAccent });
    }, 100);
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedAnswer(null);
    setFeedback('');
    setScore({ correct: 0, total: 0 });
    setSpeakPair(group.pairs[0]);
    setSpeakTarget(group.pairs[0].word1);
    setSpeakScore(null);
    setSpokenText('');
    
    if (activeTab === 'listen_quiz') {
      generateQuiz(group);
    }
  };

  // Check user listening answer
  const handleAnswerClick = (word) => {
    if (selectedAnswer) return; // already answered
    setSelectedAnswer(word);
    
    const isCorrect = word.toLowerCase() === targetWord.toLowerCase();
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1
    };
    setScore(newScore);

    if (isCorrect) {
      playSound('correct');
      vibrate(50);
      setFeedback('Chính xác! Bạn nghe rất tốt. 🎉');
      if (newScore.correct >= 5 && newScore.correct === newScore.total) {
        confetti({ particleCount: 50, spread: 60 });
      }
    } else {
      playSound('incorrect');
      vibrate([50, 50]);
      setFeedback(`Chưa đúng! Từ vừa phát âm là "${targetWord}". Hãy nghe và so sánh lại.`);
    }
  };

  // Replay audio during quiz
  const handleReplayQuiz = () => {
    if (targetWord) {
      speak(targetWord, { accent: quizAccent });
    }
  };

  // Trigger speak recognition
  const handleToggleSpeakRecord = () => {
    if (!recognition) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói.");
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const evaluatePronunciation = (transcript) => {
    const cleanSpoken = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim().toLowerCase();
    const cleanTarget = speakTarget.toLowerCase();
    
    if (cleanSpoken === cleanTarget) {
      playSound('correct');
      vibrate(50);
      setSpeakScore('perfect');
    } else if (cleanTarget.includes(cleanSpoken) || cleanSpoken.includes(cleanTarget)) {
      setSpeakScore('good');
    } else {
      playSound('incorrect');
      vibrate([50, 50]);
      setSpeakScore('try_again');
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSpeakScore(null);
    setSpokenText('');
    
    if (tab === 'listen_quiz') {
      generateQuiz(selectedGroup);
    } else if (tab === 'speak_quiz') {
      const initialPair = selectedGroup.pairs[0];
      setSpeakPair(initialPair);
      setSpeakTarget(initialPair.word1);
    }
  };

  return (
    <div className="minimal-pairs-screen animate-slideup p-6 glass">
      <div className="flex justify-between items-center mb-6">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Quay về Dashboard
        </button>
        <h2 className="glow-text text-gradient">Minimal Pairs - Cặp âm dễ nhầm</h2>
      </div>

      {/* Sound selector tab */}
      <div className="tabs-container flex gap-2 mb-6 overflow-x-auto pb-2">
        {MINIMAL_PAIRS_DATA.map((group) => (
          <button
            key={group.id}
            onClick={() => handleGroupSelect(group)}
            className={`btn-secondary ${selectedGroup.id === group.id ? 'active-accent-btn' : ''}`}
            style={{
              whiteSpace: 'nowrap',
              background: selectedGroup.id === group.id ? 'var(--color-primary-glow)' : 'transparent',
              borderColor: selectedGroup.id === group.id ? 'var(--color-primary)' : 'var(--border-light)'
            }}
          >
            {group.title} ({group.phonetics.join(' - ')})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Detail & Description */}
        <div className="lg:col-span-1 glass p-5 flex flex-col gap-4">
          <h3 className="text-gradient font-bold text-lg">{selectedGroup.title}</h3>
          <div className="phonetics-badge-row flex gap-2">
            {selectedGroup.phonetics.map((p, i) => (
              <span key={i} className="badge-level font-bold text-base" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
                {p}
              </span>
            ))}
          </div>
          <p className="text-sm color-text-muted leading-relaxed" style={{ fontSize: '13.5px' }}>
            {selectedGroup.description}
          </p>
          <div className="mt-auto border-t border-light pt-4">
            <span className="text-xs color-text-muted">Mẹo học: Hãy nghe đi nghe lại hai từ kế nhau để nhận biết sự khác biệt nhỏ nhất trong cách chuyển động của môi và lưỡi.</span>
          </div>
        </div>

        {/* Right Side: Working Panels */}
        <div className="lg:col-span-3 glass p-6 flex flex-col gap-6">
          {/* Practice mode switcher */}
          <div className="flex gap-3 border-b border-light pb-4">
            <button
              onClick={() => handleTabChange('learn')}
              className={`pb-2 font-semibold text-sm cursor-pointer border-b-2 transition ${activeTab === 'learn' ? 'border-primary color-primary' : 'border-transparent color-text-muted'}`}
              style={{ borderColor: activeTab === 'learn' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'learn' ? 'var(--color-primary)' : '' }}
            >
              📖 Học & So sánh âm
            </button>
            <button
              onClick={() => handleTabChange('listen_quiz')}
              className={`pb-2 font-semibold text-sm cursor-pointer border-b-2 transition ${activeTab === 'listen_quiz' ? 'border-primary color-primary' : 'border-transparent color-text-muted'}`}
              style={{ borderColor: activeTab === 'listen_quiz' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'listen_quiz' ? 'var(--color-primary)' : '' }}
            >
              🎧 Trắc nghiệm nghe phân biệt
            </button>
            <button
              onClick={() => handleTabChange('speak_quiz')}
              className={`pb-2 font-semibold text-sm cursor-pointer border-b-2 transition ${activeTab === 'speak_quiz' ? 'border-primary color-primary' : 'border-transparent color-text-muted'}`}
              style={{ borderColor: activeTab === 'speak_quiz' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'speak_quiz' ? 'var(--color-primary)' : '' }}
            >
              🎙️ Thực hành nói chuẩn âm
            </button>
          </div>

          {/* TAB 1: LEARN & COMPARE */}
          {activeTab === 'learn' && (
            <div className="flex flex-col gap-4 animate-slideup">
              <h4 className="font-semibold text-sm text-gradient">Danh sách các cặp từ dễ nhầm:</h4>
              <div className="vocab-list flex flex-col gap-3">
                {selectedGroup.pairs.map((pair, idx) => (
                  <div key={idx} className="vocab-row glass p-3 flex flex-wrap items-center justify-between gap-4">
                    {/* Word 1 */}
                    <div className="flex-1 flex items-center justify-between gap-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <strong className="text-base color-text-dark font-bold">{pair.word1}</strong>
                        <span className="text-xs color-text-muted ml-2">{pair.ipa1}</span>
                        <div className="text-xs color-text-muted italic">{pair.mean1}</div>
                      </div>
                      <div className="flex gap-1">
                        <button className="row-speak-btn" onClick={() => speak(pair.word1, { accent: 'US' })} title="US Pronunciation">🇺🇸</button>
                        <button className="row-speak-btn" onClick={() => speak(pair.word1, { accent: 'UK' })} title="UK Pronunciation">🇬🇧</button>
                      </div>
                    </div>

                    {/* Compare VS Section */}
                    <div className="flex items-center justify-center p-2 rounded-full font-bold" style={{ color: 'var(--color-secondary)', background: 'var(--color-secondary-glow)', fontSize: '11px', minWidth: '40px' }}>
                      🆚
                    </div>

                    {/* Word 2 */}
                    <div className="flex-1 flex items-center justify-between gap-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <strong className="text-base color-text-dark font-bold">{pair.word2}</strong>
                        <span className="text-xs color-text-muted ml-2">{pair.ipa2}</span>
                        <div className="text-xs color-text-muted italic">{pair.mean2}</div>
                      </div>
                      <div className="flex gap-1">
                        <button className="row-speak-btn" onClick={() => speak(pair.word2, { accent: 'US' })} title="US Pronunciation">🇺🇸</button>
                        <button className="row-speak-btn" onClick={() => speak(pair.word2, { accent: 'UK' })} title="UK Pronunciation">🇬🇧</button>
                      </div>
                    </div>

                    {/* Compare both together */}
                    <div>
                      <button 
                        className="btn-secondary flex gap-1 items-center" 
                        onClick={() => speakCompare(`${pair.word1}. ${pair.word2}`)}
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        🔊 So sánh liên tục
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LISTENING QUIZ */}
          {activeTab === 'listen_quiz' && quizPair && (
            <div className="flex flex-col items-center gap-6 py-6 animate-slideup">
              <div className="quiz-progress text-sm color-text-muted">
                Điểm số: <strong className="color-primary">{score.correct}</strong> / {score.total} câu
              </div>

              <div className="quiz-audio-box flex flex-col items-center gap-4">
                <button 
                  className="btn-primary rounded-full w-20 h-20 flex items-center justify-center"
                  onClick={handleReplayQuiz}
                  style={{
                    fontSize: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #06b6d4 100%)',
                    boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)'
                  }}
                >
                  🔊
                </button>
                <span className="text-xs color-text-muted">Click để nghe lại giọng đọc ({quizAccent === 'US' ? 'Mỹ 🇺🇸' : 'Anh 🇬🇧'})</span>
              </div>

              <div className="quiz-options flex gap-6 w-full max-w-md mt-4">
                <button
                  className={`btn-secondary flex-1 py-4 justify-center font-bold text-lg rounded-md ${
                    selectedAnswer
                      ? selectedAnswer.toLowerCase() === quizPair.word1.toLowerCase()
                        ? targetWord.toLowerCase() === quizPair.word1.toLowerCase()
                          ? 'correct-option'
                          : 'wrong-option'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleAnswerClick(quizPair.word1)}
                  style={{
                    border: '2px solid var(--border-light)',
                    fontSize: '20px',
                    backgroundColor: selectedAnswer && quizPair.word1 === targetWord ? 'rgba(16, 185, 129, 0.15)' : ''
                  }}
                >
                  {quizPair.word1}
                  <div className="text-xs font-normal color-text-muted mt-1">{quizPair.ipa1}</div>
                </button>

                <button
                  className={`btn-secondary flex-1 py-4 justify-center font-bold text-lg rounded-md ${
                    selectedAnswer
                      ? selectedAnswer.toLowerCase() === quizPair.word2.toLowerCase()
                        ? targetWord.toLowerCase() === quizPair.word2.toLowerCase()
                          ? 'correct-option'
                          : 'wrong-option'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleAnswerClick(quizPair.word2)}
                  style={{
                    border: '2px solid var(--border-light)',
                    fontSize: '20px',
                    backgroundColor: selectedAnswer && quizPair.word2 === targetWord ? 'rgba(16, 185, 129, 0.15)' : ''
                  }}
                >
                  {quizPair.word2}
                  <div className="text-xs font-normal color-text-muted mt-1">{quizPair.ipa2}</div>
                </button>
              </div>

              {feedback && (
                <div className="quiz-feedback-box glass p-4 text-center mt-4 w-full max-w-md animate-slideup">
                  <p className="font-medium text-sm leading-relaxed">{feedback}</p>
                  <button className="btn-primary mt-3 py-2 px-6 justify-center mx-auto" onClick={() => generateQuiz()}>
                    Tiếp theo →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SPEAKING PRACTICE */}
          {activeTab === 'speak_quiz' && speakPair && (
            <div className="flex flex-col gap-6 py-4 animate-slideup">
              <div>
                <h4 className="font-semibold text-sm mb-3">1. Chọn từ bạn muốn tập nói:</h4>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSpeakTarget(speakPair.word1);
                      setSpeakScore(null);
                      setSpokenText('');
                    }}
                    className={`btn-secondary flex-1 justify-center py-3 font-semibold ${speakTarget === speakPair.word1 ? 'active-accent-btn' : ''}`}
                    style={{
                      border: '2px solid',
                      borderColor: speakTarget === speakPair.word1 ? 'var(--color-primary)' : 'var(--border-light)',
                      backgroundColor: speakTarget === speakPair.word1 ? 'var(--color-primary-glow)' : 'transparent'
                    }}
                  >
                    🗣️ {speakPair.word1} ({speakPair.ipa1})
                  </button>
                  <button
                    onClick={() => {
                      setSpeakTarget(speakPair.word2);
                      setSpeakScore(null);
                      setSpokenText('');
                    }}
                    className={`btn-secondary flex-1 justify-center py-3 font-semibold ${speakTarget === speakPair.word2 ? 'active-accent-btn' : ''}`}
                    style={{
                      border: '2px solid',
                      borderColor: speakTarget === speakPair.word2 ? 'var(--color-primary)' : 'var(--border-light)',
                      backgroundColor: speakTarget === speakPair.word2 ? 'var(--color-primary-glow)' : 'transparent'
                    }}
                  >
                    🗣️ {speakPair.word2} ({speakPair.ipa2})
                  </button>
                </div>
              </div>

              <div className="glass p-5 rounded-md text-center flex flex-col items-center gap-4">
                <span className="text-xs color-text-muted uppercase tracking-wider font-semibold">Từ cần luyện</span>
                <span className="text-4xl font-extrabold text-gradient">{speakTarget}</span>
                <span className="text-sm color-text-muted italic">
                  Ý nghĩa: {speakTarget === speakPair.word1 ? speakPair.mean1 : speakPair.mean2}
                </span>

                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => speak(speakTarget, { accent: 'US' })}>🔊 US (Mỹ)</button>
                  <button className="btn-secondary" onClick={() => speak(speakTarget, { accent: 'UK' })}>🔊 UK (Anh)</button>
                </div>
              </div>

              {/* Recording Box */}
              <div className="flex flex-col items-center gap-4 py-4 border-t border-light mt-2">
                <button
                  className={`btn-primary rounded-full w-20 h-20 flex items-center justify-center ${isRecording ? 'pulse' : ''}`}
                  onClick={handleToggleSpeakRecord}
                  style={{
                    borderRadius: '50%',
                    background: isRecording ? 'linear-gradient(135deg, var(--color-error) 0%, #f43f5e 100%)' : 'linear-gradient(135deg, var(--color-primary) 0%, #3b82f6 100%)',
                    boxShadow: isRecording ? '0 0 25px rgba(244, 63, 94, 0.4)' : '0 0 25px rgba(59, 130, 246, 0.3)',
                    fontSize: '24px'
                  }}
                >
                  {isRecording ? '⏹️' : '🎙️'}
                </button>
                <span className="text-xs color-text-muted">
                  {isRecording ? 'Đang lắng nghe... Nói dứt khoát rồi click dừng' : 'Click microphone và nói từ phía trên'}
                </span>

                {/* Spoken output results */}
                {spokenText && (
                  <div className="spoken-result-display animate-slideup mt-3 w-full max-w-md p-4 rounded-md text-center glass border border-light">
                    <div className="text-xs color-text-muted mb-1">Hệ thống nghe được:</div>
                    <div className="font-bold text-lg mb-2">"{spokenText}"</div>
                    
                    {speakScore === 'perfect' && (
                      <span className="badge-level text-sm py-1 px-4 font-bold" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                        Xuất Sắc! Chuẩn 100% 🎯
                      </span>
                    )}
                    {speakScore === 'good' && (
                      <span className="badge-level text-sm py-1 px-4 font-bold" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-secondary)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        Khá tốt! Gần đúng 🌟
                      </span>
                    )}
                    {speakScore === 'try_again' && (
                      <span className="badge-level text-sm py-1 px-4 font-bold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                        Thử lại nhé! Hãy nghe kỹ âm xì hơi hoặc âm gió 🔁
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pair index switcher */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-light">
                <button
                  disabled={selectedGroup.pairs.indexOf(speakPair) === 0}
                  className="btn-secondary"
                  onClick={() => {
                    const currentIdx = selectedGroup.pairs.indexOf(speakPair);
                    const prevPair = selectedGroup.pairs[currentIdx - 1];
                    setSpeakPair(prevPair);
                    setSpeakTarget(prevPair.word1);
                    setSpeakScore(null);
                    setSpokenText('');
                  }}
                >
                  ← Cặp trước
                </button>

                <button
                  disabled={selectedGroup.pairs.indexOf(speakPair) === selectedGroup.pairs.length - 1}
                  className="btn-secondary"
                  onClick={() => {
                    const currentIdx = selectedGroup.pairs.indexOf(speakPair);
                    const nextPair = selectedGroup.pairs[currentIdx + 1];
                    setSpeakPair(nextPair);
                    setSpeakTarget(nextPair.word1);
                    setSpeakScore(null);
                    setSpokenText('');
                  }}
                >
                  Cặp tiếp theo →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
