import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { playSound } from '../utils/sounds';
import { fetchGeminiWithRetry } from './AdminPanel';

const IRREGULAR_VERBS = {
  "go": { present: "go / goes", past: "went", pastParticiple: "gone", partOfSpeech: "Động từ (Làm vị ngữ chính trong câu)" },
  "be": { present: "am / is / are", past: "was / were", pastParticiple: "been", partOfSpeech: "Động từ (Động từ tobe làm vị ngữ)" },
  "have": { present: "have / has", past: "had", pastParticiple: "had", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "do": { present: "do / does", past: "did", pastParticiple: "done", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "say": { present: "say / says", past: "said", pastParticiple: "said", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "make": { present: "make / makes", past: "made", pastParticiple: "made", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "get": { present: "get / gets", past: "got", pastParticiple: "got / gotten", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "take": { present: "take / takes", past: "took", pastParticiple: "taken", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "come": { present: "come / comes", past: "came", pastParticiple: "come", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "see": { present: "see / sees", past: "saw", pastParticiple: "seen", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "know": { present: "know / knows", past: "knew", pastParticiple: "known", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "find": { present: "find / finds", past: "found", pastParticiple: "found", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "give": { present: "give / gives", past: "gave", pastParticiple: "given", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "tell": { present: "tell / tells", past: "told", pastParticiple: "told", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "think": { present: "think / thinks", past: "thought", pastParticiple: "thought", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "run": { present: "run / runs", past: "ran", pastParticiple: "run", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "write": { present: "write / writes", past: "wrote", pastParticiple: "written", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "eat": { present: "eat / eats", past: "ate", pastParticiple: "eaten", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "drink": { present: "drink / drinks", past: "drank", pastParticiple: "drunk", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "speak": { present: "speak / speaks", past: "spoke", pastParticiple: "spoken", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "buy": { present: "buy / buys", past: "bought", pastParticiple: "bought", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "sell": { present: "sell / sells", past: "sold", pastParticiple: "sold", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "meet": { present: "meet / meets", past: "met", pastParticiple: "met", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "sing": { present: "sing / sings", past: "sang", pastParticiple: "sung", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "swim": { present: "swim / swims", past: "swam", pastParticiple: "swum", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "leave": { present: "leave / leaves", past: "left", pastParticiple: "left", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "grow": { present: "grow / grows", past: "grew", pastParticiple: "grown", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "bring": { present: "bring / brings", past: "brought", pastParticiple: "brought", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "begin": { present: "begin / begins", past: "began", pastParticiple: "begun", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" },
  "read": { present: "read / reads", past: "read", pastParticiple: "read", partOfSpeech: "Động từ (Thường làm vị ngữ chính)" }
};

function getInflectionsAndPOS(word) {
  const clean = word.toLowerCase().trim();
  
  let base = clean;
  if (clean.endsWith("ing") && clean.length > 5) base = clean.slice(0, -3);
  else if (clean.endsWith("ed") && clean.length > 4) base = clean.slice(0, -2);
  else if (clean.endsWith("es") && clean.length > 4) base = clean.slice(0, -2);
  else if (clean.endsWith("s") && clean.length > 3) base = clean.slice(0, -1);

  if (IRREGULAR_VERBS[clean]) return IRREGULAR_VERBS[clean];
  if (IRREGULAR_VERBS[base]) return IRREGULAR_VERBS[base];
  
  let partOfSpeech = "Từ loại khác";
  let present = clean;
  let past = clean;

  if (clean.endsWith("ize") || clean.endsWith("ate") || clean.endsWith("ify") || clean.endsWith("en")) {
    partOfSpeech = "Động từ (Làm vị ngữ chính trong câu)";
  } else if (clean.endsWith("ly")) {
    partOfSpeech = "Trạng từ (Bổ nghĩa cho động từ/tính từ)";
  } else if (clean.endsWith("ful") || clean.endsWith("less") || clean.endsWith("able") || clean.endsWith("ive") || clean.endsWith("ous") || clean.endsWith("ish") || clean.endsWith("al")) {
    partOfSpeech = "Tính từ (Bổ nghĩa cho danh từ, làm vị ngữ sau tobe)";
  } else if (clean.endsWith("tion") || clean.endsWith("sion") || clean.endsWith("ness") || clean.endsWith("ment") || clean.endsWith("ity") || clean.endsWith("ship") || clean.endsWith("hood") || clean.endsWith("ance") || clean.endsWith("ence")) {
    partOfSpeech = "Danh từ (Làm chủ ngữ hoặc tân ngữ trong câu)";
  }

  if (clean.endsWith("s") || clean.endsWith("x") || clean.endsWith("z") || clean.endsWith("ch") || clean.endsWith("sh") || clean.endsWith("o")) {
    present = `${clean} / ${clean}es`;
  } else if (clean.match(/[^aeiou]y$/)) {
    present = `${clean} / ${clean.slice(0, -1)}ies`;
  } else {
    present = `${clean} / ${clean}s`;
  }

  if (clean.endsWith("e")) {
    past = `${clean}d`;
  } else if (clean.match(/[^aeiou]y$/)) {
    past = `${clean.slice(0, -1)}ied`;
  } else if (clean.match(/[aeiou][bcdfghjklmnpqrstvwxyz]$/) && !clean.match(/[aeiou]{2}[bcdfghjklmnpqrstvwxyz]$/)) {
    if (clean.length <= 4) {
      past = `${clean}${clean.slice(-1)}ed`;
    } else {
      past = `${clean}ed`;
    }
  } else {
    past = `${clean}ed`;
  }

  return {
    partOfSpeech,
    present,
    past
  };
}

function checkLocalGrammarErrors(text) {
  let clean = text.trim();
  let corrected = clean;
  let explanations = [];

  // 1. Contraction typos & Capitalization of 'I'
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

  // 2. Subject-Verb / Tobe Agreement
  const agreementReplacements = [
    // Tobe agreement
    { regex: /\b(I|i)\s+(is|are)\b/g, replacement: "I am", explanation: "Chủ ngữ 'I' đi với động từ tobe là 'am'." },
    { regex: /\b(you|You)\s+(is|am)\b/g, replacement: "$1 are", explanation: "Chủ ngữ 'you' đi với động từ tobe là 'are'." },
    { regex: /\b(we|We)\s+(is|am)\b/g, replacement: "$1 are", explanation: "Chủ ngữ 'we' đi với động từ tobe là 'are'." },
    { regex: /\b(they|They)\s+(is|am)\b/g, replacement: "$1 are", explanation: "Chủ ngữ 'they' đi với động từ tobe là 'are'." },
    { regex: /\b(he|He)\s+(am|are)\b/g, replacement: "$1 is", explanation: "Chủ ngữ ngôi thứ ba số ít 'he' đi với động từ tobe là 'is'." },
    { regex: /\b(she|She)\s+(am|are)\b/g, replacement: "$1 is", explanation: "Chủ ngữ ngôi thứ ba số ít 'she' đi với động từ tobe là 'is'." },
    { regex: /\b(it|It)\s+(am|are)\b/g, replacement: "$1 is", explanation: "Chủ ngữ ngôi thứ ba số ít 'it' đi với động từ tobe là 'is'." },
    
    // Have agreement
    { regex: /\b(he|He|she|She|it|It)\s+(have)\b/g, replacement: "$1 has", explanation: "Chủ ngữ ngôi thứ ba số ít ('he', 'she', 'it') phải dùng động từ 'has' thay vì 'have'." },
    { regex: /\b(I|i|you|You|we|We|they|They)\s+(has)\b/g, replacement: "$1 have", explanation: "Chủ ngữ số nhiều và 'I', 'you' phải dùng động từ 'have' thay vì 'has'." },

    // Simple present tense basic third person singular -s/-es misses
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

  // 3. Articles (a/an) before vowels (exclude university/one)
  const aBeforeVowelsRegex = /\b(a|A)\s+([aeiou][a-z]*)\b/g;
  let match;
  const tempRegex = new RegExp(aBeforeVowelsRegex);
  while ((match = tempRegex.exec(corrected)) !== null) {
    const vowelWord = match[2].toLowerCase();
    if (!vowelWord.startsWith("uni") && !vowelWord.startsWith("one")) {
      corrected = corrected.replace(new RegExp(`\\b${match[1]}\\s+${match[2]}\\b`, 'g'), `${match[1] === 'A' ? 'An' : 'an'} ${match[2]}`);
      explanations.push(`Dùng mạo từ '${match[1] === 'A' ? 'An' : 'an'}' thay vì '${match[1]}' trước từ bắt đầu bằng nguyên âm '${match[2]}'.`);
    }
  }

  // Articles (an) before consonants (exclude hour/honest)
  const anBeforeConsonantsRegex = /\b(an|An)\s+([bcdfghjklmnpqrstvwxyz][a-z]*)\b/g;
  const tempRegex2 = new RegExp(anBeforeConsonantsRegex);
  while ((match = tempRegex2.exec(corrected)) !== null) {
    const consWord = match[2].toLowerCase();
    if (!consWord.startsWith("hour") && !consWord.startsWith("honest") && !consWord.startsWith("honor")) {
      corrected = corrected.replace(new RegExp(`\\b${match[1]}\\s+${match[2]}\\b`, 'g'), `${match[1] === 'An' ? 'A' : 'a'} ${match[2]}`);
      explanations.push(`Dùng mạo từ '${match[1] === 'An' ? 'A' : 'a'}' thay vì '${match[1]}' trước từ bắt đầu bằng phụ âm '${match[2]}'.`);
    }
  }

  // 4. Handle "im" / "Im" capitalization specifically
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
  const [useAI, setUseAI] = useState(false); // Default false for super fast results
  const [direction, setDirection] = useState('en-vi'); // 'en-vi' or 'vi-en'
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close on Escape keypress
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

      // 1. Check if word is already saved in notebook (only for English input)
      if (isSourceEn) {
        const savedEntry = storage.getSavedVocab().find(w => w.word.toLowerCase() === cleanQuery);
        if (savedEntry) {
          const fallbackGrammar = getInflectionsAndPOS(savedEntry.word);
          setResult({
            word: savedEntry.word,
            ipa: savedEntry.ipa,
            vietnamese: savedEntry.vietnamese,
            example: savedEntry.example,
            partOfSpeech: savedEntry.partOfSpeech || fallbackGrammar.partOfSpeech,
            forms: savedEntry.forms || {
              present_simple: fallbackGrammar.present,
              past_simple: fallbackGrammar.past
            },
            hasGrammarError: savedEntry.hasGrammarError || false,
            correctedText: savedEntry.correctedText || "",
            grammarErrorExplanation: savedEntry.grammarErrorExplanation || "",
            isCustom: true,
            isSaved: true
          });
          setIsSaved(true);
          setIsLoading(false);
          return;
        }
      }

      // 2. Check if Gemini AI is toggled ON
      const apiKey = localStorage.getItem("eng_app_gemini_key");
      if (useAI && apiKey && apiKey.trim()) {
        const prompt = isSourceEn
          ? `Bạn là một từ điển Anh-Việt học thuật và trợ lý kiểm tra ngữ pháp tiếng Anh thông minh. Hãy dịch, phân tích từ loại, chức năng ngữ pháp và đặc biệt hãy KIỂM TRA LỖI CHÍNH TẢ & NGỮ PHÁP đối với từ hoặc câu tiếng Anh sau: "${query}".
Quy tắc:
1. Đối với từ loại (partOfSpeech), hãy giải thích rõ từ đó đóng vai trò gì trong câu (ví dụ: "Động từ (làm vị ngữ chính trong câu)", "Danh từ (làm chủ ngữ hoặc tân ngữ trong câu)", "Tính từ (bổ nghĩa cho danh từ, đứng sau tobe)").
2. Đối với dạng ở các thì (forms), hãy điền dạng Hiện tại đơn (present_simple) và Quá khứ đơn (past_simple) của từ đó. Nếu là danh từ, hãy hiển thị dạng số nhiều. Nếu là tính từ, hãy hiển thị dạng so sánh hơn/nhất. Nếu là cả câu/cụm từ dài thì có thể để trống hoặc ghi "N/A".
3. Kiểm tra lỗi ngữ pháp & chính tả của "${query}":
   - Nếu phát hiện bất kỳ lỗi chính tả hoặc ngữ pháp nào, hãy đặt "hasGrammarError" thành true, cung cấp câu đã sửa lỗi ở "correctedText", và giải thích ngắn gọn lỗi sai ở "grammarErrorExplanation" bằng tiếng Việt.
   - Nếu không phát hiện lỗi nào (hoặc câu hoàn toàn chính xác), hãy đặt "hasGrammarError" thành false.
4. Trả về kết quả dưới dạng JSON duy nhất theo cấu trúc sau (không kèm markdown, không có chữ nào khác ngoài JSON):
{
  "word": "${query}",
  "ipa": "phiên âm IPA (ví dụ: /ɡoʊ/)",
  "partOfSpeech": "từ loại kèm giải thích chức năng (ví dụ: Động từ (làm vị ngữ chính trong câu))",
  "vietnamese": "dịch nghĩa tiếng Việt đầy đủ",
  "forms": {
    "present_simple": "dạng ở thì hiện tại đơn (ví dụ: go/goes)",
    "past_simple": "dạng ở thì quá khứ đơn (ví dụ: went)"
  },
  "hasGrammarError": true,
  "correctedText": "câu đã được sửa lỗi chính tả/ngữ pháp",
  "grammarErrorExplanation": "Giải thích ngắn gọn lý do sửa lỗi bằng tiếng Việt",
  "example": "ví dụ câu tiếng Anh chứa từ đó",
  "example_translation": "dịch nghĩa ví dụ tiếng Việt"
}`
          : `Bạn là một từ điển Việt-Anh học thuật và trợ lý tiếng Anh thông minh. Hãy dịch từ hoặc câu tiếng Việt sau sang tiếng Anh: "${query}".
Quy tắc:
1. Đối với kết quả dịch sang tiếng Anh, hãy phân tích từ loại (partOfSpeech) của từ dịch chính, giải thích rõ đóng vai trò gì trong câu.
2. Đối với các thì (forms), hãy cung cấp dạng Hiện tại đơn (present_simple) và Quá khứ đơn (past_simple) của từ dịch tiếng Anh đó. Nếu là cụm từ/câu dài thì ghi "N/A".
3. Trả về kết quả dưới dạng JSON duy nhất theo cấu trúc sau (không kèm markdown, không có chữ nào khác ngoài JSON):
{
  "word": "câu/từ tiếng Anh đã dịch (ví dụ: He went to school)",
  "ipa": "phiên âm IPA của từ tiếng Anh đã dịch (nếu là từ đơn)",
  "partOfSpeech": "từ loại của từ tiếng Anh đã dịch kèm giải thích chức năng (ví dụ: Động từ (làm vị ngữ chính trong câu))",
  "vietnamese": "${query}",
  "forms": {
    "present_simple": "dạng ở thì hiện tại đơn của từ tiếng Anh (ví dụ: go/goes)",
    "past_simple": "dạng ở thì quá khứ đơn của từ tiếng Anh (ví dụ: went)"
  },
  "hasGrammarError": false,
  "correctedText": "",
  "grammarErrorExplanation": "",
  "example": "ví dụ câu tiếng Anh chứa từ đó",
  "example_translation": "dịch nghĩa ví dụ tiếng Việt"
}`;

        try {
          const response = await fetchGeminiWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey.trim()}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.3
                }
              })
            }
          );

          if (response && response.ok) {
            const resData = await response.json();
            const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const firstBrace = rawText.indexOf('{');
              const lastBrace = rawText.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                const cleanJson = rawText.slice(firstBrace, lastBrace + 1);
                const parsed = JSON.parse(cleanJson);
                
                // Double check if the translated word is already saved
                const translatedClean = (parsed.word || '').trim().toLowerCase();
                const alreadySaved = storage.getSavedVocab().find(w => w.word.toLowerCase() === translatedClean);
                if (alreadySaved) {
                  setIsSaved(true);
                }

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
                  isCustom: true,
                  isSaved: alreadySaved ? true : false
                });
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (geminiErr) {
          console.warn("Gemini translate failed, falling back to basic APIs:", geminiErr);
        }
      }

      // 3. Fallback (Or Fast Default): Query Google Translate + Dictionary API
      const sl = isSourceEn ? 'en' : 'vi';
      const tl = isSourceEn ? 'vi' : 'en';

      const transPromise = fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(cleanQuery)}`)
        .then(res => res.json())
        .then(data => data && data[0] && data[0][0] && data[0][0][0] ? data[0][0][0] : "Không tìm thấy nghĩa");

      const translationResult = await transPromise;
      const targetEnglishWord = isSourceEn ? cleanQuery : translationResult.trim().toLowerCase();
      const isTargetSingleWord = !targetEnglishWord.includes(' ');

      let dictPromise = Promise.resolve({ ipa: '', example: '' });
      if (isTargetSingleWord) {
        dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetEnglishWord}`)
          .then(res => res.json())
          .then(data => {
            if (data && data[0]) {
              const phonetics = data[0].phonetics || [];
              const foundIpa = phonetics.find(p => p.text)?.text || data[0].phonetic || `/${targetEnglishWord}/`;
              const meaning = data[0].meanings?.[0]?.definitions?.[0]?.definition || "";
              const sample = data[0].meanings?.[0]?.definitions?.[0]?.example || "";
              return { 
                ipa: foundIpa, 
                example: meaning ? `${meaning}${sample ? ` (E.g. ${sample})` : ''}` : '' 
              };
            }
            return { ipa: `/${targetEnglishWord}/`, example: '' };
          })
          .catch(() => ({ ipa: `/${targetEnglishWord}/`, example: '' }));
      }

      const dictInfo = await dictPromise;
      const localGrammar = isTargetSingleWord ? getInflectionsAndPOS(targetEnglishWord) : null;
      
      // Run local grammar check on English input or translation
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
        forms: localGrammar ? { present_simple: localGrammar.present, past_simple: localGrammar.past } : null,
        example: dictInfo.example || (isTargetSingleWord ? `Used in: ${targetEnglishWord}` : 'Sentence translation'),
        hasGrammarError: localCheck.hasError,
        correctedText: localCheck.correctedText,
        grammarErrorExplanation: localCheck.explanation,
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
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={direction === 'en-vi' ? "Nhập từ tiếng Anh hoặc câu cần dịch..." : "Nhập từ tiếng Việt hoặc câu cần dịch..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="translator-input glass"
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
                      <h4 className="result-word">{direction === 'en-vi' ? result.word : result.word}</h4>
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
                      <p className="result-translation" style={{ fontSize: '16px', fontWeight: 'normal' }}>
                        {result.vietnamese}
                      </p>
                    </div>
                  )}

                  {/* Gợi ý bật AI để sửa ngữ pháp nếu là câu dài và không dùng AI */}
                  {!useAI && !result.hasGrammarError && direction === 'en-vi' && query.trim().split(/\s+/).length > 2 && (
                    <div className="mt-3 text-xs text-center color-text-muted p-3 glass" style={{ border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                      💡 Bật chế độ <strong>Dịch & Sửa lỗi ngữ pháp bằng Gemini AI</strong> để kiểm tra ngữ pháp nâng cao hơn.
                    </div>
                  )}

                  {/* Biến thể các thì hiện tại / quá khứ đơn */}
                  {result.forms && (result.forms.present_simple || result.forms.past_simple) && (
                    <div className="result-forms mt-3 p-3 glass" style={{ borderLeft: '3px solid var(--color-primary)' }}>
                      <strong className="color-text-muted text-xs block mb-2">CÁC DẠNG CỦA TỪ (GRAMMAR):</strong>
                      <div className="flex flex-col gap-1 text-sm">
                        {result.forms.present_simple && result.forms.present_simple !== 'N/A' && (
                          <div>• <strong>Hiện tại đơn / Số nhiều / Nguyên mẫu:</strong> <code>{result.forms.present_simple}</code></div>
                        )}
                        {result.forms.past_simple && result.forms.past_simple !== 'N/A' && (
                          <div>• <strong>Quá khứ đơn / So sánh hơn:</strong> <code>{result.forms.past_simple}</code></div>
                        )}
                      </div>
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
