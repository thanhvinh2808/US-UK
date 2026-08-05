// api/gemini-proxy.js (Vercel Serverless Function)
//
// Proxy phía server cho Gemini API — giữ GEMINI_API_KEY an toàn ở server, không lộ ra client.
// Được gọi bởi:
//   - src/utils/geminiVocab.js  (sinh thêm từ vựng AI cho MiniGames)
//   - src/components/GlobalTranslator.jsx  (phân tích AI cho từ tra cứu)
//
// LƯU Ý VỀ MODEL: gemini-2.0-flash đã bị Google khai tử (shut down) từ 1/6/2026.
// gemini-2.5-flash vẫn hoạt động nhưng dự kiến khai tử 16/10/2026. Dùng
// gemini-3.5-flash-lite (GA, nhanh, rẻ, phù hợp cho tác vụ text đơn giản như sinh từ
// vựng/phân tích ngắn) để tránh phải cập nhật lại sớm. Nếu sau này model này cũng bị
// deprecate, chỉ cần đổi giá trị GEMINI_MODEL bên dưới.
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

// Giới hạn độ dài prompt đầu vào để tránh bị lạm dụng gửi prompt khổng lồ gây tốn quota/API cost
const MAX_PROMPT_LENGTH = 4000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY variable is missing on server environment' });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({ error: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)` });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // tránh treo request quá lâu

    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7
            }
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    // Model có thể chặn phản hồi vì lý do an toàn (finishReason: SAFETY) -> candidates rỗng.
    // Trả về chuỗi rỗng thay vì lỗi, để client tự xử lý gracefully như đã thiết kế sẵn.
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json(textOutput);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Gemini API request timed out' });
    }
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
