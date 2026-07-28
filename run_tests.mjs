function getIngForm(verb) {
  if (!verb) return '';
  const v = verb.toLowerCase();
  if (v === 'be') return 'being';
  if (v === 'see') return 'seeing';
  if (v === 'die') return 'dying';
  if (v === 'lie') return 'lying';
  if (v === 'tie') return 'tying';
  if (v.endsWith('e') && !v.endsWith('ee') && !v.endsWith('oe')) return v.slice(0, -1) + 'ing';
  if (v.endsWith('ie')) return v.slice(0, -2) + 'ying';
  if (/[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/i.test(v) && !/[wxy]$/i.test(v)) {
    return v + v.slice(-1) + 'ing';
  }
  return v + 'ing';
}

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

// Regression Test Suite
const tests = [
  // Bug 1: "do it"
  { input: "I can't do it", expected: "I can't do it" },
  { input: "you can do it", expected: "you can do it" },
  { input: "I want to do it", expected: "I want to do it" },
  { input: "please do it now", expected: "please do it now" },
  { input: "do he like it", expected: "does he like it" },

  // Bug 2: "was / is" in Wh-questions
  { input: "where he was", expected: "where he was" },
  { input: "where he is", expected: "where he is" },
  { input: "when she was born", expected: "when she was born" },

  // Bug 3: Subjunctive mood after suggest / recommend
  { input: "I suggest him to go", expected: "I suggest that he go" },
  { input: "I suggest that he goes", expected: "I suggest that he go" },
  { input: "I recommend her to study", expected: "I recommend that she study" },

  // Bug 4: Phonetic a / an
  { input: "a user account", expected: "a user account" },
  { input: "an user account", expected: "a user account" },
  { input: "a euro", expected: "a euro" },
  { input: "an euro", expected: "a euro" },
  { input: "a MBA degree", expected: "an MBA degree" },
  { input: "a hour", expected: "an hour" },
  { input: "a honest man", expected: "an honest man" },

  // Bug 5: "anh" -> "and" removal
  { input: "anh and I go to school", expected: "anh and I go to school" },
  { input: "I like him, anh", expected: "I like him, anh" }
];

let failed = 0;
console.log("================ RUNNING REGRESSION TESTS ================\n");
tests.forEach(({ input, expected }, idx) => {
  const res = checkLocalGrammarErrors(input);
  const actual = res.correctedText;
  if (actual === expected) {
    console.log(`✅ [PASS ${idx + 1}] "${input}" -> "${actual}"`);
  } else {
    console.error(`❌ [FAIL ${idx + 1}] "${input}" -> Actual: "${actual}" | Expected: "${expected}"`);
    failed++;
  }
});

console.log("\n================ TEST SUMMARY ================");
if (failed === 0) {
  console.log(`🎉 ALL ${tests.length} REGRESSION TESTS PASSED CLEANLY!\n`);
  process.exit(0);
} else {
  console.error(`💥 ${failed} / ${tests.length} TESTS FAILED.\n`);
  process.exit(1);
}
