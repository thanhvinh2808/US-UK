import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { speak, speakCompare } from '../utils/sounds';

export default function VocabReader({ topic, onSavedVocabChange, onComplete, onNavigateBack, showToast }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [customTranslation, setCustomTranslation] = useState('');
  const [savedWordsList, setSavedWordsList] = useState(() => storage.getSavedVocab().map(w => w.word.toLowerCase()));
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFullTranslation, setShowFullTranslation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Custom Typography settings
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('eng_app_reader_font_size')) || 16);
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('eng_app_reader_font_family') || 'var(--font-sans)');

  // Split reading passage into words, stripping punctuation for translation lookups
  const words = topic.reading_passage.split(/\s+/);

  const handleWordClick = async (rawWord) => {
    // Clean word for lookup
    const cleanWord = rawWord.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
    setIsSidebarOpen(true);
    
    // Set loading state first
    setSelectedWord({
      word: cleanWord,
      ipa: "Loading...",
      vietnamese: "Translating...",
      example: "Loading example...",
      isCustom: true,
      isLoading: true
    });
    setCustomTranslation("Translating...");

    // 1. Check if word is already saved in notebook
    const savedEntry = storage.getSavedVocab().find(w => w.word.toLowerCase() === cleanWord);
    if (savedEntry) {
      setSelectedWord({
        word: savedEntry.word,
        ipa: savedEntry.ipa,
        vietnamese: savedEntry.vietnamese,
        example: savedEntry.example,
        isCustom: true,
        isSaved: true
      });
      setCustomTranslation(savedEntry.vietnamese);
      return;
    }

    // 2. Find in default vocabs
    const foundVocab = topic.default_vocabs.find(v => v.word.toLowerCase() === cleanWord);
    if (foundVocab) {
      setSelectedWord({
        word: cleanWord,
        ipa: foundVocab.ipa,
        vietnamese: foundVocab.vietnamese,
        example: foundVocab.example,
        isCustom: false
      });
      return;
    }

    // 3. Fallback: Mock dictionary first, then query Google Translate + Dictionary API
    const mockDict = {
      seattle: "thành phố Seattle (Mỹ)",
      famous: "nổi tiếng",
      coffee: "cà phê",
      culture: "văn hóa",
      every: "mỗi, mọi",
      morning: "buổi sáng",
      millions: "hàng triệu",
      people: "người, người dân",
      visit: "ghé thăm, viếng thăm",
      local: "địa phương",
      grab: "lấy, mua nhanh",
      drinks: "thức uống, đồ uống",
      order: "gọi món, đặt hàng",
      simple: "đơn giản",
      black: "đen",
      cappuccino: "cà phê cappuccino",
      latte: "cà phê latte",
      size: "kích cỡ, size",
      small: "nhỏ, cỡ nhỏ",
      medium: "trung bình, cỡ vừa",
      large: "lớn, cỡ to",
      add: "thêm vào",
      croissant: "bánh sừng bò",
      blueberry: "quả việt quất",
      muffin: "bánh nướng muffin",
      enjoy: "thưởng thức",
      warm: "ấm áp",
      drink: "đồ uống",
      succeeding: "thành công, gặt hái thành công",
      job: "công việc, việc làm",
      interview: "cuộc phỏng vấn",
      great: "tuyệt vời, to lớn",
      showcase: "trình bày, trưng bày",
      professional: "chuyên nghiệp",
      skills: "các kỹ năng",
      employers: "nhà tuyển dụng",
      want: "muốn",
      hire: "thuê, tuyển dụng",
      candidates: "ứng viên",
      motivated: "có động lực",
      qualified: "đủ năng lực",
      during: "trong suốt, trong khi",
      describe: "mô tả",
      strengths: "điểm mạnh",
      previous: "trước đó",
      work: "làm việc",
      experience: "kinh nghiệm",
      important: "quan trọng",
      listen: "lắng nghe",
      carefully: "cẩn thận",
      questions: "các câu hỏi",
      answer: "trả lời",
      clearly: "rõ ràng",
      thoughtful: "chu đáo, sâu sắc",
      company: "công ty",
      interest: "sự quan tâm, hứng thú",
      remember: "ghi nhớ",
      follow: "theo dõi, liên hệ lại",
      afterward: "sau đó, về sau"
    };

    let translation = mockDict[cleanWord] || "";
    let ipa = `/${cleanWord}/`;
    let example = `This is a sentence containing "${cleanWord}".`;

    if (translation) {
      setSelectedWord({
        word: cleanWord,
        ipa: ipa,
        vietnamese: translation,
        example: example,
        isCustom: true
      });
      setCustomTranslation(translation);
      return;
    }

    // Query online APIs asynchronously
    try {
      const transPromise = fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanWord)}`)
        .then(res => res.json())
        .then(data => data && data[0] && data[0][0] && data[0][0][0] ? data[0][0][0] : "Từ mới");

      const dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0]) {
            const phonetics = data[0].phonetics || [];
            const foundIpa = phonetics.find(p => p.text)?.text || data[0].phonetic || `/${cleanWord}/`;
            const meaning = data[0].meanings?.[0]?.definitions?.[0]?.definition || "";
            const sample = data[0].meanings?.[0]?.definitions?.[0]?.example || `Used as: ${cleanWord}`;
            return { ipa: foundIpa, example: `${meaning}. (E.g. ${sample})` };
          }
          return { ipa: `/${cleanWord}/`, example: `This is a sentence containing "${cleanWord}".` };
        })
        .catch(() => ({ ipa: `/${cleanWord}/`, example: `This is a sentence containing "${cleanWord}".` }));

      const [fetchedTranslation, fetchedDict] = await Promise.all([transPromise, dictPromise]);

      setSelectedWord({
        word: cleanWord,
        ipa: fetchedDict.ipa,
        vietnamese: fetchedTranslation,
        example: fetchedDict.example,
        isCustom: true
      });
      setCustomTranslation(fetchedTranslation);
    } catch (err) {
      console.error("Live translation failed:", err);
      setSelectedWord({
        word: cleanWord,
        ipa: ipa,
        vietnamese: "Dịch lỗi (Kiểm tra kết nối mạng)",
        example: example,
        isCustom: true
      });
      setCustomTranslation("Dịch lỗi");
    }
  };

  const handleSpeak = (word, accent) => {
    speak(word, { accent: accent || localStorage.getItem('eng_app_voice_accent') || 'US', rate: 0.85 });
  };

  const handleSaveWord = () => {
    if (!selectedWord) return;

    const wordToSave = {
      word: selectedWord.word,
      ipa: selectedWord.ipa,
      vietnamese: selectedWord.isCustom ? customTranslation : selectedWord.vietnamese,
      example: selectedWord.example,
      topic: topic.topic
    };

    try {
      const newList = storage.saveWord(wordToSave);
      if (newList && newList.length > 0) {
        setSavedWordsList(newList.map(w => w.word.toLowerCase()));
        setSelectedWord(prev => ({ ...prev, isSaved: true }));
        onSavedVocabChange();
        showToast('Đã lưu từ vào sổ tay!', 'success');
      } else {
        showToast('Không thể lưu từ, vui lòng thử lại', 'error');
      }
    } catch (e) {
      showToast('Không thể lưu từ, vui lòng thử lại', 'error');
    }
  };

  const handleMarkAsRead = () => {
    storage.updateTopicProgress(topic.id, 'reading');
    setIsCompleted(true);
    if (onComplete) onComplete();
  };

  return (
    <div className="vocab-reader-screen animate-slideup">
      {/* Header and Back Button */}
      <div className="screen-header mb-6">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Back to Dashboard
        </button>
        <div className="topic-meta">
          <span className="badge-level">{topic.level}</span>
          <span className="topic-name">{topic.topic}</span>
        </div>
      </div>

      <div className="reader-layout">
        {/* Left Side: Reading Passage */}
        <div className="passage-section glass p-6">
          <h2 className="passage-title mb-4">{topic.title}</h2>

          {/* Typography Customization Toolbar */}
          <div className="font-controls mb-4 flex flex-wrap gap-4 items-center justify-between p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
            <div className="flex gap-2 items-center">
              <span className="text-xs color-text-muted">Cỡ chữ:</span>
              <button 
                className="btn-secondary" 
                style={{ padding: '2px 8px', fontSize: '12px' }}
                onClick={() => {
                  const newSize = Math.max(12, fontSize - 2);
                  setFontSize(newSize);
                  localStorage.setItem('eng_app_reader_font_size', newSize);
                }}
              >
                A-
              </button>
              <span className="text-sm font-bold">{fontSize}px</span>
              <button 
                className="btn-secondary" 
                style={{ padding: '2px 8px', fontSize: '12px' }}
                onClick={() => {
                  const newSize = Math.min(30, fontSize + 2);
                  setFontSize(newSize);
                  localStorage.setItem('eng_app_reader_font_size', newSize);
                }}
              >
                A+
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs color-text-muted">Phông chữ:</span>
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  localStorage.setItem('eng_app_reader_font_family', e.target.value);
                }}
                className="btn-secondary text-xs"
                style={{ padding: '4px 8px', background: 'var(--bg-dark)', color: 'var(--color-text-main)', border: '1px solid var(--border-light)' }}
              >
                <option value="var(--font-sans)">Không chân (Sans-Serif)</option>
                <option value="Georgia, Cambria, 'Times New Roman', Times, serif">Có chân (Serif)</option>
                <option value="'Courier New', Courier, monospace">Đơn cách (Monospace)</option>
                <option value="system-ui, -apple-system, BlinkMacSystemFont, sans-serif">Hệ thống (System)</option>
              </select>
            </div>
          </div>
          
          <div 
            className="reading-text-box mb-6"
            style={{ 
              fontSize: `${fontSize}px`, 
              fontFamily: fontFamily,
              lineHeight: '1.8',
              letterSpacing: '0.02em'
            }}
          >
            {words.map((word, idx) => {
              const clean = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
              const isSaved = savedWordsList.includes(clean);
              const isTopicVocab = topic.default_vocabs.some(v => v.word.toLowerCase() === clean);

              return (
                <span 
                  key={idx} 
                  className={`readable-word ${isTopicVocab ? 'topic-vocab' : ''} ${isSaved ? 'saved-vocab' : ''}`}
                  onClick={() => handleWordClick(word)}
                >
                  {word}{' '}
                </span>
              );
            })}
          </div>

          <div className="passage-actions mb-6 flex flex-wrap gap-3">
            <button 
              className={`btn-secondary ${showFullTranslation ? 'pulse-border' : ''}`}
              onClick={() => setShowFullTranslation(!showFullTranslation)}
            >
              {showFullTranslation ? "👁️ Hide Paragraph Translation" : "📝 Translate Entire Paragraph"}
            </button>
            
            <button 
              className="btn-secondary mobile-only-vocab-btn"
              onClick={() => setIsSidebarOpen(true)}
            >
              🔑 View Key Vocabulary
            </button>
            
            {!isCompleted ? (
              <button className="btn-primary" onClick={handleMarkAsRead}>
                📖 Mark as Read (+10 XP)
              </button>
            ) : (
              <div className="completion-badge">
                🎉 Reading completed! +10 XP awarded.
              </div>
            )}
          </div>

          {showFullTranslation && (
            <div className="paragraph-translation-box glass p-5 mb-6 animate-slideup" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
              <h4 className="color-text-muted mb-2 text-sm">🇻🇳 Bản dịch nghĩa tiếng Việt:</h4>
              <p className="color-text-main leading-relaxed paragraph-translation-text">
                {topic.reading_passage_translation}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Translation Details & Keyword Sidebar */}
        {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}
        <div className={`sidebar-section ${isSidebarOpen ? 'active' : ''}`}>
          {/* Word Translator Box */}
          {selectedWord ? (
            <div className="word-details-box glass-glow p-5 mb-6">
              <div className="details-header mb-3">
                <h3 className="word-title">{selectedWord.word}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button className="speak-btn" onClick={() => handleSpeak(selectedWord.word, 'US')} title="US Pronunciation">🇺🇸</button>
                    <button className="speak-btn" onClick={() => handleSpeak(selectedWord.word, 'UK')} title="UK Pronunciation">🇬🇧</button>
                    <button className="speak-btn" onClick={() => speakCompare(selectedWord.word)} title="Compare US/UK">🆚</button>
                  </div>
                  <button 
                    className="speak-btn close-details-btn" 
                    onClick={() => {
                      setSelectedWord(null);
                      setIsSidebarOpen(false);
                    }} 
                    title="Close details"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--color-error)',
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="word-ipa mb-3">{selectedWord.ipa}</div>

              {selectedWord.isCustom ? (
                <div className="custom-translation-input mb-4">
                  <label className="color-text-muted text-sm block mb-1">Edit Translation:</label>
                  <input 
                    type="text" 
                    className="translation-text-input"
                    value={customTranslation}
                    onChange={(e) => setCustomTranslation(e.target.value)}
                  />
                </div>
              ) : (
                <div className="word-translation mb-4">{selectedWord.vietnamese}</div>
              )}

              <div className="word-example mb-4">
                <strong>Example:</strong>
                <p className="color-text-muted mt-1 italic">"{selectedWord.example}"</p>
              </div>

              {savedWordsList.includes(selectedWord.word.toLowerCase()) || selectedWord.isSaved ? (
                <button className="btn-secondary w-full justify-center" disabled>
                  ✓ Saved to Notebook
                </button>
              ) : (
                <button className="btn-primary w-full justify-center" onClick={handleSaveWord}>
                  ⭐ Save to Notebook
                </button>
              )}
            </div>
          ) : (
            <div className="word-details-box glass p-5 mb-6 text-center text-muted">
              <span className="icon-huge">👆</span>
              <p className="mt-3">Click on any word in the text to see its translation, pronunciation, and save it!</p>
            </div>
          )}

          {/* Topic Vocabulary List */}
          <div className="topic-vocab-list-box glass p-5">
            <h3 className="mb-4">Key Vocabulary</h3>
            <div className="vocab-list">
              {topic.default_vocabs.map((vocab, index) => {
                const isSaved = savedWordsList.includes(vocab.word.toLowerCase());
                return (
                  <div key={index} className="vocab-row">
                    <div className="vocab-row-left" onClick={() => handleWordClick(vocab.word)}>
                      <span className="vocab-row-word">{vocab.word}</span>
                      <span className="vocab-row-ipa">{vocab.ipa}</span>
                    </div>
                    <div className="vocab-row-right" style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="flex gap-1" style={{ marginRight: '8px', display: 'flex' }}>
                        <button className="row-speak-btn" onClick={() => handleSpeak(vocab.word, 'US')} title="US">🇺🇸</button>
                        <button className="row-speak-btn" onClick={() => handleSpeak(vocab.word, 'UK')} title="UK">🇬🇧</button>
                        <button className="row-speak-btn" onClick={() => speakCompare(vocab.word)} title="So sánh">🆚</button>
                      </div>
                      <button 
                        className={`row-save-btn ${isSaved ? 'saved' : ''}`}
                        onClick={() => {
                          try {
                            setSelectedWord({
                              word: vocab.word,
                              ipa: vocab.ipa,
                              vietnamese: vocab.vietnamese,
                              example: vocab.example,
                              isCustom: false
                            });
                            const saved = storage.saveWord({
                              word: vocab.word,
                              ipa: vocab.ipa,
                              vietnamese: vocab.vietnamese,
                              example: vocab.example,
                              topic: topic.topic
                            });
                            if (saved && saved.length > 0) {
                              setSavedWordsList(storage.getSavedVocab().map(w => w.word.toLowerCase()));
                              onSavedVocabChange();
                              showToast('Đã lưu từ vào sổ tay!', 'success');
                            } else {
                              showToast('Không thể lưu từ, vui lòng thử lại', 'error');
                            }
                          } catch (e) {
                            showToast('Không thể lưu từ, vui lòng thử lại', 'error');
                          }
                        }}
                        disabled={isSaved}
                      >
                        {isSaved ? '★' : '☆'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
