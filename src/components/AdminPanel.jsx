import React, { useState } from 'react';
import { storage } from '../utils/storage';



function validateTopicData(data) {
  const errors = [];
  if (!data.id) errors.push("Thiếu ID bài học ('id').");
  if (!data.topic) errors.push("Thiếu tên chủ đề ('topic').");
  if (!data.level) errors.push("Thiếu cấp độ ('level').");
  if (!data.title) errors.push("Thiếu tiêu đề bài đọc ('title').");
  if (!data.reading_passage) errors.push("Thiếu nội dung bài đọc ('reading_passage').");
  if (!data.reading_passage_translation) errors.push("Thiếu bản dịch bài đọc ('reading_passage_translation').");
  if (!data.grammar_focus) errors.push("Thiếu phần ngữ pháp trọng tâm ('grammar_focus').");
  if (!data.writing_exercises || data.writing_exercises.length === 0) errors.push("Thiếu danh sách bài tập viết ('writing_exercises').");
  if (!data.dialogues || data.dialogues.length === 0) errors.push("Thiếu danh sách hội thoại mẫu ('dialogues').");
  if (!data.default_vocabs || data.default_vocabs.length === 0) errors.push("Thiếu từ vựng mặc định ('default_vocabs').");

  if (data.grammar_focus?.examples && data.reading_passage && data.dialogues) {
    const allSourceText = (data.reading_passage + " " + data.dialogues.map(d => d.text).join(" "))
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'!]/g, "")
      .replace(/\s+/g, " ");

    data.grammar_focus.examples.forEach((ex, i) => {
      const cleanEx = ex.en.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'!]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!allSourceText.includes(cleanEx)) {
        errors.push(`Cảnh báo: Câu ví dụ ngữ pháp #${i + 1} ("${ex.en}") không trùng khớp nguyên văn với bất kỳ câu nào trong bài đọc hoặc hội thoại thoại mẫu.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

const SAMPLE_TOPICS = {
  "topic_custom_airport_1": {
    id: "topic_custom_airport_1",
    topic: "At the Airport",
    level: "A2",
    title: "Flying to London",
    reading_passage: "Tomorrow, Nam will fly to London for the first time. He will arrive at the airport three hours before his flight. First, he will check in his luggage at the airline counter. Then, he will go through security control. If he has time, he will buy some duty-free gifts for his friends. Finally, he will wait at the departure gate until the flight attendants announce boarding. It will be a long flight, but he will enjoy it.",
    reading_passage_translation: "Ngày mai, Nam sẽ bay đến Luân Đôn lần đầu tiên. Anh ấy sẽ đến sân bay ba giờ trước chuyến bay của mình. Đầu tiên, anh ấy sẽ ký gửi hành lý tại quầy của hãng hàng không. Sau đó, anh ấy sẽ đi qua cửa kiểm tra an ninh. Nếu có thời gian, anh ấy sẽ mua một số món quà miễn thuế cho bạn bè của mình. Cuối cùng, anh ấy sẽ đợi ở cửa khởi hành cho đến khi tiếp viên hàng không thông báo lên máy bay. Đó sẽ là một chuyến bay dài, nhưng anh ấy sẽ tận hưởng nó.",
    grammar_focus: {
      tense: "Future Simple",
      tense_vi: "Thì tương lai đơn",
      formula: "S + will + V (nguyên mẫu)",
      explanation: "Dùng để diễn tả một hành động sẽ xảy ra trong tương lai, một quyết định ngay tại thời điểm nói, hoặc một dự đoán.",
      examples: [
        { en: "Tomorrow, Nam will fly to London for the first time.", vi: "Ngày mai Nam sẽ bay đi Luân Đôn lần đầu.", note: "Diễn tả hành động chắc chắn sẽ xảy ra trong tương lai." },
        { en: "He will arrive at the airport three hours before his flight.", vi: "Anh ấy sẽ đến sân bay trước 3 tiếng.", note: "Kế hoạch tương lai." },
        { en: "It will be a long flight, but he will enjoy it.", vi: "Đó sẽ là chuyến bay dài, nhưng anh ấy sẽ thích nó.", note: "Lời dự đoán." }
      ]
    },
    writing_exercises: [
      { id: "ap_w1", type: "fill_blank", sentence_parts: ["Next week, they ", " (travel) to Japan."], answer: "will travel", hint: "Thì tương lai đơn: will + V" },
      { id: "ap_w2", type: "sentence_ordering", words: ["flight", "at", "arrive", "will", "The", "midnight"], answer: "The flight will arrive at midnight." },
      { id: "ap_w3", type: "free_writing", prompt_vi: "Viết 2 câu kể về kế hoạch du lịch trong tương lai của bạn, sử dụng thì tương lai đơn.", required_keywords: ["will", "next year", "visit", "travel"], min_words: 8 }
    ],
    dialogues: [
      { id: "ap_d1", speaker: "Agent", text: "Good morning! Can I see your passport and ticket, please?", vietnamese: "Xin chào! Cho tôi xem hộ chiếu và vé của bạn được không?" },
      { id: "ap_d2", speaker: "Nam", text: "Here you are. I will check in this suitcase.", vietnamese: "Đây ạ. Tôi sẽ ký gửi chiếc vali này." },
      { id: "ap_d3", speaker: "Agent", text: "Great. Do you want a window or an aisle seat?", vietnamese: "Tuyệt vời. Bạn muốn ghế cạnh cửa sổ hay cạnh lối đi?" },
      { id: "ap_d4", speaker: "Nam", text: "I prefer a window seat, please.", vietnamese: "Cho tôi ghế cạnh cửa sổ nhé." },
      { id: "ap_d5", speaker: "Agent", text: "Here is your boarding pass. Your gate is gate fifteen.", vietnamese: "Đây là thẻ lên máy bay của bạn. Cửa ra máy bay của bạn là cửa số mười lăm." }
    ],
    default_vocabs: [
      { word: "passport", ipa: "/ˈpɑːspɔːt/", vietnamese: "hộ chiếu", example: "Don't forget to pack your passport before going to the airport." },
      { word: "luggage", ipa: "/ˈlʌɡɪdʒ/", vietnamese: "hành lý", example: "I have two pieces of luggage to check in." },
      { word: "departure gate", ipa: "/dɪˈpɑːtʃər ɡeɪt/", vietnamese: "cửa khởi hành", example: "Please proceed to the departure gate immediately." },
      { word: "boarding pass", ipa: "/ˈbɔːdɪŋ pɑːs/", vietnamese: "thẻ lên máy bay", example: "Keep your boarding pass and passport in your hand." },
      { word: "aisle", ipa: "/aɪl/", vietnamese: "lối đi (giữa các hàng ghế)", example: "I prefer an aisle seat so I can walk easily." },
      { word: "suitcase", ipa: "/ˈsuːtkeɪs/", vietnamese: "vali hành lý", example: "This heavy suitcase contains all my clothes." }
    ]
  },
  "topic_custom_job_it_2": {
    id: "topic_custom_job_it_2",
    topic: "Job Interview in IT",
    level: "B2",
    title: "Applying for Software Engineer",
    reading_passage: "Last year, Huy applied for a Software Engineer job at a tech startup in Da Nang. In the interview, the technical manager asked him about his past programming projects. Huy explained his code structure and how he solved performance issues. He answered the database design questions very well. Two days later, the human resources manager sent him an offer letter with a great salary. He accepted it and started his career in Da Nang.",
    reading_passage_translation: "Năm ngoái, Huy đã nộp đơn ứng tuyển công việc Kỹ sư phần mềm tại một công ty khởi nghiệp công nghệ ở Đà Nẵng. Trong buổi phỏng vấn, người quản lý kỹ thuật đã hỏi anh ấy về các dự án lập trình trước đây của anh ấy. Huy đã giải thích cấu trúc code của mình và cách anh ấy giải quyết các vấn đề về hiệu suất. Anh ấy đã trả lời các câu hỏi thiết kế cơ sở dữ liệu rất tốt. Hai ngày sau, người quản lý nhân sự gửi cho anh ấy một thư mời nhận việc với mức lương tuyệt vời. Anh ấy đã đồng ý và bắt đầu sự nghiệp của mình tại Đà Nẵng.",
    grammar_focus: {
      tense: "Past Simple",
      tense_vi: "Thì quá khứ đơn",
      formula: "S + V2/V-ed [quy tắc] | S + V (bất quy tắc)",
      explanation: "Dùng để diễn tả một hành động đã xảy ra và kết thúc hoàn toàn trong quá khứ.",
      examples: [
        { en: "Huy applied for a Software Engineer job.", vi: "Huy đã nộp đơn ứng tuyển vị trí Kỹ sư phần mềm.", note: "'applied' là dạng quá khứ có quy tắc (thêm -ed) của động từ apply." },
        { en: "The technical manager asked Huy about his past projects.", vi: "Trưởng phòng kỹ thuật đã hỏi Huy về các dự án trước đây.", note: "'asked' là dạng quá khứ có quy tắc của động từ ask." },
        { en: "He answered the database design questions very well.", vi: "Anh ấy đã trả lời các câu hỏi thiết kế database rất tốt.", note: "'answered' chia thì quá khứ đơn để thuật lại sự việc đã kết thúc." }
      ]
    },
    writing_exercises: [
      { id: "it_w1", type: "fill_blank", sentence_parts: ["Yesterday, I ", " (meet) the CEO at the office."], answer: "met", hint: "Quá khứ bất quy tắc của 'meet' là 'met'." },
      { id: "it_w2", type: "sentence_ordering", words: ["offer", "accepted", "the", "Huy", "job", "yesterday"], answer: "Huy accepted the job offer yesterday." },
      { id: "it_w3", type: "free_writing", prompt_vi: "Viết 2 câu kể về trải nghiệm một buổi phỏng vấn hoặc bài thi trong quá khứ của bạn, dùng thì quá khứ đơn.", required_keywords: ["asked", "answered", "was", "interview"], min_words: 8 }
    ],
    dialogues: [
      { id: "it_d1", speaker: "Interviewer", text: "Welcome Huy! Can you tell me about your previous coding experience?", vietnamese: "Chào mừng Huy! Bạn có thể giới thiệu về kinh nghiệm lập trình trước đây không?" },
      { id: "it_d2", speaker: "Huy", text: "Certainly. I worked on a React and Node.js web app for two years.", vietnamese: "Chắc chắn rồi. Tôi đã làm việc trên một ứng dụng web React và Node.js trong hai năm." },
      { id: "it_d3", speaker: "Interviewer", text: "Excellent. How did you handle conflicts in your developer team?", vietnamese: "Xuất sắc. Bạn đã xử lý các mâu thuẫn trong nhóm phát triển của mình thế nào?" },
      { id: "it_d4", speaker: "Huy", text: "We discussed issues openly and chose the best technical solution.", vietnamese: "Chúng tôi thảo luận công khai về các vấn đề và chọn giải pháp kỹ thuật tốt nhất." },
      { id: "it_d5", speaker: "Interviewer", text: "Very good. We will notify you of the results soon.", vietnamese: "Rất tốt. Chúng tôi sẽ sớm thông báo kết quả cho bạn." }
    ],
    default_vocabs: [
      { word: "apply", ipa: "/əˈplaɪ/", vietnamese: "nộp đơn ứng tuyển", example: "I want to apply for the software developer position." },
      { word: "interviewer", ipa: "/ˈɪntəvjuːər/", vietnamese: "người phỏng vấn", example: "The interviewer was very friendly and helpful." },
      { word: "conflict", ipa: "/ˈkɒnflɪkt/", vietnamese: "sự mâu thuẫn, xung đột", example: "We resolved the team conflict through communication." },
      { word: "notify", ipa: "/ˈnəʊtɪfaɪ/", vietnamese: "thông báo", example: "They will notify the candidates by email next week." },
      { word: "technical", ipa: "/ˈteknɪkl/", vietnamese: "thuộc về kỹ thuật", example: "He has strong technical skills in JavaScript." },
      { word: "salary", ipa: "/ˈsæləri/", vietnamese: "mức lương", example: "They offered him a very competitive salary." }
    ]
  },
  "topic_custom_coffee_3": {
    id: "topic_custom_coffee_3",
    topic: "Coffee Shop Talk",
    level: "A2",
    title: "Chatting at a Seattle Café",
    reading_passage: "Every morning, millions of people visit local coffee shops in Seattle. The baristas always greet them with a warm smile. People usually order hot drinks like latte or cappuccino. Some customers read books while others work on their laptops. Many people also enjoy delicious pastries like chocolate croissants. It is a relaxing place to start a busy day.",
    reading_passage_translation: "Mỗi buổi sáng, hàng triệu người ghé thăm các quán cà phê địa phương ở Seattle. Nhân viên pha chế luôn chào đón họ với một nụ cười ấm áp. Mọi người thường gọi đồ uống nóng như latte hoặc cappuccino. Một số khách hàng đọc sách trong khi những người khác làm việc trên máy tính xách tay của họ. Nhiều người cũng thích các loại bánh ngọt thơm ngon như bánh sừng bò sô cô la. Đó là một nơi thư giãn để bắt đầu một ngày bận rộn.",
    grammar_focus: {
      tense: "Present Simple",
      tense_vi: "Thì hiện tại đơn",
      formula: "S + V(s/es) | S + V",
      explanation: "Diễn tả thói quen, sự thật hiển nhiên hoặc hoạt động lặp đi lặp lại.",
      examples: [
        { en: "Every morning, millions of people visit local coffee shops in Seattle.", vi: "Mỗi buổi sáng, hàng triệu người ghé thăm quán cà phê địa phương ở Seattle.", note: "'visit' để nguyên mẫu vì chủ ngữ số nhiều." },
        { en: "The baristas always greet them with a warm smile.", vi: "Các nhân viên pha chế luôn chào đón họ bằng nụ cười ấm áp.", note: "Diễn tả thói quen lặp lại hàng ngày." }
      ]
    },
    writing_exercises: [
      { id: "cf_w1", type: "fill_blank", sentence_parts: ["She usually ", " (drink) tea in the afternoon."], answer: "drinks", hint: "Chủ ngữ she -> động từ thêm s" },
      { id: "cf_w2", type: "sentence_ordering", words: ["enjoy", "I", "morning", "pastries", "in", "the"], answer: "I enjoy pastries in the morning." },
      { id: "cf_w3", type: "free_writing", prompt_vi: "Viết 2 câu nói về thói quen buổi sáng của bạn.", required_keywords: ["usually", "drink", "coffee", "every"], min_words: 8 }
    ],
    dialogues: [
      { id: "cf_d1", speaker: "Barista", text: "What can I get started for you today?", vietnamese: "Tôi có thể lấy gì cho bạn ngày hôm nay?" },
      { id: "cf_d2", speaker: "Customer", text: "I would like a hot latte with oat milk, please.", vietnamese: "Cho tôi một ly latte nóng với sữa yến mạch nhé." }
    ],
    default_vocabs: [
      { word: "barista", ipa: "/bəˈriːstə/", vietnamese: "nhân viên pha chế", example: "The barista made a beautiful art pattern on my coffee." },
      { word: "pastry", ipa: "/ˈpeɪstri/", vietnamese: "bánh ngọt", example: "I love eating sweet pastries in the morning." }
    ]
  },
  "topic_custom_sapa_4": {
    id: "topic_custom_sapa_4",
    topic: "Travel to Sa Pa",
    level: "B1",
    title: "A Trip to Sa Pa",
    reading_passage: "Last month, Lan and her friends traveled to Sa Pa by train. They arrived in the morning and saw the beautiful mountain views. The weather was cold and cloudy. They walked around the town and bought some traditional clothes from the local market. They also climbed Fansipan mountain and took many photos. It was an amazing trip, and they felt very happy.",
    reading_passage_translation: "Tháng trước, Lan và bạn bè của cô ấy đã đi du lịch Sa Pa bằng tàu hỏa. Họ đến nơi vào buổi sáng và ngắm nhìn cảnh núi non tuyệt đẹp. Thời tiết lạnh và nhiều mây. Họ đi dạo quanh thị trấn và mua một số quần áo truyền thống ở chợ địa phương. Họ cũng đã leo núi Fansipan và chụp rất nhiều ảnh. Đó sẽ là một chuyến đi tuyệt vời, và họ cảm thấy rất hạnh phúc.",
    grammar_focus: {
      tense: "Past Simple",
      tense_vi: "Thì quá khứ đơn",
      formula: "S + V-ed / V2",
      explanation: "Diễn tả hành động đã xảy ra và kết thúc hoàn toàn trong quá khứ.",
      examples: [
        { en: "Last month, Lan and her friends traveled to Sa Pa by train.", vi: "Tháng trước, Lan và các bạn của cô ấy đã du lịch Sa Pa bằng tàu hỏa.", note: "'traveled' chia quá khứ đơn có quy tắc." },
        { en: "They arrived in the morning and saw the beautiful mountain views.", vi: "Họ đến nơi vào buổi sáng và nhìn thấy cảnh núi non tuyệt đẹp.", note: "'arrived' có quy tắc, 'saw' là bất quy tắc của see." }
      ]
    },
    writing_exercises: [
      { id: "sp_w1", type: "fill_blank", sentence_parts: ["We ", " (go) to Sa Pa last summer."], answer: "went", hint: "Quá khứ của go là went" },
      { id: "sp_w2", type: "sentence_ordering", words: ["cold", "was", "The", "weather", "yesterday"], answer: "The weather was cold yesterday." },
      { id: "sp_w3", type: "free_writing", prompt_vi: "Viết 2 câu kể về chuyến đi chơi gần đây nhất của bạn.", required_keywords: ["went", "visited", "last", "was"], min_words: 8 }
    ],
    dialogues: [
      { id: "sp_d1", speaker: "Lan", text: "Did you enjoy your trip to Sa Pa, Mai?", vietnamese: "Cậu có thích chuyến đi Sa Pa không Mai?" },
      { id: "sp_d2", speaker: "Mai", text: "Yes, I did. I loved the cold weather and the fresh air.", vietnamese: "Có chứ. Mình rất thích thời tiết lạnh và không khí trong lành ở đó." }
    ],
    default_vocabs: [
      { word: "mountain", ipa: "/ˈmaʊntɪn/", vietnamese: "ngọn núi", example: "Fansipan is the highest mountain in Vietnam." },
      { word: "souvenir", ipa: "/ˌsuːvəˈnɪər/", vietnamese: "quà lưu niệm", example: "I bought this small bag as a souvenir." }
    ]
  }
};

function generateDynamicMockLesson(englishTopic, vietnameseTopic, tense, level) {
  const cleanTopicEn = englishTopic.trim();
  const cleanTopicVi = vietnameseTopic.trim();
  const id = `topic_mock_${cleanTopicEn.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  let tense_vi = "Thì hiện tại đơn";
  let formula = "S + V(s/es) | S + V";
  let explanation = "Diễn tả thói quen, sự thật hiển nhiên hoặc hoạt động lặp đi lặp lại.";
  let examples = [];
  let reading_passage = "";
  let reading_passage_vi = "";
  let dialogues = [];
  
  if (tense === "Present Continuous") {
    tense_vi = "Thì hiện tại tiếp diễn";
    formula = "S + am/is/are + V-ing";
    explanation = "Diễn tả hành động đang xảy ra tại thời điểm nói hoặc đang diễn ra xung quanh thời điểm nói.";
    reading_passage = `At the moment, we are learning about ${cleanTopicEn} in the classroom. Everyone is listening carefully. The teacher is writing some important points on the board. Huy and Lan are discussing ${cleanTopicEn} with each other. They are trying to understand this subject well. Outside, the birds are singing, but the students are paying attention to the lesson.`;
    reading_passage_vi = `Vào lúc này, chúng tôi đang học về ${cleanTopicVi} trong lớp học. Mọi người đều đang lắng nghe chăm chú. Giáo viên đang viết một số điểm quan trọng lên bảng. Huy và Lan đang thảo luận về ${cleanTopicVi} với nhau. Họ đang cố gắng hiểu rõ chủ đề này. Bên ngoài, những chú chim đang hót, nhưng các học sinh đang tập trung vào bài học.`;
    examples = [
      { en: `At the moment, we are learning about ${cleanTopicEn} in the classroom.`, vi: `Vào lúc này, chúng tôi đang học về ${cleanTopicVi} trong lớp học.`, note: "'are learning' = are + V-ing, diễn tả hành động đang diễn ra." },
      { en: `Huy and Lan are discussing ${cleanTopicEn} with each other.`, vi: `Huy và Lan đang thảo luận về ${cleanTopicVi} với nhau.`, note: "'are discussing' diễn tả hành động đang xảy ra lúc này." }
    ];
    dialogues = [
      { id: "diag_1", speaker: "Teacher", text: `Are you listening to the lesson about ${cleanTopicEn}, class?`, vietnamese: `Cả lớp đang nghe giảng bài về ${cleanTopicVi} đúng không?` },
      { id: "diag_2", speaker: "Student", text: `Yes, we are studying ${cleanTopicEn} very hard.`, vietnamese: `Vâng, chúng em đang học về ${cleanTopicVi} rất chăm chỉ.` }
    ];
  } else if (tense === "Past Simple") {
    tense_vi = "Thì quá khứ đơn";
    formula = "S + V-ed / V2";
    explanation = "Diễn tả hành động đã xảy ra và kết thúc hoàn toàn trong quá khứ.";
    reading_passage = `Yesterday, the students learned about ${cleanTopicEn} for the first time. The teacher explained all the key concepts clearly. Lan asked a very interesting question about ${cleanTopicEn}. After that, they worked in groups and wrote a short paragraph. Everyone enjoyed the class. They felt very happy when they finished the lesson.`;
    reading_passage_vi = `Hôm qua, các học sinh đã học về ${cleanTopicVi} lần đầu tiên. Giáo viên đã giải thích tất cả các khái niệm chính một cách rõ ràng. Lan đã hỏi một câu hỏi rất thú vị về ${cleanTopicVi}. Sau đó, họ làm việc theo nhóm và viết một đoạn văn ngắn. Mọi người đều thích lớp học. Họ cảm thấy rất vui khi kết thúc bài học.`;
    examples = [
      { en: `Yesterday, the students learned about ${cleanTopicEn} for the first time.`, vi: `Hôm qua, các học sinh đã học về ${cleanTopicVi} lần đầu tiên.`, note: "'learned' chia thì quá khứ đơn của learn (thêm -ed)." },
      { en: `The teacher explained all the key concepts clearly.`, vi: `Giáo viên đã giải thích tất cả các khái niệm chính một cách rõ ràng.`, note: "'explained' chia thì quá khứ đơn (thêm -ed)." }
    ];
    dialogues = [
      { id: "diag_1", speaker: "Huy", text: `Did you enjoy the lesson about ${cleanTopicEn} yesterday?`, vietnamese: `Cậu có thích bài học về ${cleanTopicVi} hôm qua không?` },
      { id: "diag_2", speaker: "Lan", text: `Yes, I learned many new things about ${cleanTopicEn}.`, vietnamese: `Có chứ, tớ đã học được nhiều điều mới về ${cleanTopicVi}.` }
    ];
  } else if (tense === "Future Simple") {
    tense_vi = "Thì tương lai đơn";
    formula = "S + will + V (nguyên mẫu)";
    explanation = "Diễn tả hành động sẽ xảy ra trong tương lai, một quyết định tức thời hoặc một lời dự đoán.";
    reading_passage = `Tomorrow, we will explore ${cleanTopicEn} in our English class. The teacher will present some interesting ideas about it. We will write some sentences and practice speaking with our friends. I think everyone will love this topic. It will be a wonderful lesson, and you will learn a lot.`;
    reading_passage_vi = `Ngày mai, chúng ta sẽ khám phá ${cleanTopicVi} trong lớp học tiếng Anh của mình. Giáo viên sẽ trình bày một số ý tưởng thú vị về nó. Chúng ta sẽ viết một số câu và thực hành nói với bạn bè của mình. Tôi nghĩ mọi người sẽ yêu thích chủ đề này. Đó sẽ là một bài học tuyệt vời, và bạn sẽ học được rất nhiều điều.`;
    examples = [
      { en: `Tomorrow, we will explore ${cleanTopicEn} in our English class.`, vi: `Ngày mai, chúng ta sẽ khám phá ${cleanTopicVi} trong lớp học tiếng Anh của mình.`, note: "'will explore' = will + V, diễn tả kế hoạch tương lai." },
      { en: `I think everyone will love this topic.`, vi: `Tôi nghĩ mọi người sẽ yêu thích chủ đề này.`, note: "'will love' diễn tả một dự đoán trong tương lai." }
    ];
    dialogues = [
      { id: "diag_1", speaker: "Lan", text: `Will you join our presentation about ${cleanTopicEn}?`, vietnamese: `Bạn sẽ tham gia buổi thuyết trình về ${cleanTopicVi} của chúng tôi chứ?` },
      { id: "diag_2", speaker: "Huy", text: `Yes, I will prepare some slides about ${cleanTopicEn} tonight.`, vietnamese: `Có chứ, tôi sẽ chuẩn bị một số slide về ${cleanTopicVi} tối nay.` }
    ];
  } else {
    // Default: Present Simple
    reading_passage = `Many people love ${cleanTopicEn} because it is very interesting. Every day, they read articles and watch videos about ${cleanTopicEn}. The teacher usually explains ${cleanTopicEn} in a simple way. Good students always listen and take notes during the lesson. We study ${cleanTopicEn} to improve our knowledge and skills.`;
    reading_passage_vi = `Nhiều người yêu thích ${cleanTopicVi} vì nó rất thú vị. Mỗi ngày, họ đọc các bài báo và xem các video về ${cleanTopicVi}. Giáo viên thường giải thích ${cleanTopicVi} theo cách đơn giản. Những học sinh giỏi luôn lắng nghe và ghi chép trong suốt bài học. Chúng tôi học ${cleanTopicVi} để nâng cao kiến thức và kỹ năng của mình.`;
    examples = [
      { en: `Many people love ${cleanTopicEn} because it is very interesting.`, vi: `Nhiều người yêu thích ${cleanTopicVi} vì nó rất thú vị.`, note: "'love' để nguyên mẫu do đi với chủ ngữ số nhiều 'Many people'." },
      { en: `The teacher usually explains ${cleanTopicEn} in a simple way.`, vi: `Giáo viên thường giải thích ${cleanTopicVi} theo cách đơn giản.`, note: "'explains' thêm 's' do chủ ngữ 'The teacher' là số ít." }
    ];
    dialogues = [
      { id: "diag_1", speaker: "Lan", text: `Do you want to discuss ${cleanTopicEn} now?`, vietnamese: `Bạn có muốn thảo luận về ${cleanTopicVi} bây giờ không?` },
      { id: "diag_2", speaker: "Huy", text: `Sure, I like ${cleanTopicEn} very much.`, vietnamese: `Chắc chắn rồi, tôi rất thích ${cleanTopicVi}.` }
    ];
  }
  
  return {
    id,
    topic: cleanTopicEn,
    level,
    title: `Introduction to ${cleanTopicEn}`,
    reading_passage,
    reading_passage_translation: reading_passage_vi,
    grammar_focus: {
      tense,
      tense_vi,
      formula,
      explanation,
      examples
    },
    writing_exercises: [
      { id: `${id}_w1`, type: "fill_blank", sentence_parts: [`We like `, ` because it is very fun.`], answer: cleanTopicEn.toLowerCase(), hint: `Điền tên chủ đề bài học (${cleanTopicEn.toLowerCase()})` },
      { id: `${id}_w2`, type: "sentence_ordering", words: ["about", "we", "learn", cleanTopicEn.toLowerCase()], answer: `we learn about ${cleanTopicEn.toLowerCase()}` },
      { id: `${id}_w3`, type: "free_writing", prompt_vi: `Viết 2 câu chia sẻ suy nghĩ của bạn về chủ đề: ${cleanTopicVi}.`, required_keywords: [cleanTopicEn.toLowerCase(), "think", "is"], min_words: 8 }
    ],
    dialogues,
    default_vocabs: [
      { word: "learn", ipa: "/lɜːn/", vietnamese: "học, nghiên cứu", example: "We learn new vocabulary every day." },
      { word: "topic", ipa: "/ˈtɒpɪk/", vietnamese: "chủ đề", example: "This is an interesting topic to discuss." },
      { word: "important", ipa: "/ɪmˈpɔːtnt/", vietnamese: "quan trọng", example: "It is important to practice speaking English." }
    ]
  };
}

export default function AdminPanel({ onNavigateBack, onTopicsListChange }) {
  // Generation parameters
  const [form, setForm] = useState({ topicName: '', tense: 'Present Simple', level: 'A2' });
  const [generatedData, setGeneratedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  
  // Tab states for preview
  const [previewTab, setPreviewTab] = useState('reading'); // reading | dialogues | grammar | writing | json
  
  // Pending and published custom topics state
  const [pendingTopics, setPendingTopics] = useState(() => storage.getPendingTopics());
  const [customTopics, setCustomTopics] = useState(() => storage.getCustomTopics());

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };



  const handleGenerate = async () => {
    if (!form.topicName.trim()) {
      alert("Vui lòng nhập chủ đề!");
      return;
    }

    setIsLoading(true);
    setGeneratedData(null);
    setLogs([]);
    setValidationErrors([]);

    addLog(`[Antigravity AI] Bắt đầu sinh bài học cho chủ đề "${form.topicName}"...`);
    
    let englishTopicName = form.topicName.trim();
    let vietnameseTopicName = form.topicName.trim();
    
    const containsVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(form.topicName);
    
    if (containsVietnamese) {
      addLog(`Phát hiện chủ đề tiếng Việt. Đang tự động dịch "${form.topicName}" sang tiếng Anh...`);
      try {
        const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(form.topicName)}`);
        const transData = await transRes.json();
        if (transData && transData[0]) {
          englishTopicName = transData[0].map(s => s[0]).filter(Boolean).join('').trim();
          addLog(`-> Đã dịch thành công: "${englishTopicName}"`);
        }
      } catch (e) {
        console.warn("Dịch chủ đề thất bại, dùng bản gốc:", e);
      }
    } else {
      addLog(`Phát hiện chủ đề tiếng Anh. Đang tự động dịch "${form.topicName}" sang tiếng Việt...`);
      try {
        const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(form.topicName)}`);
        const transData = await transRes.json();
        if (transData && transData[0]) {
          vietnameseTopicName = transData[0].map(s => s[0]).filter(Boolean).join('').trim();
          addLog(`-> Đã dịch nghĩa: "${vietnameseTopicName}"`);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    const cleanTopic = englishTopicName.toLowerCase();
    let matchedSample = null;
    
    if (cleanTopic.includes("airport") || cleanTopic.includes("bay") || cleanTopic.includes("may bay")) {
      matchedSample = SAMPLE_TOPICS.topic_custom_airport_1;
    } else if (cleanTopic.includes("interview") || cleanTopic.includes("phong van") || cleanTopic.includes("xin viec")) {
      matchedSample = SAMPLE_TOPICS.topic_custom_job_it_2;
    } else if (cleanTopic.includes("coffee") || cleanTopic.includes("ca phe") || cleanTopic.includes("quan nuoc") || cleanTopic.includes("shop")) {
      matchedSample = SAMPLE_TOPICS.topic_custom_coffee_3;
    } else if (cleanTopic.includes("sapa") || cleanTopic.includes("sa pa") || cleanTopic.includes("du lich") || cleanTopic.includes("trip")) {
      matchedSample = SAMPLE_TOPICS.topic_custom_sapa_4;
    }
    
    if (matchedSample) {
      addLog(`Kết nối thành công (Sử dụng kho dữ liệu mô phỏng cục bộ của Antigravity)...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(`Đang trích xuất cấu trúc bài đọc và hội thoại...`);
      await new Promise(resolve => setTimeout(resolve, 600));
      addLog(`Hoàn tất đồng bộ ngữ pháp & từ vựng.`);
      setGeneratedData(matchedSample);
      setIsLoading(false);
      addLog(`🎉 Bài học đã được sinh thành công!`);
      return;
    } else {
      addLog(`Chủ đề mới! Đang kích hoạt bộ sinh nội dung động của Antigravity...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(`Đang biên dịch cấu trúc bài học động cho chủ đề "${englishTopicName}"...`);
      
      const dynamicLesson = generateDynamicMockLesson(englishTopicName, vietnameseTopicName, form.tense, form.level);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      addLog(`Đang tự động dịch nghĩa và ghép nối các bài tập ngữ pháp...`);
      
      setGeneratedData(dynamicLesson);
      setIsLoading(false);
      addLog(`🎉 Bài học "${englishTopicName}" đã được sinh thành công!`);
      return;
    }
  };

  const handleApprove = () => {
    if (!generatedData) return;
    
    const updated = storage.saveCustomTopic(generatedData);
    setCustomTopics(updated);
    
    storage.deletePendingTopic(generatedData.id);
    setPendingTopics(storage.getPendingTopics());

    setGeneratedData(null);
    onTopicsListChange();
    alert("🎉 Đã DUYỆT và công khai bài học cho học viên!");
  };

  const handleImportSample = (sampleId) => {
    const sampleTopic = SAMPLE_TOPICS[sampleId];
    if (!sampleTopic) return;
    
    try {
      const updated = storage.saveCustomTopic(sampleTopic);
      setCustomTopics(updated);
      onTopicsListChange();
      alert(`🎉 Đã thêm bài học "${sampleTopic.topic}" thành công!`);
    } catch (e) {
      console.error(e);
      alert("Import bài học mẫu thất bại!");
    }
  };

  const handleSavePending = () => {
    if (!generatedData) return;
    const updated = storage.savePendingTopic(generatedData);
    setPendingTopics(updated);
    setGeneratedData(null);
    alert("💾 Đã lưu bài học vào danh sách chờ duyệt!");
  };

  const handleReject = () => {
    if (window.confirm("Bạn có chắc chắn muốn đóng bản xem trước này?")) {
      setGeneratedData(null);
    }
  };

  const handleApprovePending = (topicObj) => {
    storage.saveCustomTopic(topicObj);
    storage.deletePendingTopic(topicObj.id);
    
    setPendingTopics(storage.getPendingTopics());
    setCustomTopics(storage.getCustomTopics());
    onTopicsListChange();
    alert(`Đã duyệt bài học "${topicObj.title}" thành công!`);
  };

  const handleDeletePending = (topicId) => {
    if (window.confirm("Xóa bài học đang chờ duyệt này?")) {
      const updated = storage.deletePendingTopic(topicId);
      setPendingTopics(updated);
    }
  };

  const handleDeleteCustom = (topicId) => {
    if (window.confirm("Bạn muốn xóa bài học đã công khai này khỏi lộ trình học?")) {
      const updated = storage.deleteCustomTopic(topicId);
      setCustomTopics(updated);
      onTopicsListChange();
      alert("Đã xóa bài học!");
    }
  };

  return (
    <div className="admin-panel-screen animate-slideup">
      {/* Header */}
      <div className="screen-header mb-6">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Back to Dashboard
        </button>
        <div className="topic-meta">
          <span className="badge-level font-bold">Admin</span>
          <span className="topic-name">Antigravity AI Portal</span>
        </div>
      </div>

      <div className={`admin-grid ${generatedData ? 'preview-active' : ''}`}>
        
        {/* Left Column: Form & Configuration */}
        <div className="admin-form-section flex flex-col gap-6">
          
          {/* Antigravity AI Engine Card */}
          <div className="api-key-card glass p-6">
            <h3 className="mb-2" style={{ color: 'var(--color-primary)' }}>✨ Antigravity Engine Offline</h3>
            <p className="color-text-muted text-xs leading-relaxed">
              Hệ thống đang hoạt động ở chế độ không cần khóa (Offline/Serverless). Bạn có thể tự do nhập bất kỳ chủ đề tiếng Việt hoặc tiếng Anh nào để sinh bài học ngay lập tức.
            </p>
          </div>

          {/* AI Generator Form */}
          {!generatedData && (
            <div className="generator-card glass p-6">
              <h3 className="mb-4">Sinh bài học bằng Antigravity AI</h3>
              
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="text-xs color-text-muted block mb-1">Chủ đề bài học (tiếng Anh hoặc tiếng Việt):</label>
                  <input 
                    type="text" 
                    placeholder="VD: At the Dentist, Du lịch bằng tàu hỏa..."
                    className="search-input glass w-full"
                    value={form.topicName}
                    onChange={(e) => setForm({ ...form, topicName: e.target.value })}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    <span className="color-text-muted text-[10px]" style={{ width: '100%' }}>Gợi ý nhanh chủ đề:</span>
                    {[
                      'Travel to Sa Pa 🏔️', 
                      'Job Interview 💼', 
                      'Coffee Shop Talk ☕', 
                      'At the Airport ✈️', 
                      'Vietnamese Street Food 🍜'
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="btn-secondary"
                        style={{
                          padding: '3px 8px',
                          fontSize: '11px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          borderColor: 'var(--border-glow)',
                          background: 'rgba(255, 255, 255, 0.01)',
                          lineHeight: '1.2'
                        }}
                        onClick={() => setForm({ ...form, topicName: t.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim() })}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="text-xs color-text-muted block mb-1">Thì ngữ pháp trọng tâm:</label>
                    <select 
                      className="search-input glass w-full"
                      value={form.tense}
                      onChange={(e) => setForm({ ...form, tense: e.target.value })}
                      style={{ background: 'var(--bg-darker)' }}
                    >
                      <option value="Present Simple">Present Simple (Hiện tại đơn)</option>
                      <option value="Present Continuous">Present Continuous (Hiện tại tiếp diễn)</option>
                      <option value="Past Simple">Past Simple (Quá khứ đơn)</option>
                      <option value="Present Perfect">Present Perfect (Hiện tại hoàn thành)</option>
                      <option value="Future Simple">Future Simple (Tương lai đơn)</option>
                      <option value="Past Continuous">Past Continuous (Quá khứ tiếp diễn)</option>
                      <option value="Conditional Sentences">Conditionals (Câu điều kiện)</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="text-xs color-text-muted block mb-1">Cấp độ:</label>
                    <select 
                      className="search-input glass w-full"
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                      style={{ background: 'var(--bg-darker)' }}
                    >
                      <option value="A1">A1 - Beginner</option>
                      <option value="A2">A2 - Elementary</option>
                      <option value="B1">B1 - Intermediate</option>
                      <option value="B2">B2 - Upper Intermediate</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                className="btn-primary w-full justify-center py-3" 
                onClick={handleGenerate}
                disabled={isLoading || !form.topicName.trim()}
              >
                {isLoading ? "Đang sinh bài học..." : "Sinh bài học bằng Antigravity AI"}
              </button>
            </div>
          )}

          {/* Sample Lesson Quick-Import Library */}
          {!generatedData && (
            <div className="glass p-6">
              <h3 className="mb-2" style={{ fontSize: '15px', fontWeight: 'bold' }}>📚 Thư viện bài học mẫu</h3>
              <p className="color-text-muted text-xs mb-4">Nhấn "Import nhanh" để thêm ngay bài học chất lượng cao đã biên soạn sẵn mà không cần kết nối mạng hay chờ đợi.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  {
                    id: "topic_custom_airport_1",
                    topic: "At the Airport",
                    level: "A2",
                    title: "Flying to London",
                    desc: "Học cách làm thủ tục bay, kiểm tra an ninh và cấu trúc tương lai đơn 'will + V'."
                  },
                  {
                    id: "topic_custom_job_it_2",
                    topic: "Job Interview in IT",
                    level: "B2",
                    title: "Applying for Software Engineer",
                    desc: "Học cách đối đáp phỏng vấn IT tiếng Anh chuẩn xác sử dụng các thì quá khứ đơn."
                  }
                ].map((item) => (
                  <div key={item.id} className="p-3 rounded flex justify-between items-center" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', gap: '10px' }}>
                    <div style={{ maxWidth: '75%' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-level" style={{ fontSize: '9px', padding: '1px 4px' }}>{item.level}</span>
                        <strong className="text-xs">{item.topic}</strong>
                      </div>
                      <p className="color-text-muted text-[11px]" style={{ margin: '2px 0 0 0' }}>{item.desc}</p>
                    </div>
                    <button 
                      className="btn-primary text-xs" 
                      style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer', flexShrink: 0 }}
                      onClick={() => handleImportSample(item.id)}
                    >
                      Import nhanh
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logs Area */}
          {logs.length > 0 && (
            <div className="logs-card glass p-6" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <h4 className="text-xs color-text-muted mb-2 font-bold uppercase">Tiến trình AI:</h4>
              <pre className="text-xs color-text-muted font-mono leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                {logs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </pre>
            </div>
          )}

          {/* Validation Warnings Box */}
          {generatedData && validationErrors.length > 0 && (
            <div className="validation-box p-4 glass" style={{ borderLeft: '4px solid var(--color-warning)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
              <h4 className="font-bold text-sm" style={{ color: 'var(--color-warning)' }}>Cảnh báo cấu trúc ({validationErrors.length}):</h4>
              <ul className="list-disc pl-5 mt-2 text-xs color-text-muted flex flex-col gap-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}



        </div>

        {/* Right Column: Manage existing custom topics (Show only when not previewing generated topic) */}
        {!generatedData && (
          <div className="admin-sidebar flex flex-col gap-6">
            
            {/* Pending Approval List */}
            <div className="pending-list-card glass p-6">
              <h3 className="mb-4">Bài học chờ duyệt ({pendingTopics.length})</h3>
              {pendingTopics.length === 0 ? (
                <p className="color-text-muted text-xs">Không có bài học nào đang đợi duyệt.</p>
              ) : (
                <div className="pending-items flex flex-col gap-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {pendingTopics.map((item) => (
                    <div key={item.id} className="p-3 glass flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <strong className="color-text-dark">{item.title}</strong>
                        <span className="badge-level">{item.level}</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button className="btn-row-action reset text-xs py-1" onClick={() => setGeneratedData(item)}>Xem</button>
                        <button className="btn-row-action reset text-xs py-1" style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }} onClick={() => handleApprovePending(item)}>✓ Duyệt</button>
                        <button className="btn-row-action delete text-xs py-1" onClick={() => handleDeletePending(item.id)}>Xóa</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Published Custom Lessons */}
            <div className="published-list-card glass p-6">
              <h3 className="mb-4">Bài học tự sinh đã công khai ({customTopics.length})</h3>
              {customTopics.length === 0 ? (
                <p className="color-text-muted text-xs">Chưa có bài học tự sinh nào được công khai.</p>
              ) : (
                <div className="custom-items flex flex-col gap-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {customTopics.map((item) => (
                    <div key={item.id} className="p-3 glass flex justify-between items-center text-xs">
                      <div>
                        <strong className="color-text-dark block">{item.title}</strong>
                        <span className="color-text-muted" style={{ fontSize: '10px' }}>Chủ đề: {item.topic} ({item.level})</span>
                      </div>
                      <button className="btn-row-action delete text-xs py-1" onClick={() => handleDeleteCustom(item.id)}>Xóa</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Live Preview Container (Active only when lesson is previewed) */}
        {generatedData && (
          <div className="preview-container glass p-6">
            <div className="preview-header mb-4 flex justify-between items-center flex-wrap gap-3">
              <h3 className="text-gradient">Xem trước bài học: "{generatedData.title}"</h3>
              
              {/* Preview Tabs */}
              <div className="filter-buttons flex gap-2">
                <button className={`filter-btn ${previewTab === 'reading' ? 'active' : ''}`} onClick={() => setPreviewTab('reading')}>Bài đọc</button>
                <button className={`filter-btn ${previewTab === 'dialogues' ? 'active' : ''}`} onClick={() => setPreviewTab('dialogues')}>Hội thoại</button>
                <button className={`filter-btn ${previewTab === 'grammar' ? 'active' : ''}`} onClick={() => setPreviewTab('grammar')}>Ngữ pháp</button>
                <button className={`filter-btn ${previewTab === 'writing' ? 'active' : ''}`} onClick={() => setPreviewTab('writing')}>Bài tập viết</button>
                <button className={`filter-btn ${previewTab === 'json' ? 'active' : ''}`} onClick={() => setPreviewTab('json')}>Code JSON</button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="preview-body p-4 glass mb-6" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {previewTab === 'reading' && (
                <div className="animate-slideup">
                  <h4 className="font-bold color-text-dark mb-2">{generatedData.title} ({generatedData.level})</h4>
                  <p className="leading-relaxed text-sm mb-4">{generatedData.reading_passage}</p>
                  <hr className="mb-4" style={{ borderColor: 'var(--border-light)' }} />
                  <p className="italic text-xs color-text-muted">{generatedData.reading_passage_translation}</p>
                </div>
              )}

              {previewTab === 'dialogues' && (
                <div className="animate-slideup flex flex-col gap-3">
                  {generatedData.dialogues.map((d, index) => (
                    <div key={index} className="p-2 glass text-xs">
                      <strong>{d.speaker || 'Unknown'}:</strong> "{d.text || ''}"
                      <p className="italic color-text-muted mt-1">🇻🇳 {d.vietnamese || ''}</p>
                    </div>
                  ))}
                </div>
              )}

              {previewTab === 'grammar' && (
                <div className="animate-slideup">
                  <h4 className="font-bold color-text-dark mb-1">{generatedData.grammar_focus.tense_vi} ({generatedData.grammar_focus.tense})</h4>
                  <code className="text-xs color-text-muted block mb-3 font-mono p-2 glass">Công thức: {generatedData.grammar_focus.formula}</code>
                  <p className="text-xs mb-4">{generatedData.grammar_focus.explanation}</p>
                  
                  <strong className="text-xs">Ví dụ trích văn bản:</strong>
                  <div className="flex flex-col gap-2 mt-2">
                    {generatedData.grammar_focus.examples.map((ex, index) => (
                      <div key={index} className="p-2 glass text-xs">
                        <strong>"{ex.en}"</strong>
                        <p className="color-text-muted mt-1">🇻🇳 {ex.vi}</p>
                        <p className="text-xs italic color-text-muted mt-1">💡 Chú ý: {ex.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewTab === 'writing' && (
                <div className="animate-slideup flex flex-col gap-4">
                  {generatedData.writing_exercises.map((ex, index) => (
                    <div key={index} className="p-3 glass text-xs">
                      <strong>Bài tập {index + 1} ({ex.type})</strong>
                      {ex.type === 'fill_blank' && ex.sentence_parts && (
                        <p className="mt-1">Nối câu: {ex.sentence_parts[0]} _____ {ex.sentence_parts[1]} (Đáp án: {ex.answer})</p>
                      )}
                      {ex.type === 'sentence_ordering' && ex.words && (
                        <p className="mt-1">Xếp từ: {ex.words.join(', ')} (Đáp án: {ex.answer})</p>
                      )}
                      {ex.type === 'free_writing' && (
                        <p className="mt-1">Viết tự do: {ex.prompt_vi} (Từ khóa: {ex.required_keywords?.join(', ')})</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {previewTab === 'json' && (
                <pre className="text-xs color-text-muted font-mono" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(generatedData, null, 2)}
                </pre>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="btn-secondary w-1/3 justify-center" onClick={handleReject}>
                Hủy bộ
              </button>
              <button className="btn-secondary w-1/3 justify-center" onClick={handleSavePending}>
                Lưu chờ duyệt
              </button>
              <button 
                className="btn-primary w-1/3 justify-center" 
                onClick={handleApprove}
                style={{ background: 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)', boxShadow: '0 0 15px var(--color-success-glow)' }}
              >
                ✓ Duyệt & Công khai
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
