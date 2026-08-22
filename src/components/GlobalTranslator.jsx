import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { playSound, speak, speakCompare } from '../utils/sounds';
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
  const [grammarMode, setGrammarMode] = useState(null);
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
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const hl = direction === 'en-vi' ? 'en' : 'vi';
        const callbackName = 'googleSuggest_' + Math.random().toString(36).substring(2, 10);
        const url = `https://suggestqueries.google.com/complete/search?client=youtube&hl=${hl}&q=${encodeURIComponent(trimmed)}&jsonp=${callbackName}`;

        const data = await new Promise((resolve, reject) => {
          window[callbackName] = (resData) => {
            cleanup();
            resolve(resData);
          };

          const script = document.createElement('script');
          script.src = url;
          script.id = callbackName;
          script.async = true;

          const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('JSONP timeout'));
          }, 3000);

          function cleanup() {
            clearTimeout(timeout);
            const el = document.getElementById(callbackName);
            if (el) el.remove();
            delete window[callbackName];
          }

          script.onerror = () => {
            cleanup();
            reject(new Error('JSONP error'));
          };

          document.body.appendChild(script);
        });

        if (data && Array.isArray(data[1])) {
          const words = data[1]
            .map(item => Array.isArray(item) ? item[0] : item)
            .filter(Boolean);
          setSuggestions(words.slice(0, 5));
          setShowSuggestions(true);
        }
      } catch (e) {
        console.warn("Failed to fetch autocomplete suggestions via JSONP:", e);
      }
    }, 250);
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
    if (result) {
      const isVerb = result.partOfSpeech && (
        result.partOfSpeech.toLowerCase().includes("động từ") || 
        result.partOfSpeech.toLowerCase().includes("verb") ||
        (result.forms && result.forms.present_continuous)
      );
      setGrammarMode(isVerb ? 'verb' : 'non-verb');
    } else {
      setGrammarMode(null);
    }
  }, [result]);

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
      showToast("Có lỗi xảy ra khi dịch, vui lòng thử lại.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text, accent) => {
    speak(text, { accent: accent || localStorage.getItem('eng_app_voice_accent') || 'US', rate: 0.85 });
  };

  const renderTranslatorContent = () => (
    <div className="translator-shell">
      <div className="translator-topbar">
        <div className="translator-back-wrap">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="translator-back-btn"
            >
              ← Quay lại Dashboard
            </button>
          )}
        </div>

        <div className="translator-language-switch" aria-label="Chọn chiều dịch">
          <button
            type="button"
            onClick={() => {
              setDirection('en-vi');
              setQuery('');
              setResult(null);
              setAiAnalysis(null);
            }}
            className={`translator-language-option ${direction === 'en-vi' ? 'active' : ''}`}
          >
            Tiếng Anh (UK/US)
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
            className="translator-swap-btn"
          >
            ⇄
          </button>

          <button
            type="button"
            onClick={() => {
              setDirection('vi-en');
              setQuery('');
              setResult(null);
              setAiAnalysis(null);
            }}
            className={`translator-language-option ${direction === 'vi-en' ? 'active' : ''}`}
          >
            Tiếng Việt
          </button>
        </div>

        <div className="translator-spacer" />
      </div>

      <form onSubmit={handleTranslate} className="translator-panel-grid">
        <div className="translator-pane translator-input-pane">
          <div className="translator-pane-header">
            <span>Nhập văn bản</span>
            <span className="translator-badge">{direction === 'en-vi' ? 'EN → VI' : 'VI → EN'}</span>
          </div>

          <div className="translator-field-wrap">
            <textarea
              ref={inputRef}
              placeholder={direction === 'en-vi' ? 'Nhập văn bản tiếng Anh...' : 'Nhập văn bản tiếng Việt...'}
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (query.trim() && !isLoading) {
                    handleTranslate(e);
                  }
                }
              }}
              className="translator-textarea"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResult(null);
                  setAiAnalysis(null);
                }}
                className="translator-clear-btn"
                title="Xóa văn bản"
              >
                ✕
              </button>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="translator-suggestions">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(item);
                    }}
                    className="translator-suggestion-item"
                  >
                    <span>🔍</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="translator-action-bar">
            <div className="translator-left-actions">
              <button
                type="button"
                onClick={startVoiceInput}
                className={`translator-action-chip ${isListening ? 'active' : ''}`}
              >
                🎤 {isListening ? 'Đang nghe...' : 'Giọng nói'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      setQuery(text);
                      handleTranslate(null, text);
                    }
                  } catch (e) {
                    if (showToast) showToast('Không thể dán từ clipboard.', 'info');
                  }
                }}
                className="translator-action-chip"
              >
                📋 Dán
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="translator-primary-btn"
            >
              {isLoading ? <span className="spinner" /> : <><span>Dịch nghĩa</span> ✨</>}
            </button>
          </div>
        </div>

        <div className="translator-pane translator-output-pane">
          <div className="translator-pane-header">
            <span>Kết quả</span>
            <span className="translator-badge subtle">AI</span>
          </div>

          <div className="translator-output-body">
            {isLoading ? (
              <div className="translator-empty-state centered">
                <span className="spinner" />
                <p>Đang xử lý bản dịch...</p>
              </div>
            ) : result ? (
              <div className="translator-result-card animate-fadeIn">
                <p className="translator-result-word">
                  {direction === 'en-vi' ? result.vietnamese : result.word}
                </p>
                <div className="translator-meta-row">
                  {result.partOfSpeech && <span className="translator-tag">{result.partOfSpeech}</span>}
                  {result.ipaUK && <span className="translator-ipa">🇬🇧 {result.ipaUK}</span>}
                  {result.ipaUS && <span className="translator-ipa">🇺🇸 {result.ipaUS}</span>}
                </div>
              </div>
            ) : (
              <div className="translator-empty-state">
                Kết quả dịch sẽ xuất hiện ở đây...
              </div>
            )}
          </div>

          <div className="translator-footer-row">
            <span className="translator-microcopy">Bản dịch tự động</span>

            {result ? (
              <div className="translator-tools">
                <button
                  type="button"
                  onClick={() => handleSpeak(result.word, 'US')}
                  className="translator-tool-btn"
                  title="Phát âm US"
                >
                  🔊
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(direction === 'en-vi' ? result.vietnamese : result.word, 'Bản dịch')}
                  className="translator-tool-btn"
                  title="Sao chép"
                >
                  📋
                </button>
                {isSaved ? (
                  <span className="translator-saved-badge">✓ Đã lưu</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveWord}
                    className="translator-save-btn"
                  >
                    ⭐ Lưu
                  </button>
                )}
              </div>
            ) : (
              <div className="translator-tools muted">
                <button type="button" className="translator-tool-btn" title="Phát âm" disabled>🔊</button>
                <button type="button" className="translator-tool-btn" title="Sao chép" disabled>📋</button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Dictionary & AI Inspection Details */}
      {result && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 mt-4 animate-slideup">
          <div className="flex gap-2 border-b border-slate-100 pb-3 mb-4 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveResultTab('meanings')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border-none ${activeResultTab === 'meanings' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              📖 Nghĩa & Từ loại
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('conjugation')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border-none ${activeResultTab === 'conjugation' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ⚡ Chia 12 Thì & Dạng từ
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('ai')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border-none ${activeResultTab === 'ai' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ✨ Gia Sư AI Phân Tích
            </button>
          </div>

          {/* Tab 1: Meanings */}
          {activeResultTab === 'meanings' && (
            <div className="flex flex-col gap-3 text-sm text-slate-700">
              {result.meaningsByPos && result.meaningsByPos.map((posGroup, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="font-bold text-blue-600 text-xs uppercase block mb-1">{posGroup.label}:</span>
                  <p className="text-slate-800 margin-0 font-medium">{posGroup.list.join(', ')}</p>
                </div>
              ))}

              {result.example && (
                <div className="p-3 bg-blue-50/50 rounded-lg border-l-4 border-blue-600">
                  <span className="text-xs font-bold text-slate-500 block mb-1">VÍ DỤ TIẾNG ANH:</span>
                  <p className="italic font-semibold text-slate-800 margin-0">"{result.example}"</p>
                  {result.translatedExample && (
                    <p className="text-xs text-blue-600 font-bold mt-1 margin-0">➔ "{result.translatedExample}"</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Conjugation */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-blue-600 block mb-1">HIỆN TẠI (PRESENT)</span>
                      <p className="margin-0 font-mono text-slate-800">{verbForms.present_simple}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-blue-600 block mb-1">QUÁ KHỨ (PAST)</span>
                      <p className="margin-0 font-mono text-slate-800">{verbForms.past_simple}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-blue-600 block mb-1">TƯƠNG LAI (FUTURE)</span>
                      <p className="margin-0 font-mono text-slate-800">{verbForms.future_simple}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab 3: AI Analysis */}
          {activeResultTab === 'ai' && (
            <div className="text-sm">
              {!aiAnalysis ? (
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition border-none cursor-pointer shadow-sm"
                  onClick={handleAiAnalysis}
                  disabled={isAiLoading}
                >
                  {isAiLoading ? <span className="spinner" /> : '✨ Kích hoạt Gia Sư AI Phân Tích Sắc Thái & Ví Dụ'}
                </button>
              ) : (
                <div className="flex flex-col gap-3 text-xs">
                  {aiAnalysis.nuances && (
                    <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-blue-600">
                      <strong className="text-xs text-blue-600 block mb-1 font-bold">💡 SẮC THÁI NGỮ CẢNH:</strong>
                      <p className="margin-0 text-slate-800 font-medium leading-relaxed">{aiAnalysis.nuances}</p>
                    </div>
                  )}
                  {aiAnalysis.collocations && (
                    <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-blue-600">
                      <strong className="text-xs text-blue-600 block mb-2 font-bold">🗣️ CỤM TỪ CỐ ĐỊNH (COLLOCATIONS):</strong>
                      <div className="flex flex-col gap-1">
                        {aiAnalysis.collocations.map((c, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                            <span className="font-bold text-slate-800">{c.phrase}</span>
                            <span className="text-slate-500 font-medium">{c.vi}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Section */}
      {searchHistory && searchHistory.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 margin-0">
              🕒 Lịch sử tra cứu
            </h3>
            <button 
              type="button"
              onClick={() => {
                localStorage.removeItem("eng_app_search_history");
                setSearchHistory([]);
                if (showToast) showToast("Đã xóa toàn bộ lịch sử tra cứu!", "info");
              }}
              className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 hover:underline border-none bg-none cursor-pointer"
            >
              🗑️ Xóa lịch sử
            </button>
          </div>

          {/* Chips Grid */}
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-full text-xs text-slate-700 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (item && item.word) {
                      setQuery(item.word);
                      handleTranslate(null, item.word);
                    }
                  }}
                  className="bg-none border-none p-0 cursor-pointer text-slate-700 hover:text-blue-600 font-normal text-xs"
                >
                  <span><strong>{item.word}</strong> {item.translation ? `→ ${item.translation}` : ''}</span>
                </button>
                <button 
                  type="button"
                  title="Xóa mục này"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSingleHistoryItem(item.word);
                  }}
                  className="text-slate-400 hover:text-slate-600 font-bold ml-1 border-none bg-none cursor-pointer text-xs p-0"
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
