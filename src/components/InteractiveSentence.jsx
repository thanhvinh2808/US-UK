import React, { useState, useEffect, useRef } from 'react';
import { speak } from '../utils/sounds';
import { storage } from '../utils/storage';
import './InteractiveSentence.css';

// In-memory quick translation cache to prevent duplicate network calls
const wordTranslationCache = new Map();

export default function InteractiveSentence({
  text,
  isEnglish = true,
  onWordClick,
  showToast,
  className = ""
}) {
  const [activeWordData, setActiveWordData] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [savedStatus, setSavedStatus] = useState(false);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Close popover on document click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveWordData(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  if (!text) return null;

  // Split text into word tokens and delimiter tokens
  // Matches words (including contractions like don't, it's) and separators
  const tokenRegex = /([a-zA-Z0-9'’]+|[^a-zA-Z0-9'’\s]+|\s+)/g;
  const rawTokens = text.match(tokenRegex) || [text];

  const fetchWordDetail = async (rawWord) => {
    const cleanWord = rawWord.replace(/^['’]+|['’]+$/g, '').trim().toLowerCase();
    if (!cleanWord || cleanWord.length <= 1 && !['a', 'i'].includes(cleanWord)) return;

    if (wordTranslationCache.has(cleanWord)) {
      const cached = wordTranslationCache.get(cleanWord);
      setActiveWordData({ rawWord, cleanWord, ...cached });
      const isAlreadySaved = storage.getSavedVocab().some(w => w.word.toLowerCase() === cleanWord);
      setSavedStatus(isAlreadySaved);
      return;
    }

    setIsLoadingWord(true);
    try {
      // 1. Google Translate API for quick translation
      const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanWord)}`;
      const transPromise = fetch(transUrl)
        .then(r => r.json())
        .then(d => (d && d[0] && d[0][0] ? d[0][0][0] : ''))
        .catch(() => '');

      // 2. Dictionary API for IPA (English only)
      const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;
      const dictPromise = fetch(dictUrl)
        .then(r => r.json())
        .then(d => {
          if (d && d[0]) {
            const phonetics = d[0].phonetics || [];
            const textPhonetic = phonetics.find(p => p.text)?.text || d[0].phonetic || '';
            const pos = d[0].meanings?.[0]?.partOfSpeech || '';
            return { ipa: textPhonetic, pos };
          }
          return { ipa: '', pos: '' };
        })
        .catch(() => ({ ipa: '', pos: '' }));

      const [viMeaning, dictInfo] = await Promise.all([transPromise, dictPromise]);

      const data = {
        vietnamese: viMeaning || cleanWord,
        ipa: dictInfo.ipa || `/${cleanWord}/`,
        partOfSpeech: dictInfo.pos || ''
      };

      wordTranslationCache.set(cleanWord, data);
      setActiveWordData({ rawWord, cleanWord, ...data });

      const isAlreadySaved = storage.getSavedVocab().some(w => w.word.toLowerCase() === cleanWord);
      setSavedStatus(isAlreadySaved);
    } catch (err) {
      console.warn("Failed to fetch word hover detail:", err);
      setActiveWordData({
        rawWord,
        cleanWord,
        vietnamese: cleanWord,
        ipa: '',
        partOfSpeech: ''
      });
    } finally {
      setIsLoadingWord(false);
    }
  };

  const handleWordTrigger = (e, token) => {
    e.stopPropagation();
    const cleanWord = token.replace(/^['’]+|['’]+$/g, '').trim().toLowerCase();
    if (!cleanWord || (!/[a-zA-Z]/.test(cleanWord) && isEnglish)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Calculate position centered above the token
    const left = rect.left + scrollLeft + rect.width / 2;
    const top = rect.top + scrollTop - 8;

    setPopoverPos({ top, left });
    fetchWordDetail(token);
  };

  const handleMouseEnter = (e, token) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      handleWordTrigger(e, token);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleSpeakWord = (word, e) => {
    if (e) e.stopPropagation();
    if (word) speak(word, 'US');
  };

  const handleSaveWord = (wordData, e) => {
    if (e) e.stopPropagation();
    if (!wordData || !wordData.cleanWord) return;

    storage.saveWord({
      word: wordData.cleanWord,
      ipa: wordData.ipa || '',
      vietnamese: wordData.vietnamese || '',
      example: text,
      topic: 'Tra dịch câu',
      partOfSpeech: wordData.partOfSpeech || ''
    });

    setSavedStatus(true);
    if (showToast) showToast(`Đã lưu "${wordData.cleanWord}" vào Sổ tay!`, 'success');
  };

  return (
    <div ref={containerRef} className={`interactive-sentence-container ${className}`}>
      <span className="interactive-sentence-text">
        {rawTokens.map((token, idx) => {
          const isWord = /[a-zA-Z0-9]/.test(token);
          if (!isWord || !isEnglish) {
            return <span key={idx} className="sentence-token-plain">{token}</span>;
          }

          const isCurrentActive = activeWordData && activeWordData.rawWord === token;

          return (
            <span
              key={idx}
              className={`sentence-token-word ${isCurrentActive ? 'active' : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, token)}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => handleWordTrigger(e, token)}
              title="Rê chuột hoặc chạm để tra từ & phát âm"
            >
              {token}
            </span>
          );
        })}
      </span>

      {/* Floating Interactive Word Popover */}
      {activeWordData && (
        <div
          className="word-popover-card animate-popover"
          style={{
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`
          }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="word-popover-header">
            <div className="word-popover-word-group">
              <span className="word-popover-title">{activeWordData.cleanWord}</span>
              {activeWordData.ipa && <span className="word-popover-ipa">{activeWordData.ipa}</span>}
              {activeWordData.partOfSpeech && (
                <span className="word-popover-pos">{activeWordData.partOfSpeech}</span>
              )}
            </div>
            <button
              type="button"
              className="word-popover-close-btn"
              onClick={() => setActiveWordData(null)}
              title="Đóng"
            >
              ✕
            </button>
          </div>

          <div className="word-popover-body">
            {isLoadingWord ? (
              <span className="word-popover-loading">Đang tra từ...</span>
            ) : (
              <p className="word-popover-meaning">{activeWordData.vietnamese}</p>
            )}
          </div>

          <div className="word-popover-actions">
            <button
              type="button"
              onClick={(e) => handleSpeakWord(activeWordData.cleanWord, e)}
              className="word-popover-btn speak"
              title="Nghe phát âm"
            >
              🔊 Nghe
            </button>

            {savedStatus ? (
              <span className="word-popover-saved-badge">✓ Đã lưu</span>
            ) : (
              <button
                type="button"
                onClick={(e) => handleSaveWord(activeWordData, e)}
                className="word-popover-btn save"
                title="Lưu vào Sổ tay"
              >
                ⭐ Lưu
              </button>
            )}

            {onWordClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveWordData(null);
                  onWordClick(activeWordData.cleanWord);
                }}
                className="word-popover-btn search"
                title="Tra chi tiết"
              >
                🔍 Tra cứu
              </button>
            )}
          </div>
          <div className="word-popover-arrow" />
        </div>
      )}
    </div>
  );
}
