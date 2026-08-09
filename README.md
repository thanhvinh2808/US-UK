# 🇬🇧 🇺🇸 Antigravity English (US-UK Studio)

Ứng dụng học tiếng Anh Anh/Mỹ toàn diện tích hợp Trí tuệ Nhân tạo (Gemini AI), thuật toán Lặp lại Ngắt quãng (Spaced Repetition SM-2), và công cụ Luyện phát âm / Chép chính tả tương tác.

🔗 **Demo Link:** [https://venglish-ten.vercel.app](https://venglish-ten.vercel.app)

---

## ✨ Tính năng chính

- 🇬🇧 🇺🇸 **Tùy chọn giọng chuẩn US / UK**: Tùy chỉnh giọng đọc và accent bản ngữ theo ngữ cảnh Anh - Anh hoặc Anh - Mỹ.
- 🧠 **Flashcards Spaced Repetition (SM-2)**: Thuật toán SuperMemo-2 tối ưu hóa việc ghi nhớ từ vựng lâu dài.
- 🎧 **Dictation (Luyện chép chính tả)**: Luyện phản xạ nghe và điền từ/câu theo giọng đọc bản ngữ.
- 🎙️ **Pronunciation & Minimal Pairs**: Luyện phát âm chuẩn IPA và phân biệt các cặp âm dễ nhầm lẫn (Minimal Pairs).
- 📖 **Grammar Lab & 12 Thì Tiếng Anh**: Cẩm nang chi tiết 12 thì ngữ pháp và bài tập thực hành theo chủ đề.
- ✍️ **Writing & Free Writing**: Luyện viết câu theo ngữ cảnh, tự động kiểm tra lỗi ngữ pháp.
- 🗣️ **Shadowing**: Luyện nói nhại (Shadowing Technique) theo các đoạn hội thoại thực tế.
- 🔍 **Tra từ AI (Global Translator / Lexicon)**: Tra cứu từ vựng mọi nơi trong app (phím tắt `Ctrl + K`), phân tích ngữ nghĩa và câu ví dụ với Gemini AI.
- 🌟 **Idioms Handbook**: Thư viện thành ngữ thông dụng theo cấp độ.
- 🎮 **Mini Games**: Các trò chơi tương tác nối từ, chọn đáp án nhanh giúp ôn luyện từ vựng bớt nhàm chán.
- 🛠️ **Admin Panel & AI Topic Generator**: Sinh chủ đề bài học tự động bằng AI, duyệt và quản lý dữ liệu với bảo mật Admin Secret Key.

---

## 🛠️ Hướng dẫn Cài đặt & Chạy dự án

### 1. Yêu cầu hệ thống
- Node.js (phiên bản 18+)
- npm hoặc yarn

### 2. Cài đặt Frontend (React + Vite + Tailwind CSS v4)
```bash
# Cài đặt dependencies tại thư mục gốc
npm install

# Khởi chạy giao diện phát triển
npm run dev
```
Ứng dụng frontend sẽ chạy tại: `http://localhost:5173`

### 3. Cài đặt Backend Server (Node.js + Express + MongoDB)
```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt dependencies cho backend
npm install

# Khởi chạy server
npm start
# hoặc node index.js
```
Backend server sẽ chạy tại: `http://localhost:5000`

---

## 🔑 Cấu hình Biến môi trường (Environment Variables)

Tạo file `server/.env` dựa trên mẫu sau:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
ADMIN_SECRET_KEY=antigravity_admin_secret_key_2026
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Các biến môi trường bắt buộc:
- `MONGODB_URI`: Chuỗi kết nối tới cơ sở dữ liệu MongoDB Cloud / Local.
- `ADMIN_SECRET_KEY`: Khóa bí mật dùng để xác thực quyền ghi/sửa/xóa bài học trong Admin Panel và các API bảo vệ.
- `GEMINI_API_KEY`: API Key kết nối dịch vụ Google Gemini (dùng cho Serverless Function / Proxy AI).

---

## 📜 Cấu trúc Dự án

```
web-demo-USUK/
├── api/                    # Vercel Serverless Functions (Gemini Proxy)
├── server/                 # Node.js/Express Backend Server & Database Schemas
│   ├── config/             # Kết nối Database
│   ├── middleware/         # Admin Auth Middleware
│   ├── models/             # Mongoose Schemas (Topic, UserCardProgress, StudySet...)
│   └── routes/             # API Endpoints (Topics, Progress, StudySets)
├── src/                    # React Frontend Source Code
│   ├── components/         # Các màn hình & UI Components chính
│   ├── data/               # Content Bank bài học mặc định
│   ├── services/           # Service API Client
│   └── utils/              # Helper utilities, SM-2 calculation, Storage manager
├── index.html              # Entry HTML
├── package.json
└── README.md
```
