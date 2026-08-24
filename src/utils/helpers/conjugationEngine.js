import nlp from 'compromise';
import { IRREGULAR_VERBS_LIST } from './irregularVerbs.js';
import { storage } from '../storage.js';

// 1. Modal verbs mapping
export const MODAL_VERBS = {
  "can": { present: "can", past: "could", desc: "Động từ khuyết thiếu (Modal Verb - Chỉ khả năng)" },
  "could": { present: "can", past: "could", desc: "Động từ khuyết thiếu (Modal Verb - Khả năng trong quá khứ)" },
  "may": { present: "may", past: "might", desc: "Động từ khuyết thiếu (Modal Verb - Sự cho phép/khả năng)" },
  "might": { present: "may", past: "might", desc: "Động từ khuyết thiếu (Modal Verb - Khả năng nhỏ)" },
  "must": { present: "must", past: "had to / must", desc: "Động từ khuyết thiếu (Modal Verb - Sự bắt buộc)" },
  "shall": { present: "shall", past: "should", desc: "Động từ khuyết thiếu (Modal Verb - Ý định tương lai)" },
  "should": { present: "shall", past: "should", desc: "Động từ khuyết thiếu (Modal Verb - Lời khuyên)" },
  "will": { present: "will", past: "would", desc: "Động từ khuyết thiếu (Modal Verb - Ý định tương lai)" },
  "would": { present: "will", past: "would", desc: "Động từ khuyết thiếu (Modal Verb - Giả định)" },
  "ought": { present: "ought to", past: "ought to", desc: "Động từ khuyết thiếu (Modal Verb - Nghĩa vụ)" }
};

// 2. Spelling helpers for regular verbs
export function getSForm(word) {
  if (!word) return '';
  const lower = word.toLowerCase();
  if (lower === "have") {
    return word === "Have" ? "Has" : "has";
  }
  if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z") || word.endsWith("ch") || word.endsWith("sh")) {
    return word + "es";
  }
  if (word.endsWith("o")) {
    const wordLower = word.toLowerCase();
    if (wordLower.endsWith("go") || wordLower.endsWith("do") || wordLower.endsWith("veto") || wordLower.endsWith("echo")) {
      return word + "es";
    }
    return word + "s";
  }
  if (word.match(/[^aeiou]y$/)) {
    return word.slice(0, -1) + "ies";
  }
  return word + "s";
}

export function getPastForm(word) {
  if (!word) return '';
  if (word.endsWith("e")) {
    return word + "d";
  }
  if (word.match(/[^aeiou]y$/)) {
    return word.slice(0, -1) + "ied";
  }
  if (word.match(/[aeiou][bcdfghjklmnpqrstvwxyz]$/) && !word.match(/[aeiou]{2}[bcdfghjklmnpqrstvwxyz]$/)) {
    const lastChar = word.slice(-1);
    if (word.length <= 4 && !['w', 'x', 'y', 'h'].includes(lastChar)) {
      return word + lastChar + "ed";
    }
  }
  return word + "ed";
}

export function getIngForm(word) {
  if (!word) return '';
  if (word.endsWith("ie")) {
    return word.slice(0, -2) + "ying";
  }
  if (word.endsWith("e") && !word.endsWith("ee") && !word.endsWith("oe") && !word.endsWith("ye")) {
    return word.slice(0, -1) + "ing";
  }
  if (word.match(/[aeiou][bcdfghjklmnpqrstvwxyz]$/) && !word.match(/[aeiou]{2}[bcdfghjklmnpqrstvwxyz]$/)) {
    const lastChar = word.slice(-1);
    if (word.length <= 4 && !['w', 'x', 'y', 'h'].includes(lastChar)) {
      return word + lastChar + "ing";
    }
  }
  return word + "ing";
}

// 3. Phrasal verb helper (both irregular and regular)
export function getPhrasalForms(base) {
  const parts = base.trim().split(/\s+/);
  const firstWord = parts[0].toLowerCase();
  const rest = parts.slice(1).join(" ");

  let s_form = "";
  let v2 = "";
  let v3 = "";
  let ing_form = "";

  if (IRREGULAR_VERBS_LIST[firstWord]) {
    const irreg = IRREGULAR_VERBS_LIST[firstWord];
    const formatPart = (v) => v.split("/").map(x => `${x} ${rest}`).join(" / ");
    v2 = formatPart(irreg.v2);
    v3 = formatPart(irreg.v3);
    s_form = `${getSForm(firstWord)} ${rest}`;
    ing_form = `${getIngForm(firstWord)} ${rest}`;
  } else {
    s_form = `${getSForm(firstWord)} ${rest}`;
    v2 = `${getPastForm(firstWord)} ${rest}`;
    v3 = v2;
    ing_form = `${getIngForm(firstWord)} ${rest}`;
  }

  return {
    firstWord,
    rest,
    s_form,
    v2,
    v3,
    ing_form
  };
}

const NEGATIVE_CONTRACTIONS = {
  "don't": { positive: "do", negation: "don't / do not" },
  "do not": { positive: "do", negation: "don't / do not" },
  "doesn't": { positive: "do", negation: "doesn't / does not" },
  "does not": { positive: "do", negation: "doesn't / does not" },
  "didn't": { positive: "do", negation: "didn't / did not" },
  "did not": { positive: "do", negation: "didn't / did not" },
  "can't": { positive: "can", negation: "cannot / can't" },
  "cannot": { positive: "can", negation: "cannot / can't" },
  "couldn't": { positive: "can", negation: "couldn't / could not" },
  "could not": { positive: "can", negation: "couldn't / could not" },
  "won't": { positive: "will", negation: "won't / will not" },
  "will not": { positive: "will", negation: "won't / will not" },
  "wouldn't": { positive: "will", negation: "wouldn't / would not" },
  "would not": { positive: "will", negation: "wouldn't / would not" },
  "shouldn't": { positive: "shall", negation: "shouldn't / should not" },
  "should not": { positive: "shall", negation: "shouldn't / should not" },
  "haven't": { positive: "have", negation: "haven't / have not" },
  "have not": { positive: "have", negation: "haven't / have not" },
  "hasn't": { positive: "have", negation: "hasn't / has not" },
  "has not": { positive: "have", negation: "hasn't / has not" },
  "hadn't": { positive: "have", negation: "hadn't / had not" },
  "had not": { positive: "have", negation: "hadn't / had not" }
};

const IRREGULAR_ADJECTIVES = {
  "many": { comp: "more", super: "most", pos: "Tính từ / Lượng từ (Adjective / Determiner)" },
  "much": { comp: "more", super: "most", pos: "Tính từ / Lượng từ (Adjective / Determiner)" },
  "little": { comp: "less", super: "least", pos: "Tính từ / Lượng từ (Adjective / Determiner)" },
  "fun": { comp: "more fun", super: "most fun", pos: "Tính từ (Adjective)" },
  "good": { comp: "better", super: "best", pos: "Tính từ (Adjective)" },
  "well": { comp: "better", super: "best", pos: "Trạng từ / Tính từ (Adverb / Adjective)" },
  "bad": { comp: "worse", super: "worst", pos: "Tính từ (Adjective)" },
  "badly": { comp: "worse", super: "worst", pos: "Trạng từ (Adverb)" },
  "far": { comp: "farther / further", super: "farthest / furthest", pos: "Tính từ / Trạng từ (Adjective / Adverb)" }
};

const PRIORITY_NOUNS = new Set([
  "fish", "index", "book", "light", "face", "water", "paper", "oil", "interest", "plant", 
  "page", "file", "record", "test", "check", "control", "sound", "hand", "eye", "head"
]);

const IRREGULAR_NOUN_PLURALS = {
  "fish": "fish",
  "index": "indexes / indices",
  "child": "children",
  "person": "people",
  "mouse": "mice",
  "foot": "feet",
  "tooth": "teeth",
  "ox": "oxen",
  "goose": "geese",
  "man": "men",
  "woman": "women",
  "sheep": "sheep",
  "deer": "deer",
  "series": "series",
  "species": "species",
  "datum": "data"
};

// 4. Extract Verb Forms (Base, S-form, Past, Participle, Ing)
export function getVerbForms(rawWord) {
  if (!rawWord) return null;
  const clean = rawWord.toLowerCase().trim().replace(/^(a|an|the|to)\s+/i, '').trim();
  if (!clean) return null;

  // Case A: "be"
  if (['be', 'am', 'is', 'are', 'was', 'were', 'been'].includes(clean)) {
    return {
      base: 'be',
      isBe: true,
      s_form: 'is',
      v2: 'was / were',
      v3: 'been',
      ing_form: 'being',
      isIrregular: true
    };
  }

  // Case B: Modal Verbs
  if (MODAL_VERBS[clean]) {
    const modal = MODAL_VERBS[clean];
    return {
      base: clean,
      isModal: true,
      modalPresent: modal.present,
      modalPast: modal.past,
      desc: modal.desc
    };
  }

  // Case C: Phrasal Verbs
  if (clean.includes(' ')) {
    const phrasal = getPhrasalForms(clean);
    return {
      base: clean,
      s_form: phrasal.s_form,
      v2: phrasal.v2,
      v3: phrasal.v3,
      ing_form: phrasal.ing_form,
      isPhrasal: true,
      isIrregular: !!IRREGULAR_VERBS_LIST[phrasal.firstWord]
    };
  }

  // Case D: Single Word Verbs
  const directIrreg = IRREGULAR_VERBS_LIST[clean];
  if (directIrreg) {
    return {
      base: clean,
      s_form: getSForm(clean),
      v2: directIrreg.v2,
      v3: directIrreg.v3,
      ing_form: getIngForm(clean),
      isIrregular: true
    };
  }

  // Check if it's already an inflected irregular verb (e.g. "went" -> "go", "eaten" -> "eat")
  for (const [inf, forms] of Object.entries(IRREGULAR_VERBS_LIST)) {
    const v2List = forms.v2.split('/');
    const v3List = forms.v3.split('/');
    if (v2List.includes(clean) || v3List.includes(clean)) {
      return {
        base: inf,
        s_form: getSForm(inf),
        v2: forms.v2,
        v3: forms.v3,
        ing_form: getIngForm(inf),
        isIrregular: true
      };
    }
  }

  // Regular / NLP Base
  const doc = nlp(clean);
  let base = doc.verbs().toInfinitive().text().trim().toLowerCase() || clean;
  const conj = doc.verbs().conjugate()[0];

  let s_form = getSForm(base);
  let v2 = getPastForm(base);
  let v3 = v2;
  let ing_form = getIngForm(base);

  if (conj) {
    if (conj.PresentTense) s_form = conj.PresentTense;
    if (conj.PastTense) v2 = conj.PastTense;
    v3 = conj.Participle || conj.PastTense || v2;
    if (conj.Gerund) ing_form = conj.Gerund;
  }

  return {
    base,
    s_form,
    v2,
    v3,
    ing_form,
    isIrregular: false
  };
}

// 5. Calculate Full 12 Tenses Object
export function get12Tenses(verbInput) {
  const forms = getVerbForms(verbInput);
  if (!forms) return null;

  if (forms.isModal) {
    return {
      isModal: true,
      modalNote: forms.desc,
      present: {
        simple: { nameEn: "Present Simple", nameVi: "Hiện tại đơn", formula: "S + modal", form: forms.modalPresent },
        continuous: { nameEn: "Present Continuous", nameVi: "Hiện tại tiếp diễn", formula: "N/A", form: "N/A (Động từ khuyết thiếu không chia tiếp diễn)" },
        perfect: { nameEn: "Present Perfect", nameVi: "Hiện tại hoàn thành", formula: "N/A", form: "N/A" },
        perfect_continuous: { nameEn: "Present Perfect Continuous", nameVi: "Hiện tại HT tiếp diễn", formula: "N/A", form: "N/A" }
      },
      past: {
        simple: { nameEn: "Past Simple", nameVi: "Quá khứ đơn", formula: "S + modal (past)", form: forms.modalPast },
        continuous: { nameEn: "Past Continuous", nameVi: "Quá khứ tiếp diễn", formula: "N/A", form: "N/A" },
        perfect: { nameEn: "Past Perfect", nameVi: "Quá khứ hoàn thành", formula: "N/A", form: "N/A" },
        perfect_continuous: { nameEn: "Past Perfect Continuous", nameVi: "Quá khứ HT tiếp diễn", formula: "N/A", form: "N/A" }
      },
      future: {
        simple: { nameEn: "Future Simple", nameVi: "Tương lai đơn", formula: "S + will + modal", form: `will be able to / will ${forms.modalPresent}` },
        continuous: { nameEn: "Future Continuous", nameVi: "Tương lai tiếp diễn", formula: "N/A", form: "N/A" },
        perfect: { nameEn: "Future Perfect", nameVi: "Tương lai hoàn thành", formula: "N/A", form: "N/A" },
        perfect_continuous: { nameEn: "Future Perfect Continuous", nameVi: "Tương lai HT tiếp diễn", formula: "N/A", form: "N/A" }
      }
    };
  }

  if (forms.isBe) {
    return {
      isBe: true,
      present: {
        simple: { nameEn: "Present Simple", nameVi: "Hiện tại đơn", formula: "S + am/is/are", form: "am / is / are" },
        continuous: { nameEn: "Present Continuous", nameVi: "Hiện tại tiếp diễn", formula: "S + am/is/are + being", form: "am / is / are being" },
        perfect: { nameEn: "Present Perfect", nameVi: "Hiện tại hoàn thành", formula: "S + have/has + been", form: "have / has been" },
        perfect_continuous: { nameEn: "Present Perfect Continuous", nameVi: "Hiện tại HT tiếp diễn", formula: "S + have/has been + being", form: "have / has been being" }
      },
      past: {
        simple: { nameEn: "Past Simple", nameVi: "Quá khứ đơn", formula: "S + was/were", form: "was / were" },
        continuous: { nameEn: "Past Continuous", nameVi: "Quá khứ tiếp diễn", formula: "S + was/were + being", form: "was / were being" },
        perfect: { nameEn: "Past Perfect", nameVi: "Quá khứ hoàn thành", formula: "S + had + been", form: "had been" },
        perfect_continuous: { nameEn: "Past Perfect Continuous", nameVi: "Quá khứ HT tiếp diễn", formula: "S + had been + being", form: "had been being" }
      },
      future: {
        simple: { nameEn: "Future Simple", nameVi: "Tương lai đơn", formula: "S + will be", form: "will be" },
        continuous: { nameEn: "Future Continuous", nameVi: "Tương lai tiếp diễn", formula: "S + will be + being", form: "will be being" },
        perfect: { nameEn: "Future Perfect", nameVi: "Tương lai hoàn thành", formula: "S + will have + been", form: "will have been" },
        perfect_continuous: { nameEn: "Future Perfect Continuous", nameVi: "Tương lai HT tiếp diễn", formula: "S + will have been + being", form: "will have been being" }
      }
    };
  }

  const { base, s_form, v2, v3, ing_form } = forms;

  return {
    base,
    isIrregular: forms.isIrregular,
    isPhrasal: forms.isPhrasal,
    present: {
      simple: { nameEn: "Present Simple", nameVi: "Hiện tại đơn", formula: "S + V(s/es)", form: `${base} / ${s_form}` },
      continuous: { nameEn: "Present Continuous", nameVi: "Hiện tại tiếp diễn", formula: "S + am/is/are + V-ing", form: `am / is / are ${ing_form}` },
      perfect: { nameEn: "Present Perfect", nameVi: "Hiện tại hoàn thành", formula: "S + have/has + V3/ed", form: `have / has ${v3}` },
      perfect_continuous: { nameEn: "Present Perfect Continuous", nameVi: "Hiện tại HT tiếp diễn", formula: "S + have/has been + V-ing", form: `have / has been ${ing_form}` }
    },
    past: {
      simple: { nameEn: "Past Simple", nameVi: "Quá khứ đơn", formula: "S + V2/ed", form: v2 },
      continuous: { nameEn: "Past Continuous", nameVi: "Quá khứ tiếp diễn", formula: "S + was/were + V-ing", form: `was / were ${ing_form}` },
      perfect: { nameEn: "Past Perfect", nameVi: "Quá khứ hoàn thành", formula: "S + had + V3/ed", form: `had ${v3}` },
      perfect_continuous: { nameEn: "Past Perfect Continuous", nameVi: "Quá khứ HT tiếp diễn", formula: "S + had been + V-ing", form: `had been ${ing_form}` }
    },
    future: {
      simple: { nameEn: "Future Simple", nameVi: "Tương lai đơn", formula: "S + will + V-inf", form: `will ${base}` },
      continuous: { nameEn: "Future Continuous", nameVi: "Tương lai tiếp diễn", formula: "S + will be + V-ing", form: `will be ${ing_form}` },
      perfect: { nameEn: "Future Perfect", nameVi: "Tương lai hoàn thành", formula: "S + will have + V3/ed", form: `will have ${v3}` },
      perfect_continuous: { nameEn: "Future Perfect Continuous", nameVi: "Tương lai HT tiếp diễn", formula: "S + will have been + V-ing", form: `will have been ${ing_form}` }
    }
  };
}

// 6. Curated Dictionary & Generator for 2 Bilingual Example Sentences
const CURATED_VERB_EXAMPLES = {
  "play": [
    { en: "They play football together every Sunday morning.", vi: "Họ cùng nhau chơi bóng đá vào mỗi sáng Chủ nhật." },
    { en: "She is playing a beautiful piece of music on the piano.", vi: "Cô ấy đang chơi một bản nhạc tuyệt đẹp trên cây đàn piano." }
  ],
  "go": [
    { en: "I usually go to the library to study in the afternoon.", vi: "Tôi thường đến thư viện để học bài vào buổi chiều." },
    { en: "They went to Da Nang for their summer vacation last year.", vi: "Họ đã đi Đà Nẵng trong kỳ nghỉ hè năm ngoái." }
  ],
  "read": [
    { en: "He reads English newspapers every day to improve vocabulary.", vi: "Anh ấy đọc báo tiếng Anh mỗi ngày để trau dồi vốn từ vựng." },
    { en: "I have read three inspirational books this month.", vi: "Tôi đã đọc ba cuốn sách truyền cảm hứng trong tháng này." }
  ],
  "study": [
    { en: "She studies hard to achieve a high score in the IELTS exam.", vi: "Cô ấy học tập chăm chỉ để đạt điểm cao trong kỳ thi IELTS." },
    { en: "We are studying modern web development technologies.", vi: "Chúng tôi đang học các công nghệ phát triển web hiện đại." }
  ],
  "write": [
    { en: "He writes daily journals to practice his writing skills.", vi: "Anh ấy viết nhật ký hàng ngày để rèn luyện kỹ năng viết." },
    { en: "She has written an impressive essay on climate change.", vi: "Cô ấy đã viết một bài luận đầy ấn tượng về biến đổi khí hậu." }
  ],
  "work": [
    { en: "My brother works as a software engineer at a tech company.", vi: "Anh trai tôi làm việc với tư cách là kỹ sư phần mềm tại một công ty công nghệ." },
    { en: "They have worked on this project for six months.", vi: "Họ đã làm việc trong dự án này suốt sáu tháng qua." }
  ],
  "learn": [
    { en: "Children learn languages much faster through interactive games.", vi: "Trẻ em học ngôn ngữ nhanh hơn nhiều thông qua các trò chơi tương tác." },
    { en: "I am learning how to communicate fluently in English.", vi: "Tôi đang học cách giao tiếp trôi chảy bằng tiếng Anh." }
  ],
  "eat": [
    { en: "We eat fresh fruits and vegetables to stay healthy.", vi: "Chúng tôi ăn trái cây và rau tươi để duy trì sức khỏe." },
    { en: "They ate dinner at a traditional restaurant yesterday.", vi: "Hôm qua họ đã dùng bữa tối tại một nhà hàng truyền thống." }
  ],
  "take off": [
    { en: "The airplane will take off on schedule at 8:00 AM.", vi: "Máy bay sẽ cất cánh đúng giờ vào lúc 8 giờ sáng." },
    { en: "Please take off your shoes before entering the room.", vi: "Xin vui lòng cởi giày trước khi bước vào phòng." }
  ],
  "look after": [
    { en: "She looks after her younger brother while her parents are at work.", vi: "Cô ấy chăm sóc em trai nhỏ trong khi bố mẹ đang đi làm." },
    { en: "He has looked after this garden with great care.", vi: "Ông ấy đã chăm sóc khu vườn này với sự tận tâm chu đáo." }
  ],
  "can": [
    { en: "She can speak three languages fluently.", vi: "Cô ấy có thể nói trôi chảy ba thứ tiếng." },
    { en: "You can achieve your goals with persistence and dedication.", vi: "Bạn có thể đạt được mục tiêu của mình với sự kiên trì và tận tâm." }
  ],
  "be": [
    { en: "Consistency and dedication are the keys to mastering any skill.", vi: "Sự kiên trì và tận tâm là chìa khóa để làm chủ bất kỳ kỹ năng nào." },
    { en: "She has been very supportive of our team throughout the project.", vi: "Cô ấy đã luôn ủng hộ đội ngũ của chúng tôi trong suốt dự án." }
  ]
};

export function getVerbBilingualExamples(verbInput, vietnameseMeaning = "") {
  if (!verbInput) return [];
  const clean = verbInput.toLowerCase().trim().replace(/^(a|an|the|to)\s+/i, '').trim();

  // 1. Direct match in curated examples
  if (CURATED_VERB_EXAMPLES[clean]) {
    return CURATED_VERB_EXAMPLES[clean];
  }

  // 2. Base forms match
  const forms = getVerbForms(clean);
  if (forms && forms.base && CURATED_VERB_EXAMPLES[forms.base]) {
    return CURATED_VERB_EXAMPLES[forms.base];
  }

  // 3. Dynamic template generator
  const verbBase = forms ? forms.base : clean;
  const sForm = forms ? forms.s_form : getSForm(clean);
  const ingForm = forms ? forms.ing_form : getIngForm(clean);
  const v2 = forms ? forms.v2 : getPastForm(clean);

  const meaningClean = (vietnameseMeaning || "").replace(/^(động từ|verb|v)\s*[:\-]?\s*/i, '').trim() || verbBase;

  return [
    {
      en: `She ${sForm} regularly as part of her daily routine.`,
      vi: `Cô ấy ${meaningClean} đều đặn như một thói quen hàng ngày.`
    },
    {
      en: `They are currently ${ingForm} to achieve better results.`,
      vi: `Họ hiện đang ${meaningClean} để đạt được kết quả tốt hơn.`
    }
  ];
}

// 7. Compromise local conjugation
export function conjugateWithCompromise(word) {
  const clean = word.toLowerCase().trim();

  // 0. Special Case: Negative Contractions
  if (NEGATIVE_CONTRACTIONS[clean]) {
    const negInfo = NEGATIVE_CONTRACTIONS[clean];
    const posWord = negInfo.positive;
    
    if (posWord === "can" || posWord === "will" || posWord === "shall") {
      return {
        partOfSpeech: "Động từ khuyết thiếu phủ định (Negative Modal Verb)",
        forms: {
          isModal: true,
          present_simple: negInfo.negation,
          past_simple: posWord === "can" ? "couldn't / could not" : (posWord === "will" ? "wouldn't / would not" : "shouldn't / should not"),
          note: `Dạng phủ định của động từ khuyết thiếu '${posWord}'`
        }
      };
    } else {
      if (posWord === "do") {
        return {
          partOfSpeech: "Trợ động từ phủ định (Negative Auxiliary Verb)",
          forms: {
            present_simple: "don't / doesn't (do not / does not)",
            present_continuous: "N/A",
            present_perfect: "haven't / hasn't done (have/has not done)",
            present_perfect_continuous: "N/A",
            past_simple: "didn't (did not)",
            past_continuous: "N/A",
            past_perfect: "hadn't done (had not done)",
            past_perfect_continuous: "N/A",
            future_simple: "won't do (will not do)",
            future_continuous: "N/A",
            future_perfect: "won't have done",
            future_perfect_continuous: "N/A"
          }
        };
      } else if (posWord === "have") {
        return {
          partOfSpeech: "Động từ phủ định (Negative Verb)",
          forms: {
            present_simple: "haven't / hasn't (have/has not)",
            present_continuous: "N/A",
            present_perfect: "haven't / hasn't had",
            present_perfect_continuous: "N/A",
            past_simple: "hadn't (had not)",
            past_continuous: "N/A",
            past_perfect: "hadn't had",
            past_perfect_continuous: "N/A",
            future_simple: "won't have (will not have)",
            future_continuous: "N/A",
            future_perfect: "won't have had",
            future_perfect_continuous: "N/A"
          }
        };
      }
    }
  }

  // 1. Special Case: Irregular Adjectives / Adverbs
  if (IRREGULAR_ADJECTIVES[clean]) {
    const adj = IRREGULAR_ADJECTIVES[clean];
    return {
      partOfSpeech: adj.pos,
      forms: {
        present_simple: clean,
        past_simple: 'N/A',
        plural: 'N/A',
        comparative_superlative: `${adj.comp} / ${adj.super}`
      }
    };
  }

  // A. Special Case: "be"
  if (clean === 'be' || clean === 'am' || clean === 'is' || clean === 'are' || clean === 'was' || clean === 'were' || clean === 'been') {
    return {
      partOfSpeech: "Động từ (Động từ tobe làm vị ngữ)",
      forms: {
        present_simple: "am / is / are",
        present_continuous: "am / is / are being",
        present_perfect: "have / has been",
        present_perfect_continuous: "have / has been being",
        past_simple: "was / were",
        past_continuous: "was / were being",
        past_perfect: "had been",
        past_perfect_continuous: "had been being",
        future_simple: "will be",
        future_continuous: "will be being",
        future_perfect: "will have been",
        future_perfect_continuous: "will have been being"
      }
    };
  }

  // B. Special Case: Modal Verbs
  if (MODAL_VERBS[clean]) {
    const modal = MODAL_VERBS[clean];
    return {
      partOfSpeech: "Động từ khuyết thiếu (Modal Verb)",
      forms: {
        isModal: true,
        present_simple: modal.present,
        past_simple: modal.past,
        note: modal.desc
      }
    };
  }

  // C. General Verbs: Using Compromise + Irregular Dictionary
  const doc = nlp(clean);
  
  const COMMON_DUAL_VERBS = new Set([
    "live", "work", "study", "play", "love", "like", "walk", "talk", "run", "call", "help", 
    "watch", "start", "stop", "change", "move", "open", "close", "look", "cook", "clean", 
    "wash", "drink", "eat", "sleep", "sing", "dance", "drive", "swim", "fly", "hope", "wish",
    "use", "try", "need", "want", "ask", "feel", "leave", "put", "mean", "keep", "let", "begin"
  ]);

  const isVerb = (doc.match('#Verb').found || !!IRREGULAR_VERBS_LIST[clean] || COMMON_DUAL_VERBS.has(clean) || clean.includes(' ')) && !PRIORITY_NOUNS.has(clean);
  
  if (!isVerb) {
    let partOfSpeech = "Danh từ (Noun)";
    if (doc.match('#Adjective').found) {
      partOfSpeech = "Tính từ (Adjective)";
    } else if (doc.match('#Adverb').found) {
      partOfSpeech = "Trạng từ (Adverb)";
    } else if (doc.match('#Expression').found) {
      partOfSpeech = "Thán từ (Expression)";
    } else if (doc.match('#Preposition').found) {
      partOfSpeech = "Giới từ (Preposition)";
    } else if (doc.match('#Conjunction').found) {
      partOfSpeech = "Liên từ (Conjunction)";
    } else if (doc.match('#Pronoun').found) {
      partOfSpeech = "Đại từ (Pronoun)";
    } else if (doc.match('#Noun').found) {
      partOfSpeech = "Danh từ (Noun)";
    }

    let plural = "N/A";
    let comparative_superlative = "N/A";

    if (doc.match('#Noun').found) {
      const pluralCandidate = doc.nouns().toPlural().text().trim();
      plural = IRREGULAR_NOUN_PLURALS[clean] || pluralCandidate || getSForm(clean);
    } else if (partOfSpeech === "Danh từ (Noun)") {
      plural = IRREGULAR_NOUN_PLURALS[clean] || getSForm(clean);
    }

    if (doc.match('#Adjective').found || doc.match('#Adverb').found) {
      const adjConjs = doc.adjectives().conjugate()[0];
      if (adjConjs && adjConjs.Comparative && adjConjs.Superlative) {
        let comp = adjConjs.Comparative;
        let superForm = adjConjs.Superlative;
        if (clean.length > 7 || clean.endsWith('ful') || clean.endsWith('less') || clean.endsWith('ing') || clean.endsWith('ed')) {
          comp = `more ${clean}`;
          superForm = `most ${clean}`;
        }
        comparative_superlative = `${comp} / ${superForm}`;
      } else {
        comparative_superlative = `more ${clean} / most ${clean}`;
      }
    }

    return {
      partOfSpeech,
      forms: {
        present_simple: clean,
        past_simple: 'N/A',
        plural,
        comparative_superlative
      }
    };
  }

  const formsData = getVerbForms(clean);
  if (formsData) {
    return {
      partOfSpeech: formsData.isIrregular ? "Động từ bất quy tắc (Irregular Verb)" : (formsData.isPhrasal ? "Cụm động từ (Phrasal Verb)" : "Động từ (Verb)"),
      forms: {
        present_simple: `${formsData.base} / ${formsData.s_form}`,
        present_continuous: `am / is / are ${formsData.ing_form}`,
        present_perfect: `have / has ${formsData.v3}`,
        present_perfect_continuous: `have / has been ${formsData.ing_form}`,
        
        past_simple: formsData.v2,
        past_continuous: `was / were ${formsData.ing_form}`,
        past_perfect: `had ${formsData.v3}`,
        past_perfect_continuous: `had been ${formsData.ing_form}`,
        
        future_simple: `will ${formsData.base}`,
        future_continuous: `will be ${formsData.ing_form}`,
        future_perfect: `will have ${formsData.v3}`,
        future_perfect_continuous: `will have been ${formsData.ing_form}`
      }
    };
  }

  return null;
}

// 8. Check if query needs AI fallback
export function needsAIFallback(query, direction, useAI, apiKey) {
  if (direction === 'vi-en') return true;
  if (useAI && apiKey && apiKey.trim()) return true;

  const clean = query.trim();
  const words = clean.split(/\s+/);
  
  // If it's a longer sentence, compromise might struggle
  if (words.length > 3) return true;

  return false;
}

// 9. Primary 3-layer entrypoint
export function getConjugation(query, direction, useAI, apiKey) {
  const clean = query.toLowerCase().trim();

  // Layer 1: Cache
  if (direction === 'en-vi') {
    const saved = storage.getSavedVocab().find(w => w.word.toLowerCase() === clean);
    if (saved && saved.forms && saved.forms.present_continuous) {
      return {
        word: saved.word,
        ipa: saved.ipa,
        vietnamese: saved.vietnamese,
        example: saved.example,
        partOfSpeech: saved.partOfSpeech,
        forms: saved.forms,
        isCustom: true,
        isSaved: true,
        source: 'cache'
      };
    }
  }

  // Layer 2: Compromise Local
  const isFallback = needsAIFallback(query, direction, useAI, apiKey);
  if (!isFallback) {
    const result = conjugateWithCompromise(query);
    if (result && result.forms) {
      return {
        word: query.trim(),
        partOfSpeech: result.partOfSpeech,
        forms: result.forms,
        source: 'compromise'
      };
    }
  }

  // Layer 3: Gemini AI fallback
  return null;
}
