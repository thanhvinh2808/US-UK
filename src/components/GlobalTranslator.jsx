import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { playSound, speak, speakCompare } from '../utils/sounds';
import { conjugateWithCompromise, getSForm, getPastForm, getIngForm } from '../utils/helpers/conjugationEngine';

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
    // Double Conjunctions
    { 
      regex: /\b(although|though|even though)\b([^.?!]+?)(?:,\s*)?\bbut\b/gi, 
      replacement: "$1$2,", 
      explanation: "Không sử dụng đồng thời 'although/though/even though' và 'but' trong cùng một câu ghép." 
    },
    { 
      regex: /\b(because|since|as)\b([^.?!]+?)(?:,\s*)?\bso\b/gi, 
      replacement: "$1$2,", 
      explanation: "Không sử dụng đồng thời 'because/since/as' và 'so' trong cùng một câu ghép." 
    },
    // Tobe + base verb
    { 
      regex: /\b(I\s+am|I'm|i'm|Im|im|he\s+is|he's|He's|she\s+is|she's|She's|it\s+is|it's|It's|you\s+are|you're|You're|we\s+are|we're|We're|they\s+are|they're|They're)\s+(study|work|learn|read|write|cook|run|play|watch|talk|speak|listen|sing|dance|drive|swim|walk|sleep|eat|drink)\b/gi, 
      replacement: (match, pronTobe, verb) => {
        const cleanPronTobe = pronTobe.trim();
        let newTobe = pronTobe;
        if (cleanPronTobe.toLowerCase() === "im") newTobe = "I'm";
        const ingVerb = getIngForm(verb.toLowerCase());
        return `${newTobe} ${ingVerb}`;
      }, 
      explanation: "Sử dụng cấu trúc 'be + V-ing' để diễn tả hành động đang diễn ra (thì tiếp diễn)." 
    },
    // Wh-question with missing does on 3rd person singular + s-verb (Bug 2 fix: exclude was, is, has, does)
    { 
      regex: /\b(where|how|when|why|Where|How|When|Why)\s+(he|she|it)\s+([a-zA-Z]+)s\b/g, 
      replacement: (match, wh, subj, verb) => {
        const fullVerb = verb + 's';
        const lowerFull = fullVerb.toLowerCase();
        if (lowerFull === 'was' || lowerFull === 'is' || lowerFull === 'has' || lowerFull === 'does') {
          return match;
        }
        let baseVerb = verb;
        if (verb.toLowerCase().endsWith("es") && (verb.toLowerCase().endsWith("goes") || verb.toLowerCase().endsWith("does") || verb.toLowerCase().endsWith("watches") || verb.toLowerCase().endsWith("fishes") || verb.toLowerCase().endsWith("classes"))) {
          baseVerb = verb.slice(0, -2);
        } else if (verb.toLowerCase().endsWith("s")) {
          baseVerb = verb.slice(0, -1);
        }
        return `${wh} does ${subj} ${baseVerb}`;
      }, 
      explanation: "Trong câu hỏi Wh-question ở hiện tại đơn với ngôi thứ ba số ít, sử dụng trợ động từ 'does' đứng trước chủ ngữ và động từ chính ở dạng nguyên thể." 
    },
    // Wish + am/is/are
    { 
      regex: /\b(wish|wishes)\s+(I|i|he|He|she|She|it|It|you|You|we|We|they|They)\s+(am|is|are)\b/g, 
      replacement: "$1 $2 were", 
      explanation: "Sau 'wish' diễn tả mong ước không có thật ở hiện tại, động từ tobe được chia ở dạng quá khứ giả định (were) cho tất cả các ngôi." 
    },
    // Since with duration
    { 
      regex: /\b(since)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|many|several)\s+(years|months|days|weeks|hours|minutes)\b/gi, 
      replacement: "for $2 $3", 
      explanation: "Dùng 'for' để chỉ khoảng thời gian (khoảng bao lâu), dùng 'since' để chỉ mốc thời gian (bắt đầu từ khi nào)." 
    },
    // For with specific year
    { 
      regex: /\b(for)\s+(19\d{2}|20\d{2})\b/g, 
      replacement: "since $2", 
      explanation: "Dùng 'since' thay vì 'for' trước mốc thời gian cụ thể (ví dụ: năm)." 
    },
    // Tobe agreements
    { regex: /\b(I|i)\s+(is|are)\b/g, replacement: "I am", explanation: "Chủ ngữ 'I' đi với động từ tobe là 'am'." },
    { regex: /\b(you|You)\s+(is|am)\b/g, replacement: "$1 are", explanation: "Chủ ngữ 'you' đi với động từ tobe là 'are'." },
    { regex: /\b(we|We)\s+(is|am)\b/g, replacement: "$1 are", explanation: "Chủ ngữ 'we' đi với động từ tobe là 'are'." },
    { regex: /\b(they|They)\s+(is|am)\b/g, replacement: "$1 are", explanation: "Chủ ngữ 'they' đi với động từ tobe là 'are'." },
    { regex: /\b(he|He)\s+(am|are)\b/g, replacement: "$1 is", explanation: "Chủ ngữ ngôi thứ ba số ít 'he' đi với động từ tobe là 'is'." },
    { regex: /\b(she|She)\s+(am|are)\b/g, replacement: "$1 is", explanation: "Chủ ngữ ngôi thứ ba số ít 'she' đi với động từ tobe là 'is'." },
    { regex: /\b(it|It)\s+(am|are)\b/g, replacement: "$1 is", explanation: "Chủ ngữ ngôi thứ ba số ít 'it' đi với động từ tobe là 'is'." },
    { regex: /(?<!\b(?:do|does|did|Do|Does|Did)\s)\b(he|He|she|She|it|It)\s+(have)\b/g, replacement: "$1 has", explanation: "Chủ ngữ ngôi thứ ba số ít ('he', 'she', 'it') phải dùng động từ 'has' thay vì 'have'." },
    { regex: /\b(I|i|you|You|we|We|they|They)\s+(has)\b/g, replacement: "$1 have", explanation: "Chủ ngữ số nhiều và 'I', 'you' phải dùng động từ 'have' thay vì 'has'." },
    { regex: /(?<!\b(?:do|does|did|Do|Does|Did)\s)\b(he|He|she|She|it|It)\s+(go)\b/g, replacement: "$1 goes", explanation: "Động từ 'go' cần thêm '-es' thành 'goes' sau chủ ngữ ngôi thứ ba số ít." },
    { regex: /(?<!\b(?:do|does|did|Do|Does|Did)\s)\b(he|He|she|She|it|It)\s+(do)\b/g, replacement: "$1 does", explanation: "Động từ 'do' cần thêm '-es' thành 'does' sau chủ ngữ ngôi thứ ba số ít." },
    { regex: /(?<!\b(?:do|does|did|Do|Does|Did)\s)\b(he|He|she|She|it|It)\s+(want)\b/g, replacement: "$1 wants", explanation: "Động từ 'want' cần thêm '-s' thành 'wants' sau chủ ngữ ngôi thứ ba số ít." },
    { regex: /(?<!\b(?:do|does|did|Do|Does|Did)\s)\b(he|He|she|She|it|It)\s+(like)\b/g, replacement: "$1 likes", explanation: "Động từ 'like' cần thêm '-s' thành 'likes' sau chủ ngữ ngôi thứ ba số ít." },
    { regex: /\b(is|am|Is|Am)\s+you\b/g, replacement: (m, aux) => `${/^[A-Z]/.test(aux) ? 'Are' : 'are'} you`, explanation: "Trong câu hỏi, chủ ngữ 'you' đi với động từ tobe là 'are' ('are you' chứ không phải 'is/am you')." },
    { regex: /\b(are|am|Are|Am)\s+(he|she|it)\b/g, replacement: (m, aux, subj) => `${/^[A-Z]/.test(aux) ? 'Is' : 'is'} ${subj}`, explanation: "Trong câu hỏi, chủ ngữ số ít 'he/she/it' đi với động từ tobe là 'is' ('is he/she/it')." },
    { regex: /\b(does|Does)\s+(I|i|you|You|we|We|they|They)\b/g, replacement: (m, aux, subj) => `${/^[A-Z]/.test(aux) ? 'Do' : 'do'} ${subj}`, explanation: "Trong câu hỏi, chủ ngữ số nhiều và 'I', 'you' dùng trợ động từ 'do' ('do you', 'do they')." },

    // Bug 1 fix: Only match question 'do he/she' when not preceded by modal verbs, 'to', etc.
    { regex: /(?<!\b(?:can|could|should|would|will|may|might|must|cannot|can't|couldn't|shouldn't|wouldn't|won't|don't|doesn't|didn't|to|let|make|help|I|you|we|they|he|she|it|this|that|please|just|always|never)\s+)\b(do|Do)\s+(he|He|she|She)\b/g, replacement: (m, aux, subj) => `${/^[A-Z]/.test(aux) ? 'Does' : 'does'} ${subj}`, explanation: "Trong câu hỏi, chủ ngữ ngôi thứ ba số ít dùng trợ động từ 'does' ('does he', 'does she')." },

    { regex: /\b(what|What)\s+(timing|timming)\s+is\s+it\b/g, replacement: "$1 time is it", explanation: "Câu hỏi giờ giấc chuẩn tiếng Anh sử dụng danh từ 'time' ('What time is it') chứ không dùng 'timing'." },
    { regex: /\b(we|they|people|these|those|We|They|People|These|Those)\s+a\s+([a-zA-Z]+)\b/g, replacement: "$1 are $2", explanation: "Dùng động từ tobe số nhiều 'are' thay vì từ đơn 'a' đứng sau chủ ngữ/danh từ số nhiều." },
    { regex: /\b(where|how|when|why|Where|How|When|Why)\s+(you|they|we)\s+(go|live|work|like|want|do|study|learn|see|eat|drink|have|play|say|call)\b/g, replacement: "$1 do $2 $3", explanation: "Trong câu hỏi có từ để hỏi (wh-question), cần thêm trợ động từ 'do' trước chủ ngữ." },
    { regex: /\b(where|how|when|why|Where|How|When|Why)\s+(he|she|it)\s+(go|live|work|like|want|do|study|learn|see|eat|drink|have|play|say|call)\b/g, replacement: "$1 does $2 $3", explanation: "Trong câu hỏi có từ để hỏi (wh-question), cần thêm trợ động từ 'does' trước chủ ngữ số ít." },
    { regex: /\b([hH]ow\s+many\s+[a-zA-Z]+)\s+in\s+([a-zA-Z\s]+)\b/g, replacement: "$1 are there in $2", explanation: "Thiếu cấu trúc chỉ sự tồn tại 'are there' trong câu hỏi số lượng ('How many... are there in...')." },
    { regex: /\b(I|i|we|We|they|They|you|You)\s+am\s+(feel|like|love|hate|agree|disagree|think)\b/g, replacement: "$1 $2", explanation: "Không dùng động từ tobe 'am/are' đi liền trước động từ thường chỉ trạng thái/cảm xúc ở hiện tại đơn." },
    { regex: /\b(I'm|i'm|Im|im)\s+(feel|like|love|hate|agree|disagree|think)\b/g, replacement: "I $2", explanation: "Không dùng 'I'm' trước động từ thường chỉ trạng thái/cảm xúc ở hiện tại đơn (dùng 'I' thay vì 'I'm')." },
    { regex: /\b(I'm|i'm|Im|im)\s+(study|work|learn|read|write|cook|run|play|watch)\b/g, replacement: "I am $2ing", explanation: "Dùng động từ đuôi -ing sau 'I am' để tạo thì hiện tại tiếp diễn." },
    // Bug 5 fix: Removed 'anh' -> 'and' rule completely to avoid corrupting names or repeating 'and'

    // Bug 3 fix: Suggest / Recommend rules placed LAST so subjunctive mood is protected
    { 
      regex: /\b(suggest|recommend|suggested|recommended)\s+(him|her|them|us|me)\s+to\s+([a-zA-Z]+)\b/gi, 
      replacement: (match, verb, pron, baseVerb) => {
        const pronMap = { him: 'he', her: 'she', them: 'they', us: 'we', me: 'I' };
        const subj = pronMap[pron.toLowerCase()] || pron;
        return `${verb} that ${subj} ${baseVerb}`;
      }, 
      explanation: "Động từ 'suggest/recommend' không đi với cấu trúc tân ngữ + to-verb. Dùng 'suggest that [chủ ngữ] + verb nguyên thể' hoặc 'suggest + V-ing'." 
    },
    { 
      regex: /\b(suggest|recommend|suggested|recommended)\s+(?:that\s+)?(he|she|it)\s+(goes|does|has|wants|likes|is|was|were)\b/gi, 
      replacement: (match, verb, subj, sVerb) => {
        const baseMap = { goes: 'go', does: 'do', has: 'have', wants: 'want', likes: 'like', is: 'be', was: 'be', were: 'be' };
        const base = baseMap[sVerb.toLowerCase()] || sVerb;
        return `${verb} that ${subj} ${base}`;
      }, 
      explanation: "Sau 'suggest/recommend', động từ trong mệnh đề 'that' dùng ở dạng giả định (động từ nguyên thể không chia cho tất cả các ngôi)." 
    }
  ];

  for (const item of agreementReplacements) {
    if (item.regex.test(corrected)) {
      corrected = corrected.replace(item.regex, item.replacement);
      explanations.push(item.explanation);
    }
  }

  // Bug 4 fix: Phonetic-aware a / an logic
  const consonantSoundVowels = /\b(user|university|unicorn|unique|useful|unit|united|universe|utensil|utopia|ubiquitous|euro|european|one|oneself|ufo)\b/i;
  const silentHWords = /\b(hour|hours|honest|honor|honour|honorable|honourable|heir|heiress)\b/i;
  const vowelSoundAcronyms = /\b([FHLMNRSX][A-Z0-9]{1,4})\b/; // MBA, MP3, HR, SMS, etc.

  // 1. Fix "a" before words requiring "an"
  const aToAnRegex = /\b(a|A)\s+([a-zA-Z0-9]+)\b/g;
  corrected = corrected.replace(aToAnRegex, (fullMatch, art, word) => {
    const lowerWord = word.toLowerCase();
    const isVowelStart = /^[aeiou]/i.test(word);
    const isSilentH = silentHWords.test(lowerWord);
    const isVowelAcronym = vowelSoundAcronyms.test(word);
    const isConsonantSoundVowel = consonantSoundVowels.test(lowerWord);

    if ((isVowelStart && !isConsonantSoundVowel) || isSilentH || isVowelAcronym) {
      const correctArt = art === 'A' ? 'An' : 'an';
      explanations.push(`Dùng mạo từ '${correctArt}' thay vì '${art}' trước từ bắt đầu bằng âm nguyên âm '${word}'.`);
      return `${correctArt} ${word}`;
    }
    return fullMatch;
  });

  // 2. Fix "an" before words requiring "a"
  const anToARegex = /\b(an|An)\s+([a-zA-Z0-9]+)\b/g;
  corrected = corrected.replace(anToARegex, (fullMatch, art, word) => {
    const lowerWord = word.toLowerCase();
    const isConsonantStart = /^[bcdfghjklmnpqrstvwxyz]/i.test(word);
    const isSilentH = silentHWords.test(lowerWord);
    const isVowelAcronym = vowelSoundAcronyms.test(word);
    const isConsonantSoundVowel = consonantSoundVowels.test(lowerWord);

    if ((isConsonantStart && !isSilentH && !isVowelAcronym) || isConsonantSoundVowel) {
      const correctArt = art === 'An' ? 'A' : 'a';
      explanations.push(`Dùng mạo từ '${correctArt}' thay vì '${art}' trước từ bắt đầu bằng âm phụ âm '${word}'.`);
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

  try {
    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `text=${encodeURIComponent(text)}&language=en-US&level=picky`,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.matches || data.matches.length === 0) {
      return { hasError: false, correctedText: "", explanation: "" };
    }
    
    const sortedMatches = [...data.matches].sort((a, b) => b.offset - a.offset);
    
    let correctedText = text;
    
    // Concurrently translate all match messages to prevent sequential fetch delays
    const translationPromises = sortedMatches.map(async (match) => {
      try {
        const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(match.message)}`);
        const transData = await transRes.json();
        if (transData && transData[0]) {
          return transData[0].map(s => s[0]).filter(Boolean).join('').trim();
        }
      } catch (transErr) {
        console.warn("Failed to translate grammar explanation:", transErr);
      }
      return match.message;
    });
    
    const translatedMessages = await Promise.all(translationPromises);
    const explanations = [];
    
    sortedMatches.forEach((match, idx) => {
      const originalWord = text.substring(match.offset, match.offset + match.length);
      const replacement = match.replacements && match.replacements[0] ? match.replacements[0].value : "";
      
      if (replacement) {
        correctedText = correctedText.substring(0, match.offset) + replacement + correctedText.substring(match.offset + match.length);
      }
      
      const explanationVi = (translatedMessages[idx] || match.message || "").trim();
      explanations.push(`- Lỗi "${originalWord}": ${explanationVi}${replacement ? ` (Gợi ý sửa: "${replacement}")` : ''}`);
    });
    
    explanations.reverse();
    
    return {
      hasError: true,
      correctedText,
      explanation: explanations.join('\n')
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("LanguageTool check error or timeout:", err);
    return null;
  }
}

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
          setSuggestions(words.slice(0, 5)); // show top 5 suggestions
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

  // Search History States & Actions (Safeguarded against legacy plain string history)
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const data = localStorage.getItem("eng_app_search_history");
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      // Sanitize: filter out nulls or string primitives
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

      // Strip leading articles (a, an, the, to) for headword dictionary lookup
      const queryHeadword = isSourceEn ? cleanQuery.replace(/^(a|an|the|to)\s+/i, '').trim() : cleanQuery;

      // Primary fetch to Google Translate API with quality check (&dt=qc)
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

      // Fallback Datamuse spell check if Google Translate didn't offer a suggestion but dictionary lookup failed
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
    <div className="lexicon-studio-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Direction Pills Bar - Dynamic Royal Blue System */}
      <div className="direction-tabs-studio flex gap-3 justify-center flex-wrap" style={{ position: 'relative' }}>
        <button 
          type="button"
          className={`btn-secondary text-xs px-6 py-3 ${direction === 'en-vi' ? 'active-pill' : ''}`}
          style={{ 
            borderRadius: '12px', 
            border: direction === 'en-vi' ? '2px solid var(--color-primary)' : '1px solid var(--border-light)',
            background: direction === 'en-vi' ? 'var(--color-primary)' : 'var(--bg-card)',
            color: direction === 'en-vi' ? '#ffffff' : 'var(--color-text-main)',
            fontWeight: '700',
            fontSize: '14px',
            minHeight: '44px',
            flex: '1 1 150px',
            maxWidth: '240px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            setDirection('en-vi');
            setQuery('');
            setResult(null);
            setAiAnalysis(null);
          }}
        >
          🇬🇧 Anh ➔ 🇻🇳 Việt
        </button>
        <button 
          type="button"
          className={`btn-secondary text-xs px-6 py-3 ${direction === 'vi-en' ? 'active-pill' : ''}`}
          style={{ 
            borderRadius: '12px', 
            border: direction === 'vi-en' ? '2px solid var(--color-primary)' : '1px solid var(--border-light)',
            background: direction === 'vi-en' ? 'var(--color-primary)' : 'var(--bg-card)',
            color: direction === 'vi-en' ? '#ffffff' : 'var(--color-text-main)',
            fontWeight: '700',
            fontSize: '14px',
            minHeight: '44px',
            flex: '1 1 150px',
            maxWidth: '240px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            setDirection('vi-en');
            setQuery('');
            setResult(null);
            setAiAnalysis(null);
          }}
        >
          🇻🇳 Việt ➔ 🇬🇧 Anh
        </button>
      </div>

      {/* Solid Search Console */}
      <form onSubmit={handleTranslate} className="translator-search-console">
        <div style={{
          position: 'relative',
          display: 'flex',
          gap: '12px',
          background: 'var(--bg-card)',
          padding: '8px',
          borderRadius: '16px',
          border: '2px solid var(--color-primary)',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 260px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <textarea
                ref={inputRef}
                placeholder={direction === 'en-vi' ? "Nhập từ tiếng Anh hoặc câu dài cần dịch..." : "Nhập từ tiếng Việt hoặc câu dài cần dịch..."}
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
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 90px 12px 16px',
                  fontSize: '15px',
                  fontFamily: 'var(--font-sans)',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-main)',
                  resize: 'none',
                  lineHeight: 1.5
                }}
              />
              {/* Action Cluster inside Search Console */}
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setResult(null);
                      setAiAnalysis(null);
                    }}
                    style={{
                      background: 'rgba(0, 0, 0, 0.08)',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Xóa nội dung"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={startVoiceInput}
                  style={{
                    background: isListening ? 'var(--color-error)' : 'var(--color-primary-glow)',
                    border: '1px solid var(--color-primary)',
                    color: isListening ? '#ffffff' : 'var(--color-primary)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Nhập bằng giọng nói (Voice Input)"
                >
                  🎙️
                </button>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'var(--bg-card)',
                border: '2px solid var(--color-primary)',
                borderRadius: '12px',
                marginTop: '6px',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(item);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: 'var(--color-text-main)',
                      borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid var(--border-light)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    className="suggestion-item"
                  >
                    <span style={{ opacity: 0.5, fontSize: '12px' }}>🔍</span>
                    <span style={{ fontWeight: '500' }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading || !query.trim()} 
            style={{ 
              height: '54px', 
              minWidth: '120px', 
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              background: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              flex: '0 0 auto',
              alignSelf: 'center'
            }}
          >
            {isLoading ? <span className="spinner" /> : 'Tra cứu ✨'}
          </button>
        </div>
      </form>

      {/* Results & History Section */}
      <div className="translator-results-container">
        {isLoading && (
          <div className="text-center p-8 glass rounded-2xl" style={{ border: '1.5px solid var(--color-primary)' }}>
            <span className="spinner-large" />
            <p className="color-text-muted mt-3 font-semibold text-sm">
              Đang tra cứu từ điển...
            </p>
          </div>
        )}

        {!isLoading && !result && searchHistory && searchHistory.length > 0 && (
          <div className="recent-searches-box glass p-4 animate-slideup" style={{
            borderRadius: '16px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 className="text-xs uppercase tracking-wider color-text-muted font-bold flex items-center gap-2" style={{ margin: 0 }}>
                🕒 LỊCH SỬ TRA CỨU:
              </h4>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("eng_app_search_history");
                  setSearchHistory([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-error)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                Xóa lịch sử
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (item && item.word) {
                      setQuery(item.word);
                      handleTranslate(null, item.word);
                    }
                  }}
                  className="btn-secondary text-xs"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--color-text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{item?.word || ''}</span>
                  {item?.translation && <span className="color-text-muted" style={{ fontSize: '11px' }}>➔ {item.translation}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="translator-result-box glass p-6 animate-slideup" style={{ borderRadius: '16px', border: '2px solid var(--color-primary)', background: 'var(--bg-card)' }}>
            {/* Spell Correction / Did You Mean Banner */}
            {result.isAutoCorrected && result.originalQuery && (
              <div className="spell-suggestion-banner p-3.5 mb-5 flex items-center justify-between flex-wrap gap-2 animate-fadeIn" style={{ 
                background: 'rgba(59, 130, 246, 0.08)', 
                border: '1.5px solid var(--color-primary)', 
                borderRadius: '12px', 
                fontSize: '14px',
                color: 'var(--color-text-main)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>✨</span>
                  <span>
                    Đang hiện bản dịch cho <strong style={{ color: 'var(--color-primary)', fontWeight: '700' }}>{result.word}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleTranslate(e, result.originalQuery, true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Chuyển sang dịch {result.originalQuery}
                </button>
              </div>
            )}

            {!result.isAutoCorrected && result.spellSuggestion && (
              <div className="spell-suggestion-banner p-3.5 mb-5 flex items-center justify-between flex-wrap gap-2 animate-fadeIn" style={{ 
                background: 'var(--bg-input)', 
                border: '1px dashed var(--color-primary)', 
                borderRadius: '12px', 
                fontSize: '14px',
                color: 'var(--color-text-main)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>💡</span>
                  <span>
                    Có phải bạn muốn tìm: <strong style={{ color: 'var(--color-primary)', fontWeight: '700' }}>{result.spellSuggestion}</strong>?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleTranslate(e, result.spellSuggestion, false)}
                  style={{
                    background: 'var(--color-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 14px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Dịch từ {result.spellSuggestion}
                </button>
              </div>
            )}

            {/* Header Result Card */}
            <div className="result-header flex justify-between items-start flex-wrap gap-4" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 className="result-word" style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800', color: 'var(--color-text-main)' }}>
                    {direction === 'en-vi' ? result.word : result.word}
                  </h3>
                  {result.source && (
                    <span className="badge-source text-xs" style={{ 
                      fontSize: '11px', 
                      padding: '4px 10px', 
                      borderRadius: '6px',
                      background: 'var(--color-primary)',
                      color: '#ffffff',
                      fontWeight: '700'
                    }}>
                      {result.source === 'cache' ? 'Cache' : (result.source === 'compromise' ? 'Local Engine' : 'Gemini AI')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(`${result.word} (${result.ipa || ''}) - ${result.vietnamese}`, 'từ & bản dịch')}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--color-text-main)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '600'
                    }}
                    title="Sao chép từ & bản dịch"
                  >
                    📋 Sao chép
                  </button>
                </div>

                {/* Phonetics Bar */}
                {result.ipaUK && result.ipaUS ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <span style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', border: '1px solid var(--border-light)' }}>
                      🇬🇧 UK: {result.ipaUK}
                    </span>
                    <span style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', border: '1px solid var(--border-light)' }}>
                      🇺🇸 US: {result.ipaUS}
                    </span>
                  </div>
                ) : result.ipa ? (
                  <span className="result-ipa" style={{ fontSize: '15px', color: 'var(--color-primary)', fontWeight: '600', marginTop: '6px', display: 'inline-block' }}>{result.ipa}</span>
                ) : null}
              </div>

              {/* Voice Player Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn-secondary text-xs" onClick={() => handleSpeak(direction === 'en-vi' ? result.word : result.word, 'US')} style={{ padding: '8px 14px', borderRadius: '8px', fontWeight: '700' }}>
                  🔊 🇺🇸 US
                </button>
                <button className="btn-secondary text-xs" onClick={() => handleSpeak(direction === 'en-vi' ? result.word : result.word, 'UK')} style={{ padding: '8px 14px', borderRadius: '8px', fontWeight: '700' }}>
                  🔊 🇬🇧 UK
                </button>
                <button className="btn-secondary text-xs" onClick={() => speakCompare(direction === 'en-vi' ? result.word : result.word)} style={{ padding: '8px 14px', borderRadius: '8px', fontWeight: '700' }}>
                  🆚 So sánh
                </button>
              </div>
            </div>

            {/* Part of Speech Badge */}
            {result.partOfSpeech && (
              <div className="mt-3">
                <span style={{
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {result.partOfSpeech}
                </span>
              </div>
            )}

            {/* Grammar Warning Box */}
            {result.hasGrammarError && result.correctedText && (
              <div className="grammar-correction-box mt-4 p-4" style={{ borderLeft: '4px solid var(--color-error)', background: 'var(--color-error-glow)', borderRadius: '8px' }}>
                <strong className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-error)' }}>
                  ⚠️ Lỗi ngữ pháp:
                </strong>
                <div className="mt-2 text-sm">
                  <del className="color-text-muted italic block mb-1" style={{ color: 'var(--color-error)' }}>
                    "{result.originalCheckedText || query}"
                  </del>
                  <ins className="font-bold block mb-2" style={{ textDecoration: 'none', color: 'var(--color-text-main)' }}>
                    ✓ Sửa đúng: "{result.correctedText}"
                  </ins>
                  <p className="color-text-main italic p-2 rounded mt-1" style={{ background: 'var(--bg-input)', fontSize: '13px', whiteSpace: 'pre-line' }}>
                    {result.grammarErrorExplanation}
                  </p>
                </div>
              </div>
            )}

            {/* Primary Translation Box */}
            <div className="result-meaning-box mt-4 p-4" style={{ background: 'var(--bg-input)', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
              <strong className="color-text-muted text-xs uppercase block mb-1">
                {direction === 'en-vi' ? 'DỊCH NGHĨA CHÍNH (TIẾNG VIỆT):' : 'DỊCH NGHĨA CHÍNH (TIẾNG ANH):'}
              </strong>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)', margin: 0 }}>
                {direction === 'en-vi' ? result.vietnamese : result.word}
              </p>
            </div>

            {/* Categorized POS Meanings (Rendered as Clean Pill Tags) */}
            {result.meaningsByPos && result.meaningsByPos.length > 0 && (
              <div className="meanings-by-pos-box mt-4 p-5" style={{ borderLeft: '4px solid var(--color-primary)', borderRadius: '12px', background: 'var(--bg-input)' }}>
                <strong className="color-text-muted text-xs uppercase block mb-3 font-bold" style={{ color: 'var(--color-primary)' }}>
                  📚 CÁC NGHĨA CHI TIẾT THEO TỪ LOẠI:
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.meaningsByPos.map((posGroup, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                      <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                        {posGroup.label}:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {posGroup.list.map((m, mIdx) => (
                          <span 
                            key={mIdx} 
                            style={{ 
                              background: 'var(--bg-input)', 
                              color: 'var(--color-text-main)', 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              fontSize: '13px', 
                              fontWeight: '600',
                              border: '1px solid var(--border-light)'
                            }}
                          >
                            {m.normalize ? m.normalize("NFC") : m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Synonyms Grid (Deduplicated & Cleaned) */}
            {result.synonyms && result.synonyms.length > 0 && (() => {
              const uniqueSynonyms = [];
              const seen = new Set();
              result.synonyms.forEach(item => {
                const lower = (item.word || '').toLowerCase();
                if (lower && !seen.has(lower)) {
                  seen.add(lower);
                  uniqueSynonyms.push(item);
                }
              });

              if (uniqueSynonyms.length === 0) return null;

              return (
                <div className="synonyms-box mt-4 p-5" style={{ borderLeft: '4px solid var(--color-primary)', borderRadius: '12px', background: 'var(--bg-input)' }}>
                  <strong className="color-text-muted text-xs uppercase block mb-3 font-bold" style={{ color: 'var(--color-primary)' }}>
                    💡 TỪ ĐỒNG NGHĨA (SYNONYMS):
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {uniqueSynonyms.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'var(--bg-card)', 
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          flex: '1 1 140px',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '14px' }}>{item.word}</span>
                        {item.vietnamese && item.vietnamese !== item.word && (
                          <span className="color-text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>{item.vietnamese}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ⚡ Dedicated 12 Tenses Verb & Word Forms Conjugation Table */}
            {result.word && !result.word.trim().replace(/^(a|an|the|to)\s+/i, '').includes(" ") && (
              <div className="result-forms mt-5 p-5" style={{ borderRadius: '14px', border: '2px solid var(--color-primary)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <strong style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚡ BẢNG CHIA ĐỘNG TỪ 12 THÌ & DẠNG TỪ (VERB CONJUGATION):
                  </strong>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{
                        background: grammarMode !== 'non-verb' ? 'var(--color-primary)' : 'var(--bg-input)',
                        color: grammarMode !== 'non-verb' ? '#ffffff' : 'var(--color-text-main)',
                        fontWeight: '700',
                        border: '1px solid var(--color-primary)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setGrammarMode('verb')}
                    >
                      ⚡ 12 Thì Động từ
                    </button>
                    <button 
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{
                        background: grammarMode === 'non-verb' ? 'var(--color-primary)' : 'var(--bg-input)',
                        color: grammarMode === 'non-verb' ? '#ffffff' : 'var(--color-text-main)',
                        fontWeight: '700',
                        border: '1px solid var(--color-primary)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setGrammarMode('non-verb')}
                    >
                      📘 Dạng Danh / Tính từ
                    </button>
                  </div>
                </div>
                
                {(() => {
                  const targetWord = (result.word || '').trim().toLowerCase().replace(/^(a|an|the|to)\s+/i, '');
                  const conjugated = conjugateWithCompromise(targetWord);
                  
                  let verbForms = conjugated.forms;
                  if (grammarMode !== 'non-verb' && (!verbForms || !verbForms.present_continuous || verbForms.past_simple === 'N/A')) {
                    const base = targetWord;
                    const s_form = getSForm(base);
                    const v2 = getPastForm(base);
                    const v3 = v2;
                    const ing_form = getIngForm(base);
                    verbForms = {
                      present_simple: `${base} / ${s_form}`,
                      present_continuous: `am / is / are ${ing_form}`,
                      present_perfect: `have / has ${v3}`,
                      present_perfect_continuous: `have / has been ${ing_form}`,
                      past_simple: v2,
                      past_continuous: `was / were ${ing_form}`,
                      past_perfect: `had ${v3}`,
                      past_perfect_continuous: `had been ${ing_form}`,
                      future_simple: `will ${base}`,
                      future_continuous: `will be ${ing_form}`,
                      future_perfect: `will have ${v3}`,
                      future_perfect_continuous: `will have been ${ing_form}`
                    };
                  }

                  const currentForms = (grammarMode === 'non-verb')
                    ? {
                        present_simple: targetWord,
                        past_simple: 'N/A',
                        plural: getSForm(targetWord),
                        comparative_superlative: `more ${targetWord} / most ${targetWord}`
                      }
                    : verbForms;

                  if (!currentForms) return null;

                  if (grammarMode !== 'non-verb') {
                    if (currentForms.isModal) {
                      return (
                        <div className="flex flex-col gap-2 text-xs">
                          <div className="tense-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                            <div className="tense-card-item p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600', display: 'block' }}>Hiện tại (Present)</span>
                              <code style={{ color: 'var(--color-primary)', fontWeight: '800', fontSize: '14px' }}>{currentForms.present_simple}</code>
                            </div>
                            {currentForms.past_simple && currentForms.past_simple !== 'N/A' && (
                              <div className="tense-card-item p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: '600', display: 'block' }}>Quá khứ (Past)</span>
                                <code style={{ color: 'var(--color-primary)', fontWeight: '800', fontSize: '14px' }}>{currentForms.past_simple}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="tenses-grid mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Present */}
                        <div className="p-3.5 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
                          <strong className="text-xs block mb-2 font-bold" style={{ color: 'var(--color-primary)' }}>🕒 NÓM THÌ HIỆN TẠI (PRESENT TENSES)</strong>
                          <div className="tense-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Hiện tại đơn:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.present_simple}</code>
                            </div>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Hiện tại tiếp diễn:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.present_continuous}</code>
                            </div>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Hiện tại hoàn thành:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.present_perfect}</code>
                            </div>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Hiện tại HT tiếp diễn:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.present_perfect_continuous}</code>
                            </div>
                          </div>
                        </div>
                        {/* Past */}
                        <div className="p-3.5 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
                          <strong className="text-xs block mb-2 font-bold" style={{ color: 'var(--color-primary)' }}>⏳ NHÓM THÌ QUÁ KHỨ (PAST TENSES)</strong>
                          <div className="tense-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Quá khứ đơn (V2/ed):</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.past_simple}</code>
                            </div>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Quá khứ tiếp diễn:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.past_continuous}</code>
                            </div>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Quá khứ hoàn thành (V3):</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.past_perfect}</code>
                            </div>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Quá khứ HT tiếp diễn:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.past_perfect_continuous}</code>
                            </div>
                          </div>
                        </div>
                        {/* Future */}
                        <div className="p-3.5 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
                          <strong className="text-xs block mb-2 font-bold" style={{ color: 'var(--color-primary)' }}>🚀 NHÓM THÌ TƯƠNG LAI (FUTURE TENSES)</strong>
                          <div className="tense-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Tương lai đơn:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.future_simple}</code>
                            </div>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Tương lai tiếp diễn:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.future_continuous}</code>
                            </div>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Tương lai hoàn thành:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.future_perfect}</code>
                            </div>
                            <div className="tense-card-item p-2.5 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                              <span className="text-xs color-text-muted block">Tương lai HT tiếp diễn:</span> 
                              <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '13px' }}>{currentForms.future_perfect_continuous}</code>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="tense-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                        {currentForms.present_simple && (
                          <div className="tense-card-item p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                            <span className="text-xs color-text-muted block font-semibold">Dạng nguyên mẫu:</span> 
                            <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '14px' }}>{currentForms.present_simple}</code>
                          </div>
                        )}
                        {currentForms.plural && (
                          <div className="tense-card-item p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                            <span className="text-xs color-text-muted block font-semibold">Dạng số nhiều (Plural):</span> 
                            <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '14px' }}>{currentForms.plural}</code>
                          </div>
                        )}
                        {currentForms.comparative_superlative && (
                          <div className="tense-card-item p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                            <span className="text-xs color-text-muted block font-semibold">Cấp so sánh (More/Most):</span> 
                            <code style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '14px' }}>{currentForms.comparative_superlative}</code>
                          </div>
                        )}
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* Definition & Example */}
            {result.example && (
              <div className="result-example-box mt-4 p-4" style={{ borderLeft: '4px solid var(--color-primary)', borderRadius: '8px', background: 'var(--bg-input)' }}>
                <strong className="color-text-muted text-xs uppercase block mb-1">VÍ DỤ TIẾNG ANH:</strong>
                <p className="result-example color-text-muted italic" style={{ fontSize: '15px' }}>"{result.example}"</p>
                {result.translatedExample && (
                  <p className="result-example font-semibold mt-2" style={{ color: 'var(--color-primary)', fontSize: '14px' }}>
                    ➔ "{result.translatedExample}"
                  </p>
                )}
              </div>
            )}

            {/* ✨ Gemini AI Deep Insights Hub */}
            <div className="ai-deep-analysis-section mt-5">
              {!aiAnalysis ? (
                <button
                  type="button"
                  className="btn-primary w-full justify-center py-4 text-sm"
                  onClick={handleAiAnalysis}
                  disabled={isAiLoading}
                  style={{
                    background: 'var(--color-primary)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#ffffff',
                    border: 'none'
                  }}
                >
                  {isAiLoading ? <span className="spinner" /> : '✨ 🤖 Phân tích AI sâu (Sắc thái, Collocations & Ví dụ)'}
                </button>
              ) : (
                <div className="ai-analysis-card p-5 rounded-xl glass animate-slideup" style={{
                  background: 'var(--bg-card)',
                  border: '2px solid var(--color-primary)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border-light)' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--color-primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🤖 PHÂN TÍCH CHUYÊN SÂU TỪ GIA SƯ AI
                    </h4>
                    <button 
                      onClick={() => setAiAnalysis(null)} 
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer', fontSize: '16px' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Nuances */}
                  {aiAnalysis.nuances && (
                    <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', borderLeft: '4px solid var(--color-primary)' }}>
                      <strong style={{ color: 'var(--color-primary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                        💡 SẮC THÁI & HOÀN CẢNH SỬ DỤNG:
                      </strong>
                      <p style={{ fontSize: '14px', margin: 0, lineHeight: 1.6 }} className="color-text-main">
                        {aiAnalysis.nuances}
                      </p>
                    </div>
                  )}

                  {/* Collocations */}
                  {aiAnalysis.collocations && aiAnalysis.collocations.length > 0 && (
                    <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', borderLeft: '4px solid var(--color-primary)' }}>
                      <strong style={{ color: 'var(--color-primary)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                        🗣️ CỤM TỪ CỐ ĐỊNH / COLLOCATIONS HAY GẶP:
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {aiAnalysis.collocations.map((col, idx) => (
                          <div key={idx} style={{ fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{col.phrase}</span>
                            <span className="color-text-muted text-xs">{col.vi}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real-world Examples */}
                  {aiAnalysis.real_examples && aiAnalysis.real_examples.length > 0 && (
                    <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', borderLeft: '4px solid var(--color-primary)' }}>
                      <strong style={{ color: 'var(--color-primary)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                        💬 VÍ DỤ THỰC TẾ CHUẨN BẢN XỨ:
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {aiAnalysis.real_examples.map((ex, idx) => (
                          <div key={idx} style={{ fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button 
                                type="button" 
                                onClick={() => handleSpeak(ex.en, 'US')} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                title="Phát âm"
                              >
                                🔊
                              </button>
                              <span style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>"{ex.en}"</span>
                            </div>
                            <div className="color-text-muted italic text-xs ml-6 mt-1">➔ {ex.vi}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {aiAnalysis.alternatives && (
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', borderLeft: '4px solid var(--color-primary)' }}>
                      <strong style={{ color: 'var(--color-primary)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                        🎭 CÁCH DIỄN ĐẠT THAY THẾ (FORMAL / INFORMAL / SLANG):
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '13px' }}>
                        {aiAnalysis.alternatives.formal && (
                          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                            <span className="color-text-muted text-xs block">Trang trọng:</span>
                            <span style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>{aiAnalysis.alternatives.formal}</span>
                          </div>
                        )}
                        {aiAnalysis.alternatives.informal && (
                          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                            <span className="color-text-muted text-xs block">Thường ngày:</span>
                            <span style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>{aiAnalysis.alternatives.informal}</span>
                          </div>
                        )}
                        {aiAnalysis.alternatives.slang && aiAnalysis.alternatives.slang !== 'null' && (
                          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                            <span className="color-text-muted text-xs block">Tiếng lóng (Slang):</span>
                            <span style={{ fontWeight: '700', color: 'var(--color-error)' }}>{aiAnalysis.alternatives.slang}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save Button Action */}
            <div className="result-actions mt-5 flex gap-3">
              {isSaved ? (
                <button className="btn-secondary w-full justify-center py-3" disabled style={{ borderRadius: '12px' }}>
                  ✓ Đã có trong sổ tay
                </button>
              ) : (
                <button className="btn-primary w-full justify-center py-3" onClick={handleSaveWord} style={{ borderRadius: '12px', fontSize: '15px', background: 'var(--color-primary)', color: '#ffffff' }}>
                  ⭐ Lưu vào sổ tay
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && !result && (
          <div className="translator-empty p-8 text-center glass rounded-2xl" style={{ border: '1px solid var(--border-light)' }}>
            <span className="icon-huge" style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>💡</span>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Next-Gen AI Lexicon Console</h3>
            <p className="color-text-muted text-sm">
              {direction === 'en-vi' 
                ? 'Nhập từ/câu tiếng Anh bất kỳ (vd: "amazing", "hit the books") để trải nghiệm tra cứu từ điển US-UK kết hợp Gia sư AI 1:1!'
                : 'Nhập từ/câu tiếng Việt bất kỳ (vd: "tuyệt vời", "tôi đang chuẩn bị đi làm") để dịch sang tiếng Anh chuẩn bản xứ.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isPageMode) {
    return (
      <div className="translator-page animate-slideup" style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        {/* Dynamic Royal Blue Page Header */}
        <div className="page-header glass p-6 mb-6 rounded-xl flex justify-between items-center flex-wrap gap-4" style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--color-primary)'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary)', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>
              ⚡ POWERED BY GEMINI AI & DICTIONARY API
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: 'var(--color-text-main)' }}>
              🔍 AI Lexicon Studio (US-UK)
            </h1>
            <p className="color-text-muted text-xs mt-1" style={{ margin: 0 }}>
              Hệ thống tra cứu từ điển chuyên sâu, phân tích ngữ pháp, 12 thì & sắc thái hội thoại
            </p>
          </div>
          {onNavigateBack && (
            <button 
              className="btn-secondary text-xs" 
              onClick={onNavigateBack}
              style={{ padding: '10px 18px', borderRadius: '8px', fontWeight: '700' }}
            >
              ← Quay lại Dashboard
            </button>
          )}
        </div>

        <div className="translator-page-card glass p-6 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          {renderTranslatorContent()}
        </div>
      </div>
    );
  }

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
          <div className="modal-content translator-modal glass-glow" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', borderRadius: '24px' }}>
            {/* Modal Header */}
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>🔍 AI Lexicon Studio</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            {renderTranslatorContent()}
          </div>
        </div>
      )}
    </>
  );
}
