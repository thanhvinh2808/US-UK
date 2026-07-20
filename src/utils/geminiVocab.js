/**
 * Gọi Gemini để sinh thêm 1 batch từ vựng mới, tránh trùng với các từ đã có.
 * @param {string} level - 'A1' | 'A2' | 'B1' | 'B2'
 * @param {string[]} excludeWords - danh sách từ đã có (để AI không lặp lại)
 * @param {number} count - số từ muốn sinh thêm (mặc định 10)
 */
export async function fetchMoreVocabFromAI(level, excludeWords = [], count = 10) {
  const prompt = `Sinh ${count} từ vựng tiếng Anh cấp độ CEFR ${level}, dùng cho app học tiếng Anh.
Không được trùng với các từ sau: ${excludeWords.join(', ') || '(không có)'}.
Trả về CHỈ JSON array, không markdown, không giải thích, đúng format:
[{"word":"...", "vietnamese":"...", "example":"..."}]`;

  try {
    // Gọi qua proxy backend của bạn (KHÔNG gọi thẳng Gemini kèm API key ở client)
    const res = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) throw new Error('Gemini proxy error');

    const data = await res.json();
    
    // Hỗ trợ cấu trúc phản hồi linh hoạt (chuỗi thô, mảng trực tiếp, hoặc đối tượng bọc text/content)
    let rawText = '';
    if (typeof data === 'string') {
      rawText = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.filter(w => w && typeof w.word === 'string' && typeof w.vietnamese === 'string');
      }
      rawText = data.text || data.content || data.response || '';
    }

    if (!rawText) throw new Error('Empty response from proxy');

    // Làm sạch khối mã markdown ```json ... ``` của Gemini
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Lọc dữ liệu hỏng để tránh crash game
    return Array.isArray(parsed)
      ? parsed.filter(w => w && typeof w.word === 'string' && typeof w.vietnamese === 'string')
      : [];
  } catch (e) {
    console.error('Lỗi khi sinh thêm từ vựng AI:', e);
    return []; // fail im lặng, game vẫn chạy tiếp với pool cũ
  }
}
