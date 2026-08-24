import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { playSound, speak } from '../utils/sounds';
import { conjugateWithCompromise, get12Tenses, getVerbBilingualExamples } from '../utils/helpers/conjugationEngine';
import { checkLocalGrammarErrors, checkGrammarOnline } from '../utils/helpers/grammarChecker';
import InteractiveSentence from './InteractiveSentence';

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyMenuRef = useRef(null);
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
        setIsHistoryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleHistoryOutsideClick = (e) => {
      if (historyMenuRef.current && !historyMenuRef.current.contains(e.target)) {
        setIsHistoryOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleHistoryOutsideClick);
    return () => document.removeEventListener('pointerdown', handleHistoryOutsideClick);
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

      const targetVerbCandidate = isSourceEn ? activeQueryHeadword : translationResult;
      const tenses12 = get12Tenses(targetVerbCandidate);
      const bilingualExamples = getVerbBilingualExamples(targetVerbCandidate, isSourceEn ? translationResult : queryToUse.trim());

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
        tenses12: tenses12,
        bilingualExamples: bilingualExamples,
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

        <div className="translator-history-menu-wrap" ref={historyMenuRef}>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`translator-history-toggle-btn ${isHistoryOpen ? 'active' : ''}`}
            title="Xem lịch sử tra cứu"
          >
            🕒 <span className="history-btn-text">Lịch sử</span>
            {searchHistory && searchHistory.length > 0 && (
              <span className="history-counter">{searchHistory.length}</span>
            )}
          </button>

          {isHistoryOpen && (
            <div className="translator-history-dropdown animate-popover">
              <div className="history-dropdown-header">
                <div className="history-dropdown-title-group">
                  <span>🕒 Lịch sử tra cứu</span>
                  <span className="history-count-badge">{searchHistory.length}</span>
                </div>
                <div className="history-header-actions">
                  {searchHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("eng_app_search_history");
                        setSearchHistory([]);
                        if (showToast) showToast("Đã xóa toàn bộ lịch sử!", "info");
                      }}
                      className="history-clear-all-btn"
                      title="Xóa toàn bộ lịch sử"
                    >
                      🗑️ Xóa hết
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsHistoryOpen(false)}
                    className="history-dropdown-close-btn"
                    title="Đóng"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="history-dropdown-list">
                {searchHistory.length === 0 ? (
                  <div className="history-empty-text">Chưa có lịch sử tra cứu nào</div>
                ) : (
                  searchHistory.map((item, idx) => (
                    <div key={idx} className="history-dropdown-item">
                      <div
                        className="history-item-content"
                        onClick={() => {
                          setQuery(item.word);
                          handleTranslate(null, item.word);
                          setIsHistoryOpen(false);
                        }}
                      >
                        <span className="history-item-word">{item.word}</span>
                        {item.translation && (
                          <span className="history-item-trans">→ {item.translation}</span>
                        )}
                      </div>
                      <div className="history-item-actions">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(item.word, 'US');
                          }}
                          className="history-item-btn audio"
                          title="Nghe phát âm"
                        >
                          🔊
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSingleHistoryItem(item.word);
                          }}
                          className="history-item-btn delete"
                          title="Xóa mục này"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick History Pills Bar */}
      {searchHistory && searchHistory.length > 0 && (
        <div className="translator-quick-history-bar">
          <span className="quick-history-label">🕒 Gần đây:</span>
          <div className="quick-history-scroll-track">
            {searchHistory.slice(0, 10).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (item && item.word) {
                    setQuery(item.word);
                    handleTranslate(null, item.word);
                  }
                }}
                className="quick-history-chip"
                title={`Tra lại: ${item.word}`}
              >
                <span className="chip-word">{item.word}</span>
                {item.translation && <span className="chip-trans">→ {item.translation}</span>}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="quick-history-all-btn"
            title="Xem & Quản lý tất cả lịch sử"
          >
            Tất cả ({searchHistory.length})
          </button>
        </div>
      )}

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
                <div className="translator-result-word">
                  {direction === 'en-vi' ? (
                    <span>{result.vietnamese}</span>
                  ) : (
                    <InteractiveSentence
                      text={result.word}
                      isEnglish={true}
                      onWordClick={(w) => { setQuery(w); handleTranslate(null, w); }}
                      showToast={showToast}
                    />
                  )}
                </div>

                {direction === 'en-vi' && result.word && (
                  <div className="mt-2 text-xs text-slate-500 font-medium">
                    <span className="text-slate-400 mr-1">Câu gốc (chạm/rê chuột tra từ):</span>
                    <InteractiveSentence
                      text={result.originalQuery || result.word}
                      isEnglish={true}
                      onWordClick={(w) => { setQuery(w); handleTranslate(null, w); }}
                      showToast={showToast}
                    />
                  </div>
                )}

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
        <div className="translator-insight-panel animate-slideup">
          <div className="translator-tabbar">
            <button
              type="button"
              onClick={() => setActiveResultTab('meanings')}
              className={`translator-tab ${activeResultTab === 'meanings' ? 'active' : ''}`}
            >
              📖 Nghĩa & Từ loại
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('conjugation')}
              className={`translator-tab ${activeResultTab === 'conjugation' ? 'active' : ''}`}
            >
              ⚡ Chia 12 Thì & Dạng từ
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('ai')}
              className={`translator-tab ${activeResultTab === 'ai' ? 'active' : ''}`}
            >
              ✨ Gia Sư AI Phân Tích
            </button>
          </div>

          {activeResultTab === 'meanings' && (
            <div className="translator-detail-stack">
              {result.meaningsByPos && result.meaningsByPos.map((posGroup, idx) => (
                <div key={idx} className="translator-detail-card">
                  <span className="translator-detail-label">{posGroup.label}:</span>
                  <p>{posGroup.list.join(', ')}</p>
                </div>
              ))}

              {result.example && (
                <div className="translator-example-card">
                  <span>VÍ DỤ TIẾNG ANH (DICTIONARY):</span>
                  <p className="translator-example-en">"{result.example}"</p>
                  {result.translatedExample && (
                    <p className="translator-example-vi">➔ "{result.translatedExample}"</p>
                  )}
                </div>
              )}

              {result.bilingualExamples && result.bilingualExamples.length > 0 && (
                <div className="bilingual-examples-section">
                  <div className="bilingual-examples-title">🌟 2 Câu ví dụ minh họa song ngữ:</div>
                  {result.bilingualExamples.map((ex, i) => (
                    <div key={i} className="bilingual-example-item">
                      <div className="bilingual-example-header">
                        <div className="bilingual-example-en">
                          <InteractiveSentence
                            text={ex.en}
                            isEnglish={true}
                            onWordClick={(w) => { setQuery(w); handleTranslate(null, w); }}
                            showToast={showToast}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => speak(ex.en, 'US')}
                          className="bilingual-audio-btn"
                          title="Phát âm câu"
                        >
                          🔊 Nghe câu
                        </button>
                      </div>
                      <div className="bilingual-example-vi">➔ {ex.vi}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeResultTab === 'conjugation' && (
            <div className="translator-conjugation-wrap">
              {(() => {
                const targetWord = (result.word || '').trim().toLowerCase().replace(/^(a|an|the|to)\s+/i, '');
                const tensesData = result.tenses12 || get12Tenses(targetWord);
                const examplesData = result.bilingualExamples || getVerbBilingualExamples(targetWord, result.vietnamese);

                if (!tensesData) {
                  return <div className="p-4 text-slate-500 text-center">Không tìm thấy thông tin chia thì cho từ này.</div>;
                }

                if (tensesData.isModal) {
                  return (
                    <div className="flex flex-col gap-4">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
                        📌 <strong>Động từ khuyết thiếu (Modal Verb):</strong> {tensesData.modalNote || "Không có đầy đủ 12 thì như động từ thông thường."}
                      </div>
                      <div className="translator-conjugation-grid">
                        <div className="tense-group-column">
                          <div className="tense-group-header present">🟢 Hiện tại (Present)</div>
                          <div className="tense-subcard">
                            <div className="tense-name-row">
                              <span className="tense-name-en">Present Simple</span>
                              <span className="tense-name-vi">Hiện tại đơn</span>
                            </div>
                            <span className="tense-formula-row">S + modal</span>
                            <div className="tense-form-badge">{tensesData.present.simple.form}</div>
                          </div>
                        </div>
                        <div className="tense-group-column">
                          <div className="tense-group-header past">🔵 Quá khứ (Past)</div>
                          <div className="tense-subcard">
                            <div className="tense-name-row">
                              <span className="tense-name-en">Past Simple</span>
                              <span className="tense-name-vi">Quá khứ đơn</span>
                            </div>
                            <span className="tense-formula-row">S + modal (past)</span>
                            <div className="tense-form-badge">{tensesData.past.simple.form}</div>
                          </div>
                        </div>
                        <div className="tense-group-column">
                          <div className="tense-group-header future">🟣 Tương lai (Future)</div>
                          <div className="tense-subcard">
                            <div className="tense-name-row">
                              <span className="tense-name-en">Future Simple</span>
                              <span className="tense-name-vi">Tương lai đơn</span>
                            </div>
                            <span className="tense-formula-row">S + will + modal</span>
                            <div className="tense-form-badge">{tensesData.future.simple.form}</div>
                          </div>
                        </div>
                      </div>

                      {examplesData && examplesData.length > 0 && (
                        <div className="bilingual-examples-section">
                          <div className="bilingual-examples-title">🌟 2 Câu ví dụ minh họa song ngữ:</div>
                          {examplesData.map((ex, i) => (
                            <div key={i} className="bilingual-example-item">
                              <div className="bilingual-example-header">
                                <div className="bilingual-example-en">
                                  <InteractiveSentence
                                    text={ex.en}
                                    isEnglish={true}
                                    onWordClick={(w) => { setQuery(w); handleTranslate(null, w); }}
                                    showToast={showToast}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => speak(ex.en, 'US')}
                                  className="bilingual-audio-btn"
                                  title="Phát âm câu"
                                >
                                  🔊 Nghe câu
                                </button>
                              </div>
                              <div className="bilingual-example-vi">➔ {ex.vi}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                const tenseGroups = [
                  { key: 'present', label: '🟢 Hiện tại (Present)', class: 'present', data: tensesData.present },
                  { key: 'past', label: '🔵 Quá khứ (Past)', class: 'past', data: tensesData.past },
                  { key: 'future', label: '🟣 Tương lai (Future)', class: 'future', data: tensesData.future }
                ];

                return (
                  <div className="flex flex-col gap-4">
                    <div className="translator-conjugation-grid">
                      {tenseGroups.map((group) => (
                        <div key={group.key} className="tense-group-column">
                          <div className={`tense-group-header ${group.class}`}>{group.label}</div>
                          <div className="flex flex-col gap-2">
                            {['simple', 'continuous', 'perfect', 'perfect_continuous'].map((tKey) => {
                              const tenseItem = group.data[tKey];
                              if (!tenseItem) return null;
                              return (
                                <div key={tKey} className="tense-subcard">
                                  <div className="tense-name-row">
                                    <span className="tense-name-en">{tenseItem.nameEn}</span>
                                    <span className="tense-name-vi">{tenseItem.nameVi}</span>
                                  </div>
                                  <span className="tense-formula-row">{tenseItem.formula}</span>
                                  <div className="tense-form-badge">{tenseItem.form}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {examplesData && examplesData.length > 0 && (
                      <div className="bilingual-examples-section">
                        <div className="bilingual-examples-title">🌟 2 Câu ví dụ minh họa song ngữ:</div>
                        {examplesData.map((ex, i) => (
                          <div key={i} className="bilingual-example-item">
                            <div className="bilingual-example-header">
                              <div className="bilingual-example-en">
                                <InteractiveSentence
                                  text={ex.en}
                                  isEnglish={true}
                                  onWordClick={(w) => { setQuery(w); handleTranslate(null, w); }}
                                  showToast={showToast}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => speak(ex.en, 'US')}
                                className="bilingual-audio-btn"
                                title="Phát âm câu"
                              >
                                🔊 Nghe câu
                              </button>
                            </div>
                            <div className="bilingual-example-vi">➔ {ex.vi}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {activeResultTab === 'ai' && (
            <div className="translator-ai-wrap">
              {!aiAnalysis ? (
                <button
                  type="button"
                  className="translator-ai-trigger"
                  onClick={handleAiAnalysis}
                  disabled={isAiLoading}
                >
                  {isAiLoading ? <span className="spinner" /> : '✨ Kích hoạt Gia Sư AI Phân Tích Sắc Thái & Ví Dụ'}
                </button>
              ) : (
                <div className="translator-ai-stack">
                  {aiAnalysis.nuances && (
                    <div className="translator-ai-card">
                      <strong>💡 SẮC THÁI NGỮ CẢNH:</strong>
                      <p>{aiAnalysis.nuances}</p>
                    </div>
                  )}
                  {aiAnalysis.collocations && (
                    <div className="translator-ai-card">
                      <strong>🗣️ CỤM TỪ CỐ ĐỊNH (COLLOCATIONS):</strong>
                      <div className="translator-collocation-list">
                        {aiAnalysis.collocations.map((c, i) => (
                          <div key={i} className="translator-collocation-item">
                            <span>{c.phrase}</span>
                            <small>{c.vi}</small>
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
