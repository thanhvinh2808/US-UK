/**
 * CEFR Content Registry for V-English (Phase 17)
 * Defines structured English-learning curriculum from A1 to C2.
 * High-quality educational content with authentic dialogues, grammar breakdowns,
 * vocabulary in context, phonetics, and interactive exercises.
 */

export const CEFR_LEVELS = [
  {
    id: 'A1',
    title: 'A1 · Beginner',
    subtitle: 'Nền tảng khởi đầu',
    description: 'Làm quen với các cấu trúc giao tiếp cơ bản, từ vựng thông dụng hàng ngày và phát âm chuẩn.',
    order: 1,
    requiredMasteryToUnlockNext: 70
  },
  {
    id: 'A2',
    title: 'A2 · Elementary',
    subtitle: 'Sơ cấp',
    description: 'Giao tiếp trong các tình huống quen thuộc, miêu tả thói quen, trải nghiệm cá nhân và gia đình.',
    order: 2,
    requiredMasteryToUnlockNext: 70
  },
  {
    id: 'B1',
    title: 'B1 · Intermediate',
    subtitle: 'Trung cấp',
    description: 'Tự tin trao đổi về công việc, học tập, sở thích, bày tỏ quan điểm và xử lý tình huống du lịch.',
    order: 3,
    requiredMasteryToUnlockNext: 75
  },
  {
    id: 'B2',
    title: 'B2 · Upper-Intermediate',
    subtitle: 'Trung cao cấp',
    description: 'Hiểu các văn bản phức tạp, tranh luận lưu loát, sử dụng ngôn ngữ linh hoạt trong môi trường học thuật.',
    order: 4,
    requiredMasteryToUnlockNext: 75
  },
  {
    id: 'C1',
    title: 'C1 · Advanced',
    subtitle: 'Cao cấp',
    description: 'Sử dụng tiếng Anh tự nhiên, sắc thái tinh tế, viết và thuyết trình mạch lạc về các chủ đề chuyên sâu.',
    order: 5,
    requiredMasteryToUnlockNext: 80
  },
  {
    id: 'C2',
    title: 'C2 · Proficiency',
    subtitle: 'Thành thạo',
    description: 'Làm chủ ngôn ngữ như người bản xứ, thấu hiểu ngữ cảnh văn hóa và các cấu trúc ngôn ngữ học thuật cao.',
    order: 6,
    requiredMasteryToUnlockNext: 80
  }
];

export const CEFR_UNITS = [
  // =========================================================================
  // LEVEL A1 — UNIT 01: FIRST ENCOUNTERS & GREETINGS
  // =========================================================================
  {
    id: 'a1_u1',
    levelId: 'A1',
    order: 1,
    title: 'Unit 01: First Encounters',
    titleVi: 'Làm quen & Chào hỏi cơ bản',
    description: 'Học cách chào hỏi, giới thiệu bản thân, đánh vần tên và hỏi thông tin cơ bản của người đối diện.',
    objectives: [
      'Chào hỏi và tạm biệt trong bối cảnh trang trọng và thân mật',
      'Giới thiệu tên, tuổi, nghề nghiệp và quốc tịch cơ bản',
      'Sử dụng chính xác động từ "to be" ở hiện tại đơn (am/is/are)',
      'Luyện phát âm chuẩn các âm nguyên âm ngắn /æ/, /e/, /ɪ/'
    ],
    skillsCovered: ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing', 'quiz'],
    coreVocabulary: [
      { word: 'hello', ipa: '/həˈloʊ/', vietnamese: 'xin chào', partOfSpeech: 'int', example: 'Hello, my name is Alex.' },
      { word: 'name', ipa: '/neɪm/', vietnamese: 'tên, danh tính', partOfSpeech: 'n', example: 'What is your name?' },
      { word: 'student', ipa: '/ˈstuː.dənt/', vietnamese: 'học sinh, sinh viên', partOfSpeech: 'n', example: 'She is a university student.' },
      { word: 'teacher', ipa: '/ˈtiː.tʃər/', vietnamese: 'giáo viên', partOfSpeech: 'n', example: 'Our English teacher is very helpful.' },
      { word: 'friend', ipa: '/frend/', vietnamese: 'bạn bè', partOfSpeech: 'n', example: 'David is my best friend.' },
      { word: 'welcome', ipa: '/ˈwel.kəm/', vietnamese: 'chào đón, hoan nghênh', partOfSpeech: 'v/adj', example: 'Welcome to our English class.' },
      { word: 'pleased', ipa: '/pliːzd/', vietnamese: 'hài lòng, hân hạnh', partOfSpeech: 'adj', example: 'Pleased to meet you!' },
      { word: 'country', ipa: '/ˈkʌn.tri/', vietnamese: 'quốc gia, đất nước', partOfSpeech: 'n', example: 'Which country are you from?' }
    ],
    coreVerbs: ['be', 'meet', 'spell', 'come', 'live'],
    grammarFocus: {
      title: 'Verb to be & Subject Pronouns',
      titleVi: 'Động từ To Be và Đại từ nhân xưng',
      formula: 'I am | You/We/They are | He/She/It is',
      explanation: 'Động từ "to be" được dùng để chỉ trạng thái, danh tính hoặc đặc điểm của chủ ngữ ở hiện tại.',
      examples: [
        { en: 'I am a student.', vi: 'Tôi là một sinh viên.', note: 'I đi với am' },
        { en: 'She is from Vietnam.', vi: 'Cô ấy đến từ Việt Nam.', note: 'She đi với is' },
        { en: 'They are my good friends.', vi: 'Họ là những người bạn tốt của tôi.', note: 'They đi với are' }
      ]
    },
    lessons: [
      {
        id: 'a1_u1_l1',
        unitId: 'a1_u1',
        order: 1,
        type: 'vocabulary',
        title: 'Từ vựng: Lời chào & Giới thiệu',
        description: 'Học 8 từ vựng nền tảng khi bắt đầu một cuộc trò chuyện tiếng Anh.',
        estimatedMinutes: 8,
        xpReward: 20,
        activities: [
          {
            id: 'a1_u1_l1_a1',
            type: 'flashcard_preview',
            title: 'Khám phá từ vựng mới',
            instructions: 'Lắng nghe phát âm và ghi nhớ ý nghĩa ngữ cảnh của từng từ.',
            words: ['hello', 'name', 'student', 'teacher', 'friend', 'welcome', 'pleased', 'country']
          },
          {
            id: 'a1_u1_l1_a2',
            type: 'multiple_choice',
            title: 'Nhận biết nghĩa từ vựng',
            instructions: 'Chọn đáp án đúng nhất cho từ vựng hiển thị.',
            questions: [
              {
                question: 'Nghĩa của từ "student" là gì?',
                options: ['Học sinh / sinh viên', 'Giáo viên', 'Hàng xóm', 'Bác sĩ'],
                correctAnswer: 'Học sinh / sinh viên',
                explanation: '"Student" có nghĩa là học sinh hoặc sinh viên.'
              },
              {
                question: 'Từ nào mang nghĩa "hân hạnh, hài lòng"?',
                options: ['Pleased', 'Tired', 'Angry', 'Busy'],
                correctAnswer: 'Pleased',
                explanation: '"Pleased" là tính từ chỉ sự hài lòng, thường gặp trong "Pleased to meet you".'
              }
            ]
          }
        ]
      },
      {
        id: 'a1_u1_l2',
        unitId: 'a1_u1',
        order: 2,
        type: 'grammar',
        title: 'Ngữ pháp: Động từ To Be (am, is, are)',
        description: 'Nắm vững cách chia động từ To Be với các đại từ nhân xưng.',
        estimatedMinutes: 10,
        xpReward: 25,
        activities: [
          {
            id: 'a1_u1_l2_a1',
            type: 'fill_blank',
            title: 'Điền dạng đúng của To Be',
            instructions: 'Chọn hoặc điền am, is hoặc are vào chỗ trống.',
            questions: [
              {
                sentenceParts: ['She ', ' a friendly teacher.'],
                options: ['is', 'are', 'am'],
                correctAnswer: 'is',
                explanation: 'Chủ ngữ ngôi thứ ba số ít "She" đi với "is".'
              },
              {
                sentenceParts: ['They ', ' students at the academy.'],
                options: ['are', 'is', 'am'],
                correctAnswer: 'are',
                explanation: 'Chủ ngữ số nhiều "They" đi với "are".'
              }
            ]
          }
        ]
      },
      {
        id: 'a1_u1_l3',
        unitId: 'a1_u1',
        order: 3,
        type: 'listening',
        title: 'Luyện nghe: Cuộc đối thoại đầu tiên',
        description: 'Nghe đoạn hội thoại làm quen tại lớp học và trả lời câu hỏi.',
        estimatedMinutes: 10,
        xpReward: 25,
        activities: [
          {
            id: 'a1_u1_l3_a1',
            type: 'dialogue_comprehension',
            title: 'Hội thoại làm quen',
            dialogue: [
              { speaker: 'Alex', text: 'Hello! My name is Alex. What is your name?' },
              { speaker: 'Lan', text: 'Hi Alex! I am Lan. Pleased to meet you.' },
              { speaker: 'Alex', text: 'Pleased to meet you too, Lan. Are you a new student here?' },
              { speaker: 'Lan', text: 'Yes, I am. I come from Vietnam.' }
            ],
            questions: [
              {
                question: 'Lan đến từ quốc gia nào?',
                options: ['Vietnam', 'Canada', 'Australia', 'United Kingdom'],
                correctAnswer: 'Vietnam',
                explanation: 'Trong hội thoại, Lan nói: "I come from Vietnam."'
              }
            ]
          }
        ]
      },
      {
        id: 'a1_u1_l4',
        unitId: 'a1_u1',
        order: 4,
        type: 'speaking',
        title: 'Luyện nói: Tự giới thiệu bản thân',
        description: 'Luyện phát âm chuẩn các mẫu câu chào hỏi và tự giới thiệu.',
        estimatedMinutes: 8,
        xpReward: 20,
        activities: [
          {
            id: 'a1_u1_l4_a1',
            type: 'pronunciation_repeat',
            title: 'Luyện câu phát âm chuẩn',
            prompts: [
              { text: 'Hello, my name is Alex.', ipa: '/həˈloʊ maɪ neɪm ɪz ˈæl.ɪks/' },
              { text: 'Pleased to meet you!', ipa: '/pliːzd tuː miːt juː/' }
            ]
          }
        ]
      },
      {
        id: 'a1_u1_l5',
        unitId: 'a1_u1',
        order: 5,
        type: 'reading',
        title: 'Đọc hiểu: Bài viết ngắn về người bạn mới',
        description: 'Đọc văn bản ngắn và phân tích từ vựng trong ngữ cảnh.',
        estimatedMinutes: 10,
        xpReward: 25,
        activities: [
          {
            id: 'a1_u1_l5_a1',
            type: 'reading_passage',
            passage: 'My name is Alex. I am twenty years old and I am a student. Today is my first day at university. My English teacher is Mrs. Green. She is very kind and energetic. In class, I meet Lan. She is from Vietnam and she is very friendly.',
            questions: [
              {
                question: 'Alex bao nhiêu tuổi?',
                options: ['Twenty (20)', 'Eighteen (18)', 'Twenty-five (25)', 'Thirty (30)'],
                correctAnswer: 'Twenty (20)',
                explanation: 'Đoạn văn nêu rõ: "I am twenty years old".'
              }
            ]
          }
        ]
      },
      {
        id: 'a1_u1_l6',
        unitId: 'a1_u1',
        order: 6,
        type: 'writing',
        title: 'Luyện viết: Hoàn thiện câu giới thiệu',
        description: 'Sắp xếp từ ngữ và viết câu tự giới thiệu chính xác.',
        estimatedMinutes: 10,
        xpReward: 25,
        activities: [
          {
            id: 'a1_u1_l6_a1',
            type: 'sentence_order',
            scrambledWords: ['is', 'name', 'My', 'Lan', '.'],
            correctSentence: 'My name is Lan.',
            explanation: 'Cấu trúc câu hoàn chỉnh: My name is Lan.'
          }
        ]
      },
      {
        id: 'a1_u1_l7',
        unitId: 'a1_u1',
        order: 7,
        type: 'quiz',
        title: 'Đánh giá tổng hợp: Unit 01 Review Quiz',
        description: 'Kiểm tra toàn diện từ vựng, ngữ pháp và khả năng ứng dụng của Unit 01.',
        estimatedMinutes: 12,
        xpReward: 35,
        activities: [
          {
            id: 'a1_u1_l7_a1',
            type: 'unit_quiz',
            questions: [
              {
                question: 'Chọn câu viết đúng ngữ pháp:',
                options: ['She is my teacher.', 'She are my teacher.', 'She am my teacher.', 'She be my teacher.'],
                correctAnswer: 'She is my teacher.',
                explanation: '"She" là chủ ngữ số ít nên đi cùng động từ "is".'
              },
              {
                question: 'Điền từ thích hợp: "Pleased to ______ you!"',
                options: ['meet', 'see', 'make', 'do'],
                correctAnswer: 'meet',
                explanation: 'Thành ngữ cố định: "Pleased to meet you" (Rất vui được gặp bạn).'
              }
            ]
          }
        ]
      }
    ]
  },

  // =========================================================================
  // LEVEL A1 — UNIT 02: DAILY LIFE & ROUTINES
  // =========================================================================
  {
    id: 'a1_u2',
    levelId: 'A1',
    order: 2,
    title: 'Unit 02: Daily Life & Routines',
    titleVi: 'Cuộc sống & Thói quen hằng ngày',
    description: 'Mô tả lịch trình sinh hoạt mỗi ngày, giờ giấc và các hoạt động thường nhật.',
    objectives: [
      'Nói về các hoạt động hàng ngày (thức dậy, ăn sáng, đi làm, học bài)',
      'Sử dụng thì Hiện tại đơn (Present Simple) với các ngôi',
      'Hỏi và trả lời về thời gian (What time is it?)',
      'Sử dụng trạng từ chỉ tần suất cơ bản (always, usually, sometimes, never)'
    ],
    skillsCovered: ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing', 'quiz'],
    coreVocabulary: [
      { word: 'morning', ipa: '/ˈmɔːr.nɪŋ/', vietnamese: 'buổi sáng', partOfSpeech: 'n', example: 'I wake up early in the morning.' },
      { word: 'breakfast', ipa: '/ˈbrek.fəst/', vietnamese: 'bữa sáng', partOfSpeech: 'n', example: 'We eat breakfast at 7:00 AM.' },
      { word: 'always', ipa: '/ˈɔːl.weɪz/', vietnamese: 'luôn luôn', partOfSpeech: 'adv', example: 'He always arrives on time.' },
      { word: 'usually', ipa: '/ˈjuː.ʒu.ə.li/', vietnamese: 'thường xuyên', partOfSpeech: 'adv', example: 'I usually drink tea after lunch.' },
      { word: 'evening', ipa: '/ˈiːv.nɪŋ/', vietnamese: 'buổi tối', partOfSpeech: 'n', example: 'They read books in the evening.' },
      { word: 'routine', ipa: '/ruːˈtiːn/', vietnamese: 'lịch trình, thói quen', partOfSpeech: 'n', example: 'Exercise is part of my daily routine.' },
      { word: 'exercise', ipa: '/ˈek.sɚ.saɪz/', vietnamese: 'tập thể dục, rèn luyện', partOfSpeech: 'v/n', example: 'She exercises every morning.' },
      { word: 'sleep', ipa: '/sliːp/', vietnamese: 'ngủ, giấc ngủ', partOfSpeech: 'v/n', example: 'I sleep eight hours every night.' }
    ],
    coreVerbs: ['wake', 'eat', 'work', 'study', 'relax', 'sleep'],
    grammarFocus: {
      title: 'Present Simple for Habits',
      titleVi: 'Thì Hiện tại đơn diễn tả thói quen',
      formula: 'S + V(s/es) | S + do/does not + V',
      explanation: 'Dùng để diễn tả hành động lặp đi lặp lại như một thói quen hoặc sự thật hiển nhiên.',
      examples: [
        { en: 'I wake up at six o’clock.', vi: 'Tôi thức dậy lúc 6 giờ.', note: 'Chủ ngữ "I" dùng động từ nguyên mẫu' },
        { en: 'He studies English every day.', vi: 'Anh ấy học tiếng Anh mỗi ngày.', note: 'Chủ ngữ "He" động từ thêm "es"' }
      ]
    },
    lessons: [
      {
        id: 'a1_u2_l1',
        unitId: 'a1_u2',
        order: 1,
        type: 'vocabulary',
        title: 'Từ vựng: Hoạt động thường nhật',
        description: 'Học các từ vựng chỉ thói quen và mốc thời gian trong ngày.',
        estimatedMinutes: 8,
        xpReward: 20,
        activities: [
          {
            id: 'a1_u2_l1_a1',
            type: 'flashcard_preview',
            title: 'Từ vựng thói quen',
            instructions: 'Lắng nghe phát âm và ghi nhớ nghĩa của từ.',
            words: ['morning', 'breakfast', 'always', 'usually', 'evening', 'routine', 'exercise', 'sleep']
          }
        ]
      },
      {
        id: 'a1_u2_l2',
        unitId: 'a1_u2',
        order: 2,
        type: 'grammar',
        title: 'Ngữ pháp: Thì Hiện tại đơn & Thói quen',
        description: 'Học cách thêm -s/-es và đặt câu hỏi thói quen.',
        estimatedMinutes: 10,
        xpReward: 25,
        activities: [
          {
            id: 'a1_u2_l2_a1',
            type: 'multiple_choice',
            title: 'Chia động từ Hiện tại đơn',
            questions: [
              {
                question: 'Chọn dạng đúng: "Tom ______ (drink) coffee every morning."',
                options: ['drinks', 'drink', 'drinking', 'is drink'],
                correctAnswer: 'drinks',
                explanation: 'Chủ ngữ "Tom" là ngôi thứ ba số ít nên động từ "drink" thêm "s".'
              }
            ]
          }
        ]
      },
      {
        id: 'a1_u2_l3',
        unitId: 'a1_u2',
        order: 3,
        type: 'listening',
        title: 'Luyện nghe: Lịch trình một ngày',
        description: 'Nghe đoạn mô tả ngày làm việc của Sarah.',
        estimatedMinutes: 10,
        xpReward: 25,
        activities: [
          {
            id: 'a1_u2_l3_a1',
            type: 'dialogue_comprehension',
            dialogue: [
              { speaker: 'Sarah', text: 'I usually wake up at 6:30 AM. First, I make breakfast.' },
              { speaker: 'Sarah', text: 'Then I take the bus to work. In the evening, I relax at home.' }
            ],
            questions: [
              {
                question: 'Sarah thức dậy lúc mấy giờ?',
                options: ['6:30 AM', '7:00 AM', '8:00 AM', '6:00 AM'],
                correctAnswer: '6:30 AM',
                explanation: 'Sarah nói: "I usually wake up at 6:30 AM."'
              }
            ]
          }
        ]
      },
      {
        id: 'a1_u2_l4',
        unitId: 'a1_u2',
        order: 4,
        type: 'reading',
        title: 'Đọc hiểu: Một ngày của John',
        description: 'Đọc đoạn văn ngắn về thói quen sinh hoạt và trả lời câu hỏi.',
        estimatedMinutes: 10,
        xpReward: 25,
        activities: [
          {
            id: 'a1_u2_l4_a1',
            type: 'reading_passage',
            passage: 'John is an engineer in New York. His daily routine is very organized. He wakes up at 6:00 AM and goes for a run in Central Park. After that, he drinks a cup of black coffee and eats fruit for breakfast. He works until 5:00 PM and studies Spanish in the evening.',
            questions: [
              {
                question: 'John làm nghề gì?',
                options: ['Engineer', 'Doctor', 'Teacher', 'Student'],
                correctAnswer: 'Engineer',
                explanation: 'Bài đọc viết: "John is an engineer in New York."'
              }
            ]
          }
        ]
      },
      {
        id: 'a1_u2_l5',
        unitId: 'a1_u2',
        order: 5,
        type: 'quiz',
        title: 'Đánh giá: Unit 02 Review Quiz',
        description: 'Kiểm tra kiến thức thì hiện tại đơn và từ vựng thói quen hàng ngày.',
        estimatedMinutes: 12,
        xpReward: 35,
        activities: [
          {
            id: 'a1_u2_l5_a1',
            type: 'unit_quiz',
            questions: [
              {
                question: 'Từ nào có nghĩa là "luôn luôn"?',
                options: ['Always', 'Never', 'Sometimes', 'Rarely'],
                correctAnswer: 'Always',
                explanation: '"Always" là trạng từ chỉ tần suất mang nghĩa luôn luôn (100%).'
              }
            ]
          }
        ]
      }
    ]
  },

  // =========================================================================
  // LEVEL A1 — UNIT 03: FAMILY & FRIENDS
  // =========================================================================
  {
    id: 'a1_u3',
    levelId: 'A1',
    order: 3,
    title: 'Unit 03: Family & Friends',
    titleVi: 'Gia đình & Bạn bè thân thiết',
    description: 'Miêu tả các thành viên trong gia đình, các mối quan hệ và tính cách cơ bản.',
    objectives: [
      'Kể tên các thành viên trong gia đình (parents, brother, sister, cousin)',
      'Sử dụng tính từ sở hữu (my, your, his, her, their, our)',
      'Miêu tả ngoại hình và tính cách đơn giản (tall, kind, funny, smart)'
    ],
    skillsCovered: ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing', 'quiz'],
    coreVocabulary: [
      { word: 'family', ipa: '/ˈfæm.əl.i/', vietnamese: 'gia đình', partOfSpeech: 'n', example: 'I have a large and happy family.' },
      { word: 'parents', ipa: '/ˈper.ənts/', vietnamese: 'bố mẹ, phụ huynh', partOfSpeech: 'n', example: 'My parents live in Da Nang.' },
      { word: 'brother', ipa: '/ˈbrʌð.ɚ/', vietnamese: 'anh/em trai', partOfSpeech: 'n', example: 'My older brother is a doctor.' },
      { word: 'sister', ipa: '/ˈsɪs.tɚ/', vietnamese: 'chị/em gái', partOfSpeech: 'n', example: 'Her sister is very kind.' },
      { word: 'kind', ipa: '/kaɪnd/', vietnamese: 'tốt bụng, tử tế', partOfSpeech: 'adj', example: 'She is always kind to everyone.' },
      { word: 'smart', ipa: '/smɑːrt/', vietnamese: 'thông minh, nhanh nhạy', partOfSpeech: 'adj', example: 'He is a very smart student.' }
    ],
    coreVerbs: ['have', 'live', 'help', 'love', 'visit'],
    grammarFocus: {
      title: 'Possessive Adjectives & Have/Has',
      titleVi: 'Tính từ sở hữu và động từ Have / Has',
      formula: 'My / Your / His / Her / Our / Their + Noun',
      explanation: 'Tính từ sở hữu đứng trước danh từ để chỉ quyền sở hữu hoặc mối quan hệ.',
      examples: [
        { en: 'This is my brother.', vi: 'Đây là anh trai tôi.', note: 'my = của tôi' },
        { en: 'She has two sisters.', vi: 'Cô ấy có hai người chị gái.', note: 'She đi với has' }
      ]
    },
    lessons: [
      {
        id: 'a1_u3_l1',
        unitId: 'a1_u3',
        order: 1,
        type: 'vocabulary',
        title: 'Từ vựng: Thành viên gia đình',
        description: 'Học từ vựng về gia đình và tính từ miêu tả tính cách.',
        estimatedMinutes: 8,
        xpReward: 20,
        activities: [
          {
            id: 'a1_u3_l1_a1',
            type: 'flashcard_preview',
            words: ['family', 'parents', 'brother', 'sister', 'kind', 'smart']
          }
        ]
      },
      {
        id: 'a1_u3_l2',
        unitId: 'a1_u3',
        order: 2,
        type: 'grammar',
        title: 'Ngữ pháp: Tính từ sở hữu (Possessives)',
        description: 'Phân biệt my, your, his, her, their.',
        estimatedMinutes: 10,
        xpReward: 25,
        activities: [
          {
            id: 'a1_u3_l2_a1',
            type: 'multiple_choice',
            questions: [
              {
                question: 'Điền từ đúng: "David loves ______ (của anh ấy) family."',
                options: ['his', 'her', 'their', 'my'],
                correctAnswer: 'his',
                explanation: 'David là nam giới nên tính từ sở hữu tương ứng là "his".'
              }
            ]
          }
        ]
      },
      {
        id: 'a1_u3_l3',
        unitId: 'a1_u3',
        order: 3,
        type: 'quiz',
        title: 'Đánh giá: Unit 03 Review Quiz',
        description: 'Kiểm tra tổng hợp kiến thức về gia đình và tính từ sở hữu.',
        estimatedMinutes: 12,
        xpReward: 35,
        activities: [
          {
            id: 'a1_u3_l3_a1',
            type: 'unit_quiz',
            questions: [
              {
                question: '"Parents" có nghĩa là gì?',
                options: ['Bố mẹ', 'Anh chị em', 'Hàng xóm', 'Thầy cô'],
                correctAnswer: 'Bố mẹ',
                explanation: '"Parents" chỉ cha mẹ / phụ huynh.'
              }
            ]
          }
        ]
      }
    ]
  },

  // =========================================================================
  // LEVEL A1 — UNIT 04: FOOD & DINING
  // =========================================================================
  {
    id: 'a1_u4',
    levelId: 'A1',
    order: 4,
    title: 'Unit 04: Food & Dining',
    titleVi: 'Ẩm thực & Gọi món nhà hàng',
    description: 'Học từ vựng món ăn, đồ uống và cách gọi món lịch sự tại nhà hàng.',
    objectives: [
      'Nhận biết các loại thực phẩm và đồ uống phổ biến',
      'Sử dụng cấu trúc gọi món lịch sự: "I would like..." hoặc "Can I have...?"',
      'Đếm danh từ đếm được và không đếm được cơ bản (some/any)'
    ],
    skillsCovered: ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing', 'quiz'],
    coreVocabulary: [
      { word: 'water', ipa: '/ˈwɑː.t̬ɚ/', vietnamese: 'nước uống', partOfSpeech: 'n', example: 'Can I have a glass of water?' },
      { word: 'coffee', ipa: '/ˈkɑː.fi/', vietnamese: 'cà phê', partOfSpeech: 'n', example: 'He drinks black coffee in the morning.' },
      { word: 'tea', ipa: '/tiː/', vietnamese: 'trà, chè', partOfSpeech: 'n', example: 'Green tea is very healthy.' },
      { word: 'bread', ipa: '/bred/', vietnamese: 'bánh mì', partOfSpeech: 'n', example: 'I eat bread with eggs for breakfast.' },
      { word: 'fruit', ipa: '/fruːt/', vietnamese: 'trái cây, hoa quả', partOfSpeech: 'n', example: 'Fresh fruit is good for your health.' },
      { word: 'delicious', ipa: '/dɪˈlɪʃ.əs/', vietnamese: 'ngon miệng, thơm ngon', partOfSpeech: 'adj', example: 'This noodle soup is delicious.' }
    ],
    coreVerbs: ['order', 'eat', 'drink', 'cook', 'taste'],
    grammarFocus: {
      title: 'Polite Requests & Countable/Uncountable',
      titleVi: 'Yêu cầu lịch sự & Danh từ đếm được / không đếm được',
      formula: 'Would like + Noun | Can I have + Noun, please?',
      explanation: 'Dùng "would like" để thể hiện mong muốn một cách lịch thiệp khi gọi món.',
      examples: [
        { en: 'I would like a cup of tea, please.', vi: 'Cho tôi một tách trà nhé.', note: 'lịch sự hơn "I want"' }
      ]
    },
    lessons: [
      {
        id: 'a1_u4_l1',
        unitId: 'a1_u4',
        order: 1,
        type: 'vocabulary',
        title: 'Từ vựng: Đồ ăn & Thức uống',
        description: 'Học từ vựng phổ biến về ẩm thực hàng ngày.',
        estimatedMinutes: 8,
        xpReward: 20,
        activities: [
          {
            id: 'a1_u4_l1_a1',
            type: 'flashcard_preview',
            words: ['water', 'coffee', 'tea', 'bread', 'fruit', 'delicious']
          }
        ]
      },
      {
        id: 'a1_u4_l2',
        unitId: 'a1_u4',
        order: 2,
        type: 'quiz',
        title: 'Đánh giá: Unit 04 Review Quiz',
        description: 'Kiểm tra khả năng gọi món và từ vựng ẩm thực.',
        estimatedMinutes: 12,
        xpReward: 35,
        activities: [
          {
            id: 'a1_u4_l2_a1',
            type: 'unit_quiz',
            questions: [
              {
                question: 'Mẫu câu lịch sự nào dùng để gọi món?',
                options: ['I would like a coffee, please.', 'Give me coffee now.', 'I want coffee fast.', 'Coffee here.'],
                correctAnswer: 'I would like a coffee, please.',
                explanation: '"I would like..." là mẫu câu lịch sự chuẩn mực trong tiếng Anh.'
              }
            ]
          }
        ]
      }
    ]
  }
];
