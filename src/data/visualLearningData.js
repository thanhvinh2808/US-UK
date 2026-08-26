/**
 * Visual Learning Content Registry for V-English (Phase 17B)
 * Provides contextual imagery, vocabulary visuals, and situation illustrations
 * for CEFR curriculum (A1 -> C2).
 * 
 * Philosophy: CONTENT > LEARNING CONTEXT > IMAGE > DECORATION
 */

export const visualLearningData = {
  units: {
    // =========================================================================
    // LEVEL A1 — UNIT 01: FIRST ENCOUNTERS & GREETINGS
    // =========================================================================
    a1_u1: {
      unitId: 'a1_u1',
      hero: {
        type: 'context',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
        alt: 'Two professionals shaking hands and introducing themselves with friendly smiles',
        caption: 'Meeting someone for the first time in a professional and friendly setting',
        source: 'Unsplash',
        attribution: 'Photo by Christina @ wocintechchat.com on Unsplash'
      },
      situation: {
        type: 'situation',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
        alt: 'A diverse group of university students collaborating and greeting each other around a table',
        caption: 'Students introducing themselves on the first day of English class',
        source: 'Unsplash',
        attribution: 'Photo by Brooke Cagle on Unsplash'
      },
      grammarVisual: {
        type: 'grammar_pronouns',
        title: 'Subject Pronouns (Đại từ nhân xưng)',
        items: [
          { pronoun: 'I', vi: 'Tôi (người nói)', example: 'I am Alex.' },
          { pronoun: 'You', vi: 'Bạn (người đối thoại)', example: 'You are a student.' },
          { pronoun: 'He', vi: 'Anh ấy (nam giới)', example: 'He is David.' },
          { pronoun: 'She', vi: 'Cô ấy (nữ giới)', example: 'She is Lan.' },
          { pronoun: 'We / They', vi: 'Chúng tôi / Họ', example: 'They are friends.' }
        ]
      }
    },

    // =========================================================================
    // LEVEL A1 — UNIT 02: DAILY LIFE & ROUTINES
    // =========================================================================
    a1_u2: {
      unitId: 'a1_u2',
      hero: {
        type: 'context',
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
        alt: 'A morning desk setting with coffee cup, journal, and laptop in soft natural light',
        caption: 'Starting the day with an organized morning routine and study plan',
        source: 'Unsplash',
        attribution: 'Photo by Andrew Neel on Unsplash'
      },
      situation: {
        type: 'situation',
        image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1000&q=80',
        alt: 'A checklist notebook with morning schedule and completed daily tasks',
        caption: 'Managing daily routines from morning wake up to evening rest',
        source: 'Unsplash',
        attribution: 'Photo by Glenn Carstens-Peters on Unsplash'
      },
      sequence: {
        title: 'Daily Routine Timeline (Lịch trình một ngày)',
        steps: [
          { time: '06:00 AM', action: 'Wake up', actionVi: 'Thức dậy' },
          { time: '07:00 AM', action: 'Have breakfast', actionVi: 'Ăn bữa sáng' },
          { time: '08:00 AM', action: 'Go to work/school', actionVi: 'Đi làm / đi học' },
          { time: '12:00 PM', action: 'Have lunch', actionVi: 'Ăn trưa' },
          { time: '06:00 PM', action: 'Exercise & Dinner', actionVi: 'Tập thể dục & Ăn tối' },
          { time: '10:30 PM', action: 'Sleep', actionVi: 'Đi ngủ' }
        ]
      }
    },

    // =========================================================================
    // LEVEL A1 — UNIT 03: FAMILY & FRIENDS
    // =========================================================================
    a1_u3: {
      unitId: 'a1_u3',
      hero: {
        type: 'context',
        image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
        alt: 'A multi-generational family happily walking together in the park',
        caption: 'Spending quality time with family members and close friends',
        source: 'Unsplash',
        attribution: 'Photo by Tyler Nix on Unsplash'
      },
      situation: {
        type: 'situation',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
        alt: 'A group of close friends laughing and taking photos together outdoors',
        caption: 'Describing personalities and relationships among friends',
        source: 'Unsplash',
        attribution: 'Photo by Sam Manns on Unsplash'
      },
      familyTree: {
        title: 'Family Members Tree (Cây gia đình)',
        generations: [
          { level: 'Phụ huynh (Parents)', members: ['Father (Bố)', 'Mother (Mẹ)'] },
          { level: 'Con cái (Children)', members: ['Brother (Anh/Em trai)', 'Sister (Chị/Em gái)'] }
        ]
      }
    },

    // =========================================================================
    // LEVEL A1 — UNIT 04: FOOD & DINING
    // =========================================================================
    a1_u4: {
      unitId: 'a1_u4',
      hero: {
        type: 'context',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        alt: 'Warm and inviting restaurant interior with dining tables set for guests',
        caption: 'Dining out at a restaurant and ordering food politely',
        source: 'Unsplash',
        attribution: 'Photo by Jay Wennington on Unsplash'
      },
      situation: {
        type: 'situation',
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
        alt: 'A barista preparing a fresh coffee at a modern cafe counter',
        caption: 'Customer ordering drinks: "I would like a coffee, please."',
        source: 'Unsplash',
        attribution: 'Photo by Demi DeHerrera on Unsplash'
      }
    }
  },

  // =========================================================================
  // CORE VOCABULARY VISUAL ASSETS
  // =========================================================================
  vocabulary: {
    // Unit 01 Vocabulary
    hello: {
      word: 'hello',
      image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80',
      alt: 'A friendly group of young people waving and saying hello',
      caption: 'A friendly greeting used when meeting someone',
      source: 'Unsplash',
      attribution: 'Photo by Duy Pham on Unsplash'
    },
    name: {
      word: 'name',
      image: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80',
      alt: 'A name tag sticker with "Hello My Name Is" written on it',
      caption: 'The word or words that a person or thing is known by',
      source: 'Unsplash',
      attribution: 'Photo by Jon Tyson on Unsplash'
    },
    student: {
      word: 'student',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
      alt: 'A dedicated university student studying with books and notebook in library',
      caption: 'A person who is studying at a school, college, or university',
      source: 'Unsplash',
      attribution: 'Photo by Priscilla Du Preez on Unsplash'
    },
    teacher: {
      word: 'teacher',
      image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80',
      alt: 'A supportive teacher explaining a lesson at the front of a classroom',
      caption: 'A person whose job is to teach, especially in a school',
      source: 'Unsplash',
      attribution: 'Photo by CDC on Unsplash'
    },
    friend: {
      word: 'friend',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
      alt: 'Two good friends smiling warmly and enjoying time together outdoors',
      caption: 'A person you know well and like, but who is not a family member',
      source: 'Unsplash',
      attribution: 'Photo by Sam Manns on Unsplash'
    },
    welcome: {
      word: 'welcome',
      image: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&w=600&q=80',
      alt: 'A welcoming door sign with "Welcome" greeting guests warmly',
      caption: 'Used to greet someone in a polite and friendly way',
      source: 'Unsplash',
      attribution: 'Photo by Nick Fewings on Unsplash'
    },
    pleased: {
      word: 'pleased',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      alt: 'A cheerful man smiling with a pleased and positive expression',
      caption: 'Happy, satisfied, or glad about something',
      source: 'Unsplash',
      attribution: 'Photo by Joseph Gonzalez on Unsplash'
    },
    country: {
      word: 'country',
      image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80',
      alt: 'A world globe showing different nations and continents',
      caption: 'An area of land that has its own government, army, and laws',
      source: 'Unsplash',
      attribution: 'Photo by Kyle Glenn on Unsplash'
    },

    // Unit 02 Vocabulary
    morning: {
      word: 'morning',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
      alt: 'Bright golden sunrise over a peaceful countryside landscape',
      caption: 'The early part of the day, from sunrise to noon',
      source: 'Unsplash',
      attribution: 'Photo by Federico Respini on Unsplash'
    },
    breakfast: {
      word: 'breakfast',
      image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
      alt: 'A nutritious breakfast plate with eggs, toast, and orange juice',
      caption: 'The first meal of the day, usually eaten in the morning',
      source: 'Unsplash',
      attribution: 'Photo by Calum Lewis on Unsplash'
    },
    always: {
      word: 'always',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      alt: 'A classic mechanical clock representing continuous, unbroken time',
      caption: 'At all times; on every occasion (100% frequency)',
      source: 'Unsplash',
      attribution: 'Photo by Sonja Langford on Unsplash'
    },
    usually: {
      word: 'usually',
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80',
      alt: 'A daily planner journal with organized recurring habits',
      caption: 'Under normal conditions; generally or typically',
      source: 'Unsplash',
      attribution: 'Photo by Glenn Carstens-Peters on Unsplash'
    },
    evening: {
      word: 'evening',
      image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
      alt: 'Warm calm sunset over a city skyline in the evening',
      caption: 'The part of the day between late afternoon and night',
      source: 'Unsplash',
      attribution: 'Photo by Jonathan Bowers on Unsplash'
    },
    routine: {
      word: 'routine',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
      alt: 'A person writing down their regular daily routine on paper',
      caption: 'A customary or regular course of procedure',
      source: 'Unsplash',
      attribution: 'Photo by Green Chameleon on Unsplash'
    },
    exercise: {
      word: 'exercise',
      image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
      alt: 'A runner jogging outdoors along a scenic path for healthy exercise',
      caption: 'Physical activity that you do to make your body strong and healthy',
      source: 'Unsplash',
      attribution: 'Photo by Jenny Hill on Unsplash'
    },
    sleep: {
      word: 'sleep',
      image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
      alt: 'A cozy, peaceful bedroom bed with soft pillows in evening light',
      caption: 'The natural state of rest in which your eyes are closed',
      source: 'Unsplash',
      attribution: 'Photo by Kate Stone Matheson on Unsplash'
    },

    // Unit 03 Vocabulary
    family: {
      word: 'family',
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
      alt: 'A loving family with parents and children hugging together happily',
      caption: 'A group of people who are related to each other, especially parents and children',
      source: 'Unsplash',
      attribution: 'Photo by Tyler Nix on Unsplash'
    },
    parents: {
      word: 'parents',
      image: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=600&q=80',
      alt: 'Mother and father holding hands with their child in a park',
      caption: 'A father or mother of a person',
      source: 'Unsplash',
      attribution: 'Photo by Austin Schmid on Unsplash'
    },
    brother: {
      word: 'brother',
      image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80',
      alt: 'Two brothers smiling together side by side outdoors',
      caption: 'A boy or man who has the same parents as you',
      source: 'Unsplash',
      attribution: 'Photo by Jude Beck on Unsplash'
    },
    sister: {
      word: 'sister',
      image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca56a?auto=format&fit=crop&w=600&q=80',
      alt: 'Two sisters laughing together on a bright sunny day',
      caption: 'A girl or woman who has the same parents as you',
      source: 'Unsplash',
      attribution: 'Photo by Melissa Askew on Unsplash'
    },
    kind: {
      word: 'kind',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      alt: 'A person with a kind, warm, and friendly smile',
      caption: 'Generous, helpful, and caring about other people',
      source: 'Unsplash',
      attribution: 'Photo by Aiony Haust on Unsplash'
    },
    smart: {
      word: 'smart',
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
      alt: 'Books, glasses, and notes representing intelligence and smart studying',
      caption: 'Intelligent, clever, or quick at learning',
      source: 'Unsplash',
      attribution: 'Photo by Aaron Burden on Unsplash'
    },

    // Unit 04 Vocabulary
    water: {
      word: 'water',
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
      alt: 'A clear glass of pure fresh drinking water with water droplets',
      caption: 'The clear liquid that falls as rain and that people drink',
      source: 'Unsplash',
      attribution: 'Photo by Manu Schwendener on Unsplash'
    },
    coffee: {
      word: 'coffee',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      alt: 'A hot cup of freshly brewed black coffee on a wooden saucer',
      caption: 'A hot dark-brown drink made from roasted coffee beans',
      source: 'Unsplash',
      attribution: 'Photo by Nathan Dumlao on Unsplash'
    },
    tea: {
      word: 'tea',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      alt: 'A warm ceramic cup of green herbal tea with loose tea leaves',
      caption: 'A hot drink made by pouring boiling water over dried leaves',
      source: 'Unsplash',
      attribution: 'Photo by Content Pixie on Unsplash'
    },
    bread: {
      word: 'bread',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      alt: 'Freshly baked golden artisan bread loaf sliced on a board',
      caption: 'A basic food made by mixing flour and water and baking it',
      source: 'Unsplash',
      attribution: 'Photo by Wesual Click on Unsplash'
    },
    fruit: {
      word: 'fruit',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
      alt: 'A colorful basket of fresh apples, oranges, bananas, and berries',
      caption: 'The sweet and fleshy product of a tree or other plant containing seeds',
      source: 'Unsplash',
      attribution: 'Photo by Jannis Brandt on Unsplash'
    },
    delicious: {
      word: 'delicious',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      alt: 'A beautifully plated gourmet meal that looks appetizing and delicious',
      caption: 'Having a very pleasant taste or smell',
      source: 'Unsplash',
      attribution: 'Photo by Casey Lee on Unsplash'
    }
  }
};

/**
 * Retrieves the contextual visual metadata for a specific Unit.
 * 
 * @param {string} unitId - The CEFR Unit ID (e.g. 'a1_u1')
 * @returns {Object|null}
 */
export function getUnitVisual(unitId) {
  if (!unitId || typeof unitId !== 'string') return null;
  return visualLearningData.units[unitId] || null;
}

/**
 * Retrieves the visual metadata for a specific vocabulary word.
 * 
 * @param {string} word - The vocabulary term (e.g. 'hello')
 * @returns {Object|null}
 */
export function getVocabularyVisual(word) {
  if (!word || typeof word !== 'string') return null;
  const key = word.trim().toLowerCase();
  return visualLearningData.vocabulary[key] || null;
}

/**
 * Retrieves all matching visual metadata items for a list of words.
 * 
 * @param {string[]} wordsArray
 * @returns {Object[]}
 */
export function getVocabularyVisualList(wordsArray = []) {
  if (!Array.isArray(wordsArray)) return [];
  return wordsArray
    .map(w => getVocabularyVisual(typeof w === 'string' ? w : w?.word))
    .filter(Boolean);
}

export default visualLearningData;
