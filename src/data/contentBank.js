// contentBank.js
// Đã bổ sung đầy đủ grammar_focus + writing_exercises cho 4 thì cơ bản:
// 1. Present Simple      -> topic_coffee_shop
// 2. Present Continuous  -> topic_family_morning
// 3. Past Simple         -> topic_weekend_trip
// 4. Future Simple       -> topic_future_plans
//
// topic_job_interview được giữ nguyên như cũ (chưa gắn thì cụ thể, có thể bổ sung sau).

export const contentBank = [
  // =========================================================
  // 1. PRESENT SIMPLE — At the Coffee Shop
  // =========================================================
  {
    id: "topic_coffee_shop",
    topic: "At the Coffee Shop",
    level: "A2",
    title: "Ordering Coffee in Seattle",
    reading_passage: "Seattle is famous for its coffee culture. Every morning, millions of people visit local coffee shops to grab their favorite drinks. When you order, the barista will ask: 'What can I get started for you?' You can choose a simple black coffee, a latte, or a cappuccino. Don't forget to specify the size: small, medium, or large. Many people also like to add a pastry, such as a croissant or a blueberry muffin, to enjoy with their warm drink.",
    reading_passage_translation: "Seattle nổi tiếng với văn hóa cà phê. Mỗi buổi sáng, hàng triệu người ghé thăm các quán cà phê địa phương để mua đồ uống yêu thích của họ. Khi bạn gọi món, nhân viên pha chế sẽ hỏi: 'Tôi có thể lấy gì cho bạn?' Bạn có thể chọn cà phê đen đơn giản, latte hoặc cappuccino. Đừng quên chỉ rõ kích cỡ: nhỏ, vừa hoặc lớn. Nhiều người cũng thích thêm một chiếc bánh ngọt, chẳng hạn như bánh sừng bò hoặc bánh muffin việt quất, để thưởng thức cùng đồ uống ấm áp của họ.",

    grammar_focus: {
      tense: "Present Simple",
      tense_vi: "Thì hiện tại đơn",
      formula: "S + V(s/es) [chủ ngữ số ít: he/she/it]  |  S + V (nguyên mẫu) [chủ ngữ số nhiều: I/you/we/they]",
      explanation: "Dùng để diễn tả thói quen, sự thật hiển nhiên, hoặc điều luôn đúng. Với chủ ngữ số ít (he/she/it), động từ thêm 's' hoặc 'es'.",
      examples: [
        { en: "Seattle is famous for its coffee culture.", vi: "Seattle nổi tiếng với văn hóa cà phê.", note: "'is' là dạng chia của to be với chủ ngữ số ít 'Seattle' — diễn tả một sự thật." },
        { en: "Millions of people visit local coffee shops every morning.", vi: "Hàng triệu người ghé quán cà phê địa phương mỗi sáng.", note: "'visit' không thêm 's' vì chủ ngữ 'millions of people' là số nhiều." },
        { en: "The barista asks what you want to order.", vi: "Nhân viên pha chế hỏi bạn muốn gọi món gì.", note: "'asks' thêm 's' vì chủ ngữ 'the barista' là số ít (he/she/it)." }
      ]
    },

    writing_exercises: [
      { id: "cs_w1", type: "fill_blank", sentence_parts: ["Every morning, she ", " (visit) the coffee shop near her house."], answer: "visits", hint: "Chủ ngữ 'she' → động từ thêm s/es" },
      { id: "cs_w2", type: "sentence_ordering", words: ["coffee", "drink", "I", "morning", "every"], answer: "I drink coffee every morning." },
      { id: "cs_w3", type: "free_writing", prompt_vi: "Viết 2 câu mô tả thói quen uống cà phê hằng ngày của bạn, dùng thì hiện tại đơn.", required_keywords: ["every day", "usually", "always", "often"], min_words: 8 }
    ],

    dialogues: [
      { id: "coffee_diag_1", speaker: "Barista", text: "Hi there! What can I get started for you today?", vietnamese: "Xin chào! Hôm nay tôi có thể lấy gì cho bạn đây?" },
      { id: "coffee_diag_2", speaker: "Customer", text: "I would like a medium iced latte with oat milk, please.", vietnamese: "Cho tôi một ly latte đá cỡ vừa với sữa yến mạch nhé." },
      { id: "coffee_diag_3", speaker: "Barista", text: "Sure. Would you like any pastry with that?", vietnamese: "Dĩ nhiên rồi. Bạn có muốn dùng kèm bánh ngọt gì không?" },
      { id: "coffee_diag_4", speaker: "Customer", text: "Yes, please. I will take a chocolate croissant.", vietnamese: "Có chứ. Cho tôi một chiếc bánh sừng bò sô-cô-la." },
      { id: "coffee_diag_5", speaker: "Barista", text: "Perfect. That comes to seven dollars and fifty cents.", vietnamese: "Tuyệt vời. Tổng cộng hết bảy đô la và năm mươi xu." }
    ],

    default_vocabs: [
      { word: "barista", ipa: "/bəˈriːstə/", vietnamese: "nhân viên pha chế cà phê", example: "The barista made a beautiful heart pattern on my latte." },
      { word: "pastry", ipa: "/ˈpeɪstri/", vietnamese: "bánh ngọt, bánh nướng", example: "I love eating sweet pastries in the morning." },
      { word: "croissant", ipa: "/ˈkrwɑːsɒ̃/", vietnamese: "bánh sừng bò", example: "This chocolate croissant is very crispy and delicious." },
      { word: "specify", ipa: "/ˈspesɪfaɪ/", vietnamese: "chỉ rõ, xác định cụ thể", example: "You need to specify whether you want hot or iced coffee." },
      { word: "culture", ipa: "/ˈkʌltʃər/", vietnamese: "nền văn hóa", example: "Seattle is famous for its vibrant coffee culture." },
      { word: "favorite", ipa: "/ˈfeɪvərɪt/", vietnamese: "yêu thích", example: "Espresso is my favorite type of coffee." }
    ]
  },

  // =========================================================
  // 2. PRESENT CONTINUOUS — A Busy Morning
  // =========================================================
  {
    id: "topic_family_morning",
    topic: "Family & Daily Life",
    level: "A2",
    title: "A Busy Sunday Morning",
    reading_passage: "It is Sunday morning, and the Nguyen family is having breakfast together. Mai is making pancakes in the kitchen while her brother, Tom, is setting the table. Their mother is reading the newspaper, and their father is talking on the phone with a client. Outside, the neighbors are washing their car, and the birds are singing in the trees. Everyone is enjoying this peaceful weekend morning.",
    reading_passage_translation: "Đó là một buổi sáng Chủ nhật, và gia đình nhà Nguyễn đang cùng nhau ăn sáng. Mai đang làm bánh pancake trong bếp trong khi anh trai của cô, Tom, đang dọn bàn ăn. Mẹ của họ đang đọc báo, còn bố đang nói chuyện điện thoại với khách hàng. Bên ngoài, hàng xóm đang rửa xe, và những chú chim đang hót trên cây. Mọi người đều đang tận hưởng buổi sáng cuối tuần yên bình này.",

    grammar_focus: {
      tense: "Present Continuous",
      tense_vi: "Thì hiện tại tiếp diễn",
      formula: "S + am/is/are + V-ing",
      explanation: "Dùng để diễn tả một hành động đang xảy ra ngay tại thời điểm nói, hoặc một việc đang diễn ra trong một khoảng thời gian ở hiện tại.",
      examples: [
        { en: "Mai is making pancakes in the kitchen.", vi: "Mai đang làm bánh pancake trong bếp.", note: "'is making' = is + V-ing, chủ ngữ số ít 'Mai' dùng 'is'." },
        { en: "The neighbors are washing their car.", vi: "Hàng xóm đang rửa xe.", note: "'are washing' = are + V-ing, chủ ngữ số nhiều 'the neighbors' dùng 'are'." },
        { en: "Their father is talking on the phone with a client.", vi: "Bố của họ đang nói chuyện điện thoại với khách hàng.", note: "Hành động đang diễn ra ngay lúc được miêu tả trong bài." }
      ]
    },

    writing_exercises: [
      { id: "fm_w1", type: "fill_blank", sentence_parts: ["Right now, my brother ", " (play) video games in his room."], answer: "is playing", hint: "Chủ ngữ số ít 'my brother' → is + V-ing" },
      { id: "fm_w2", type: "sentence_ordering", words: ["mother", "cooking", "my", "dinner", "is"], answer: "My mother is cooking dinner." },
      { id: "fm_w3", type: "free_writing", prompt_vi: "Viết 2 câu mô tả những gì mọi người trong nhà bạn đang làm ngay bây giờ, dùng thì hiện tại tiếp diễn.", required_keywords: ["is", "are", "right now", "at the moment"], min_words: 8 }
    ],

    dialogues: [
      { id: "family_diag_1", speaker: "Mai", text: "What are you doing right now, Tom?", vietnamese: "Anh đang làm gì vậy Tom?" },
      { id: "family_diag_2", speaker: "Tom", text: "I am setting the table for breakfast.", vietnamese: "Anh đang dọn bàn để ăn sáng." },
      { id: "family_diag_3", speaker: "Mai", text: "Mom is reading the newspaper in the living room.", vietnamese: "Mẹ đang đọc báo ở phòng khách." },
      { id: "family_diag_4", speaker: "Tom", text: "And Dad is talking on the phone again.", vietnamese: "Còn Bố lại đang nói chuyện điện thoại nữa rồi." },
      { id: "family_diag_5", speaker: "Mai", text: "Yes, he is always working, even on Sundays.", vietnamese: "Đúng vậy, bố lúc nào cũng làm việc, kể cả Chủ nhật." }
    ],

    default_vocabs: [
      { word: "pancake", ipa: "/ˈpænkeɪk/", vietnamese: "bánh pancake, bánh kếp", example: "She is making pancakes for the family." },
      { word: "set the table", ipa: "/set ðə ˈteɪbl/", vietnamese: "dọn bàn ăn", example: "Tom is setting the table before dinner." },
      { word: "neighbor", ipa: "/ˈneɪbər/", vietnamese: "hàng xóm", example: "Our neighbors are very friendly." },
      { word: "peaceful", ipa: "/ˈpiːsfəl/", vietnamese: "yên bình", example: "This is a peaceful morning in the countryside." },
      { word: "client", ipa: "/ˈklaɪənt/", vietnamese: "khách hàng, thân chủ", example: "My father is talking to a client on the phone." },
      { word: "enjoy", ipa: "/ɪnˈdʒɔɪ/", vietnamese: "tận hưởng, thích thú", example: "We are enjoying our weekend together." }
    ]
  },

  // =========================================================
  // 3. PAST SIMPLE — My Trip to Da Lat
  // =========================================================
  {
    id: "topic_weekend_trip",
    topic: "Travel & Experiences",
    level: "A2",
    title: "My Trip to Da Lat",
    reading_passage: "Last weekend, my family traveled to Da Lat for a short vacation. We left home early on Saturday morning and arrived in the afternoon. On the first day, we visited a beautiful flower garden and took many photos. In the evening, we ate dinner at a small local restaurant and tried a famous hot pot dish. The next morning, we walked around a quiet lake and drank fresh coffee at a nearby cafe. We really enjoyed the cool weather and the peaceful atmosphere of the city.",
    reading_passage_translation: "Cuối tuần trước, gia đình tôi đã đi du lịch Đà Lạt cho một chuyến nghỉ ngắn ngày. Chúng tôi rời nhà từ sáng sớm thứ Bảy và đến nơi vào buổi chiều. Ngày đầu tiên, chúng tôi ghé thăm một vườn hoa xinh đẹp và chụp rất nhiều ảnh. Buổi tối, chúng tôi ăn tối tại một nhà hàng địa phương nhỏ và thử món lẩu nổi tiếng. Sáng hôm sau, chúng tôi đi dạo quanh một hồ nước yên tĩnh và uống cà phê tươi tại một quán gần đó. Chúng tôi thực sự đã tận hưởng thời tiết mát mẻ và bầu không khí yên bình của thành phố.",

    grammar_focus: {
      tense: "Past Simple",
      tense_vi: "Thì quá khứ đơn",
      formula: "S + V-ed (động từ có quy tắc)  |  S + V2 (động từ bất quy tắc)",
      explanation: "Dùng để diễn tả một hành động đã xảy ra và kết thúc hoàn toàn trong quá khứ, thường đi kèm các mốc thời gian như 'last weekend', 'yesterday'.",
      examples: [
        { en: "Last weekend, my family traveled to Da Lat.", vi: "Cuối tuần trước, gia đình tôi đã đi du lịch Đà Lạt.", note: "'traveled' = travel + ed, động từ có quy tắc." },
        { en: "We left home early on Saturday morning.", vi: "Chúng tôi rời nhà từ sáng sớm thứ Bảy.", note: "'left' là dạng quá khứ bất quy tắc của 'leave'." },
        { en: "We ate dinner at a small local restaurant.", vi: "Chúng tôi ăn tối tại một nhà hàng địa phương nhỏ.", note: "'ate' là dạng quá khứ bất quy tắc của 'eat'." }
      ]
    },

    writing_exercises: [
      { id: "wt_w1", type: "fill_blank", sentence_parts: ["Yesterday, we ", " (visit) my grandmother in the countryside."], answer: "visited", hint: "Động từ có quy tắc, thêm -ed" },
      { id: "wt_w2", type: "sentence_ordering", words: ["went", "we", "beach", "the", "to"], answer: "We went to the beach." },
      { id: "wt_w3", type: "free_writing", prompt_vi: "Viết 2 câu kể về một chuyến đi bạn đã thực hiện trong quá khứ, dùng thì quá khứ đơn.", required_keywords: ["last", "yesterday", "ago", "went", "visited"], min_words: 8 }
    ],

    dialogues: [
      { id: "trip_diag_1", speaker: "Linh", text: "Where did you go last weekend?", vietnamese: "Cuối tuần trước bạn đã đi đâu vậy?" },
      { id: "trip_diag_2", speaker: "Nam", text: "I traveled to Da Lat with my family.", vietnamese: "Mình đã đi Đà Lạt cùng gia đình." },
      { id: "trip_diag_3", speaker: "Linh", text: "That sounds nice! What did you do there?", vietnamese: "Nghe hay đấy! Bạn đã làm gì ở đó?" },
      { id: "trip_diag_4", speaker: "Nam", text: "We visited a flower garden and tried a local hot pot dish.", vietnamese: "Bọn mình đã ghé vườn hoa và thử món lẩu địa phương." },
      { id: "trip_diag_5", speaker: "Linh", text: "It seems like you really enjoyed the trip.", vietnamese: "Có vẻ như bạn đã thực sự tận hưởng chuyến đi." }
    ],

    default_vocabs: [
      { word: "vacation", ipa: "/veɪˈkeɪʃn/", vietnamese: "kỳ nghỉ", example: "We took a short vacation to Da Lat." },
      { word: "arrive", ipa: "/əˈraɪv/", vietnamese: "đến nơi", example: "We arrived in the afternoon." },
      { word: "atmosphere", ipa: "/ˈætməsfɪər/", vietnamese: "bầu không khí", example: "I love the peaceful atmosphere of this city." },
      { word: "local", ipa: "/ˈləʊkl/", vietnamese: "địa phương", example: "We tried a famous local dish." },
      { word: "nearby", ipa: "/ˌnɪrˈbaɪ/", vietnamese: "gần đó", example: "There is a small cafe nearby." },
      { word: "fresh", ipa: "/freʃ/", vietnamese: "tươi, mới", example: "The coffee here is always fresh." }
    ]
  },

  // =========================================================
  // 4. FUTURE SIMPLE — Weekend Plans
  // =========================================================
  {
    id: "topic_future_plans",
    topic: "Plans & Predictions",
    level: "A2",
    title: "My Plans for Next Weekend",
    reading_passage: "Next weekend, I will visit my hometown to see my parents. My mother will cook my favorite dishes, and we will have a big family dinner on Saturday night. On Sunday morning, I will go fishing with my father at the nearby river. In the afternoon, my sister will come home too, so all of us will spend time together in the garden. I think it will be a relaxing and happy weekend.",
    reading_passage_translation: "Cuối tuần tới, tôi sẽ về quê để thăm bố mẹ. Mẹ tôi sẽ nấu những món ăn tôi yêu thích, và chúng tôi sẽ có một bữa tối gia đình lớn vào tối thứ Bảy. Sáng Chủ nhật, tôi sẽ đi câu cá cùng bố tại con sông gần nhà. Buổi chiều, em gái tôi cũng sẽ về nhà, vì vậy tất cả chúng tôi sẽ dành thời gian bên nhau trong khu vườn. Tôi nghĩ đây sẽ là một cuối tuần thư giãn và hạnh phúc.",

    grammar_focus: {
      tense: "Future Simple",
      tense_vi: "Thì tương lai đơn",
      formula: "S + will + V (nguyên mẫu)",
      explanation: "Dùng để diễn tả một dự định, quyết định tức thời, hoặc dự đoán về việc sẽ xảy ra trong tương lai. Động từ luôn giữ nguyên dạng, không chia.",
      examples: [
        { en: "Next weekend, I will visit my hometown.", vi: "Cuối tuần tới, tôi sẽ về quê.", note: "'will visit' = will + V nguyên mẫu, không thêm s/es dù chủ ngữ là gì." },
        { en: "My mother will cook my favorite dishes.", vi: "Mẹ tôi sẽ nấu những món ăn tôi yêu thích.", note: "Dù chủ ngữ 'my mother' là số ít, động từ sau 'will' vẫn giữ nguyên dạng 'cook'." },
        { en: "I think it will be a relaxing weekend.", vi: "Tôi nghĩ đây sẽ là một cuối tuần thư giãn.", note: "Dùng 'will' để đưa ra dự đoán về tương lai." }
      ]
    },

    writing_exercises: [
      { id: "fp_w1", type: "fill_blank", sentence_parts: ["Tomorrow, we ", " (travel) to my grandparents' house."], answer: "will travel", hint: "will + V nguyên mẫu" },
      { id: "fp_w2", type: "sentence_ordering", words: ["will", "she", "tomorrow", "call", "you"], answer: "She will call you tomorrow." },
      { id: "fp_w3", type: "free_writing", prompt_vi: "Viết 2 câu về kế hoạch của bạn cho cuối tuần tới, dùng thì tương lai đơn.", required_keywords: ["will", "next weekend", "tomorrow"], min_words: 8 }
    ],

    dialogues: [
      { id: "future_diag_1", speaker: "An", text: "What will you do next weekend?", vietnamese: "Cuối tuần tới bạn sẽ làm gì?" },
      { id: "future_diag_2", speaker: "Huy", text: "I will visit my hometown to see my parents.", vietnamese: "Mình sẽ về quê để thăm bố mẹ." },
      { id: "future_diag_3", speaker: "An", text: "That sounds lovely. Will you go alone?", vietnamese: "Nghe hay đấy. Bạn sẽ đi một mình à?" },
      { id: "future_diag_4", speaker: "Huy", text: "No, my sister will come with me too.", vietnamese: "Không, em gái mình cũng sẽ đi cùng." },
      { id: "future_diag_5", speaker: "An", text: "I hope you will have a relaxing time together.", vietnamese: "Mình hy vọng các bạn sẽ có khoảng thời gian thư giãn bên nhau." }
    ],

    default_vocabs: [
      { word: "hometown", ipa: "/ˈhoʊmtaʊn/", vietnamese: "quê hương, quê nhà", example: "I will visit my hometown next weekend." },
      { word: "relaxing", ipa: "/rɪˈlæksɪŋ/", vietnamese: "thư giãn", example: "It will be a relaxing weekend." },
      { word: "fishing", ipa: "/ˈfɪʃɪŋ/", vietnamese: "câu cá", example: "I will go fishing with my father." },
      { word: "garden", ipa: "/ˈɡɑːrdn/", vietnamese: "khu vườn", example: "We will spend time together in the garden." },
      { word: "predict", ipa: "/prɪˈdɪkt/", vietnamese: "dự đoán", example: "I predict it will rain tomorrow." },
      { word: "plan", ipa: "/plæn/", vietnamese: "kế hoạch, dự định", example: "What is your plan for next weekend?" }
    ]
  },

  // =========================================================
  // BONUS TOPIC (giữ nguyên, chưa gắn thì cụ thể)
  // =========================================================
  {
    id: "topic_job_interview",
    topic: "Job Interview",
    level: "B1",
    title: "Succeeding in a Job Interview",
    reading_passage: "A job interview is a great opportunity to showcase your professional skills. Employers want to hire candidates who are motivated and qualified. During the interview, you should describe your strengths and previous work experience. It is important to listen carefully to the questions and answer them clearly. You should also ask thoughtful questions about the company culture to show your interest. Remember to follow up with a thank-you email afterward.",
    reading_passage_translation: "Một cuộc phỏng vấn xin việc là một cơ hội tuyệt vời để phô diễn các kỹ năng chuyên môn của bạn. Nhà tuyển dụng muốn thuê những ứng viên có động lực và đủ năng lực. Trong cuộc phỏng vấn, bạn nên mô tả các điểm mạnh và kinh nghiệm làm việc trước đây của mình. Điều quan trọng là phải lắng nghe cẩn thận các câu hỏi và trả lời chúng một cách rõ ràng. Bạn cũng nên đặt những câu hỏi sâu sắc về văn hóa công ty để thể hiện sự quan tâm của mình. Hãy nhớ gửi email cảm ơn sau đó.",
    dialogues: [
      { id: "interview_diag_1", speaker: "Interviewer", text: "Thank you for coming in today. Can you tell me a little about yourself?", vietnamese: "Cảm ơn bạn đã đến hôm nay. Bạn có thể giới thiệu đôi chút về bản thân không?" },
      { id: "interview_diag_2", speaker: "Candidate", text: "Certainly. I have three years of experience in web design, and I love creating user-friendly interfaces.", vietnamese: "Chắc chắn rồi. Tôi có ba năm kinh nghiệm thiết kế web, và tôi yêu thích tạo ra các giao diện thân thiện với người dùng." },
      { id: "interview_diag_3", speaker: "Interviewer", text: "What would you say is your greatest professional strength?", vietnamese: "Bạn tự nhận xét thế mạnh chuyên môn lớn nhất của mình là gì?" },
      { id: "interview_diag_4", speaker: "Candidate", text: "I am highly organized and excel at collaborating with multidisciplinary teams.", vietnamese: "Tôi cực kỳ ngăn nắp và xuất sắc trong việc cộng tác với các đội ngũ đa chuyên môn." },
      { id: "interview_diag_5", speaker: "Interviewer", text: "That is excellent. Do you have any questions for us about the role?", vietnamese: "Tuyệt vời. Bạn có câu hỏi nào cho chúng tôi về vai trò này không?" }
    ],
    default_vocabs: [
      { word: "opportunity", ipa: "/ˌɒpəˈtjuːnəti/", vietnamese: "cơ hội", example: "A job interview is a great opportunity to show your skills." },
      { word: "showcase", ipa: "/ˈʃəʊkeɪs/", vietnamese: "trình bày, trưng bày, phô diễn", example: "Use this project to showcase your coding abilities." },
      { word: "motivated", ipa: "/ˈməʊtɪveɪtɪd/", vietnamese: "có động lực, nhiệt huyết", example: "We are looking for motivated software engineers." },
      { word: "qualified", ipa: "/ˈkwɒlɪfaɪd/", vietnamese: "đủ trình độ, năng lực", example: "She is highly qualified for the manager position." },
      { word: "strength", ipa: "/streŋθ/", vietnamese: "thế mạnh, điểm mạnh", example: "My greatest strength is my problem-solving ability." },
      { word: "collaborating", ipa: "/kəˈlæbəreɪtɪŋ/", vietnamese: "hợp tác, cộng tác", example: "Collaborating with others helps us learn faster." }
    ]
  }
];
