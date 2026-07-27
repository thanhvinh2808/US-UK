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
  
  const [quizPair, setQuizPair] = useState(null);
  const [targetWord, setTargetWord] = useState('');
  const [quizAccent, setQuizAccent] = useState('US');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [feedback, setFeedback] = useState('');
  
  const [speakPair, setSpeakPair] = useState(null);
  const [speakTarget, setSpeakTarget] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [speakScore, setSpeakScore] = useState(null);
  const [recognition, setRecognition] = useState(null);

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

  const handleAnswerClick = (word) => {
    if (selectedAnswer) return;
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
      setFeedback('Chính xác! Bạn nghe phân biệt âm rất tốt. 🎉');
      if (newScore.correct >= 5 && newScore.correct === newScore.total) {
        confetti({ particleCount: 50, spread: 60 });
      }
    } else {
      playSound('incorrect');
      vibrate([50, 50]);
      setFeedback(`Chưa đúng! Từ vừa phát âm là "${targetWord}". Bấm nút loa để nghe lại nhé.`);
    }
  };

  const handleReplayQuiz = () => {
    if (targetWord) {
      speak(targetWord, { accent: quizAccent });
    }
  };

  const handleToggleSpeakRecord = () => {
    if (!recognition) return;
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
    <div className="minimal-pairs-studio-container animate-slideup" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Header Card */}
      <div className="page-header glass p-6 mb-6 rounded-2xl flex justify-between items-center flex-wrap gap-4" style={{ background: 'var(--bg-card)', border: '2px solid var(--color-primary)' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary)', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>
            🎙️ PRONUNCIATION SOUND STAGE
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: '800', margin: 0, color: 'var(--color-text-main)' }}>
            Luyện Âm Phân Biệt (Minimal Pairs Studio)
          </h1>
          <p className="color-text-muted text-xs mt-1" style={{ margin: 0 }}>
            Luyện tập phân biệt các cặp từ đồng âm hoặc có khẩu hình gần giống nhau với công nghệ phản hồi âm bản xứ
          </p>
        </div>
        {onNavigateBack && (
          <button 
            className="btn-secondary text-xs" 
            onClick={onNavigateBack}
            style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: '700' }}
          >
            ← Quay lại Dashboard
          </button>
        )}
      </div>

      {/* Top Sound Selector Carousel Bar */}
      <div className="sound-selector-carousel flex gap-2 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {MINIMAL_PAIRS_DATA.map((group) => (
          <button
            key={group.id}
            onClick={() => handleGroupSelect(group)}
            className="btn-secondary text-xs"
            style={{
              whiteSpace: 'nowrap',
              padding: '12px 20px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '13.5px',
              background: selectedGroup.id === group.id ? 'var(--color-primary)' : 'var(--bg-card)',
              color: selectedGroup.id === group.id ? '#ffffff' : 'var(--color-text-main)',
              borderColor: selectedGroup.id === group.id ? 'var(--color-primary)' : 'var(--border-light)',
              boxShadow: selectedGroup.id === group.id ? '0 4px 16px var(--color-primary-glow)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {group.title} ({group.phonetics.join(' - ')})
          </button>
        ))}
      </div>

      {/* Hero Stage Container */}
      <div className="sound-stage-hero glass p-6 mb-6" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border-light)' }}>
        {/* Phonetics & Mouth Placement Guide Banner */}
        <div className="p-4 mb-6" style={{ background: 'var(--bg-input)', borderRadius: '14px', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-primary)' }}>{selectedGroup.title}</h3>
            {selectedGroup.phonetics.map((p, i) => (
              <span key={i} style={{ background: 'var(--color-primary)', color: '#ffffff', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                {p}
              </span>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }} className="color-text-main font-medium">
            {selectedGroup.description}
          </p>
        </div>

        {/* Practice Mode Switcher Bar */}
        <div className="mode-switcher-grid flex gap-3 mb-6 flex-wrap justify-center">
          <button
            onClick={() => handleTabChange('learn')}
            className="btn-secondary text-sm flex-1 justify-center py-3 font-extrabold"
            style={{
              borderRadius: '12px',
              background: activeTab === 'learn' ? 'var(--color-primary)' : 'var(--bg-card)',
              color: activeTab === 'learn' ? '#ffffff' : 'var(--color-text-main)',
              border: activeTab === 'learn' ? 'none' : '1px solid var(--border-light)',
              maxWidth: '260px'
            }}
          >
            📖 1. So sánh âm bản xứ
          </button>
          <button
            onClick={() => handleTabChange('listen_quiz')}
            className="btn-secondary text-sm flex-1 justify-center py-3 font-extrabold"
            style={{
              borderRadius: '12px',
              background: activeTab === 'listen_quiz' ? 'var(--color-primary)' : 'var(--bg-card)',
              color: activeTab === 'listen_quiz' ? '#ffffff' : 'var(--color-text-main)',
              border: activeTab === 'listen_quiz' ? 'none' : '1px solid var(--border-light)',
              maxWidth: '260px'
            }}
          >
            🎧 2. Trắc nghiệm phản xạ
          </button>
          <button
            onClick={() => handleTabChange('speak_quiz')}
            className="btn-secondary text-sm flex-1 justify-center py-3 font-extrabold"
            style={{
              borderRadius: '12px',
              background: activeTab === 'speak_quiz' ? 'var(--color-primary)' : 'var(--bg-card)',
              color: activeTab === 'speak_quiz' ? '#ffffff' : 'var(--color-text-main)',
              border: activeTab === 'speak_quiz' ? 'none' : '1px solid var(--border-light)',
              maxWidth: '260px'
            }}
          >
            🎙️ 3. Phòng thu phát âm
          </button>
        </div>

        {/* MODE 1: DUAL-CARD VS SOUND STAGE */}
        {activeTab === 'learn' && (
          <div className="flex flex-col gap-6 animate-slideup">
            {selectedGroup.pairs.map((pair, idx) => (
              <div 
                key={idx} 
                className="vs-sound-battle-card glass p-6" 
                style={{ 
                  background: 'var(--bg-card)', 
                  borderRadius: '18px', 
                  border: '1.5px solid var(--border-light)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'center' }}>
                  {/* Left Word Card A */}
                  <div className="word-card-a p-5 text-center" style={{ background: 'var(--bg-input)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0, color: 'var(--color-text-main)' }}>
                      {pair.word1}
                    </h2>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-primary)', display: 'block', marginTop: '4px' }}>
                      {pair.ipa1}
                    </span>
                    <p className="color-text-muted text-xs italic mt-1" style={{ margin: 0 }}>
                      Nghĩa: {pair.mean1}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                      <button className="btn-secondary text-xs" onClick={() => speak(pair.word1, { accent: 'US' })} style={{ padding: '6px 12px', borderRadius: '8px', fontWeight: '700' }}>
                        🔊 🇺🇸 US
                      </button>
                      <button className="btn-secondary text-xs" onClick={() => speak(pair.word1, { accent: 'UK' })} style={{ padding: '6px 12px', borderRadius: '8px', fontWeight: '700' }}>
                        🔊 🇬🇧 UK
                      </button>
                    </div>
                  </div>

                  {/* Center VS Action Divider */}
                  <div className="vs-divider flex flex-col items-center justify-center gap-2">
                    <span style={{ 
                      background: 'var(--color-primary)', 
                      color: '#ffffff', 
                      padding: '6px 16px', 
                      borderRadius: '20px', 
                      fontSize: '14px', 
                      fontWeight: '900',
                      boxShadow: '0 4px 14px var(--color-primary-glow)'
                    }}>
                      VS
                    </span>
                    <button 
                      className="btn-primary text-xs" 
                      onClick={() => speakCompare(`${pair.word1}. ${pair.word2}`)}
                      style={{ 
                        padding: '10px 16px', 
                        borderRadius: '10px', 
                        fontWeight: '800',
                        background: 'var(--color-primary)',
                        color: '#ffffff',
                        border: 'none',
                        marginTop: '6px'
                      }}
                    >
                      🔊 Nghe so sánh cả 2 từ
                    </button>
                  </div>

                  {/* Right Word Card B */}
                  <div className="word-card-b p-5 text-center" style={{ background: 'var(--bg-input)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0, color: 'var(--color-text-main)' }}>
                      {pair.word2}
                    </h2>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-primary)', display: 'block', marginTop: '4px' }}>
                      {pair.ipa2}
                    </span>
                    <p className="color-text-muted text-xs italic mt-1" style={{ margin: 0 }}>
                      Nghĩa: {pair.mean2}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                      <button className="btn-secondary text-xs" onClick={() => speak(pair.word2, { accent: 'US' })} style={{ padding: '6px 12px', borderRadius: '8px', fontWeight: '700' }}>
                        🔊 🇺🇸 US
                      </button>
                      <button className="btn-secondary text-xs" onClick={() => speak(pair.word2, { accent: 'UK' })} style={{ padding: '6px 12px', borderRadius: '8px', fontWeight: '700' }}>
                        🔊 🇬🇧 UK
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODE 2: LISTENING QUIZ */}
        {activeTab === 'listen_quiz' && quizPair && (
          <div className="flex flex-col items-center gap-6 py-6 animate-slideup" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="quiz-progress text-sm font-bold color-text-main">
              Điểm số phản xạ: <strong style={{ color: 'var(--color-primary)', fontSize: '18px' }}>{score.correct}</strong> / {score.total} câu
            </div>

            <div className="quiz-audio-box flex flex-col items-center gap-3">
              <button 
                className="btn-primary"
                onClick={handleReplayQuiz}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  fontSize: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  boxShadow: '0 6px 24px var(--color-primary-glow)',
                  cursor: 'pointer'
                }}
              >
                🔊
              </button>
              <span className="text-xs color-text-muted font-semibold">Click để nghe lại từ vừa đọc ({quizAccent === 'US' ? 'Giọng Mỹ 🇺🇸' : 'Giọng Anh 🇬🇧'})</span>
            </div>

            <div className="quiz-options flex gap-4 w-full mt-4 flex-wrap">
              <button
                className="btn-secondary flex-1 py-5 justify-center font-extrabold text-xl"
                onClick={() => handleAnswerClick(quizPair.word1)}
                style={{
                  borderRadius: '16px',
                  border: '2px solid var(--color-primary)',
                  background: selectedAnswer && quizPair.word1 === targetWord ? 'var(--color-success-glow)' : 'var(--bg-card)',
                  color: 'var(--color-text-main)'
                }}
              >
                {quizPair.word1}
                <div className="text-xs font-normal color-text-muted mt-1">{quizPair.ipa1}</div>
              </button>

              <button
                className="btn-secondary flex-1 py-5 justify-center font-extrabold text-xl"
                onClick={() => handleAnswerClick(quizPair.word2)}
                style={{
                  borderRadius: '16px',
                  border: '2px solid var(--color-primary)',
                  background: selectedAnswer && quizPair.word2 === targetWord ? 'var(--color-success-glow)' : 'var(--bg-card)',
                  color: 'var(--color-text-main)'
                }}
              >
                {quizPair.word2}
                <div className="text-xs font-normal color-text-muted mt-1">{quizPair.ipa2}</div>
              </button>
            </div>

            {feedback && (
              <div className="quiz-feedback-box glass p-5 text-center mt-2 w-full animate-slideup" style={{ borderRadius: '16px', background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
                <p className="font-semibold text-sm mb-3" style={{ margin: 0, color: 'var(--color-text-main)' }}>{feedback}</p>
                <button className="btn-primary py-3 px-8 justify-center mx-auto text-sm" onClick={() => generateQuiz()} style={{ borderRadius: '10px', background: 'var(--color-primary)', color: '#ffffff', fontWeight: '800' }}>
                  Câu tiếp theo ➔
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE 3: SPEAKING PRACTICE STUDIO */}
        {activeTab === 'speak_quiz' && speakPair && (
          <div className="flex flex-col gap-6 py-2 animate-slideup" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div>
              <h4 className="font-semibold text-xs color-text-muted uppercase mb-3">1. Chọn từ muốn luyện thu âm:</h4>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSpeakTarget(speakPair.word1);
                    setSpeakScore(null);
                    setSpokenText('');
                  }}
                  className="btn-secondary flex-1 justify-center py-4 font-extrabold"
                  style={{
                    borderRadius: '14px',
                    border: '2px solid var(--color-primary)',
                    background: speakTarget === speakPair.word1 ? 'var(--color-primary)' : 'var(--bg-card)',
                    color: speakTarget === speakPair.word1 ? '#ffffff' : 'var(--color-text-main)'
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
                  className="btn-secondary flex-1 justify-center py-4 font-extrabold"
                  style={{
                    borderRadius: '14px',
                    border: '2px solid var(--color-primary)',
                    background: speakTarget === speakPair.word2 ? 'var(--color-primary)' : 'var(--bg-card)',
                    color: speakTarget === speakPair.word2 ? '#ffffff' : 'var(--color-text-main)'
                  }}
                >
                  🗣️ {speakPair.word2} ({speakPair.ipa2})
                </button>
              </div>
            </div>

            <div className="glass p-6 text-center flex flex-col items-center gap-3" style={{ background: 'var(--bg-input)', borderRadius: '18px', border: '1.5px solid var(--border-light)' }}>
              <span className="text-xs color-text-muted uppercase font-bold">Từ mục tiêu</span>
              <span className="text-5xl font-extrabold" style={{ color: 'var(--color-primary)' }}>{speakTarget}</span>
              <span className="text-xs color-text-muted italic">
                Ý nghĩa: {speakTarget === speakPair.word1 ? speakPair.mean1 : speakPair.mean2}
              </span>

              <div className="flex gap-2 mt-2">
                <button className="btn-secondary text-xs" onClick={() => speak(speakTarget, { accent: 'US' })} style={{ padding: '6px 14px', borderRadius: '8px' }}>🔊 US (Mỹ)</button>
                <button className="btn-secondary text-xs" onClick={() => speak(speakTarget, { accent: 'UK' })} style={{ padding: '6px 14px', borderRadius: '8px' }}>🔊 UK (Anh)</button>
              </div>
            </div>

            {/* Recording Box */}
            <div className="flex flex-col items-center gap-3 py-2">
              <button
                className={`btn-primary rounded-full w-22 h-22 flex items-center justify-center ${isRecording ? 'pulse' : ''}`}
                onClick={handleToggleSpeakRecord}
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: isRecording ? 'var(--color-error)' : 'var(--color-primary)',
                  boxShadow: isRecording ? '0 0 24px rgba(239, 68, 68, 0.5)' : '0 6px 24px var(--color-primary-glow)',
                  fontSize: '32px',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ffffff'
                }}
              >
                {isRecording ? '⏹' : '🎙️'}
              </button>
              <span className="text-xs color-text-muted font-medium">
                {isRecording ? 'Đang lắng nghe giọng bạn... Đọc rõ rồi click dừng' : 'Bấm micro và đọc to từ phía trên'}
              </span>

              {spokenText && (
                <div className="spoken-result-display animate-slideup mt-2 w-full p-4 rounded-xl text-center glass border border-light" style={{ borderRadius: '14px', background: 'var(--bg-card)' }}>
                  <div className="text-xs color-text-muted mb-1">Hệ thống nhận diện được:</div>
                  <div className="font-extrabold text-xl mb-2" style={{ color: 'var(--color-text-main)' }}>"{spokenText}"</div>
                  
                  {speakScore === 'perfect' && (
                    <span className="badge-level text-sm py-1.5 px-4 font-bold" style={{ backgroundColor: 'var(--color-success-glow)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }}>
                      Xuất Sắc! Phát âm chuẩn 100% 🎯
                    </span>
                  )}
                  {speakScore === 'good' && (
                    <span className="badge-level text-sm py-1.5 px-4 font-bold" style={{ backgroundColor: 'var(--color-primary-glow)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>
                      Khá tốt! Gần đúng 🌟
                    </span>
                  )}
                  {speakScore === 'try_again' && (
                    <span className="badge-level text-sm py-1.5 px-4 font-bold" style={{ backgroundColor: 'var(--color-error-glow)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>
                      Thử lại nhé! Hãy chú ý bật khẩu hình chuẩn 🔁
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Pair index switcher */}
            <div className="flex justify-between items-center mt-2 pt-4 border-t border-light" style={{ borderColor: 'var(--border-light)' }}>
              <button
                disabled={selectedGroup.pairs.indexOf(speakPair) === 0}
                className="btn-secondary text-xs"
                style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: '700' }}
                onClick={() => {
                  const currentIdx = selectedGroup.pairs.indexOf(speakPair);
                  const prevPair = selectedGroup.pairs[currentIdx - 1];
                  setSpeakPair(prevPair);
                  setSpeakTarget(prevPair.word1);
                  setSpeakScore(null);
                  setSpokenText('');
                }}
              >
                ← Cặp từ trước
              </button>

              <button
                disabled={selectedGroup.pairs.indexOf(speakPair) === selectedGroup.pairs.length - 1}
                className="btn-secondary text-xs"
                style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: '700' }}
                onClick={() => {
                  const currentIdx = selectedGroup.pairs.indexOf(speakPair);
                  const nextPair = selectedGroup.pairs[currentIdx + 1];
                  setSpeakPair(nextPair);
                  setSpeakTarget(nextPair.word1);
                  setSpeakScore(null);
                  setSpokenText('');
                }}
              >
                Cặp từ tiếp theo ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
