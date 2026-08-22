import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { playSound, speak } from '../utils/sounds';
import { conjugateWithCompromise, getSForm, getPastForm, getIngForm } from '../utils/helpers/conjugationEngine';
import { checkLocalGrammarErrors, checkGrammarOnline } from '../utils/helpers/grammarChecker';

export default function GlobalTranslator({ onSavedVocabChange, showToast, isPageMode = false, onNavigateBack }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [direction, setDirection] = useState('en-vi');
  const inputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('meanings');
  const recognitionRef = useRef(null);

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (showToast) showToast("Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói.", "error");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = direction === 'en-vi' ? 'en-US' : 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        if (showToast) showToast("🎙️ Đang lắng nghe giọng nói...", "info");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        fetchSuggestions(transcript);
        handleTranslate(null, transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (showToast) showToast("Không nhận diện được âm thanh, vui lòng thử lại.", "error");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Voice input error", err);
      setIsListening(false);
    }
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`Đã sao chép ${label || 'nội dung'}!`, "success");
  };

  const handleAiAnalysis = async () => {
    if (!result || isAiLoading) return;
    const wordToAnalyze = direction === 'en-vi' ? result.word : result.word;
    if (!wordToAnalyze) return;

    setIsAiLoading(true);
    try {
      const prompt = `Bạn là chuyên gia ngôn ngữ Anh-Việt cao cấp. Phân tích chi tiết và sâu sắc từ/cụm từ/câu sau: "${wordToAnalyze}" (Nghĩa dịch: "${result.vietnamese}").
Trả về CHỈ một chuỗi JSON hợp lệ (không chứa mác code fence \`\`\`json, không thêm text nào khác ngoài JSON) theo schema:
{
  "nuances": "Giải thích chi tiết sắc thái ngữ cảnh, độ trang trọng (formal/informal/slang), cảm xúc và hoàn cảnh sử dụng phù hợp nhất",
  "collocations": [
    {"phrase": "cụm 1", "vi": "nghĩa cụm 1"},
    {"phrase": "cụm 2", "vi": "nghĩa cụm 2"},
    {"phrase": "cụm 3", "vi": "nghĩa cụm 3"}
  ],
  "real_examples": [
    {"en": "câu ví dụ tiếng Anh 1", "vi": "dịch tiếng Việt 1"},
    {"en": "câu ví dụ tiếng Anh 2", "vi": "dịch tiếng Việt 2"}
  ],
  "alternatives": {
    "formal": "cách nói trang trọng hơn",
    "informal": "cách nói thông dụng",
    "slang": "cách nói lóng (nếu có, không có để null)"
  }
}`;

      const res = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error('AI proxy error');
      const data = await res.json();
      let rawText = typeof data === 'string' ? data : (data.text || data.content || data.response || '');
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setAiAnalysis(parsed);
      playSound("correct");
    } catch (err) {
      console.error("AI Analysis error:", err);
      if (showToast) showToast("Không thể phân tích AI lúc này, vui lòng thử lại.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchSuggestions = (val) => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    const trimmed = val.trim();
    // Do not suggest for empty, single char, or long sentences/paragraphs
    if (!trimmed || trimmed.length < 2 || trimmed.length > 35 || /[.,!?;:\n]/.test(trimmed)) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        let cleanWords = [];

        if (direction === 'en-vi') {
          // 1. Primary: Datamuse API (pure English dictionary vocabulary words)
          try {
            const datamuseRes = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(trimmed)}`)
              .then(r => r.json());
            if (Array.isArray(datamuseRes)) {
              cleanWords = datamuseRes
                .map(item => item.word)
                .filter(w => w && w.length >= 2 && !w.includes('_') && w.split(/\s+/).length <= 2)
                .slice(0, 5);
            }
          } catch (e) {
            console.warn("Datamuse sug error:", e);
          }

          // 2. Fallback to dictionary completion if Datamuse returned few results
          if (cleanWords.length < 4) {
            const callbackName = 'googleSuggest_' + Math.random().toString(36).substring(2, 10);
            const url = `https://suggestqueries.google.com/complete/search?client=dict&ds=d&hl=en&q=${encodeURIComponent(trimmed)}&jsonp=${callbackName}`;

            const googleData = await new Promise((resolve) => {
              window[callbackName] = (resData) => {
                cleanup();
                resolve(resData);
              };
              const script = document.createElement('script');
              script.src = url;
              script.id = callbackName;
              script.async = true;
              const timeout = setTimeout(() => { cleanup(); resolve(null); }, 1500);
              function cleanup() {
                clearTimeout(timeout);
                const el = document.getElementById(callbackName);
                if (el) el.remove();
                delete window[callbackName];
              }
              script.onerror = () => { cleanup(); resolve(null); };
              document.body.appendChild(script);
            });

            if (googleData && Array.isArray(googleData[1])) {
              const extraWords = googleData[1]
                .map(item => (Array.isArray(item) ? item[0] : item))
                .filter(w => typeof w === 'string' && w.trim())
                .map(w => w.replace(/<[^>]*>/g, '').trim())
                // Strictly filter to dictionary terms (max 2 words, no web search noise)
                .filter(w => w.split(/\s+/).length <= 2 && !/(youtube|mp3|free|download|game|movie|song|lyrics|pdf|hack|online)/i.test(w));
              
              cleanWords = Array.from(new Set([...cleanWords, ...extraWords])).slice(0, 5);
            }
          }
        } else {
          // Vietnamese -> English dictionary term suggestions
          const callbackName = 'googleSuggest_' + Math.random().toString(36).substring(2, 10);
          const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=vi&q=${encodeURIComponent(trimmed)}&jsonp=${callbackName}`;

          const googleData = await new Promise((resolve) => {
            window[callbackName] = (resData) => {
              cleanup();
              resolve(resData);
            };
            const script = document.createElement('script');
            script.src = url;
            script.id = callbackName;
            script.async = true;
            const timeout = setTimeout(() => { cleanup(); resolve(null); }, 1500);
            function cleanup() {
              clearTimeout(timeout);
              const el = document.getElementById(callbackName);
              if (el) el.remove();
              delete window[callbackName];
            }
            script.onerror = () => { cleanup(); resolve(null); };
            document.body.appendChild(script);
          });

          if (googleData && Array.isArray(googleData[1])) {
            cleanWords = googleData[1]
              .filter(w => typeof w === 'string' && w.trim())
              .filter(w => w.split(/\s+/).length <= 3 && !/(youtube|mp3|phim|game|hack|online|download|pdf|xem|tải)/i.test(w))
              .slice(0, 5);
          }
        }

        if (cleanWords.length > 0) {
          setSuggestions(cleanWords);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (e) {
        console.warn("Failed to fetch autocomplete suggestions:", e);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    fetchSuggestions(val);
  };

  const handleSelectSuggestion = (suggestionText) => {
    setQuery(suggestionText);
    setSuggestions([]);
    setShowSuggestions(false);
    handleTranslate(null, suggestionText);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const data = localStorage.getItem("eng_app_search_history");
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && typeof item === 'object' && item.word);
    } catch (e) {
      return [];
    }
  });

  const updateSearchHistory = (wordText, translationText) => {
    try {
      const historyData = localStorage.getItem("eng_app_search_history");
      let list = [];
      if (historyData) {
        const parsed = JSON.parse(historyData);
        if (Array.isArray(parsed)) {
          list = parsed.filter(item => item && typeof item === 'object' && item.word);
        }
      }
      
      list = list.filter(item => item.word && item.word.toLowerCase() !== wordText.toLowerCase());
      list.unshift({
        word: wordText,
        translation: translationText || "",
        timestamp: Date.now()
      });
      list = list.slice(0, 10);
      localStorage.setItem("eng_app_search_history", JSON.stringify(list));
      setSearchHistory(list);
    } catch (e) {
      console.error("Failed to save search history", e);
    }
  };

  const deleteSingleHistoryItem = (wordToDelete) => {
    try {
      const updated = searchHistory.filter(item => item.word !== wordToDelete);
      localStorage.setItem("eng_app_search_history", JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (e) {
      console.error("Failed to delete history item", e);
    }
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveWord = () => {
    if (!result) return;
    const targetWord = result.word;
    const vietnameseMeaning = result.vietnamese;
    if (!targetWord) return;

    storage.saveWord({
      word: targetWord,
      ipa: result.ipa || '',
      vietnamese: vietnameseMeaning,
      example: result.example || '',
      topic: 'Tra dịch AI',
      partOfSpeech: result.partOfSpeech || ''
    });

    setIsSaved(true);
    if (onSavedVocabChange) onSavedVocabChange();
    if (showToast) showToast(`Đã lưu "${targetWord}" vào Sổ tay từ vựng!`, 'success');
  };

  const handleTranslate = async (e, overrideQuery, forceOriginal = false) => {
    if (e) e.preventDefault();
    const queryToUse = overrideQuery || query;
    const cleanQuery = queryToUse.trim().toLowerCase();
    if (!cleanQuery) return;

    setIsLoading(true);
    setResult(null);
    setIsSaved(false);

    try {
      const isSourceEn = direction === 'en-vi';

      if (isSourceEn && forceOriginal) {
        const savedEntry = storage.getSavedVocab().find(w => w.word.toLowerCase() === cleanQuery);
        if (savedEntry) {
          if (savedEntry.forms && savedEntry.forms.present_continuous) {
            setResult({
              ...savedEntry,
              isSaved: true,
              source: 'cache'
            });
            updateSearchHistory(savedEntry.word, savedEntry.vietnamese);
            setIsSaved(true);
            setIsLoading(false);
            return;
          }
          const localGrammar = conjugateWithCompromise(savedEntry.word);
          setResult({
            word: savedEntry.word,
            ipa: savedEntry.ipa,
            vietnamese: savedEntry.vietnamese,
            example: savedEntry.example,
            partOfSpeech: savedEntry.partOfSpeech || (localGrammar ? localGrammar.partOfSpeech : ""),
            forms: localGrammar ? localGrammar.forms : null,
            hasGrammarError: savedEntry.hasGrammarError || false,
            correctedText: savedEntry.correctedText || "",
            grammarErrorExplanation: savedEntry.grammarErrorExplanation || "",
            isCustom: true,
            isSaved: true,
            source: 'cache'
          });
          updateSearchHistory(savedEntry.word, savedEntry.vietnamese);
          setIsSaved(true);
          setIsLoading(false);
          return;
        }
      }

      const sl = isSourceEn ? 'en' : 'vi';
      const tl = isSourceEn ? 'vi' : 'en';

      const queryHeadword = isSourceEn ? cleanQuery.replace(/^(a|an|the|to)\s+/i, '').trim() : cleanQuery;

      const primaryTransRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=bd&dt=qc&dt=rm&q=${encodeURIComponent(queryHeadword)}`)
        .then(res => res.json())
        .catch(() => null);

      let spellSuggestion = null;
      if (primaryTransRes && primaryTransRes[7] && primaryTransRes[7][1]) {
        const rawSug = String(primaryTransRes[7][1]).replace(/<[^>]*>/g, '').trim();
        if (rawSug && rawSug.toLowerCase() !== queryHeadword.toLowerCase()) {
          spellSuggestion = rawSug;
        }
      }

      let activeQueryHeadword = queryHeadword;
      let isAutoCorrected = false;

      if (spellSuggestion && !forceOriginal) {
        activeQueryHeadword = spellSuggestion;
        isAutoCorrected = true;
      }

      let activeTransData = primaryTransRes;
      if (isAutoCorrected && activeQueryHeadword.toLowerCase() !== queryHeadword.toLowerCase()) {
        activeTransData = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=bd&dt=qc&dt=rm&q=${encodeURIComponent(activeQueryHeadword)}`)
          .then(res => res.json())
          .catch(() => primaryTransRes);
      }

      let text = "Không tìm thấy nghĩa";
      let meaningsByPos = [];
      if (activeTransData && activeTransData[0]) {
        text = activeTransData[0].map(segment => segment[0]).filter(Boolean).join('');
      }
      if (activeTransData && activeTransData[1] && Array.isArray(activeTransData[1])) {
        const posMap = {
          noun: '📘 Danh từ (Noun)',
          verb: '⚡ Động từ (Verb)',
          adjective: '🎨 Tính từ (Adjective)',
          adverb: '🚀 Trạng từ (Adverb)',
          preposition: '🔗 Giới từ (Preposition)',
          conjunction: '🤝 Liên từ (Conjunction)',
          pronoun: '👤 Đại từ (Pronoun)',
          interjection: '💥 Thán từ (Interjection)'
        };
        meaningsByPos = activeTransData[1].map(item => {
          const rawPos = item[0] || '';
          const label = posMap[rawPos.toLowerCase()] || `📌 ${rawPos}`;
          const list = (item[1] || []).slice(0, 8);
          return { pos: rawPos, label, list };
        }).filter(i => i.list && i.list.length > 0);
      }

      const translationResult = text;
      const targetEnglishWord = isSourceEn ? activeQueryHeadword : translationResult.trim().toLowerCase();
      const rootEnglishWord = targetEnglishWord.replace(/^(a|an|the|to)\s+/i, '').trim();
      const isTargetSingleWord = !rootEnglishWord.includes(' ');

      let dictPromise = Promise.resolve({ ipa: '', ipaUK: '', ipaUS: '', example: '', synonymsList: [], apiPos: '' });
      if (isTargetSingleWord) {
        dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(rootEnglishWord)}`)
          .then(res => res.json())
          .then(data => {
            if (data && data[0]) {
              const phonetics = data[0].phonetics || [];
              const foundIpa = phonetics.find(p => p.text)?.text || data[0].phonetic || `/${rootEnglishWord}/`;

              let ipaUK = '';
              let ipaUS = '';
              phonetics.forEach(p => {
                if (p.text) {
                  const audioUrl = (p.audio || '').toLowerCase();
                  if (audioUrl.includes('-uk') || audioUrl.includes('uk/') || audioUrl.includes('en-gb')) {
                    ipaUK = p.text;
                  } else if (audioUrl.includes('-us') || audioUrl.includes('us/') || audioUrl.includes('en-us')) {
                    ipaUS = p.text;
                  }
                }
              });

              const textPhonetics = phonetics.filter(p => p.text);
              if (!ipaUK && textPhonetics.length > 0) {
                const ukCandidate = textPhonetics.find(p => (p.audio || '').toLowerCase().includes('uk')) || textPhonetics[0];
                ipaUK = ukCandidate.text;
              }
              if (!ipaUS && textPhonetics.length > 0) {
                const usCandidate = textPhonetics.find(p => (p.audio || '').toLowerCase().includes('us')) || (textPhonetics[1] || textPhonetics[0]);
                ipaUS = usCandidate.text;
              }

              const apiPos = data[0].meanings?.[0]?.partOfSpeech || "";
              const meaning = data[0].meanings?.[0]?.definitions?.[0]?.definition || "";
              const sample = data[0].meanings?.[0]?.definitions?.[0]?.example || "";

              let synonyms = [];
              if (data[0].meanings) {
                for (const m of data[0].meanings) {
                  if (m.synonyms) synonyms.push(...m.synonyms);
                  if (m.definitions) {
                    for (const d of m.definitions) {
                      if (d.synonyms) synonyms.push(...d.synonyms);
                    }
                  }
                }
              }
              const synonymsList = Array.from(new Set(synonyms))
                .filter(s => s && s.trim() && s.toLowerCase() !== rootEnglishWord.toLowerCase())
                .slice(0, 5);

              return {
                ipa: foundIpa,
                ipaUK: ipaUK,
                ipaUS: ipaUS,
                example: meaning ? `${meaning}${sample ? ` (E.g. ${sample})` : ''}` : '',
                synonymsList: synonymsList,
                apiPos: apiPos
              };
            }
            return { ipa: `/${rootEnglishWord}/`, ipaUK: '', ipaUS: '', example: '', synonymsList: [], apiPos: '' };
          })
          .catch(() => ({ ipa: `/${rootEnglishWord}/`, ipaUK: '', ipaUS: '', example: '', synonymsList: [], apiPos: '' }));
      }

      let dictInfo = await dictPromise;

      if (!spellSuggestion && isSourceEn && isTargetSingleWord && !dictInfo.example && !dictInfo.apiPos) {
        try {
          const sugRes = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(rootEnglishWord)}`).then(r => r.json());
          if (sugRes && sugRes.length > 0 && sugRes[0].word) {
            const topWord = sugRes[0].word.trim();
            if (topWord.toLowerCase() !== rootEnglishWord.toLowerCase() && sugRes[0].score > 500) {
              spellSuggestion = topWord;
              if (!forceOriginal) {
                activeQueryHeadword = spellSuggestion;
                isAutoCorrected = true;
                const corrDict = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(spellSuggestion)}`)
                  .then(r => r.json())
                  .catch(() => null);
                if (corrDict && corrDict[0]) {
                  const phonetics = corrDict[0].phonetics || [];
                  dictInfo.ipa = phonetics.find(p => p.text)?.text || corrDict[0].phonetic || `/${spellSuggestion}/`;
                  dictInfo.apiPos = corrDict[0].meanings?.[0]?.partOfSpeech || "";
                  const meaning = corrDict[0].meanings?.[0]?.definitions?.[0]?.definition || "";
                  const sample = corrDict[0].meanings?.[0]?.definitions?.[0]?.example || "";
                  dictInfo.example = meaning ? `${meaning}${sample ? ` (E.g. ${sample})` : ''}` : '';
                }
              }
            }
          }
        } catch (e) {
          console.warn("Datamuse spell check fallback error:", e);
        }
      }

      let localSynonyms = [];
      if (dictInfo.synonymsList && dictInfo.synonymsList.length > 0) {
        try {
          const synonymsText = dictInfo.synonymsList.join(" | ");
          const synTransRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(synonymsText)}`)
            .then(res => res.json())
            .then(data => {
              if (data && data[0]) {
                return data[0].map(s => s[0]).filter(Boolean).join('');
              }
              return "";
            });

          if (synTransRes) {
            const translatedWords = synTransRes.split(/\s*\|\s*/);
            localSynonyms = dictInfo.synonymsList.map((word, idx) => ({
              word: word,
              vietnamese: (translatedWords[idx] || "").trim() || "Nghĩa tương tự"
            }));
          }
        } catch (e) {
          console.warn("Failed to translate local synonyms:", e);
          localSynonyms = dictInfo.synonymsList.map(word => ({ word, vietnamese: "" }));
        }
      }

      const localGrammar = isTargetSingleWord ? conjugateWithCompromise(targetEnglishWord) : null;

      const posMap = {
        'noun': 'Danh từ (Noun)',
        'verb': 'Động từ (Verb)',
        'adjective': 'Tính từ (Adjective)',
        'adverb': 'Trạng từ (Adverb)',
        'pronoun': 'Đại từ (Pronoun)',
        'preposition': 'Giới từ (Preposition)',
        'conjunction': 'Liên từ (Conjunction)',
        'interjection': 'Thán từ (Interjection)',
        'abbreviation': 'Từ viết tắt (Abbreviation)',
        'expression': 'Thán từ / Cảm thán (Expression)'
      };

      let finalPartOfSpeech = "";
      if (isTargetSingleWord && dictInfo.apiPos && posMap[dictInfo.apiPos.toLowerCase()]) {
        finalPartOfSpeech = posMap[dictInfo.apiPos.toLowerCase()];
      } else if (localGrammar) {
        finalPartOfSpeech = localGrammar.partOfSpeech;
      } else {
        finalPartOfSpeech = isTargetSingleWord ? 'Từ đơn' : 'Cụm từ / Câu';
      }

      let translatedExample = "";
      if (isSourceEn && dictInfo.example) {
        try {
          const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(dictInfo.example)}`)
            .then(res => res.json())
            .then(data => {
              if (data && data[0]) {
                return data[0].map(s => s[0]).filter(Boolean).join('');
              }
              return "";
            });
          if (transRes) {
            translatedExample = transRes.trim();
          }
        } catch (e) {
          console.warn("Failed to translate definition:", e);
        }
      }

      const englishTextToCheck = isSourceEn ? activeQueryHeadword : translationResult.trim();
      const isWordInDictionary = isTargetSingleWord && !!(dictInfo.example || dictInfo.ipa || dictInfo.apiPos);
      let localCheck = { hasError: false, correctedText: "", explanation: "" };

      if (englishTextToCheck && !isWordInDictionary) {
        const localResult = checkLocalGrammarErrors(englishTextToCheck);

        let onlineCheck = null;
        try {
          onlineCheck = await checkGrammarOnline(englishTextToCheck);
        } catch (e) {
          console.warn("Online grammar check failed or timed out:", e);
        }

        if (onlineCheck && onlineCheck.hasError) {
          const combinedExplanations = [];
          if (localResult.hasError) {
            combinedExplanations.push(localResult.explanation);
          }
          combinedExplanations.push(onlineCheck.explanation);

          const mergedCorrected = checkLocalGrammarErrors(onlineCheck.correctedText);

          localCheck = {
            hasError: true,
            correctedText: mergedCorrected.correctedText,
            explanation: Array.from(new Set(combinedExplanations.join('\n').split('\n'))).filter(line => line.trim()).join('\n')
          };
        } else {
          localCheck = localResult;
        }

        if (localCheck.correctedText.toLowerCase() === englishTextToCheck.toLowerCase()) {
          localCheck.hasError = false;
          localCheck.correctedText = "";
          localCheck.explanation = "";
        }
      }

      const displayWord = isSourceEn ? activeQueryHeadword : translationResult;
      const alreadySaved = storage.getSavedVocab().find(w => w.word.toLowerCase() === displayWord.toLowerCase());
      if (alreadySaved) {
        setIsSaved(true);
      }

      setResult({
        word: displayWord,
        originalQuery: queryToUse.trim(),
        spellSuggestion: spellSuggestion,
        isAutoCorrected: isAutoCorrected,
        ipa: dictInfo.ipa || (isTargetSingleWord ? `/${targetEnglishWord}/` : ''),
        ipaUK: dictInfo.ipaUK || '',
        ipaUS: dictInfo.ipaUS || '',
        vietnamese: isSourceEn ? translationResult : queryToUse.trim(),
        partOfSpeech: finalPartOfSpeech,
        forms: localGrammar ? localGrammar.forms : null,
        example: dictInfo.example || '',
        translatedExample: translatedExample,
        hasGrammarError: localCheck.hasError,
        correctedText: localCheck.correctedText,
        grammarErrorExplanation: localCheck.explanation,
        originalCheckedText: englishTextToCheck,
        synonyms: localSynonyms,
        meaningsByPos: meaningsByPos,
        isCustom: true,
        isSaved: alreadySaved ? true : false
      });

      const finalWord = displayWord;
      const finalTrans = isSourceEn ? translationResult : queryToUse.trim();
      updateSearchHistory(finalWord, finalTrans);
    } catch (err) {
      console.error("Global translation failed:", err);
      if (showToast) showToast("Có lỗi xảy ra khi dịch, vui lòng thử lại.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text, accent) => {
    speak(text, { accent: accent || localStorage.getItem('eng_app_voice_accent') || 'US', rate: 0.85 });
  };

  const renderTranslatorContent = () => (
    <div className="w-full font-sans hero-translator-wrapper animate-fadeIn max-w-3xl mx-auto">

      {/* Top bar: back button (trái) + toggle chiều dịch dạng viên nang nhỏ (phải) */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        {onNavigateBack ? (
          <button
            type="button"
            onClick={onNavigateBack}
            className="text-xs font-semibold text-slate-500 hover:text-blue-700 border-none bg-transparent cursor-pointer transition-colors flex items-center gap-1"
          >
            ← Quay lại Dashboard
          </button>
        ) : <span />}

        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/80 text-xs">
          <button
            type="button"
            onClick={() => { setDirection('en-vi'); setQuery(''); setResult(null); setAiAnalysis(null); }}
            className={`px-3.5 py-1.5 font-bold rounded-full border-none cursor-pointer transition-all flex items-center gap-1.5 ${
              direction === 'en-vi' ? 'bg-white text-[#0F2B48] shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'
            }`}
          >
            🇬🇧🇺🇸 Anh
          </button>
          <button
            type="button"
            title="Đổi chiều dịch"
            onClick={() => {
              const newDirection = direction === 'en-vi' ? 'vi-en' : 'en-vi';
              const swappedQuery = result ? (direction === 'en-vi' ? result.vietnamese : result.word) : query;
              setDirection(newDirection);
              setQuery(swappedQuery || '');
              setResult(null);
              setAiAnalysis(null);
            }}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-[#0F2B48] rounded-full border-none bg-transparent cursor-pointer text-xs font-bold transition-all mx-0.5"
          >
            ⇄
          </button>
          <button
            type="button"
            onClick={() => { setDirection('vi-en'); setQuery(''); setResult(null); setAiAnalysis(null); }}
            className={`px-3.5 py-1.5 font-bold rounded-full border-none cursor-pointer transition-all flex items-center gap-1.5 ${
              direction === 'vi-en' ? 'bg-white text-[#0F2B48] shadow-sm' : 'text-slate-500 hover:text-slate-800 bg-transparent'
            }`}
          >
            🇻🇳 Việt
          </button>
        </div>
      </div>

      {/* Tiêu đề trung tâm - chỉ hiện to khi CHƯA có kết quả, để không rối khi đang xem bản dịch */}
      {!result && !isLoading && (
        <div className="text-center mb-7 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2B48] tracking-tight margin-0">
            Tra Từ & Dịch Nghĩa
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Gõ 1 từ, 1 cụm từ, hoặc cả câu — hệ thống tự tra nghĩa, phiên âm US-UK và phân tích ngữ pháp
          </p>
        </div>
      )}

      {/* 🔍 THANH TÌM KIẾM TRUNG TÂM (Hero Command Bar) */}
      <form onSubmit={handleTranslate} className="relative mb-2">
        <div className="hero-search-bar flex items-center gap-3 bg-white rounded-full shadow-md hover:shadow-lg border-2 border-slate-200 focus-within:border-[#0F2B48] px-3 py-2 pl-5 transition-all">
          <span className="text-lg text-slate-300 flex-shrink-0">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder={direction === 'en-vi' ? "Nhập từ, cụm từ hoặc câu tiếng Anh..." : "Nhập từ, cụm từ hoặc câu tiếng Việt..."}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="flex-1 outline-none border-none bg-transparent text-slate-900 placeholder-slate-400 text-base sm:text-lg font-medium py-2"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResult(null); setAiAnalysis(null); }}
              className="w-7 h-7 flex-shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs border-none cursor-pointer transition-colors"
              title="Xóa"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={startVoiceInput}
            className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center border-none cursor-pointer transition-all ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title={isListening ? "Đang lắng nghe..." : "Nhập bằng giọng nói"}
          >
            🎙️
          </button>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#0F2B48] hover:bg-[#1A3D63] disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-full border-none cursor-pointer transition-all shadow-sm"
            title="Tra cứu"
          >
            {isLoading ? <span className="spinner" /> : <span>➔</span>}
          </button>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown absolute top-full left-0 right-0 z-50 bg-white rounded-2xl shadow-xl mt-2 overflow-hidden border border-slate-200 animate-slideup">
            <div className="px-4 py-2 bg-[#F3F5F7] border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
              <span>📖 Gợi ý từ điển</span>
              <span>Bấm chọn ↵</span>
            </div>
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(item); }}
                className="px-4 py-2.5 cursor-pointer text-sm text-slate-800 hover:bg-blue-50/80 hover:text-blue-900 flex items-center justify-between border-b border-slate-100 last:border-none transition-colors font-medium"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-blue-600 text-xs">📖</span>
                  <span>{item}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Chọn</span>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* 💡 Gợi ý nhỏ dưới thanh tìm kiếm khi trang còn trống */}
      {!query && !result && !isLoading && (
        <p className="text-center text-xs text-slate-400 mb-6">
          Thử gõ <button type="button" onClick={() => { setQuery('amazing'); handleTranslate(null, 'amazing'); }} className="text-blue-600 font-semibold border-none bg-transparent cursor-pointer underline decoration-dotted">"amazing"</button> hoặc <button type="button" onClick={() => { setQuery('hit the books'); handleTranslate(null, 'hit the books'); }} className="text-blue-600 font-semibold border-none bg-transparent cursor-pointer underline decoration-dotted">"hit the books"</button> để bắt đầu
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 text-center">
          <span className="spinner-large" />
          <p className="text-xs text-slate-500 font-medium mt-3">Đang tra cứu từ điển & ngữ pháp...</p>
        </div>
      )}

      {/* 🎴 THẺ KẾT QUẢ NỔI (Result Hero Card) */}
      {result && !isLoading && (
        <div className="result-hero-card bg-white rounded-3xl shadow-md border border-slate-100 p-6 sm:p-8 animate-slideup mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F2B48] leading-tight tracking-tight margin-0">
                {direction === 'en-vi' ? result.word : result.vietnamese}
              </h1>
              <p className="text-slate-500 text-base font-medium mt-1">
                {direction === 'en-vi' ? result.vietnamese : result.word}
              </p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {result.partOfSpeech && (
                  <span className="px-2.5 py-1 rounded-md bg-[#0F2B48] text-white text-xs font-bold font-mono">
                    {result.partOfSpeech}
                  </span>
                )}
                {result.ipaUK && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(result.word, 'UK')}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-xs font-mono text-slate-800 hover:border-blue-500 cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                    title="Nghe giọng Anh BBC (UK)"
                  >
                    <span className="text-sm">🇬🇧</span>
                    <span className="font-bold">{result.ipaUK}</span>
                    <span className="text-xs text-blue-600">🔊</span>
                  </button>
                )}
                {result.ipaUS && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(result.word, 'US')}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-xs font-mono text-slate-800 hover:border-blue-500 cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                    title="Nghe giọng Mỹ (US)"
                  >
                    <span className="text-sm">🇺🇸</span>
                    <span className="font-bold">{result.ipaUS}</span>
                    <span className="text-xs text-blue-600">🔊</span>
                  </button>
                )}
                {!result.ipaUK && !result.ipaUS && result.ipa && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(result.word, 'US')}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-xs font-mono text-slate-800 hover:border-blue-500 cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                    title="Nghe phát âm"
                  >
                    <span className="font-bold">{result.ipa}</span>
                    <span className="text-xs text-blue-600">🔊</span>
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => handleSpeak(result.word, 'US')} 
                className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 cursor-pointer transition-all flex items-center gap-1.5" 
                title="Phát âm giọng US"
              >
                <span>🔊 Nghe</span>
              </button>
              <button 
                type="button" 
                onClick={() => handleCopy(direction === 'en-vi' ? result.vietnamese : result.word, 'Bản dịch')} 
                className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 cursor-pointer transition-all flex items-center gap-1.5" 
                title="Sao chép"
              >
                <span>📋 Copy</span>
              </button>
              {isSaved ? (
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                  ✓ Đã lưu
                </span>
              ) : (
                <button 
                  type="button" 
                  onClick={handleSaveWord} 
                  className="px-4 py-2 text-xs font-bold bg-[#0F2B48] hover:bg-[#1A3D63] text-white rounded-xl shadow-sm border-none cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <span>⭐ Lưu từ</span>
                </button>
              )}
            </div>
          </div>

          {/* Grammar Error Alert if any */}
          {result.hasGrammarError && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                <span>⚠️ Phát hiện lỗi ngữ pháp:</span>
              </div>
              {result.correctedText && (
                <p className="text-sm font-semibold text-emerald-800 margin-0 mb-1">
                  Gợi ý sửa: <span className="underline">{result.correctedText}</span>
                </p>
              )}
              {result.grammarErrorExplanation && (
                <p className="text-xs text-slate-600 margin-0 whitespace-pre-line">
                  {result.grammarErrorExplanation}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ⚠️ Auto-Correction Alert */}
      {result && result.spellSuggestion && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3 animate-slideup">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-bold text-base">💡</span>
            <span className="text-xs sm:text-sm text-amber-950 font-medium">
              Gợi ý từ Cambridge Dictionary: <strong className="text-[#0F2B48] text-base font-extrabold">{result.spellSuggestion}</strong>?
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery(result.spellSuggestion);
              handleTranslate(null, result.spellSuggestion);
            }}
            className="px-3.5 py-1.5 text-xs font-bold bg-[#0F2B48] hover:bg-[#1A3D63] text-white rounded-lg border-none cursor-pointer transition-all shadow-sm"
          >
            Chuyển sang từ này ➔
          </button>
        </div>
      )}

      {/* 📘 Cambridge Lexicon & Grammar Inspector Panel */}
      {result && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm mt-6 animate-slideup">
          
          {/* Cambridge Tab Bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveResultTab('meanings')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                activeResultTab === 'meanings' 
                  ? 'bg-[#0F2B48] text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>📖 Cambridge Entry & Ví dụ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('conjugation')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                activeResultTab === 'conjugation' 
                  ? 'bg-[#0F2B48] text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>⚡ 12 Thì Ngữ Pháp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('ai')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                activeResultTab === 'ai' 
                  ? 'bg-[#0F2B48] text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>✨ Phân Tích Gia Sư AI</span>
            </button>
          </div>

          {/* Tab 1: Meanings & Examples */}
          {activeResultTab === 'meanings' && (
            <div className="flex flex-col gap-4 text-sm text-slate-800">
              {result.meaningsByPos && result.meaningsByPos.map((posGroup, idx) => (
                <div key={idx} className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-200">
                  <span className="font-mono font-bold text-blue-700 text-xs uppercase tracking-wider block mb-1">
                    {posGroup.label}:
                  </span>
                  <p className="text-slate-900 margin-0 font-bold text-base">
                    {posGroup.list.join(', ')}
                  </p>
                </div>
              ))}

              {result.example && (
                <div className="p-4 bg-blue-50/60 rounded-xl border-l-4 border-[#0F2B48]">
                  <span className="text-xs font-mono font-bold text-slate-500 block mb-1">CÂU VÍ DỤ CHUẨN CAMBRIDGE:</span>
                  <p className="italic font-bold text-slate-900 margin-0 text-base">"{result.example}"</p>
                  {result.translatedExample && (
                    <p className="text-sm text-blue-800 font-bold mt-2 margin-0">➔ "{result.translatedExample}"</p>
                  )}
                </div>
              )}

              {result.synonyms && result.synonyms.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-mono font-bold text-slate-400 block mb-2 uppercase">TỪ ĐỒNG NGHĨA (SYNONYMS):</span>
                  <div className="flex flex-wrap gap-2">
                    {result.synonyms.map((syn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setQuery(syn.word);
                          handleTranslate(null, syn.word);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 text-slate-800 rounded-lg border border-slate-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <span>{syn.word}</span>
                        {syn.vietnamese && <span className="text-slate-400 text-xs font-normal">({syn.vietnamese})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Conjugation & 12 Tenses */}
          {activeResultTab === 'conjugation' && (
            <div className="text-sm">
              {(() => {
                const targetWord = (result.word || '').trim().toLowerCase().replace(/^(a|an|the|to)\s+/i, '');
                const conjugated = conjugateWithCompromise(targetWord);
                let verbForms = conjugated.forms;
                if (!verbForms || !verbForms.present_continuous || verbForms.past_simple === 'N/A') {
                  const base = targetWord;
                  const s_form = getSForm(base);
                  const v2 = getPastForm(base);
                  const v3 = v2;
                  const ing_form = getIngForm(base);
                  verbForms = {
                    present_simple: `${base} / ${s_form}`,
                    present_continuous: `am / is / are ${ing_form}`,
                    present_perfect: `have / has ${v3}`,
                    past_simple: v2,
                    past_continuous: `was / were ${ing_form}`,
                    past_perfect: `had ${v3}`,
                    future_simple: `will ${base}`
                  };
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <span className="font-mono font-bold text-blue-700 block mb-1 text-xs">HIỆN TẠI (PRESENT)</span>
                      <p className="margin-0 font-mono text-slate-900 text-sm font-bold">{verbForms.present_simple}</p>
                    </div>
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <span className="font-mono font-bold text-amber-700 block mb-1 text-xs">QUÁ KHỨ (PAST)</span>
                      <p className="margin-0 font-mono text-slate-900 text-sm font-bold">{verbForms.past_simple}</p>
                    </div>
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <span className="font-mono font-bold text-emerald-700 block mb-1 text-xs">TƯƠNG LAI (FUTURE)</span>
                      <p className="margin-0 font-mono text-slate-900 text-sm font-bold">{verbForms.future_simple}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab 3: AI Context Tutor */}
          {activeResultTab === 'ai' && (
            <div className="text-sm">
              {!aiAnalysis ? (
                <div className="text-center py-6 bg-[#F8FAFC] rounded-xl border border-slate-200 p-5">
                  <p className="text-xs text-slate-600 font-medium mb-3">
                    Bấm để Gia Sư AI phân tích sắc thái ngữ cảnh (Formal/Informal/Slang) và cụm từ đi kèm.
                  </p>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#0F2B48] hover:bg-[#1A3D63] transition-all border-none cursor-pointer shadow-md"
                    onClick={handleAiAnalysis}
                    disabled={isAiLoading}
                  >
                    {isAiLoading ? <span className="spinner" /> : '✨ Kích Hoạt AI Phân Tích Ngữ Cảnh'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 text-xs">
                  {aiAnalysis.nuances && (
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-[#0F2B48]">
                      <strong className="text-xs text-blue-700 font-mono block mb-1 uppercase">💡 SẮC THÁI NGỮ CẢNH AI:</strong>
                      <p className="margin-0 text-slate-900 font-medium text-sm leading-relaxed">{aiAnalysis.nuances}</p>
                    </div>
                  )}
                  {aiAnalysis.collocations && aiAnalysis.collocations.length > 0 && (
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-[#0F2B48]">
                      <strong className="text-xs text-blue-700 font-mono block mb-2 uppercase">🗣️ CỤM TỪ CỐ ĐỊNH (COLLOCATIONS):</strong>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {aiAnalysis.collocations.map((c, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                            <span className="font-bold text-slate-900 text-xs">{c.phrase}</span>
                            <span className="text-slate-600 text-xs font-medium">{c.vi}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiAnalysis.real_examples && aiAnalysis.real_examples.length > 0 && (
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-[#0F2B48]">
                      <strong className="text-xs text-blue-700 font-mono block mb-2 uppercase">📚 CÂU VÍ DỤ THỰC TẾ:</strong>
                      <div className="flex flex-col gap-2">
                        {aiAnalysis.real_examples.map((ex, i) => (
                          <div key={i} className="bg-white p-3 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-slate-900 text-xs margin-0">"{ex.en}"</p>
                              <button
                                type="button"
                                onClick={() => handleSpeak(ex.en, 'US')}
                                className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer p-0 text-xs flex-shrink-0"
                                title="Phát âm câu ví dụ"
                              >
                                🔊
                              </button>
                            </div>
                            {ex.vi && <p className="text-slate-500 text-xs mt-1 margin-0">➔ {ex.vi}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiAnalysis.alternatives && (
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border-l-4 border-[#0F2B48]">
                      <strong className="text-xs text-blue-700 font-mono block mb-2 uppercase">🔄 CÁC CÁCH DIỄN ĐẠT THAY THẾ:</strong>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {aiAnalysis.alternatives.formal && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold text-blue-600 block uppercase">Trang trọng (Formal)</span>
                            <span className="text-xs font-medium text-slate-800">{aiAnalysis.alternatives.formal}</span>
                          </div>
                        )}
                        {aiAnalysis.alternatives.informal && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold text-emerald-600 block uppercase">Thông dụng (Informal)</span>
                            <span className="text-xs font-medium text-slate-800">{aiAnalysis.alternatives.informal}</span>
                          </div>
                        )}
                        {aiAnalysis.alternatives.slang && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold text-amber-600 block uppercase">Tiếng lóng (Slang)</span>
                            <span className="text-xs font-medium text-slate-800">{aiAnalysis.alternatives.slang}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🕒 Search History Bar */}
      {searchHistory && searchHistory.length > 0 && (
        <div className="mt-8 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider margin-0">
              🕒 Lịch sử tra cứu gần đây
            </h3>
            <button 
              type="button"
              onClick={() => {
                localStorage.removeItem("eng_app_search_history");
                setSearchHistory([]);
                if (showToast) showToast("Đã xóa toàn bộ lịch sử tra cứu!", "info");
              }}
              className="text-xs text-red-500 hover:text-red-600 font-semibold border-none bg-transparent cursor-pointer"
            >
              🗑️ Xóa lịch sử
            </button>
          </div>

          {/* History Chips */}
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F5F7] hover:bg-white hover:shadow-xs rounded-lg text-xs text-slate-800 transition-all border border-slate-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (item && item.word) {
                      setQuery(item.word);
                      handleTranslate(null, item.word);
                    }
                  }}
                  className="bg-transparent border-none p-0 cursor-pointer text-slate-800 hover:text-blue-900 font-semibold text-xs flex items-center gap-1"
                >
                  <span><strong>{item.word}</strong></span>
                  {item.translation && <span className="text-slate-400 font-normal">→ {item.translation}</span>}
                </button>
                <button 
                  type="button"
                  title="Xóa mục này"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSingleHistoryItem(item.word);
                  }}
                  className="text-slate-400 hover:text-slate-700 font-bold ml-1 border-none bg-transparent cursor-pointer text-xs p-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (isPageMode) {
    return (
      <div className="translator-page animate-slideup w-full flex justify-center py-4">
        <div className="w-full max-w-5xl mx-auto p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
          {renderTranslatorContent()}
        </div>
      </div>
    );
  }

  return (
    <>
      <button 
        className="floating-translate-btn glass-glow"
        onClick={() => setIsOpen(true)}
        title="Tra từ / dịch nhanh toàn cục"
      >
        📖
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content translator-modal glass-glow" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', borderRadius: '24px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>🔍 Tra Từ & Dịch Nghĩa</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            {renderTranslatorContent()}
          </div>
        </div>
      )}
    </>
  );
}
