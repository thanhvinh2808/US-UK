// aiTutorContext.js
// Gia sư AI 1:1 — system prompt cố định + ngữ cảnh động từ storage.js + hàm gọi Gemini API
// Đặt cạnh geminiVocab.js, dùng chung proxy/retry logic đã có sẵn trong AdminPanel.jsx

import { storage } from "./storage.js";

// ─────────────────────────────────────────────
// 1. SYSTEM PROMPT CỐ ĐỊNH — viết 1 lần, không đổi mỗi lần gọi
// ─────────────────────────────────────────────
export const TUTOR_SYSTEM_PROMPT = `
Bạn là "Gia sư AI" trong ứng dụng học tiếng Anh V English (US-UK).
Vai trò: gia sư 1:1 kiên nhẫn, dạy người Việt qua hội thoại tự nhiên, không giảng lý thuyết dài dòng.

QUY TẮC BẮT BUỘC:
1. Luôn trả lời DUY NHẤT bằng JSON hợp lệ theo đúng schema bên dưới, không thêm text, không thêm markdown code fence.
2. Chỉ hỏi 1 câu mỗi lượt, không dồn nhiều câu hỏi.
3. Khi người dùng viết/nói sai, điền vào trường "correction" theo cấu trúc: sai -> đúng -> tự nhiên hơn -> lý do ngắn bằng tiếng Việt. Nếu không có lỗi, để "correction": null.
4. Ưu tiên từ vựng/cấu trúc có trong "weakWords" và "recentTopics" được cung cấp ở ngữ cảnh — chủ động lồng ghép để ôn tập ngắt quãng, không hỏi lại những gì đã biết về người học.
5. Không sửa lỗi nhỏ không ảnh hưởng giao tiếp. Không dùng thuật ngữ ngữ pháp khó nếu chưa giải thích trước.
6. Giữ giọng điệu tích cực, khen cụ thể khi tiến bộ, thẳng thắn khi cần sửa, không tạo áp lực.
7. Nếu người học có vẻ mệt/muốn dừng, chủ động đề nghị rút gọn còn 1 nội dung thay vì ép học đủ.

SCHEMA JSON PHẢI TRẢ VỀ (không thêm field nào khác):
{
  "reply_en": string,
  "reply_vi_note": string | null,
  "correction": {
    "wrong": string,
    "correct": string,
    "natural": string,
    "reason_vi": string
  } | null,
  "new_vocab": [ { "word": string, "vi": string, "example": string } ],
  "suggested_followup_question": string
}
`.trim();

// ─────────────────────────────────────────────
// 2. NGỮ CẢNH ĐỘNG — build tự động từ storage.js mỗi lần gọi, không hỏi lại người học
// ─────────────────────────────────────────────
export function buildTutorContext() {
  const stats = storage.getUserStats();
  const vocab = storage.getSavedVocab();

  const weakWords = vocab
    .filter((w) => (w.lowGradeCount || 0) >= 2)
    .slice(0, 8)
    .map((w) => w.word);

  const recentTopics = [...new Set(vocab.slice(-15).map((w) => w.topic).filter(Boolean))];

  const level = vocab.length < 50 ? "Mới bắt đầu" : vocab.length < 200 ? "Sơ cấp" : "Trung cấp";

  return `
NGỮ CẢNH NGƯỜI HỌC (tự động, không hỏi lại):
- Streak hiện tại: ${stats.streak || 0} ngày
- Trình độ ước tính: ${level}
- Từ hay sai cần ôn lại: ${weakWords.length ? weakWords.join(", ") : "chưa có"}
- Chủ đề gần đây đã học: ${recentTopics.length ? recentTopics.join(", ") : "chưa có"}
`.trim();
}

// ─────────────────────────────────────────────
// 3. QUẢN LÝ LỊCH SỬ HỘI THOẠI + GỌI GEMINI API
// ─────────────────────────────────────────────
const MAX_HISTORY_TURNS = 16; // giới hạn để không phình token mỗi lần gọi

let conversationHistory = [];

export function resetTutorConversation() {
  conversationHistory = [];
}

/**
 * Gửi 1 lượt tin nhắn của người học tới Gia sư AI.
 * @param {string} userMessage
 * @param {(body: object) => Promise<{text: string}>} callGeminiProxy - hàm gọi API/proxy đã có sẵn (giống geminiVocab.js)
 * @returns {Promise<object>} JSON theo đúng schema ở trên
 */
export async function sendToTutor(userMessage, callGeminiProxy) {
  conversationHistory.push({ role: "user", parts: [{ text: userMessage }] });

  const body = {
    system_instruction: {
      parts: [{ text: `${TUTOR_SYSTEM_PROMPT}\n\n${buildTutorContext()}` }],
    },
    contents: conversationHistory,
    generationConfig: {
      response_mime_type: "application/json", // ép Gemini trả JSON thật, tránh phải tự parse markdown
    },
  };

  const data = await callGeminiProxy(body);

  let parsed;
  try {
    parsed = JSON.parse(data.text);
  } catch (e) {
    // fallback an toàn nếu model lỡ trả sai định dạng
    parsed = {
      reply_en: data.text,
      reply_vi_note: null,
      correction: null,
      new_vocab: [],
      suggested_followup_question: "",
    };
  }

  conversationHistory.push({ role: "model", parts: [{ text: data.text }] });

  if (conversationHistory.length > MAX_HISTORY_TURNS) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY_TURNS);
  }

  return parsed;
}
