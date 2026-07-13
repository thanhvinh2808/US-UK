import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export function preprocessAndRepairJson(rawText) {
  // Pass 1: Repair unescaped quotes
  let repairedText = '';
  for (let i = 0; i < rawText.length; i++) {
    const char = rawText[i];
    
    if (char === '"' && rawText[i - 1] !== '\\') {
      // Check if it's a structural quote
      let prevChar = '';
      let prevIdx = i - 1;
      while (prevIdx >= 0) {
        const c = rawText[prevIdx];
        if (c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r') {
          prevChar = c;
          break;
        }
        prevIdx--;
      }
      
      let nextChar = '';
      let nextIdx = i + 1;
      while (nextIdx < rawText.length) {
        const c = rawText[nextIdx];
        if (c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r') {
          nextChar = c;
          break;
        }
        nextIdx++;
      }
      
      const isPreceded = ['{', '[', ',', ':'].includes(prevChar);
      const isFollowed = ['}', ']', ',', ':'].includes(nextChar);
      
      if (isPreceded || isFollowed) {
        repairedText += char;
      } else {
        repairedText += '\\"'; // Escape it
      }
    } else {
      repairedText += char;
    }
  }

  // Pass 2: Escape literal newlines, carriage returns, tabs inside strings, and strip comments
  let cleanText = '';
  let insideString = false;
  let escaped = false;
  
  for (let i = 0; i < repairedText.length; i++) {
    const char = repairedText[i];
    
    // Strip comments outside strings
    if (!insideString) {
      if (char === '/' && repairedText[i + 1] === '/') {
        while (i < repairedText.length && repairedText[i] !== '\n' && repairedText[i] !== '\r') {
          i++;
        }
        i--;
        continue;
      }
      if (char === '/' && repairedText[i + 1] === '*') {
        i += 2;
        while (i < repairedText.length && !(repairedText[i] === '*' && repairedText[i + 1] === '/')) {
          i++;
        }
        i++;
        continue;
      }
    }
    
    if (char === '"' && !escaped) {
      insideString = !insideString;
      cleanText += char;
      continue;
    }
    
    if (insideString) {
      if (char === '\\') {
        escaped = !escaped;
        cleanText += char;
      } else {
        if (char === '\n') {
          cleanText += '\\n';
        } else if (char === '\r') {
          cleanText += '\\r';
        } else if (char === '\t') {
          cleanText += '\\t';
        } else {
          cleanText += char;
        }
        escaped = false;
      }
    } else {
      cleanText += char;
    }
  }
  
  // Remove trailing commas in arrays/objects
  cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');
  
  return cleanText;
}

export async function fetchGeminiWithRetry(url, options, maxRetries = 3, delayMs = 1500) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      const status = response.status;
      if (status === 503 || status === 429 || status === 500 || status === 504) {
        console.warn(`Gemini API returned status ${status} on attempt ${attempt}. Retrying in ${delayMs * attempt}ms...`);
        lastError = new Error(`Gemini API Error (Status ${status}): Dịch vụ tạm thời quá tải hoặc giới hạn lượt gọi.`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt)); // Exponential backoff
          continue;
        }
      } else if (status === 400 || status === 403) {
        throw new Error(`Gemini API Error (Status ${status}): API Key không hợp lệ, hết hạn, hoặc bị từ chối truy cập.`);
      } else {
        throw new Error(`Gemini API Error (Status ${status}): Đã xảy ra lỗi kết nối phía Gemini.`);
      }
    } catch (err) {
      lastError = err;
      if (err.message.includes("API Key không hợp lệ")) {
        throw err;
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }
    }
  }
  throw lastError;
}

export function validateTopicData(data) {
  const errors = [];

  if (!data) {
    errors.push("Dữ liệu bài học rỗng.");
    return { valid: false, errors };
  }

  if (!data.id) errors.push("Thiếu thuộc tính 'id' định danh.");
  if (!data.topic) errors.push("Thiếu thuộc tính 'topic' tên chủ đề.");
  if (!data.level) errors.push("Thiếu thuộc tính 'level' cấp độ học tập.");
  if (!data.title) errors.push("Thiếu thuộc tính 'title' tiêu đề tiếng Anh.");

  if (!data.reading_passage || data.reading_passage.split(/\s+/).filter(Boolean).length < 40) {
    errors.push("Bài đọc 'reading_passage' quá ngắn hoặc không tồn tại (cần ít nhất 40 từ).");
  }

  if (!data.reading_passage_translation) {
    errors.push("Thiếu trường dịch nghĩa toàn bài đọc 'reading_passage_translation'.");
  }

  if (!data.grammar_focus?.examples || data.grammar_focus.examples.length < 2) {
    errors.push("Phần ngữ pháp 'grammar_focus.examples' phải có ít nhất 2 câu ví dụ.");
  }

  if (!data.writing_exercises || data.writing_exercises.length !== 3) {
    errors.push("Phần bài tập viết 'writing_exercises' bắt buộc phải có đúng 3 bài.");
  } else {
    // Check types
    const types = data.writing_exercises.map(e => e.type);
    if (!types.includes("fill_blank")) errors.push("Thiếu bài tập dạng điền vào chỗ trống ('fill_blank').");
    if (!types.includes("sentence_ordering")) errors.push("Thiếu bài tập dạng sắp xếp từ thành câu ('sentence_ordering').");
    if (!types.includes("free_writing")) errors.push("Thiếu bài tập dạng viết tự do ('free_writing').");
  }

  if (!data.dialogues || data.dialogues.length !== 5) {
    errors.push("Phần hội thoại 'dialogues' bắt buộc phải có đúng 5 câu thoại.");
  }

  if (!data.default_vocabs || data.default_vocabs.length < 5) {
    errors.push("Danh sách từ vựng 'default_vocabs' phải có ít nhất 5 từ.");
  }

  // Check if example sentences are in reading passage or dialogues
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

export default function AdminPanel({ onNavigateBack, onTopicsListChange }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("eng_app_gemini_key") || "");
  const [isKeySaved, setIsKeySaved] = useState(() => !!localStorage.getItem("eng_app_gemini_key"));
  
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

  const runSpellCheck = async (text) => {
    if (!apiKey.trim() || !text) return;
    setIsCheckingSpelling(true);
    addLog("Đang tiến hành quét và kiểm tra lỗi chính tả/ngữ pháp bằng AI...");
    
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
      const response = await fetchGeminiWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey.trim()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
            const cleanJsonText = rawText.slice(firstBrace, lastBrace + 1);
            const repairedJsonText = preprocessAndRepairJson(cleanJsonText);
            const parsed = JSON.parse(repairedJsonText);
            setSpellCheckResult(parsed);
            if (parsed.hasErrors) {
              addLog(`⚠️ Đã phát hiện ${parsed.errors.length} lỗi chính tả/ngữ pháp trong bài đọc.`);
            } else {
              addLog(`🎉 Bài đọc hoàn hảo! Không phát hiện lỗi chính tả hay ngữ pháp.`);
            }
            return;
          }
        }
      }
      setSpellCheckResult({ hasErrors: false, errors: [] });
      addLog("Không thể hoàn thành kiểm tra chính tả (Phản hồi không đúng cấu trúc).");
    } catch (e) {
      console.error("Spell check error:", e);
      addLog("Lỗi khi kết nối kiểm tra chính tả.");
    } finally {
      setIsCheckingSpelling(false);
    }
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
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      alert("Vui lòng cấu hình Gemini API Key trước!");
      return;
    }

    setIsLoading(false);
    setLogs([]);
    setValidationErrors([]);
    setGeneratedData(null);
    setSpellCheckResult(null);
    setIsCheckingSpelling(false);
    setIsLoading(true);

    addLog(`Bắt đầu kết nối với Gemini API...`);
    addLog(`Đang gửi yêu cầu sinh bài học cho chủ đề: "${form.topicName}"`);
    addLog(`Độ khó: ${form.level} | Thì ngữ pháp chủ đạo: ${form.tense}`);

    const systemPrompt = `Bạn là chuyên gia soạn giáo trình tiếng Anh.
Nhiệm vụ: tạo 1 bài học theo ĐÚNG cấu trúc JSON được yêu cầu, không thêm bất kỳ văn bản nào khác ngoài JSON.
Quy tắc bắt buộc:
1. Mọi câu trong "examples" của grammar_focus PHẢI được trích nguyên văn từ "reading_passage" hoặc "dialogues", không được tự ý bịa câu mới. Đây là tiêu chí bắt buộc để chấm điểm.
2. "reading_passage" khoảng 80-120 từ, đúng level yêu cầu, dùng đúng thì ngữ pháp được chỉ định làm thì chủ đạo.
3. "reading_passage_translation" là bản dịch tiếng Việt tự nhiên của "reading_passage".
4. "dialogues" gồm đúng 5 câu, xen kẽ 2 người nói.
5. "default_vocabs" gồm đúng 6 từ lấy từ chính đoạn văn, kèm IPA, giải thích nghĩa tiếng Việt và câu ví dụ chứa từ đó.
6. "writing_exercises" gồm đúng 3 bài: 
   - Bài 1: type "fill_blank", sentence_parts: [phần trước chỗ trống, phần sau chỗ trống], answer: động từ đã chia đúng thì, hint: gợi ý ngữ pháp.
   - Bài 2: type "sentence_ordering", words: mảng gồm các từ đơn lẻ xáo trộn, answer: câu hoàn chỉnh (nhớ dấu chấm ở cuối câu).
   - Bài 3: type "free_writing", prompt_vi: đề bài tiếng Việt yêu cầu người học tự viết 2 câu, required_keywords: mảng từ khóa, min_words: 8.
7. ID của chủ đề (id) phải là duy nhất dạng: "topic_custom_xxxx" (ví dụ: topic_custom_travel_123).
8. ĐẶC BIỆT CHÚ Ý: Mọi dấu ngoặc kép (double quotes) xuất hiện bên trong các trường văn bản PHẢI được viết dưới dạng thoát ký tự: \\" (ví dụ: \\"fine\\" thay vì "fine"). Không được để dấu ngoặc kép trần làm hỏng cấu trúc JSON.
9. Đảm bảo cấu trúc JSON hoàn chỉnh, không có dấu phẩy thừa (trailing commas) ở cuối các phần tử mảng hoặc thuộc tính đối tượng.`;

    // Generate a random seed to enforce diverse output
    const randomSeed = Math.random().toString(36).substring(7);

    const userPrompt = `Hãy tạo một bài học tiếng Anh hoàn toàn MỚI, ĐỘC ĐÁO và KHÁC BIỆT (tránh trùng lặp nội dung với các lần tạo trước) cho:
Chủ đề: ${form.topicName}
Thì ngữ pháp trọng tâm: ${form.tense}
Level: ${form.level}
Mã số định danh sáng tạo ngẫu nhiên (Creative Seed): ${randomSeed}

Hãy sáng tạo một cốt truyện bài đọc (reading_passage) và các câu thoại mới lạ lấy cảm hứng ngẫu nhiên dựa trên mã số định danh này để tạo tính đa dạng.

Trả về đúng JSON theo cấu trúc mẫu sau (chỉ trả về JSON, không thêm chữ nào ngoài JSON):
{
  "id": "topic_custom_${Date.now()}_${randomSeed}",
  "topic": "${form.topicName}",
  "level": "${form.level}",
  "title": "Tên tiêu đề tiếng Anh",
  "reading_passage": "...",
  "reading_passage_translation": "...",
  "grammar_focus": {
    "tense": "${form.tense}",
    "tense_vi": "Ví dụ: Thì hiện tại đơn",
    "formula": "Ví dụ: S + V(s/es)",
    "explanation": "...",
    "examples": [
      { "en": "Trích nguyên văn từ reading_passage hoặc dialogues", "vi": "Dịch nghĩa", "note": "Ghi chú ngữ pháp" }
    ]
  },
  "writing_exercises": [
    { "id": "w1", "type": "fill_blank", "sentence_parts": ["...", "..."], "answer": "...", "hint": "..." },
    { "id": "w2", "type": "sentence_ordering", "words": ["..."], "answer": "..." },
    { "id": "w3", "type": "free_writing", "prompt_vi": "...", "required_keywords": ["..."], "min_words": 8 }
  ],
  "dialogues": [
    { "id": "d1", "speaker": "Speaker A", "text": "...", "vietnamese": "..." }
  ],
  "default_vocabs": [
    { "word": "...", "ipa": "...", "vietnamese": "...", "example": "..." }
  ]
}`;

    try {
      addLog(`Đang gửi yêu cầu và đợi phản hồi từ Gemini API (hệ thống tự động thử lại nếu máy chủ quá tải)...`);
      const response = await fetchGeminiWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey.trim()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 1.0
          }
        })
      });

      const resData = await response.json();
      addLog(`Đã nhận phản hồi thành công từ Gemini API.`);
      
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Không nhận được nội dung từ AI.");
      }

      addLog(`Đang tiến hành trích xuất dữ liệu JSON...`);
      
      // Robust JSON extraction matching first { and last }
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error("Không tìm thấy cấu trúc JSON hợp lệ trong câu trả lời từ Gemini.");
      }
      const cleanJsonText = rawText.slice(firstBrace, lastBrace + 1);
      const repairedJsonText = preprocessAndRepairJson(cleanJsonText);
      
      let parsedData;
      try {
        parsedData = JSON.parse(repairedJsonText);
      } catch (parseErr) {
        console.error("JSON Parse Error details:", parseErr);
        // Extract context around syntax error position if available
        const posMatch = parseErr.message.match(/position\s+(\d+)/i);
        if (posMatch) {
          const pos = parseInt(posMatch[1], 10);
          const start = Math.max(0, pos - 40);
          const end = Math.min(repairedJsonText.length, pos + 40);
          const errorContext = repairedJsonText.slice(start, end);
          // Highlight exact spot
          const marker = " ".repeat(Math.min(pos - start + 10, 50)) + "^";
          addLog(`❌ Lỗi cú pháp JSON từ AI gần vị trí ${pos}:`);
          addLog(`[Ngữ cảnh]: ...${errorContext}...`);
          addLog(`[Vị trí lỗi]: ${marker}`);
        }
        throw new Error(`Dữ liệu JSON từ AI bị lỗi cú pháp: ${parseErr.message}. Vui lòng thử lại.`);
      }
      
      addLog(`Đang tiến hành kiểm tra (validate) dữ liệu bài học...`);
      const { valid, errors } = validateTopicData(parsedData);
      setValidationErrors(errors);

      setGeneratedData(parsedData);
      runSpellCheck(parsedData.reading_passage);
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
    
    // Save to published custom topics list
    const updated = storage.saveCustomTopic(generatedData);
    setCustomTopics(updated);
    
    // If it was in pending, remove it
    storage.deletePendingTopic(generatedData.id);
    setPendingTopics(storage.getPendingTopics());

    setGeneratedData(null);
    onTopicsListChange();
    alert("🎉 Đã DUYỆT và công khai bài học cho học viên!");
  };

  const handleSavePending = () => {
    if (!generatedData) return;
    
    const updated = storage.savePendingTopic(generatedData);
    setPendingTopics(updated);
    
    setGeneratedData(null);
    alert("💾 Đã lưu bài học vào danh sách chờ duyệt!");
  };

  const handleReject = () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy bỏ bài học đang sinh này?")) {
      setGeneratedData(null);
      setValidationErrors([]);
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
            <p className="color-text-muted text-xs mt-2">API Key được lưu bảo mật trong Local Storage trên chính trình duyệt của bạn, hoàn toàn không được gửi đi nơi khác.</p>
          </div>

          {/* AI Generator Form */}
          {!generatedData && (
            <div className="generator-card glass p-6">
              <h3 className="mb-4">Sinh bài học bằng AI (Gemini 3.5 Flash)</h3>
              
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
                disabled={isLoading || !form.topicName.trim() || !apiKey.trim()}
              >
                {isLoading ? "Đang sinh bài học..." : "Sinh bài học tự động"}
              </button>
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
          {generatedData && (isCheckingSpelling || spellCheckResult) && (
            <div className="spellcheck-card glass p-6 mb-6">
              <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                Soát lỗi chính tả & ngữ pháp
              </h3>
              {isCheckingSpelling ? (
                <div className="text-center py-4 flex flex-col items-center justify-center">
                  <div className="admin-spinner" style={{ margin: '0 auto 12px auto' }}></div>
                  <p className="color-text-muted text-xs mt-2">AI đang kiểm tra cấu trúc từng từ và câu thoại...</p>
                </div>
              ) : spellCheckResult && spellCheckResult.hasErrors ? (
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
                </div>
              ) : (
                <div className="text-center py-4" style={{ color: 'var(--color-success)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', fontWeight: 'bold' }}>✓</div>
                  <p className="text-sm font-semibold mt-2">Văn bản hoàn chỉnh & chuẩn bản xứ!</p>
                  <p className="color-text-muted text-xs">Không phát hiện bất kỳ lỗi chính tả hay ngữ pháp nào trong bài đọc.</p>
                </div>
              )}
            </div>
          )}

          {/* Live Preview Container (Active only when lesson is generated) */}
          {generatedData && (
            <div className="preview-container glass p-6">
              <div className="preview-header mb-4 flex justify-between items-center flex-wrap gap-3">
                <h3 className="text-gradient">Xem trước bài học AI sinh: "{generatedData.title}"</h3>
                
                {/* Preview Tabs Toolbar */}
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

              {/* Action Buttons for generated lesson */}
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

      </div>
    </div>
  );
}
