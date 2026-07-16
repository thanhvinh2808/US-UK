import React, { useState } from 'react';
import { storage } from '../utils/storage';

export async function fetchGeminiWithRetry(url, options, maxRetries = 4, delayMs = 3000) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      const status = response.status;
      if (status === 429) {
        const waitTime = Math.pow(2, attempt) * 3000;
        console.warn(`Gemini API returned 429 (Rate Limit) on attempt ${attempt}. Retrying in ${waitTime}ms...`);
        lastError = new Error(`Gemini API Error (Status 429): Tần suất gọi API quá nhanh hoặc vượt quá hạn ngạch (Rate Limit). Vui lòng đợi giây lát.`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      } else if (status === 503 || status === 500 || status === 504) {
        const waitTime = attempt * delayMs;
        console.warn(`Gemini API returned status ${status} on attempt ${attempt}. Retrying in ${waitTime}ms...`);
        lastError = new Error(`Gemini API Error (Status ${status}): Dịch vụ Gemini tạm thời bận hoặc quá tải.`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      } else if (status === 404) {
        throw new Error(`Gemini API Error (Status 404): Không tìm thấy mô hình hoặc sai URL endpoint. Vui lòng chọn mô hình khác.`);
      } else if (status === 400 || status === 403) {
        throw new Error(`Gemini API Error (Status ${status}): API Key không hợp lệ hoặc không được phép truy cập mô hình này.`);
      } else {
        throw new Error(`Gemini API Error (Status ${status}): Lỗi kết nối phía Gemini API.`);
      }
    } catch (err) {
      lastError = err;
      if (err.message.includes("không hợp lệ") || err.message.includes("404") || err.message.includes("400") || err.message.includes("403")) {
        throw err;
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * delayMs));
        continue;
      }
    }
  }
  throw lastError;
}

function preprocessAndRepairJson(rawText) {
  let cleanText = rawText.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();
  return cleanText;
}

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
  }
};

export default function AdminPanel({ onNavigateBack, onTopicsListChange }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("eng_app_gemini_key") || "");
  const [isKeySaved, setIsKeySaved] = useState(() => !!localStorage.getItem("eng_app_gemini_key"));
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("eng_app_gemini_model") || "gemini-1.5-flash");
  
  // Generation parameters
  const [form, setForm] = useState({ topicName: '', tense: 'Present Simple', level: 'A2' });
  const [generatedData, setGeneratedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  
  // Spell check states
  const [spellCheckResult, setSpellCheckResult] = useState(null);
  const [isCheckingSpelling, setIsCheckingSpelling] = useState(false);
  
  // Tab states for preview
  const [previewTab, setPreviewTab] = useState('reading'); // reading | dialogues | grammar | writing | json
  
  // Pending and published custom topics state
  const [pendingTopics, setPendingTopics] = useState(() => storage.getPendingTopics());
  const [customTopics, setCustomTopics] = useState(() => storage.getCustomTopics());

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("eng_app_gemini_key", apiKey.trim());
      setIsKeySaved(true);
      alert("Đã lưu API Key thành công!");
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem("eng_app_gemini_key");
    setApiKey("");
    setIsKeySaved(false);
    alert("Đã xóa API Key.");
  };

  const runSpellCheck = async (text) => {
    if (!apiKey.trim() || !text) return;
    
    setIsCheckingSpelling(true);
    setSpellCheckResult(null);
    
    const prompt = `Bạn là một chuyên gia soát lỗi và hiệu đính tiếng Anh. Hãy phân tích đoạn văn sau và kiểm tra xem có bất kỳ lỗi chính tả (spelling) hoặc ngữ pháp (grammar) nào không:
"${text}"

Hãy trả về kết quả dưới dạng JSON có cấu trúc như sau (chỉ trả về JSON, không thêm văn bản giải thích nào khác):
{
  "hasErrors": true,
  "errors": [
    { "word": "từ hoặc cụm từ bị lỗi", "type": "spelling", "correction": "phần sửa lại đúng", "reason": "giải thích ngắn gọn lỗi bằng tiếng Việt" }
  ]
}
Nếu không phát hiện lỗi nào, hãy trả về:
{
  "hasErrors": false,
  "errors": []
}`;

    try {
      const response = await fetchGeminiWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey.trim()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (response && response.ok) {
        const resData = await response.json();
        const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            const cleanText = preprocessAndRepairJson(rawText.slice(firstBrace, lastBrace + 1));
            const parsed = JSON.parse(cleanText);
            setSpellCheckResult(parsed);
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert(`Lỗi soát lỗi AI: ${e.message}`);
    } finally {
      setIsCheckingSpelling(false);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      alert("Vui lòng cấu hình API Key trước!");
      return;
    }
    if (!form.topicName.trim()) {
      alert("Vui lòng nhập chủ đề!");
      return;
    }

    setIsLoading(true);
    setGeneratedData(null);
    setLogs([]);
    setValidationErrors([]);
    setSpellCheckResult(null);

    addLog(`Bắt đầu sinh bài học cho chủ đề "${form.topicName}" (Thì: ${form.tense}, Cấp độ: ${form.level})`);

    const systemPrompt = `Bạn là một trợ lý AI tạo giáo trình học tiếng Anh chuyên nghiệp. Nhiệm vụ của bạn là sinh ra một bài học tiếng Anh hoàn chỉnh theo đúng cấu trúc JSON được chỉ định.
QUAN TRỌNG: 
1. Câu ví dụ trong phần "grammar_focus.examples" PHẢI trùng khớp nguyên văn từng ký tự với các câu có trong "reading_passage" hoặc "dialogues". Đây là quy định bắt buộc.
2. Giọng đọc hỗ trợ cả US (Mỹ) và UK (Anh), các từ vựng phải có phiên âm IPA chuẩn xác.`;

    const userPrompt = `Hãy tạo một bài học tiếng Anh về chủ đề: "${form.topicName}"
- Cấp độ: ${form.level}
- Thì ngữ pháp trọng tâm: ${form.tense}

Yêu cầu trả về đúng cấu trúc JSON mẫu sau đây (không được thêm văn bản giải thích nào khác ngoài khối JSON):
{
  "id": "topic_${form.topicName.toLowerCase().replace(/[^a-z0-9]/g, '_')}",
  "topic": "${form.topicName}",
  "level": "${form.level}",
  "title": "[Tiêu đề bài học ngắn gọn, ví dụ: Shopping in Paris]",
  "reading_passage": "[Đoạn văn đọc tiếng Anh khoảng 5-7 câu sử dụng nhiều câu chứa thì ${form.tense}]",
  "reading_passage_translation": "[Dịch nghĩa tiếng Việt đầy đủ của đoạn văn đọc]",
  "grammar_focus": {
    "tense": "${form.tense}",
    "tense_vi": "[Tên tiếng Việt của thì ngữ pháp]",
    "formula": "[Công thức của thì]",
    "explanation": "[Giải thích cách dùng ngắn gọn bằng tiếng Việt]",
    "examples": [
      { "en": "[Câu ví dụ tiếng Anh - PHẢI trích nguyên văn từ bài đọc hoặc hội thoại thoại ở trên]", "vi": "[Dịch nghĩa câu ví dụ]", "note": "[Giải thích cấu trúc ngữ pháp chia trong câu này]" }
    ]
  },
  "writing_exercises": [
    { "id": "ex_1", "type": "fill_blank", "sentence_parts": ["[Phần câu đầu]", "[Phần câu cuối]"], "answer": "[Từ/cụm từ điền vào chỗ trống]", "hint": "[Gợi ý bằng tiếng Việt]" },
    { "id": "ex_2", "type": "sentence_ordering", "words": ["từ", "sắp", "xếp"], "answer": "[câu hoàn chỉnh]" },
    { "id": "ex_3", "type": "free_writing", "prompt_vi": "[Đề bài viết tự do liên quan đến chủ đề]", "required_keywords": ["từ", "khóa"], "min_words": 8 }
  ],
  "dialogues": [
    { "id": "d_1", "speaker": "Barista", "text": "[Câu thoại tiếng Anh]", "vietnamese": "[Dịch câu thoại]" },
    { "id": "d_2", "speaker": "Customer", "text": "[Câu thoại tiếng Anh]", "vietnamese": "[Dịch câu thoại]" }
  ],
  "default_vocabs": [
    { "word": "[từ vựng]", "ipa": "[phiên âm IPA, ví dụ: /kəˈnekt/]", "vietnamese": "[nghĩa tiếng Việt]", "example": "[câu ví dụ]" }
  ]
}`;

    try {
      addLog(`Đang gửi yêu cầu và đợi phản hồi từ Gemini API (hệ thống tự động thử lại nếu máy chủ quá tải)...`);
      const response = await fetchGeminiWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey.trim()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 1.0
          }
        })
      });

      if (!response || !response.ok) {
        throw new Error(`Kết nối thất bại (Mã lỗi: ${response ? response.status : 'Không rõ'})`);
      }

      addLog(`Đã nhận phản hồi thành công. Đang phân tích cú pháp JSON...`);
      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error("Gemini API trả về nội dung trống rỗng.");
      }

      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("Không thể tìm thấy khối cấu trúc dữ liệu JSON trong phản hồi của AI.");
      }

      const cleanJsonText = preprocessAndRepairJson(rawText.slice(firstBrace, lastBrace + 1));
      const parsedData = JSON.parse(cleanJsonText);

      addLog(`Áp dụng thuật toán vá ngữ pháp tự động (Auto-Healing) để khớp câu ví dụ...`);
      if (parsedData.grammar_focus?.examples && parsedData.reading_passage) {
        const sentences = [];
        parsedData.reading_passage.split(/[.!?]/).forEach(s => {
          if (s.trim()) sentences.push(s.trim());
        });
        parsedData.dialogues.forEach(d => {
          if (d.text.trim()) sentences.push(d.text.trim());
        });

        parsedData.grammar_focus.examples = parsedData.grammar_focus.examples.map((ex, idx) => {
          if (!ex.en) return ex;
          
          const cleanEx = ex.en.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'!]/g, "").replace(/\s+/g, " ").trim();
          
          let bestSentence = ex.en;
          let bestScore = 0;
          
          sentences.forEach(s => {
            const cleanS = s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'!]/g, "").replace(/\s+/g, " ").trim();
            
            const exWords = cleanEx.split(' ');
            const sWords = cleanS.split(' ');
            
            const exWordSet = new Set(exWords);
            const sWordSet = new Set(sWords);
            
            let intersect = 0;
            exWordSet.forEach(w => {
              if (sWordSet.has(w)) intersect++;
            });
            
            const score = intersect / Math.max(exWordSet.size, sWordSet.size);
            if (score > bestScore && score >= 0.7) {
              bestScore = score;
              bestSentence = s;
            }
          });
          
          if (bestSentence !== ex.en) {
            addLog(`-> Đã tự động vá và đồng bộ câu ví dụ #${idx + 1} từ "${ex.en}" thành câu nguyên văn: "${bestSentence}"`);
            ex.en = bestSentence;
          }
          return ex;
        });
      }
      
      addLog(`Đang tiến hành kiểm tra (validate) dữ liệu bài học...`);
      const { valid, errors } = validateTopicData(parsedData);
      setValidationErrors(errors);

      setGeneratedData(parsedData);
      if (valid) {
        addLog(`🎉 Bài học đã được sinh thành công và ĐẠT TẤT CẢ các kiểm tra cấu trúc dữ liệu!`);
      } else {
        addLog(`⚠️ Bài học được sinh ra nhưng có ${errors.length} lỗi/cảnh báo cấu trúc. Vui lòng rà soát.`);
      }

    } catch (err) {
      console.error(err);
      addLog(`❌ Thất bại: ${err.message}`);
      alert("Sinh bài học bằng AI thất bại. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.");
    } finally {
      setIsLoading(false);
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
      alert(`🎉 Đã thêm bài học "${sampleTopic.topic}" vào dự án thành công!`);
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
          <span className="topic-name">AI Lesson Generator Hub</span>
        </div>
      </div>

      <div className={`admin-grid ${generatedData ? 'preview-active' : ''}`}>
        
        {/* Left Column: Form & Configuration */}
        <div className="admin-form-section flex flex-col gap-6">
          
          {/* API Key configuration card */}
          <div className="api-key-card glass p-6">
            <h3 className="mb-3">Cấu hình Gemini API Key</h3>
            {isKeySaved ? (
              <div className="flex justify-between items-center">
                <span className="color-text-muted text-sm font-semibold">
                  API Key: <code>AIzaSy...{apiKey.slice(-6)}</code> (Đã lưu)
                </span>
                <button className="btn-secondary text-xs" onClick={handleClearKey}>Thay đổi Key</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input 
                  type="password" 
                  placeholder="Nhập Gemini API Key (AIzaSy...)"
                  className="search-input glass w-full"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
                <button className="btn-primary" onClick={handleSaveKey}>Lưu Key</button>
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-dashed" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <label className="text-xs color-text-muted block mb-1">Mô hình Gemini (Model):</label>
              <select 
                className="search-input glass w-full text-sm"
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  localStorage.setItem("eng_app_gemini_model", e.target.value);
                }}
                style={{ background: 'var(--bg-darker)' }}
              >
                <option value="gemini-1.5-flash">gemini-1.5-flash (Khuyên dùng - Miễn phí & Ổn định)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Mới - Tốc độ cao)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (Logic cực mạnh - Dành cho bài phức tạp)</option>
              </select>
            </div>
            <p className="color-text-muted text-xs mt-2">API Key được lưu bảo mật trong Local Storage trên chính trình duyệt của bạn, hoàn toàn không được gửi đi nơi khác.</p>
          </div>

          {/* AI Generator Form */}
          {!generatedData && (
            <div className="generator-card glass p-6">
              <h3 className="mb-4">Sinh bài học bằng AI ({selectedModel})</h3>
              
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
                {isLoading ? "Đang sinh bài học..." : "Sinh bài học tự động"}
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
              <h4 className="text-xs color-text-muted mb-2 font-bold uppercase">Tiến trình hệ thống:</h4>
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

          {/* AI Spell Check Report */}
          {generatedData && (
            <div className="spellcheck-card glass p-6 mb-6">
              <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                Soát lỗi chính tả & ngữ pháp bài đọc
              </h3>
              
              {!isCheckingSpelling && !spellCheckResult && (
                <div className="text-center py-4 flex flex-col items-center justify-center">
                  <p className="color-text-muted text-xs mb-4">Bạn có muốn quét soát lỗi chính tả và ngữ pháp cho bài đọc vừa tạo không?</p>
                  <button 
                    className="btn-secondary text-xs" 
                    onClick={() => runSpellCheck(generatedData.reading_passage)}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-light)' }}
                  >
                    🔍 Quét lỗi bằng AI
                  </button>
                </div>
              )}

              {isCheckingSpelling && (
                <div className="text-center py-4 flex flex-col items-center justify-center">
                  <div className="admin-spinner" style={{ margin: '0 auto 12px auto' }}></div>
                  <p className="color-text-muted text-xs mt-2">AI đang kiểm tra cấu trúc từng từ và câu thoại...</p>
                </div>
              )}

              {!isCheckingSpelling && spellCheckResult && spellCheckResult.hasErrors && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs color-text-muted">Đã tìm thấy <strong>{spellCheckResult.errors.length}</strong> điểm cần chỉnh sửa trong bài viết:</p>
                  <div className="flex flex-col gap-2">
                    {spellCheckResult.errors.map((err, idx) => (
                      <div key={idx} className="p-3 glass" style={{ borderLeft: `3px solid ${err.type === 'spelling' ? 'var(--color-error)' : 'var(--color-warning)'}` }}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs" style={{ color: err.type === 'spelling' ? 'var(--color-error)' : 'var(--color-warning)' }}>
                            [{err.type === 'spelling' ? 'Chính tả' : 'Ngữ pháp'}] "{err.word}"
                          </span>
                          <span className="badge-level" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            Gợi ý: {err.correction}
                          </span>
                        </div>
                        <p className="text-xs color-text-muted mt-1">{err.reason}</p>
                      </div>
                    ))}
                  </div>
                  <button 
                    className="btn-secondary text-xs mt-2" 
                    style={{ alignSelf: 'flex-start', padding: '6px 12px', cursor: 'pointer' }}
                    onClick={() => {
                      setSpellCheckResult(null);
                      runSpellCheck(generatedData.reading_passage);
                    }}
                  >
                    🔄 Quét lại
                  </button>
                </div>
              )}

              {!isCheckingSpelling && spellCheckResult && !spellCheckResult.hasErrors && (
                <div className="text-center py-4" style={{ color: 'var(--color-success)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', fontWeight: 'bold' }}>✓</div>
                  <p className="text-sm font-semibold mt-2">Văn bản hoàn chỉnh & chuẩn bản xứ!</p>
                  <p className="color-text-muted text-xs">Không phát hiện bất kỳ lỗi chính tả hay ngữ pháp nào trong bài đọc.</p>
                  <button 
                    className="btn-secondary text-xs mt-3" 
                    style={{ padding: '4px 10px', cursor: 'pointer' }}
                    onClick={() => {
                      setSpellCheckResult(null);
                      runSpellCheck(generatedData.reading_passage);
                    }}
                  >
                    Quét lại
                  </button>
                </div>
              )}
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
                      <strong>{d.speaker}:</strong> "{d.text}"
                      <p className="italic color-text-muted mt-1">🇻🇳 {d.vietnamese}</p>
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
                      {ex.type === 'fill_blank' && (
                        <p className="mt-1">Nối câu: {ex.sentence_parts[0]} _____ {ex.sentence_parts[1]} (Đáp án: {ex.answer})</p>
                      )}
                      {ex.type === 'sentence_ordering' && (
                        <p className="mt-1">Xếp từ: {ex.words.join(', ')} (Đáp án: {ex.answer})</p>
                      )}
                      {ex.type === 'free_writing' && (
                        <p className="mt-1">Viết tự do: {ex.prompt_vi} (Từ khóa: {ex.required_keywords.join(', ')})</p>
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
                Hủy bỏ
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
