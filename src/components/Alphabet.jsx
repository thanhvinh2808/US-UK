import React, { useState, useEffect, useCallback } from 'react';
import { speak } from '../utils/sounds';

// Dữ liệu 26 chữ cái: phiên âm IPA khi ĐỌC TÊN CHỮ CÁI (không phải âm của chữ cái trong từ),
// cách đọc gần đúng theo tiếng Việt để dễ nhớ, phân loại nguyên âm/phụ âm, và 1 từ ví dụ.
// Tham khảo nội dung: https://ielts-fighter.com/tin-tuc/bang-chu-cai-tieng-anh_mt1567769918.html
const ALPHABET_DATA = [
  { letter: 'A', ipa: '/eɪ/', vi: 'Ây', example: 'Apple', type: 'vowel' },
  { letter: 'B', ipa: '/biː/', vi: 'Bi', example: 'Banana', type: 'consonant' },
  { letter: 'C', ipa: '/siː/', vi: 'Si', example: 'Cat', type: 'consonant' },
  { letter: 'D', ipa: '/diː/', vi: 'Đi', example: 'Dog', type: 'consonant' },
  { letter: 'E', ipa: '/iː/', vi: 'I', example: 'Elephant', type: 'vowel' },
  { letter: 'F', ipa: '/ɛf/', vi: 'Ép', example: 'Fish', type: 'consonant' },
  { letter: 'G', ipa: '/dʒiː/', vi: 'Ji', example: 'Grape', type: 'consonant' },
  { letter: 'H', ipa: '/eɪtʃ/', vi: 'Ết', example: 'House', type: 'consonant' },
  { letter: 'I', ipa: '/aɪ/', vi: 'Ai', example: 'Ice cream', type: 'vowel' },
  { letter: 'J', ipa: '/dʒeɪ/', vi: 'Dzê', example: 'Juice', type: 'consonant' },
  { letter: 'K', ipa: '/keɪ/', vi: 'Kêy', example: 'Kite', type: 'consonant' },
  { letter: 'L', ipa: '/ɛl/', vi: 'Eo', example: 'Lion', type: 'consonant' },
  { letter: 'M', ipa: '/ɛm/', vi: 'Em', example: 'Monkey', type: 'consonant' },
  { letter: 'N', ipa: '/ɛn/', vi: 'En', example: 'Nose', type: 'consonant' },
  { letter: 'O', ipa: '/oʊ/', vi: 'Âu', example: 'Orange', type: 'vowel' },
  { letter: 'P', ipa: '/piː/', vi: 'Pi', example: 'Pig', type: 'consonant' },
  { letter: 'Q', ipa: '/kjuː/', vi: 'Kiu', example: 'Queen', type: 'consonant' },
  { letter: 'R', ipa: '/ɑːr/', vi: 'A-rờ', example: 'Rabbit', type: 'consonant' },
  { letter: 'S', ipa: '/ɛs/', vi: 'Ét', example: 'Sun', type: 'consonant' },
  { letter: 'T', ipa: '/tiː/', vi: 'Ti', example: 'Tiger', type: 'consonant' },
  { letter: 'U', ipa: '/juː/', vi: 'Diu', example: 'Umbrella', type: 'vowel' },
  { letter: 'V', ipa: '/viː/', vi: 'Vi', example: 'Violin', type: 'consonant' },
  { letter: 'W', ipa: '/ˈdʌbəljuː/', vi: 'Đắp-liu', example: 'Watermelon', type: 'consonant' },
  { letter: 'X', ipa: '/ɛks/', vi: 'Ét-sờ', example: 'X-ray', type: 'consonant' },
  { letter: 'Y', ipa: '/waɪ/', vi: 'Quai', example: 'Yellow', type: 'consonant' },
  { letter: 'Z', ipa: '/ziː/', vi: 'Di', example: 'Zebra', type: 'consonant' },
];

export default function Alphabet({ onNavigateBack }) {
  const [activeLetter, setActiveLetter] = useState(null);
  const [filter, setFilter] = useState('all'); // all | vowel | consonant
  const [speakMode, setSpeakMode] = useState('letter'); // letter | example

  const handlePlay = useCallback((item) => {
    setActiveLetter(item.letter);
    const textToSpeak = speakMode === 'example' ? item.example : item.letter;
    speak(textToSpeak, { rate: 0.8 });
    // Bỏ hiệu ứng "đang phát" sau một khoảng ngắn để card không bị highlight mãi
    setTimeout(() => setActiveLetter(prev => (prev === item.letter ? null : prev)), 900);
  }, [speakMode]);

  // Hỗ trợ gõ phím A-Z trên bàn phím để nghe phát âm nhanh, không cần rê chuột
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      const item = ALPHABET_DATA.find(d => d.letter === key);
      if (item) handlePlay(item);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlay]);

  const filteredData = ALPHABET_DATA.filter(item => filter === 'all' || item.type === filter);

  return (
    <div className="alphabet-container animate-slideup">
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

      {/* Header Card */}
      <div className="handbook-header glass p-6 mb-8 rounded-xl" style={{ background: 'var(--bg-card)', border: 'none', boxShadow: 'var(--shadow-subtle)' }}>
        <h1 className="glow-text text-gradient" style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0 }}>Bảng Chữ Cái Tiếng Anh</h1>
        <p className="color-text-muted mt-2" style={{ fontSize: '13px', fontWeight: '400', margin: '6px 0 0 0' }}>
          Bấm vào 1 chữ cái (hoặc gõ phím A–Z trên bàn phím) để nghe phát âm chuẩn. Đổi giọng US/UK ở thanh bên trái.
        </p>
      </div>

      {/* Bộ lọc: tất cả / nguyên âm / phụ âm + chế độ phát âm */}
      <div className="handbook-controls mb-8 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            className={`btn-secondary ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả (26)
          </button>
          <button
            className={`btn-secondary ${filter === 'vowel' ? 'active' : ''}`}
            onClick={() => setFilter('vowel')}
            style={filter === 'vowel' ? { borderColor: '#22d3ee' } : {}}
          >
            🔵 Nguyên âm (5)
          </button>
          <button
            className={`btn-secondary ${filter === 'consonant' ? 'active' : ''}`}
            onClick={() => setFilter('consonant')}
            style={filter === 'consonant' ? { borderColor: '#f59e0b' } : {}}
          >
            🟠 Phụ âm (21)
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <span className="color-text-muted text-xs">Bấm để nghe:</span>
          <button
            className={`btn-secondary text-xs ${speakMode === 'letter' ? 'active' : ''}`}
            onClick={() => setSpeakMode('letter')}
          >
            Tên chữ cái
          </button>
          <button
            className={`btn-secondary text-xs ${speakMode === 'example' ? 'active' : ''}`}
            onClick={() => setSpeakMode('example')}
          >
            Từ ví dụ
          </button>
        </div>
      </div>

      {/* Lưới 26 chữ cái */}
      <div
        className="alphabet-grid glass p-4 rounded-xl"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
          gap: '14px',
        }}
      >
        {filteredData.map((item) => {
          const isActive = activeLetter === item.letter;
          const isVowel = item.type === 'vowel';
          return (
            <button
              key={item.letter}
              onClick={() => handlePlay(item)}
              className="alphabet-card glass p-3 rounded-xl transition-all cursor-pointer"
              style={{
                textAlign: 'center',
                border: isActive ? '2px solid #22d3ee' : 'none',
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
                boxShadow: isActive ? '0 0 16px rgba(34,211,238,0.55)' : 'none',
              }}
              title={`${item.letter} — ${item.ipa} (${item.example})`}
            >
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: isVowel ? '#22d3ee' : '#f59e0b',
                }}
              >
                {item.letter}
              </div>
              <div className="color-text-muted text-xs mt-1">{item.ipa}</div>
              <div className="text-xs mt-1" style={{ opacity: 0.85 }}>{item.vi}</div>
              <div className="color-text-muted text-xs mt-1" style={{ fontStyle: 'italic' }}>
                {item.example}
              </div>
            </button>
          );
        })}
      </div>

      {/* Ghi chú nhỏ ở cuối */}
      <p className="color-text-muted text-xs mt-6 text-center">
        Mẹo nhớ nguyên âm nhanh: U, E, O, A, I — đọc thành "uể oải" 🙂
      </p>
    </div>
  );
}
