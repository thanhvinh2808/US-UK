import nlp from 'compromise';
import { IRREGULAR_VERBS_LIST } from './irregularVerbs';
import { storage } from '../storage';

// 1. Modal verbs mapping
const MODAL_VERBS = {
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

// 3. Phrasal verb irregular helper
function getIrregularPhrasal(base) {
  const parts = base.split(" ");
  const firstWord = parts[0];
  if (IRREGULAR_VERBS_LIST[firstWord]) {
    const irreg = IRREGULAR_VERBS_LIST[firstWord];
    const rest = parts.slice(1).join(" ");
    const formatPart = (v) => v.split("/").map(x => `${x} ${rest}`).join(" / ");
    return {
      v2: formatPart(irreg.v2),
      v3: formatPart(irreg.v3),
      s_form: `${getSForm(firstWord)} ${rest}`,
      ing_form: `${getIngForm(firstWord)} ${rest}`
    };
  }
  return null;
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

// 4. Compromise local conjugation
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
  
  // Determine if it is actually a verb (and not a priority noun)
  const isVerb = (doc.match('#Verb').found || !!IRREGULAR_VERBS_LIST[clean]) && !PRIORITY_NOUNS.has(clean);
  
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

  let base = doc.verbs().toInfinitive().text().trim().toLowerCase();
  
  if (!base) {
    base = clean;
  }

  // Double check modal verbs for lemmatized base (e.g. if query was "could" -> base "can")
  if (MODAL_VERBS[base]) {
    const modal = MODAL_VERBS[base];
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

  // Get irregular conjugation details if any
  const phrasalIrreg = base.includes(" ") ? getIrregularPhrasal(base) : null;
  const directIrreg = IRREGULAR_VERBS_LIST[base];
  const isIrregular = !!(directIrreg || phrasalIrreg);

  const conj = doc.verbs().conjugate()[0];

  // Derive forms
  let s_form = getSForm(base);
  let v2 = getPastForm(base);
  let v3 = v2;
  let ing_form = getIngForm(base);

  if (phrasalIrreg) {
    s_form = phrasalIrreg.s_form;
    v2 = phrasalIrreg.v2;
    v3 = phrasalIrreg.v3;
    ing_form = phrasalIrreg.ing_form;
  } else if (directIrreg) {
    v2 = directIrreg.v2;
    v3 = directIrreg.v3;
  } else if (conj) {
    if (conj.PresentTense) s_form = conj.PresentTense;
    if (conj.PastTense) v2 = conj.PastTense;
    v3 = conj.Participle || conj.PastTense || v2;
    if (conj.Gerund) ing_form = conj.Gerund;
  }

  // Return standard 12 tenses structure
  return {
    partOfSpeech: isIrregular ? "Động từ bất quy tắc (Irregular Verb)" : "Động từ (Verb)",
    forms: {
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
    }
  };
}

// 5. Check if query needs AI fallback
export function needsAIFallback(query, direction, useAI, apiKey) {
  if (direction === 'vi-en') return true;
  if (useAI && apiKey && apiKey.trim()) return true;

  const clean = query.trim();
  const words = clean.split(/\s+/);
  
  // If it's a longer sentence, compromise might struggle
  if (words.length > 3) return true;

  return false;
}

// 6. Primary 3-layer entrypoint
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
  // Check if we can parse it locally without falling back to AI
  const isFallback = needsAIFallback(query, direction, useAI, apiKey);
  if (!isFallback) {
    // Only attempt on simple English queries
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

  // Layer 3: Gemini AI fallback (returns null to tell Caller to invoke Gemini/Google Translate API)
  return null;
}
