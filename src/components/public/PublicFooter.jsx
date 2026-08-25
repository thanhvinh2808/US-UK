import React from 'react';

export const PublicFooter = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
                V
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                V-English
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Nền tảng học tiếng Anh thông minh thế hệ mới. Kết hợp thuật toán ghi nhớ ngắt quãng Spaced Repetition (SM-2), kho ngữ liệu US/UK chuẩn mực và phân tích ngữ pháp AI.
            </p>
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
              Learn. Practice. Improve.
            </p>
          </div>

          {/* Col 2: Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Tính năng học tập
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('flashcards')}
                  className="hover:text-white transition-colors"
                >
                  ⚡ Flashcards SM-2
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('notebook')}
                  className="hover:text-white transition-colors"
                >
                  📙 Sổ tay từ vựng
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('grammar')}
                  className="hover:text-white transition-colors"
                >
                  🔬 Grammar Lab AI
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('minimal_pairs')}
                  className="hover:text-white transition-colors"
                >
                  🎙️ Minimal Pairs & Shadowing
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('translator')}
                  className="hover:text-white transition-colors"
                >
                  🔍 Tra từ điển thông minh
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Tài nguyên & Bài viết
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('news')}
                  className="hover:text-white transition-colors"
                >
                  📰 Tin tức & Mẹo học IELTS
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tenses_handbook')}
                  className="hover:text-white transition-colors"
                >
                  📖 Cẩm nang 12 Thì tiếng Anh
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('idioms_handbook')}
                  className="hover:text-white transition-colors"
                >
                  💡 Thành ngữ & Cụm từ (Idioms)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('alphabet')}
                  className="hover:text-white transition-colors"
                >
                  🔤 Bảng ngữ âm IPA chuẩn
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Nền tảng & Bảo mật
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400">
                🔒 Refresh Token Rotation (RTR)
              </li>
              <li className="text-slate-400">
                ⚡ Offline-First Architecture
              </li>
              <li className="text-slate-400">
                📱 Đồng bộ đa thiết bị tức thì
              </li>
              <li className="text-slate-400">
                🛡️ Phân vùng lưu trữ an toàn
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 V-English Platform. All rights reserved. Designed for Excellence.</p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              V2.0 Production Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
