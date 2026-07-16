import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { playSound } from '../utils/sounds';
import { fetchGeminiWithRetry, preprocessAndRepairJson } from './AdminPanel';
import { conjugateWithCompromise, needsAIFallback, getSForm } from '../utils/helpers/conjugationEngine';

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
    { regex: /\b(he|He|she|She|it|It)\s+(like)\b/g, replacement: "$1 likes", explanation: "Động từ 'like' cần thêm '-s' thành 'likes' sau chủ ngữ ngôi thứ ba số ít." }
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

export default function GlobalTranslator({ onSavedVocabChange, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [direction, setDirection] = useState('en-vi');
  const inputRef = useRef(null);
  const [grammarMode, setGrammarMode] = useState(null);

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

  const handleTranslate = async (e) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim().toLowerCase();
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
            partOfSpeech: savedEntry.partOfSpeech || localGrammar.partOfSpeech,
            forms: localGrammar.forms,
            hasGrammarError: savedEntry.hasGrammarError || false,
            correctedText: savedEntry.correctedText || "",
            grammarErrorExplanation: savedEntry.grammarErrorExplanation || "",
            isCustom: true,
            isSaved: true,
            source: 'cache'
          });
          setIsSaved(true);
          setIsLoading(false);
          return;
        }
      }

      const apiKey = localStorage.getItem("eng_app_gemini_key");
      const selectedModel = localStorage.getItem("eng_app_gemini_model") || "gemini-1.5-flash";

      if (useAI && (!apiKey || !apiKey.trim())) {
        showToast("Vui lòng cấu hình Gemini API Key trong Admin Panel trước để sử dụng AI!", "error");
        setIsLoading(false);
        return;
      }

      const isFallback = needsAIFallback(query, direction, useAI, apiKey);

      if (isFallback && apiKey && apiKey.trim()) {
        const prompt = isSourceEn
          ? `Bạn là một từ điển Anh-Việt học thuật và trợ lý kiểm tra ngữ pháp tiếng Anh thông minh. Hãy dịch, phân tích từ loại, chức năng ngữ pháp và đặc biệt hãy KIỂM TRA LỖI CHÍNH TẢ & NGỮ PHÁP đối với từ hoặc câu tiếng Anh sau: "${query}".
Hãy trả về một đối tượng JSON duy nhất có cấu trúc chính xác như mẫu dưới đây (chỉ trả về JSON, không bao gồm markdown hay giải thích nào khác ngoài JSON):
{
  "word": "từ hoặc câu tiếng Anh gốc (đã được sửa nếu có lỗi chính tả/ngữ pháp)",
  "ipa": "phiên âm IPA của từ đơn (nếu là từ đơn, ví dụ: /he'loʊ/, nếu là câu thì để trống '')",
  "vietnamese": "dịch nghĩa tiếng Việt đầy đủ và tự nhiên",
  "partOfSpeech": "từ loại (Danh từ, Động từ, Tính từ, Trạng từ, Cụm từ, Câu...)",
  "hasGrammarError": false, // true nếu phát hiện bất kỳ lỗi chính tả hoặc lỗi ngữ pháp nào trong câu gốc "${query}", ngược lại là false
  "correctedText": "câu đã được sửa lỗi chính tả/ngữ pháp hoàn chỉnh (nếu hasGrammarError là true, ngược lại để trống '')",
  "grammarErrorExplanation": "giải thích chi tiết bằng tiếng Việt các lỗi chính tả/ngữ pháp và cách sửa (nếu hasGrammarError là true, ngược lại để trống '')",
  "example": "một câu ví dụ tiếng Anh liên quan",
  "example_translation": "dịch nghĩa tiếng Việt của câu ví dụ đó",
  "synonyms": [
    { "word": "từ đồng nghĩa tiếng Anh (nếu đầu vào là từ đơn) hoặc câu/cách diễn đạt tương tự bằng tiếng Anh (nếu đầu vào là câu)", "vietnamese": "dịch nghĩa tiếng Việt tương ứng tương ứng" }
  ], // Luôn cung cấp từ 3-5 gợi ý từ đồng nghĩa (nếu đầu vào là từ đơn) hoặc 3-5 câu/cách diễn đạt tương tự (nếu đầu vào là cụm từ/câu) kèm theo dịch nghĩa tiếng Việt tương ứng
  "forms": null // Đối tượng chứa biến thể 12 thì (nếu là động từ đơn, ví dụ: go, eat, study...), còn nếu là câu/cụm từ/từ loại khác thì để null. Mẫu: {"present_simple": "go / goes", "present_continuous": "am/is/are going", "present_perfect": "have/has gone", "present_perfect_continuous": "have/has been going", "past_simple": "went", "past_continuous": "was/were going", "past_perfect": "had gone", "past_perfect_continuous": "had been going", "future_simple": "will go", "future_continuous": "will be going", "future_perfect": "will have gone", "future_perfect_continuous": "will have been going"}
}`
          : `Bạn là một từ điển Việt-Anh học thuật và trợ lý tiếng Anh thông minh. Hãy dịch từ hoặc câu tiếng Việt sau sang tiếng Anh: "${query}".
Hãy trả về một đối tượng JSON duy nhất có cấu trúc chính xác như mẫu dưới đây (chỉ trả về JSON, không bao gồm markdown hay giải thích nào khác ngoài JSON):
{
  "word": "bản dịch tiếng Anh (viết đúng chính tả và ngữ pháp)",
  "ipa": "phiên âm IPA của bản dịch tiếng Anh (nếu là từ đơn, ví dụ: /he'loʊ/, nếu là câu thì để trống '')",
  "vietnamese": "câu/từ tiếng Việt gốc ('${query}')",
  "partOfSpeech": "từ loại của bản dịch tiếng Anh (Danh từ, Động từ, Tính từ, Trạng từ, Cụm từ, Câu...)",
  "hasGrammarError": false, // Luôn điền false vì dịch từ Việt sang Anh
  "correctedText": "",
  "grammarErrorExplanation": "",
  "example": "một câu ví dụ tiếng Anh liên quan đến bản dịch",
  "example_translation": "dịch nghĩa tiếng Việt của câu ví dụ đó",
  "synonyms": [
    { "word": "từ đồng nghĩa tiếng Anh với bản dịch (nếu đầu vào là từ đơn) hoặc câu/cách diễn đạt tương đương bằng tiếng Anh (nếu đầu vào là câu)", "vietnamese": "dịch nghĩa tiếng Việt tương ứng tương ứng" }
  ], // Luôn cung cấp từ 3-5 gợi ý từ đồng nghĩa (nếu đầu vào là từ đơn) hoặc 3-5 câu/cách diễn đạt tương tự (nếu đầu vào là cụm từ/câu) kèm theo dịch nghĩa tiếng Việt tương ứng
  "forms": null // Đối tượng chứa biến thể 12 thì (nếu bản dịch là động từ đơn, ví dụ: go, eat...), ngược lại là null. Mẫu: {"present_simple": "go / goes", "present_continuous": "am/is/are going", "present_perfect": "have/has gone", "present_perfect_continuous": "have/has been going", "past_simple": "went", "past_continuous": "was/were going", "past_perfect": "had gone", "past_perfect_continuous": "had been going", "future_simple": "will go", "future_continuous": "will be going", "future_perfect": "will have gone", "future_perfect_continuous": "will have been going"}
}`;

        try {
          const response = await fetchGeminiWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey.trim()
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
              })
            }
          );

          if (response && response.ok) {
            const resData = await response.json();
            const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const firstBrace = rawText.indexOf('{');
              const lastBrace = rawText.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1) {
                const cleanJsonText = rawText.slice(firstBrace, lastBrace + 1);
                const repairedJsonText = preprocessAndRepairJson(cleanJsonText);
                const parsed = JSON.parse(repairedJsonText);
                const translatedClean = (parsed.word || '').trim().toLowerCase();
                const alreadySaved = storage.getSavedVocab().find(w => w.word.toLowerCase() === translatedClean);
                
                setResult({
                  word: parsed.word || query.trim(),
                  ipa: parsed.ipa || "",
                  vietnamese: parsed.vietnamese || "",
                  partOfSpeech: parsed.partOfSpeech || "",
                  forms: parsed.forms || null,
                  hasGrammarError: parsed.hasGrammarError || false,
                  correctedText: parsed.correctedText || "",
                  grammarErrorExplanation: parsed.grammarErrorExplanation || "",
                  example: parsed.example ? `${parsed.example} -> ${parsed.example_translation || ''}` : '',
                  synonyms: parsed.synonyms || [],
                  isCustom: true,
                  isSaved: !!alreadySaved,
                  source: 'ai'
                });
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (geminiErr) {
          console.warn("Gemini translate failed, falling back:", geminiErr);
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

      let dictPromise = Promise.resolve({ ipa: '', example: '', synonymsList: [] });
      if (isTargetSingleWord) {
        dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetEnglishWord}`)
          .then(res => res.json())
          .then(data => {
            if (data && data[0]) {
              const phonetics = data[0].phonetics || [];
              const foundIpa = phonetics.find(p => p.text)?.text || data[0].phonetic || `/${targetEnglishWord}/`;
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
                example: meaning ? `${meaning}${sample ? ` (E.g. ${sample})` : ''}` : '',
                synonymsList: synonymsList
              };
            }
            return { ipa: `/${targetEnglishWord}/`, example: '', synonymsList: [] };
          })
          .catch(() => ({ ipa: `/${targetEnglishWord}/`, example: '', synonymsList: [] }));
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
      const localCheck = isSourceEn ? checkLocalGrammarErrors(query) : { hasError: false, correctedText: "", explanation: "" };
      // Check if result is already in notebook
      const alreadySaved = storage.getSavedVocab().find(w => w.word.toLowerCase() === targetEnglishWord);
      if (alreadySaved) {
        setIsSaved(true);
      }

      setResult({
        word: isSourceEn ? query.trim() : translationResult, // The English translation or English source
        ipa: dictInfo.ipa || (isTargetSingleWord ? `/${targetEnglishWord}/` : ''),
        vietnamese: isSourceEn ? translationResult : query.trim(), // The Vietnamese translation or Vietnamese source
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
    } catch (err) {
      console.error("Global translation failed:", err);
      showToast("Có lỗi xảy ra khi dịch, vui lòng thử lại.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
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

              {/* AI Translation Toggle */}
              <div className="translator-options mt-3">
                <label className="flex items-center gap-2 text-xs cursor-pointer color-text-muted select-none">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>✨ Dịch & Sửa lỗi ngữ pháp bằng Gemini AI (Yêu cầu API Key, phản hồi chậm hơn)</span>
                </label>
              </div>
            </form>

            {/* Results Section */}
            <div className="translator-results-container mt-5">
              {isLoading && (
                <div className="text-center p-6">
                  <span className="spinner-large" />
                  <p className="color-text-muted mt-2">
                    {useAI ? 'Đang gọi Gemini AI phân tích...' : 'Đang tra cứu từ điển nhanh...'}
                  </p>
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
                      {result.ipa && <span className="result-ipa">{result.ipa}</span>}
                    </div>
                    <button className="speak-btn-large" onClick={() => handleSpeak(direction === 'en-vi' ? result.word : result.word)}>
                      🔊 Nghe phát âm
                    </button>
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

                  {/* Gợi ý bật AI để sửa ngữ pháp nếu là câu dài và không dùng AI */}
                  {!useAI && !result.hasGrammarError && direction === 'en-vi' && query.trim().split(/\s+/).length > 2 && (
                    <div className="mt-3 text-xs text-center color-text-muted p-3 glass" style={{ border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                      💡 Bật chế độ <strong>Dịch & Sửa lỗi ngữ pháp bằng Gemini AI</strong> để kiểm tra ngữ pháp nâng cao hơn.
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
