import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { playSound, speak, speakCompare } from '../utils/sounds';
import { conjugateWithCompromise, getSForm } from '../utils/helpers/conjugationEngine';

function checkLocalGrammarErrors(text) {
  let clean = text.trim();
  let corrected = clean;
  let explanations = [];

  const contractionReplacements = [
    { regex: /\b(dont)\b/gi, replacement: "don't", explanation: "Thiếu dấu nháy đơn trong từ phủ định 'don't'." },
    { regex: /\b(doesnt)\b/gi, replacement: "doesn't", explanation: "Thiếu dấu nháy đơn trong từ phủ định 'doesn't'." },
    { regex: /\b(didnt)\b/gi, replacement: "didn't", explanation: "Thiếu dấu nháy đơn trong từ phủ định 'didn't'." },
    { regex: /\b(cant)\b/gi, replacement: "can't", explanation: "Thiếu dấu nháy đơn trong từ phủ định 'can't'." },
    { regex: /\b(isnt)\b/gi, replacement: "isn't", explanation: "Thiếu dấu nháy đơn trong từ phủ định 'isn't'." },
    { regex: /\b(arent)\b/gi, replacement: "aren't", explanation: "Thiếu dấu nháy đơn trong từ phủ định 'aren't'." },
    { regex: /\b(wasnt)\b/gi, replacement: "wasn't", explanation: "Thiếu dấu nháy đơn trong từ phủ định 'wasn't'." },
    { regex: /\b(werent)\b/gi, replacement: "weren't", explanation: "Thiếu dấu nháy đơn trong từ phủ định 'weren't'." },
    { regex: /\b(wont)\b/gi, replacement: "won't", explanation: "Thiếu dấu nháy đơn trong từ phủ định 'won't'." },
    { regex: /\bi\b/g, replacement: "I", explanation: "Đại từ nhân xưng ngôi thứ nhất 'I' luôn luôn phải viết hoa." }
  ];

  for (const item of contractionReplacements) {
    if (item.regex.test(corrected)) {
      corrected = corrected.replace(item.regex, item.replacement);
      explanations.push(item.explanation);
    }
  }

  const agreementReplacements = [
    { regex: /\b(I|i)\s+(is|are)\b/g, replacement: "I am", explanation: "Chủ ngữ 'I' đi với động từ tobe là 'am'." },
    { regex: /\b(you|You)\s+(is|am)\b/g, replacement: "$1 are", explanation: "Chủ ngữ 'you' đi với động từ tobe là 'are'." },
    { regex: /\b(we|We)\s+(is|am)\b/g, replacement: "$1 are", explanation: "Chủ ngữ 'we' đi với động từ tobe là 'are'." },
    { regex: /\b(they|They)\s+(is|am)\b/g, replacement: "$1 are", explanation: "Chủ ngữ 'they' đi với động từ tobe là 'are'." },
    { regex: /\b(he|He)\s+(am|are)\b/g, replacement: "$1 is", explanation: "Chủ ngữ ngôi thứ ba số ít 'he' đi với động từ tobe là 'is'." },
    { regex: /\b(she|She)\s+(am|are)\b/g, replacement: "$1 is", explanation: "Chủ ngữ ngôi thứ ba số ít 'she' đi với động từ tobe là 'is'." },
    { regex: /\b(it|It)\s+(am|are)\b/g, replacement: "$1 is", explanation: "Chủ ngữ ngôi thứ ba số ít 'it' đi với động từ tobe là 'is'." },
    { regex: /\b(he|He|she|She|it|It)\s+(have)\b/g, replacement: "$1 has", explanation: "Chủ ngữ ngôi thứ ba số ít ('he', 'she', 'it') phải dùng động từ 'has' thay vì 'have'." },
    { regex: /\b(I|i|you|You|we|We|they|They)\s+(has)\b/g, replacement: "$1 have", explanation: "Chủ ngữ số nhiều và 'I', 'you' phải dùng động từ 'have' thay vì 'has'." },
    { regex: /\b(he|He|she|She|it|It)\s+(go)\b/g, replacement: "$1 goes", explanation: "Động từ 'go' cần thêm '-es' thành 'goes' sau chủ ngữ ngôi thứ ba số ít." },
    { regex: /\b(he|He|she|She|it|It)\s+(do)\b/g, replacement: "$1 does", explanation: "Động từ 'do' cần thêm '-es' thành 'does' sau chủ ngữ ngôi thứ ba số ít." },
    { regex: /\b(he|He|she|She|it|It)\s+(want)\b/g, replacement: "$1 wants", explanation: "Động từ 'want' cần thêm '-s' thành 'wants' sau chủ ngữ ngôi thứ ba số ít." },
    { regex: /\b(he|He|she|She|it|It)\s+(like)\b/g, replacement: "$1 likes", explanation: "Động từ 'like' cần thêm '-s' thành 'likes' sau chủ ngữ ngôi thứ ba số ít." },
    { regex: /\b(is|am|Is|Am)\s+you\b/g, replacement: "are you", explanation: "Trong câu hỏi, chủ ngữ 'you' đi với động từ tobe là 'are' ('are you' chứ không phải 'is/am you')." },
    { regex: /\b(are|am|Are|Am)\s+(he|she|it)\b/g, replacement: "is $2", explanation: "Trong câu hỏi, chủ ngữ số ít 'he/she/it' đi với động từ tobe là 'is' ('is he/she/it')." },
    { regex: /\b(does|Does)\s+(I|i|you|You|we|We|they|They)\b/g, replacement: "do $2", explanation: "Trong câu hỏi, chủ ngữ số nhiều và 'I', 'you' dùng trợ động từ 'do' ('do you', 'do they')." },
    { regex: /\b(do|Do)\s+(he|He|she|She|it|It)\b/g, replacement: "does $2", explanation: "Trong câu hỏi, chủ ngữ ngôi thứ ba số ít dùng trợ động từ 'does' ('does he', 'does she')." },
    { regex: /\b(what|What)\s+(timing|timming)\s+is\s+it\b/g, replacement: "$1 time is it", explanation: "Câu hỏi giờ giấc chuẩn tiếng Anh sử dụng danh từ 'time' ('What time is it') chứ không dùng 'timing'." },
    { regex: /\b(we|they|people|these|those|We|They|People|These|Those)\s+a\s+([a-zA-Z]+)\b/g, replacement: "$1 are $2", explanation: "Dùng động từ tobe số nhiều 'are' thay vì từ đơn 'a' đứng sau chủ ngữ/danh từ số nhiều." },
    { regex: /\b(where|how|when|why|Where|How|When|Why)\s+(you|they|we)\s+(go|live|work|like|want|do|study|learn|see|eat|drink|have|play|say|call)\b/g, replacement: "$1 do $2 $3", explanation: "Trong câu hỏi có từ để hỏi (wh-question), cần thêm trợ động từ 'do' trước chủ ngữ." },
    { regex: /\b(where|how|when|why|Where|How|When|Why)\s+(he|she|it)\s+(go|live|work|like|want|do|study|learn|see|eat|drink|have|play|say|call)\b/g, replacement: "$1 does $2 $3", explanation: "Trong câu hỏi có từ để hỏi (wh-question), cần thêm trợ động từ 'does' trước chủ ngữ số ít." },
    { regex: /\b([hH]ow\s+many\s+[a-zA-Z]+)\s+in\s+([a-zA-Z\s]+)\b/g, replacement: "$1 are there in $2", explanation: "Thiếu cấu trúc chỉ sự tồn tại 'are there' trong câu hỏi số lượng ('How many... are there in...')." },
    { regex: /\b(I|i|we|We|they|They|you|You)\s+am\s+(feel|like|love|hate|agree|disagree|think)\b/g, replacement: "$1 $2", explanation: "Không dùng động từ tobe 'am/are' đi liền trước động từ thường chỉ trạng thái/cảm xúc ở hiện tại đơn." },
    { regex: /\b(I'm|i'm|Im|im)\s+(feel|like|love|hate|agree|disagree|think)\b/g, replacement: "I $2", explanation: "Không dùng 'I'm' trước động từ thường chỉ trạng thái/cảm xúc ở hiện tại đơn (dùng 'I' thay vì 'I'm')." },
    { regex: /\b(I'm|i'm|Im|im)\s+(study|work|learn|read|write|cook|run|play|watch)\b/g, replacement: "I am $2ing", explanation: "Dùng động từ đuôi -ing sau 'I am' để tạo thì hiện tại tiếp diễn." },
    { regex: /\b(anh|Anh)\b/g, replacement: "and", explanation: "Từ nối 'and' bị viết nhầm/gõ nhầm thành từ 'anh'." }
  ];

  for (const item of agreementReplacements) {
    if (item.regex.test(corrected)) {
      corrected = corrected.replace(item.regex, item.replacement);
      explanations.push(item.explanation);
    }
  }

  const aBeforeVowelsRegex = /\b(a|A)\s+([aeiou][a-z]*)\b/g;
  corrected = corrected.replace(aBeforeVowelsRegex, (fullMatch, art, word) => {
    const vowelWord = word.toLowerCase();
    if (!vowelWord.startsWith("uni") && !vowelWord.startsWith("one")) {
      const correctArt = art === 'A' ? 'An' : 'an';
      explanations.push(`Dùng mạo từ '${correctArt}' thay vì '${art}' trước từ bắt đầu bằng nguyên âm '${word}'.`);
      return `${correctArt} ${word}`;
    }
    return fullMatch;
  });

  const anBeforeConsonantsRegex = /\b(an|An)\s+([bcdfghjklmnpqrstvwxyz][a-z]*)\b/g;
  corrected = corrected.replace(anBeforeConsonantsRegex, (fullMatch, art, word) => {
    const consWord = word.toLowerCase();
    if (!consWord.startsWith("hour") && !consWord.startsWith("honest") && !consWord.startsWith("honor")) {
      const correctArt = art === 'An' ? 'A' : 'a';
      explanations.push(`Dùng mạo từ '${correctArt}' thay vì '${art}' trước từ bắt đầu bằng phụ âm '${word}'.`);
      return `${correctArt} ${word}`;
    }
    return fullMatch;
  });

  if (/\b(im)\b/i.test(corrected)) {
    corrected = corrected.replace(/\b(im)\b/gi, "I'm");
    explanations.push("Viết sai chính tả 'I'm' (đại từ 'I' luôn viết hoa).");
  }

  return {
    hasError: explanations.length > 0,
    correctedText: corrected,
    explanation: explanations.join(" \n")
  };
}

async function checkGrammarOnline(text) {
  try {
    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `text=${encodeURIComponent(text)}&language=en-US&level=picky`
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.matches || data.matches.length === 0) {
      return { hasError: false, correctedText: "", explanation: "" };
    }
    
    const sortedMatches = [...data.matches].sort((a, b) => b.offset - a.offset);
    
    let correctedText = text;
    const explanations = [];
    
    for (const match of sortedMatches) {
      const originalWord = text.substring(match.offset, match.offset + match.length);
      const replacement = match.replacements && match.replacements[0] ? match.replacements[0].value : "";
      
      if (replacement) {
        correctedText = correctedText.substring(0, match.offset) + replacement + correctedText.substring(match.offset + match.length);
      }
      
      let explanationVi = match.message;
      try {
        const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(match.message)}`);
        const transData = await transRes.json();
        if (transData && transData[0] && transData[0][0] && transData[0][0][0]) {
          explanationVi = transData[0][0][0].trim();
        }
      } catch (transErr) {
        console.warn(transErr);
      }
      
      explanations.push(`- Lỗi "${originalWord}": ${explanationVi}${replacement ? ` (Gợi ý sửa: "${replacement}")` : ''}`);
    }
    
    explanations.reverse();
    
    return {
      hasError: true,
      correctedText,
      explanation: explanations.join('\n')
    };
  } catch (err) {
    console.error("LanguageTool check error:", err);
    return null;
  }
}

export default function GlobalTranslator({ onSavedVocabChange, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [direction, setDirection] = useState('en-vi');
  const inputRef = useRef(null);
  const [grammarMode, setGrammarMode] = useState(null);

  // Search History States & Actions
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const data = localStorage.getItem("eng_app_search_history");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  });

  const updateSearchHistory = (wordText, translationText) => {
    try {
      const historyData = localStorage.getItem("eng_app_search_history");
      let list = historyData ? JSON.parse(historyData) : [];
      
      list = list.filter(item => item.word.toLowerCase() !== wordText.toLowerCase());
      list.unshift({
        word: wordText,
        translation: translationText,
        timestamp: Date.now()
      });
      list = list.slice(0, 6);
      localStorage.setItem("eng_app_search_history", JSON.stringify(list));
      setSearchHistory(list);
    } catch (e) {
      console.error("Failed to save search history", e);
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

  const handleTranslate = async (e, overrideQuery) => {
    if (e) e.preventDefault();
    const queryToUse = overrideQuery || query;
    const cleanQuery = queryToUse.trim().toLowerCase();
    if (!cleanQuery) return;

    setIsLoading(true);
    setResult(null);
    setIsSaved(false);

    try {
      const isSourceEn = direction === 'en-vi';

      if (isSourceEn) {
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
      const transPromise = fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(cleanQuery)}`)
        .then(res => res.json())
        .then(data => data && data[0] && data[0][0] && data[0][0][0] ? data[0][0][0] : "Không tìm thấy nghĩa");

      const translationResult = await transPromise;
      const targetEnglishWord = isSourceEn ? cleanQuery : translationResult.trim().toLowerCase();
      const isTargetSingleWord = !targetEnglishWord.includes(' ');

      let dictPromise = Promise.resolve({ ipa: '', ipaUK: '', ipaUS: '', example: '', synonymsList: [] });
      if (isTargetSingleWord) {
        dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetEnglishWord}`)
          .then(res => res.json())
          .then(data => {
            if (data && data[0]) {
              const phonetics = data[0].phonetics || [];
              const foundIpa = phonetics.find(p => p.text)?.text || data[0].phonetic || `/${targetEnglishWord}/`;
              
              // Parse separate UK and US IPAs
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

              const meaning = data[0].meanings?.[0]?.definitions?.[0]?.definition || "";
              const sample = data[0].meanings?.[0]?.definitions?.[0]?.example || "";
              
              let synonyms = [];
              if (data[0].meanings) {
                for (const m of data[0].meanings) {
                  if (m.synonyms) {
                    synonyms.push(...m.synonyms);
                  }
                  if (m.definitions) {
                    for (const d of m.definitions) {
                      if (d.synonyms) {
                        synonyms.push(...d.synonyms);
                      }
                    }
                  }
                }
              }
              const synonymsList = Array.from(new Set(synonyms))
                .filter(s => s && s.trim() && s.toLowerCase() !== targetEnglishWord.toLowerCase())
                .slice(0, 5);

              return { 
                ipa: foundIpa, 
                ipaUK: ipaUK,
                ipaUS: ipaUS,
                example: meaning ? `${meaning}${sample ? ` (E.g. ${sample})` : ''}` : '',
                synonymsList: synonymsList
              };
            }
            return { ipa: `/${targetEnglishWord}/`, ipaUK: '', ipaUS: '', example: '', synonymsList: [] };
          })
          .catch(() => ({ ipa: `/${targetEnglishWord}/`, ipaUK: '', ipaUS: '', example: '', synonymsList: [] }));
      }

      const dictInfo = await dictPromise;
      let localSynonyms = [];
      if (dictInfo.synonymsList && dictInfo.synonymsList.length > 0) {
        try {
          const synonymsText = dictInfo.synonymsList.join(" | ");
          const synTransRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(synonymsText)}`)
            .then(res => res.json())
            .then(data => data && data[0] && data[0][0] && data[0][0][0] ? data[0][0][0] : "");
          
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
      let localCheck = { hasError: false, correctedText: "", explanation: "" };
      if (isSourceEn) {
        const localResult = checkLocalGrammarErrors(query);
        const onlineCheck = await checkGrammarOnline(query);
        
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
      }
      
      const alreadySaved = storage.getSavedVocab().find(w => w.word.toLowerCase() === targetEnglishWord);
      if (alreadySaved) {
        setIsSaved(true);
      }

      setResult({
        word: isSourceEn ? query.trim() : translationResult, 
        ipa: dictInfo.ipa || (isTargetSingleWord ? `/${targetEnglishWord}/` : ''),
        ipaUK: dictInfo.ipaUK || '',
        ipaUS: dictInfo.ipaUS || '',
        vietnamese: isSourceEn ? translationResult : query.trim(), 
        partOfSpeech: localGrammar ? localGrammar.partOfSpeech : (isTargetSingleWord ? 'Từ đơn' : 'Cụm từ / Câu'),
        forms: localGrammar ? localGrammar.forms : null,
        example: dictInfo.example || (isTargetSingleWord ? `Used in: ${targetEnglishWord}` : 'Sentence translation'),
        hasGrammarError: localCheck.hasError,
        correctedText: localCheck.correctedText,
        grammarErrorExplanation: localCheck.explanation,
        synonyms: localSynonyms,
        isCustom: true,
        isSaved: alreadySaved ? true : false
      });

      const finalWord = isSourceEn ? query.trim() : translationResult;
      const finalTrans = isSourceEn ? translationResult : query.trim();
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

  const handleSaveWord = () => {
    if (!result) return;

    try {
      const isSourceEn = direction === 'en-vi';
      const wordToSave = {
        word: isSourceEn ? result.word : result.word, // English word is always stored in result.word
        ipa: result.ipa || "",
        vietnamese: result.vietnamese, // Vietnamese translation/source
        example: result.example || `Translated via Quick Lookup`,
        partOfSpeech: result.partOfSpeech || "",
        forms: result.forms || null,
        hasGrammarError: result.hasGrammarError || false,
        correctedText: result.correctedText || "",
        grammarErrorExplanation: result.grammarErrorExplanation || "",
        topic: "Quick Lookup"
      };

      const newList = storage.saveWord(wordToSave);
      if (newList && newList.length > 0) {
        setIsSaved(true);
        onSavedVocabChange();
        showToast("Đã lưu từ vào sổ tay!", "success");
        playSound("correct");
      } else {
        showToast("Không thể lưu từ, vui lòng thử lại.", "error");
      }
    } catch (e) {
      showToast("Không thể lưu từ, vui lòng thử lại.", "error");
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className="floating-translate-btn glass-glow"
        onClick={() => setIsOpen(true)}
        title="Tra từ / dịch nhanh toàn cục"
      >
        📖
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content translator-modal glass-glow" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <h3>🔍 Tra từ & Dịch nhanh</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Language Direction Toggle Buttons */}
            <div className="direction-tabs mt-4 flex gap-3 justify-center">
              <button 
                type="button"
                className={`btn-secondary text-xs px-4 py-2 ${direction === 'en-vi' ? 'active pulse-border' : ''}`}
                style={{ 
                  borderRadius: 'var(--radius-sm)', 
                  borderColor: direction === 'en-vi' ? 'var(--color-primary)' : 'var(--border-light)',
                  background: direction === 'en-vi' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  color: direction === 'en-vi' ? 'var(--color-primary)' : 'var(--color-text-muted)'
                }}
                onClick={() => {
                  setDirection('en-vi');
                  setQuery('');
                  setResult(null);
                }}
              >
                🇬🇧 Anh ➔ 🇻🇳 Việt
              </button>
              <button 
                type="button"
                className={`btn-secondary text-xs px-4 py-2 ${direction === 'vi-en' ? 'active pulse-border' : ''}`}
                style={{ 
                  borderRadius: 'var(--radius-sm)', 
                  borderColor: direction === 'vi-en' ? 'var(--color-primary)' : 'var(--border-light)',
                  background: direction === 'vi-en' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  color: direction === 'vi-en' ? 'var(--color-primary)' : 'var(--color-text-muted)'
                }}
                onClick={() => {
                  setDirection('vi-en');
                  setQuery('');
                  setResult(null);
                }}
              >
                🇻🇳 Việt ➔ 🇬🇧 Anh
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleTranslate} className="translator-form mt-4">
              <div className="input-group">
                <textarea
                  ref={inputRef}
                  placeholder={direction === 'en-vi' ? "Nhập từ tiếng Anh hoặc câu cần dịch..." : "Nhập từ tiếng Việt hoặc câu cần dịch..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (query.trim() && !isLoading) {
                        handleTranslate(e);
                      }
                    }
                  }}
                  className="translator-input glass"
                  rows={1}
                />
                <button type="submit" className="btn-primary" disabled={isLoading || !query.trim()}>
                  {isLoading ? <span className="spinner" /> : 'Tra cứu'}
                </button>
              </div>

            </form>

            {/* Results Section */}
            <div className="translator-results-container mt-5">
              {isLoading && (
                <div className="text-center p-6">
                  <span className="spinner-large" />
                  <p className="color-text-muted mt-2">
                    Đang tra cứu từ điển nhanh...
                  </p>
                </div>
              )}

              {!isLoading && !result && searchHistory.length > 0 && (
                <div className="recent-searches-box animate-slideup" style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-light)'
                }}>
                  <h4 className="text-xs uppercase tracking-wider color-text-muted font-bold mb-3" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🕒 Lịch sử tra cứu gần đây:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {searchHistory.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setQuery(item.word);
                            handleTranslate(null, item.word);
                          }}
                          className="btn-secondary text-xs"
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-glow)',
                            background: 'rgba(255, 255, 255, 0.01)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontWeight: 'bold' }}>{item.word}</span>
                          <span className="color-text-muted" style={{ fontSize: '11px' }}>➔ {item.translation}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem("eng_app_search_history");
                        setSearchHistory([]);
                      }}
                      className="btn-secondary text-xs"
                      style={{
                        padding: '4px 10px',
                        border: '1px dotted rgba(239, 68, 68, 0.3)',
                        background: 'transparent',
                        color: 'rgba(239, 68, 68, 0.8)',
                        alignSelf: 'flex-start',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '11px',
                        marginTop: '4px'
                      }}
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                </div>
              )}

              {result && (
                <div className="translator-result-box glass p-4 animate-slideup">
                  <div className="result-header flex justify-between items-start">
                    <div>
                      {/* Displays English word first */}
                      <h4 className="result-word">
                        {direction === 'en-vi' ? result.word : result.word}
                        {result.source && (
                          <span className="badge-source ml-2 text-xs" style={{ 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            background: result.source === 'cache' ? 'rgba(34, 197, 94, 0.15)' : (result.source === 'compromise' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.15)'),
                            color: result.source === 'cache' ? '#4ade80' : (result.source === 'compromise' ? '#60a5fa' : '#a78bfa'),
                            border: '1px solid currentColor',
                            display: 'inline-block',
                            verticalAlign: 'middle'
                          }}>
                            {result.source === 'cache' ? 'Cache' : (result.source === 'compromise' ? 'Local Engine' : 'Gemini AI')}
                          </span>
                        )}
                      </h4>
                      {result.ipaUK && result.ipaUS ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '4px' }}>
                          <span className="result-ipa" style={{ background: 'rgba(245,158,11,0.06)', color: 'var(--color-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            🇬🇧 UK: {result.ipaUK}
                          </span>
                          <span className="result-ipa" style={{ background: 'rgba(124,58,237,0.06)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            🇺🇸 US: {result.ipaUS}
                          </span>
                        </div>
                      ) : result.ipa ? (
                        <span className="result-ipa">{result.ipa}</span>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', width: '100%' }}>
                      <button className="speak-btn-large flex-1" onClick={() => handleSpeak(direction === 'en-vi' ? result.word : result.word, 'US')} style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                        🇺🇸 US
                      </button>
                      <button className="speak-btn-large flex-1" onClick={() => handleSpeak(direction === 'en-vi' ? result.word : result.word, 'UK')} style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                        🇬🇧 UK
                      </button>
                      <button className="speak-btn-large flex-1" onClick={() => speakCompare(direction === 'en-vi' ? result.word : result.word)} style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                        🆚 So sánh
                      </button>
                    </div>
                  </div>

                  {/* Từ loại & vai trò ngữ pháp */}
                  {result.partOfSpeech && (
                    <div className="result-pos mt-3">
                      <span className="badge-pos">{result.partOfSpeech}</span>
                    </div>
                  )}

                  {/* Cảnh báo và gợi ý sửa lỗi ngữ pháp */}
                  {result.hasGrammarError && result.correctedText && (
                    <div className="grammar-correction-box mt-3 p-3 glass" style={{ borderLeft: '4px solid var(--color-error)', background: 'rgba(239, 68, 68, 0.03)' }}>
                      <strong className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-error)' }}>
                        ⚠️ Phát hiện lỗi chính tả/ngữ pháp:
                      </strong>
                      <div className="mt-2 text-sm">
                        <div className="color-text-muted text-xs">Câu bạn viết:</div>
                        <del className="color-text-muted italic block mb-1" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>"{query}"</del>
                        
                        <div className="color-text-muted text-xs mt-2">Gợi ý sửa đúng:</div>
                        <ins className="font-bold block mb-2" style={{ textDecoration: 'none', color: 'var(--color-success)' }}>
                          "{result.correctedText}"
                        </ins>
                        
                        <div className="color-text-muted text-xs mt-2">Giải thích chi tiết:</div>
                        <p className="color-text-main italic p-2 rounded mt-1" style={{ background: 'rgba(0, 0, 0, 0.2)', fontSize: '13px', whiteSpace: 'pre-line' }}>
                          {result.grammarErrorExplanation}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="result-meaning-box mt-4 p-3 glass">
                    <strong className="color-text-muted text-xs block mb-1">
                      {direction === 'en-vi' ? 'DỊCH NGHĨA TIẾNG VIỆT:' : 'DỊCH NGHĨA TIẾNG ANH:'}
                    </strong>
                    <p className="result-translation">
                      {direction === 'en-vi' ? result.vietnamese : result.word}
                    </p>
                  </div>

                  {direction === 'vi-en' && (
                    <div className="result-meaning-box mt-3 p-3 glass" style={{ borderLeft: '3px solid var(--color-secondary)' }}>
                      <strong className="color-text-muted text-xs block mb-1">CÂU TIẾNG VIỆT GỐC:</strong>
                      <p className="result-translation original-text">
                        {result.vietnamese}
                      </p>
                    </div>
                  )}

                  {/* Các nghĩa tương tự & Từ đồng nghĩa */}
                  {result.synonyms && result.synonyms.length > 0 && (
                    <div className="synonyms-box mt-3 p-3 glass" style={{ borderLeft: '3px solid var(--color-secondary)' }}>
                      <strong className="color-text-muted text-xs block mb-2">
                        💡 TỪ ĐỒNG NGHĨA / CÂU TƯƠNG TỰ (KÈM DỊCH NGHĨA):
                      </strong>
                      <div className="flex flex-wrap gap-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {result.synonyms.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="synonym-tag p-2 rounded" 
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.03)', 
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '8px',
                              flex: '1 1 200px',
                              minWidth: '150px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}
                          >
                            <span className="font-semibold" style={{ color: 'var(--color-primary)', fontSize: '13px' }}>{item.word}</span>
                            <span className="color-text-muted" style={{ fontSize: '11px' }}>{item.vietnamese}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* Biến thể các thì hiện tại / quá khứ đơn / 12 thì */}
                  {result.forms && (
                    <div className="result-forms mt-3 p-3 glass" style={{ borderLeft: '3px solid var(--color-primary)' }}>
                      
                      {/* POS ambiguity toggle */}
                      {result.word && !result.word.trim().includes(" ") && (
                        <div className="flex gap-2 mb-3 border-b pb-2" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                          <button 
                            type="button"
                            className={`text-xs px-3 py-1 rounded`}
                            style={{
                              background: grammarMode === 'verb' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                              color: grammarMode === 'verb' ? '#000' : 'var(--color-text-muted)',
                              fontWeight: grammarMode === 'verb' ? 'bold' : 'normal',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            onClick={() => setGrammarMode('verb')}
                          >
                            Chia động từ (Verb - 12 Thì)
                          </button>
                          <button 
                            type="button"
                            className={`text-xs px-3 py-1 rounded`}
                            style={{
                              background: grammarMode === 'non-verb' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                              color: grammarMode === 'non-verb' ? '#000' : 'var(--color-text-muted)',
                              fontWeight: grammarMode === 'non-verb' ? 'bold' : 'normal',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            onClick={() => setGrammarMode('non-verb')}
                          >
                            Dạng Danh từ / Tính từ (Noun / Adj)
                          </button>
                        </div>
                      )}

                      <strong className="color-text-muted text-xs block mb-2">CÁC DẠNG CỦA TỪ / NGỮ PHÁP CHI TIẾT:</strong>
                      
                      {(() => {
                        const targetWord = result.word ? result.word.trim().toLowerCase() : '';
                        const currentForms = grammarMode === 'verb'
                          ? ((result.forms && result.forms.present_continuous) ? result.forms : conjugateWithCompromise(targetWord).forms)
                          : ((result.forms && (result.forms.plural || result.forms.comparative_superlative)) 
                              ? result.forms 
                              : {
                                  present_simple: result.word,
                                  past_simple: 'N/A',
                                  plural: getSForm(targetWord),
                                  comparative_superlative: `more ${targetWord} / most ${targetWord}`
                                });

                        if (!currentForms) return null;

                        if (grammarMode === 'verb') {
                          // Check if it is a modal verb
                          if (currentForms.isModal) {
                            return (
                              <div className="flex flex-col gap-2 text-xs">
                                <div className="tense-grid-responsive">
                                  <div className="tense-card-item">
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Hiện tại (Present)</span>
                                    <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.present_simple}</code>
                                  </div>
                                  {currentForms.past_simple && currentForms.past_simple !== 'N/A' && (
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Quá khứ (Past)</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.past_simple}</code>
                                    </div>
                                  )}
                                </div>
                                <p className="color-text-muted italic text-xs mt-2" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
                                  💡 {currentForms.note || 'Động từ khuyết thiếu không chia đầy đủ 12 thì.'}
                                </p>
                              </div>
                            );
                          }

                          // 12 Tenses
                          return (
                            <>
                              <div className="tenses-grid mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Present Tenses */}
                                <div className="tense-group p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                                  <strong className="text-xs block mb-3" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px', letterSpacing: '0.5px' }}>🕒 THÌ HIỆN TẠI (PRESENT)</strong>
                                  <div className="tense-grid-responsive">
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Hiện tại đơn</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.present_simple}</code>
                                    </div>
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Hiện tại tiếp diễn</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.present_continuous}</code>
                                    </div>
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Hiện tại hoàn thành</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.present_perfect}</code>
                                    </div>
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Hiện tại HT tiếp diễn</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.present_perfect_continuous}</code>
                                    </div>
                                  </div>
                                </div>

                                {/* Past Tenses */}
                                <div className="tense-group p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                                  <strong className="text-xs block mb-3" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px', letterSpacing: '0.5px' }}>⏳ THÌ QUÁ KHỨ (PAST)</strong>
                                  <div className="tense-grid-responsive">
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Quá khứ đơn</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.past_simple}</code>
                                    </div>
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Quá khứ tiếp diễn</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.past_continuous}</code>
                                    </div>
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Quá khứ hoàn thành</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.past_perfect}</code>
                                    </div>
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Quá khứ HT tiếp diễn</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.past_perfect_continuous}</code>
                                    </div>
                                  </div>
                                </div>

                                {/* Future Tenses */}
                                <div className="tense-group p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                                  <strong className="text-xs block mb-3" style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px', letterSpacing: '0.5px' }}>🚀 THÌ TƯƠNG LAI (FUTURE)</strong>
                                  <div className="tense-grid-responsive">
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Tương lai đơn</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.future_simple}</code>
                                    </div>
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Tương lai tiếp diễn</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.future_continuous}</code>
                                    </div>
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Tương lai hoàn thành</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.future_perfect}</code>
                                    </div>
                                    <div className="tense-card-item">
                                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Tương lai HT tiếp diễn</span>
                                      <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.future_perfect_continuous}</code>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <p className="color-text-muted italic mt-3" style={{ fontSize: '11px', borderTop: '1px dotted rgba(255, 255, 255, 0.1)', paddingTop: '8px' }}>
                                * Ghi chú: Động từ "am/is/are", "was/were", "have/has" được chia tùy theo chủ ngữ tương ứng (I / You / We / They / He / She / It).
                              </p>
                            </>
                          );
                        } else {
                          // Noun/Adjective Mode
                          return (
                            <div className="tense-grid-responsive">
                              {currentForms.present_simple && currentForms.present_simple !== 'N/A' && (
                                <div className="tense-card-item">
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Hiện tại / Nguyên mẫu</span>
                                  <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.present_simple}</code>
                                </div>
                              )}
                              {currentForms.past_simple && currentForms.past_simple !== 'N/A' && (
                                <div className="tense-card-item">
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Quá khứ / So sánh</span>
                                  <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.past_simple}</code>
                                </div>
                              )}
                              {currentForms.plural && currentForms.plural !== 'N/A' && (
                                <div className="tense-card-item">
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>Số nhiều (Plural)</span>
                                  <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.plural}</code>
                                </div>
                              )}
                              {currentForms.comparative_superlative && currentForms.comparative_superlative !== 'N/A' && (
                                <div className="tense-card-item">
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600' }}>So sánh hơn / nhất</span>
                                  <code style={{ color: 'var(--color-secondary)', fontWeight: '600', whiteSpace: 'normal', wordBreak: 'normal' }}>{currentForms.comparative_superlative}</code>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {result.example && (
                    <div className="result-example-box mt-3">
                      <strong className="color-text-muted text-xs block">VÍ DỤ / ĐỊNH NGHĨA:</strong>
                      <p className="result-example color-text-muted italic">"{result.example}"</p>
                    </div>
                  )}

                  <div className="result-actions mt-4 flex gap-3">
                    {isSaved ? (
                      <button className="btn-secondary w-full justify-center" disabled>
                        ✓ Đã có trong sổ tay
                      </button>
                    ) : (
                      <button className="btn-primary w-full justify-center" onClick={handleSaveWord}>
                        ⭐ Lưu vào sổ tay
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!isLoading && !result && (
                <div className="translator-empty p-6 text-center color-text-muted">
                  <span className="icon-huge">💡</span>
                  <p className="mt-2">
                    {direction === 'en-vi' 
                      ? 'Nhập từ tiếng Anh (ví dụ: "amazing", "take a look") để xem phát âm, dịch nghĩa và lưu vào sổ tay ôn tập.'
                      : 'Nhập từ/câu tiếng Việt (ví dụ: "tuyệt vời", "tôi đang đi học") để xem dịch nghĩa tiếng Anh, phát âm và lưu vào sổ tay.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
