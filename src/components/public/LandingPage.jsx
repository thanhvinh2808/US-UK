import React, { useState, useEffect } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { speak } from '../../utils/sounds';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

export const LandingPage = ({
  onNavigate,
  onOpenAuth,
  voiceAccent = 'US',
  onToggleVoiceAccent
}) => {
  useScrollReveal();

  // Interactive Demo State (Standalone, isolated from storage)
  const [demoFlipped, setDemoFlipped] = useState(false);
  const [demoGradeFeedback, setDemoGradeFeedback] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);

  const handleDemoGrade = (gradeText) => {
    setDemoGradeFeedback(gradeText);
    setTimeout(() => {
      setDemoFlipped(false);
      setDemoGradeFeedback(null);
    }, 2000);
  };

  // Keyboard shortcut support for standalone demo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or modal
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setDemoFlipped(prev => !prev);
      } else if (demoFlipped) {
        if (e.key === '1') handleDemoGrade('Lặp lại ngay (1 ngày)');
        if (e.key === '2') handleDemoGrade('Khá khó (3 ngày)');
        if (e.key === '3') handleDemoGrade('Nhớ tốt (6 ngày)');
        if (e.key === '4') handleDemoGrade('Rất dễ (14 ngày)');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [demoFlipped]);

  const handleSpeak = (text, accent = 'US') => {
    speak(text, { accent, rate: 0.85 });
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <PublicNavbar
        activeScreen="landing"
        onNavigate={onNavigate}
        onOpenAuth={onOpenAuth}
        voiceAccent={voiceAccent}
        onToggleVoiceAccent={onToggleVoiceAccent}
      />

      {/* =========================================================================
          SECTION 1 — HERO
          ========================================================================= */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left reveal-init">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wide shadow-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>V-ENGLISH 2.0 — NỀN TẢNG HỌC TIẾNG ANH THÔNG MINH</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Học tiếng Anh thông minh hơn. <br />
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                  Ghi nhớ lâu hơn.
                </span>
              </h1>

              {/* Supporting Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                V-English kết hợp phương pháp ghi nhớ ngắt quãng <strong>Spaced Repetition (SM-2)</strong>, phân tích ngữ pháp AI và kho phát âm chuẩn <strong>US / UK</strong>. Giúp bạn biến từ vựng thành phản xạ tự nhiên.
              </p>

              {/* Dual Action CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Bắt đầu học miễn phí</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>

                <button
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-base shadow-sm hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <span>Mở ứng dụng học</span>
                </button>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>100% Offline-Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Thuật toán SM-2 chuẩn hóa</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Đồng bộ tức thì đa thiết bị</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Hero Showcase Preview */}
            <div className="lg:col-span-5 reveal-init stagger-2">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xl shadow-slate-900/10 space-y-5 animate-float-subtle">
                {/* Showcase Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Flashcard Focus Mode
                  </span>
                </div>

                {/* Card Body Demo */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white border border-indigo-100 text-center space-y-3">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    IELTS Band 7.5+ Core
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    pragmatic
                  </h3>
                  <p className="text-xs font-mono text-slate-500 bg-white inline-block px-3 py-1 rounded-full border border-slate-200">
                    /præɡˈmæt.ɪk/
                  </p>
                  <p className="text-sm font-semibold text-slate-700 pt-1">
                    "thực tế, có tính ứng dụng cao"
                  </p>
                </div>

                {/* Audio & SM-2 Feedback */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-slate-400 block">GIỌNG PHÁT ÂM</span>
                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                      <span>US General</span>
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
                    <span className="text-[10px] font-bold text-slate-400 block">ĐỘ BỀN TRÍ NHỚ (SM-2)</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <span>Thành thạo (14 ngày)</span>
                    </span>
                  </div>
                </div>

                {/* Interactive Simulated Rating */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors">
                    Chưa thuộc
                  </button>
                  <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-colors">
                    Thuộc tốt ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2 — VALUE PROPOSITION STRIP
          ========================================================================= */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {[
              { label: 'Spaced Repetition', desc: 'Thuật toán SM-2 khoa học' },
              { label: 'Giọng đọc US / UK', desc: 'Chuyển đổi âm vị 2 miền' },
              { label: 'Offline-First', desc: 'Học ngay khi không có mạng' },
              { label: 'Đồng bộ tức thì', desc: 'Hàng đợi Outbox đa thiết bị' },
              { label: 'Grammar Lab', desc: 'Phân tích ngữ pháp chuyên sâu' },
              { label: 'Mục tiêu IELTS', desc: 'Cá nhân hóa từ Band 5-9' },
            ].map((val, idx) => (
              <div key={idx} className="space-y-1.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors reveal-init" style={{ transitionDelay: `${idx * 60}ms` }}>
                <div className="w-8 h-8 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </div>
                <h4 className="text-xs font-bold text-slate-800">{val.label}</h4>
                <p className="text-[11px] text-slate-500">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3 — CORE PRODUCT FEATURES
          ========================================================================= */}
      <section id="features" className="py-24 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3 reveal-init">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              TÍNH NĂNG CỐT LÕI
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tất cả công cụ bạn cần để làm chủ tiếng Anh
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Không còn học rời rạc. V-English tích hợp toàn diện các phương pháp luyện từ vựng, ngữ pháp và phát âm vào một trải nghiệm đồng nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                code: 'SM2',
                title: 'Flashcards SM-2 Thông Minh',
                desc: 'Tự động tính toán khoảng cách ngày ôn tập theo mức độ ghi nhớ cá nhân. Đánh bại hoàn toàn đường cong lãng quên.',
                badge: 'Spaced Repetition',
                action: 'flashcards'
              },
              {
                code: 'VOC',
                title: 'Sổ Tay Từ Vựng Cá Nhân',
                desc: 'Lưu trữ, phân loại từ theo bộ thẻ hoặc chủ đề IELTS. Đầy đủ phiên âm IPA, giải nghĩa tiếng Việt và câu ví dụ ngữ cảnh.',
                badge: 'Từ vựng',
                action: 'notebook'
              },
              {
                code: 'GRM',
                title: 'Phòng Thí Nghiệm Ngữ Pháp',
                desc: 'Nhập câu bất kỳ để nhận phân tích cấu trúc, xác định thì động từ và gợi ý sửa lỗi trực quan.',
                badge: 'Ngữ pháp',
                action: 'grammar'
              },
              {
                code: 'PHO',
                title: 'Luyện Phát Âm US / UK',
                desc: 'Chuyển đổi tức thì giữa giọng Anh - Anh và Anh - Mỹ. So sánh các cặp âm tối thiểu (Minimal Pairs) và luyện Shadowing.',
                badge: 'Ngữ âm',
                action: 'minimal_pairs'
              },
              {
                code: 'MST',
                title: 'Ngân Hàng Câu Sai',
                desc: 'Tự động thu thập các câu trả lời sai trong quá trình làm bài để phân tích kỹ năng yếu và đưa ra bài ôn tập phục hồi.',
                badge: 'Ôn tập lỗi',
                action: 'mistake_bank'
              },
              {
                code: 'DIC',
                title: 'Tra Từ & Dịch Thuật',
                desc: 'Tra cứu nhanh từ vựng với phím tắt Ctrl+K, xem 12 thì chia động từ tự động và ví dụ song ngữ chuẩn xác.',
                badge: 'Tra cứu',
                action: 'translator'
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate(feat.action)}
                className="group bg-white rounded-3xl p-7 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between reveal-init"
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-mono font-bold flex items-center justify-center text-xs tracking-wider group-hover:scale-105 transition-transform">
                      {feat.code}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <div className="pt-6 flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:gap-2.5 transition-all">
                  <span>Trải nghiệm tính năng</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4 — THE SCIENCE OF RETENTION (SM-2)
          ========================================================================= */}
      <section id="science" className="py-24 bg-white border-y border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3 reveal-init">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              KHOA HỌC TRÍ NHỚ
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Phương pháp Spaced Repetition (SM-2) hoạt động ra sao?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Thay vì nhồi nhét từ vựng hàng giờ rồi quên sạch sau một tuần, thuật toán SM-2 lập lịch ôn tập chính xác vào thời điểm trí nhớ chuẩn bị suy giảm.
            </p>
          </div>

          {/* 4-Step Retention Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { step: '01', title: 'Học từ mới', desc: 'Nạp từ vựng kèm ngữ cảnh câu, phiên âm IPA chuẩn và nghĩa tiếng Việt.', interval: 'Ngày 1' },
              { step: '02', title: 'Ôn tập lần đầu', desc: 'Chủ động nhớ lại (Active Recall) sau 24 giờ. Đánh giá độ khó từ 1 đến 5.', interval: 'Ngày 2' },
              { step: '03', title: 'Giãn cách tối ưu', desc: 'Thuật toán tự động tăng khoảng cách lên 6 ngày, 14 ngày khi bạn nhớ tốt.', interval: 'Ngày 8' },
              { step: '04', title: 'Trí nhớ dài hạn', desc: 'Từ vựng chuyển hóa vĩnh viễn vào bộ nhớ phản xạ mà không cần học lại.', interval: 'Ngày 30+' },
            ].map((step, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 relative reveal-init" style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-indigo-600">{step.step}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {step.interval}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5 — INTERACTIVE FLASHCARD DEMO (STANDALONE WIDGET)
          ========================================================================= */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="space-y-3 reveal-init">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              TRẢI NGHIỆM TRỰC QUAN
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Thử nghiệm Flashcard SM-2 ngay tại đây
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Nhấp vào thẻ để lật xem nghĩa, sau đó chọn mức độ nhớ để cảm nhận cơ chế chấm điểm của thuật toán SuperMemo-2.
            </p>
          </div>

          {/* Interactive Card Widget */}
          <div className="max-w-md mx-auto perspective-1000 reveal-init stagger-2">
            <div
              onClick={() => setDemoFlipped(!demoFlipped)}
              className={`w-full min-h-[260px] rounded-3xl p-8 cursor-pointer transition-all duration-500 transform-style-3d border border-slate-700 bg-slate-800 hover:border-indigo-500 shadow-2xl relative flex flex-col items-center justify-center ${
                demoFlipped ? 'rotate-y-180 bg-indigo-950/80 border-indigo-500' : ''
              }`}
            >
              {!demoFlipped ? (
                <div className="space-y-3 text-center">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Mặt trước (Nhấp để lật)
                  </span>
                  <h3 className="text-4xl font-black text-white tracking-tight">
                    ubiquitous
                  </h3>
                  <p className="text-sm font-mono text-slate-400">
                    /juːˈbɪk.wɪ.təs/
                  </p>
                  <p className="text-xs text-slate-500 pt-2">
                    "Phổ biến, có mặt ở khắp mọi nơi"
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-center rotate-y-180">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Mặt sau (Ý nghĩa & Ví dụ)
                  </span>
                  <h3 className="text-2xl font-bold text-white">
                    Phổ biến, ở đâu cũng có
                  </h3>
                  <p className="text-xs text-slate-300 italic max-w-xs">
                    "Smartphones have become ubiquitous in modern society."
                  </p>
                  <span className="text-[10px] text-indigo-300 block pt-1">
                    (Nhấn các nút bên dưới để chấm điểm)
                  </span>
                </div>
              )}
            </div>

            {/* Grading Controls */}
            {demoFlipped && (
              <div className="mt-5 grid grid-cols-4 gap-2 animate-fadeIn">
                <button
                  onClick={() => handleDemoGrade('Lặp lại ngay (1 ngày)')}
                  className="py-2 px-1 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-300 text-xs font-bold transition-colors"
                >
                  Again (1)
                </button>
                <button
                  onClick={() => handleDemoGrade('Khá khó (3 ngày)')}
                  className="py-2 px-1 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-300 text-xs font-bold transition-colors"
                >
                  Hard (2)
                </button>
                <button
                  onClick={() => handleDemoGrade('Nhớ tốt (6 ngày)')}
                  className="py-2 px-1 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition-colors"
                >
                  Good (3)
                </button>
                <button
                  onClick={() => handleDemoGrade('Rất dễ (14 ngày)')}
                  className="py-2 px-1 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/50 text-indigo-300 text-xs font-bold transition-colors"
                >
                  Easy (4)
                </button>
              </div>
            )}

            {/* Keyboard shortcut hint */}
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Space</span>
              <span>Lật thẻ</span>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">1 - 4</span>
              <span>Đánh giá mức độ</span>
            </div>

            {demoGradeFeedback && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold animate-fadeIn">
                ✓ Đã tính toán: Lập lịch ôn lại sau {demoGradeFeedback}!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6 — US / UK PRONUNCIATION SHOWCASE
          ========================================================================= */}
      <section className="py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3 reveal-init">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              NGỮ ÂM CHUẨN MỰC
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Phát âm chuẩn xác cả 2 phương ngữ US & UK
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              V-English hỗ trợ núm chuyển đổi nhanh giữa chuẩn General American (Mỹ) và Received Pronunciation (Anh) để bạn làm chủ mọi bài thi nghe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { word: 'schedule', us: '/ˈskedʒ.uːl/', uk: '/ˈʃedʒ.uːl/', meaning: 'Lịch trình' },
              { word: 'water', us: '/ˈwɑː.t̬ɚ/ (Flapped T)', uk: '/ˈwɔː.tər/ (Clear T)', meaning: 'Nước uống' },
              { word: 'advertisement', us: '/ˌæd.vɚˈtaɪz.mənt/', uk: '/ədˈvɜː.tɪs.mənt/', meaning: 'Mục quảng cáo' }
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 reveal-init" style={{ transitionDelay: `${idx * 80}ms` }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">{item.word}</h3>
                  <span className="text-xs font-semibold text-slate-500">{item.meaning}</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-blue-800">🇺🇸 US:</span>
                      <span className="font-mono text-blue-900">{item.us}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeak(item.word, 'US')}
                      className="px-2 py-1 rounded-lg bg-blue-100/80 hover:bg-blue-200 text-blue-800 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      title="Nghe phát âm giọng Mỹ"
                    >
                      <span>🔊</span> Nghe
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/70 border border-red-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-red-800">🇬🇧 UK:</span>
                      <span className="font-mono text-red-900">{item.uk}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeak(item.word, 'UK')}
                      className="px-2 py-1 rounded-lg bg-red-100/80 hover:bg-red-200 text-red-800 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      title="Nghe phát âm giọng Anh"
                    >
                      <span>🔊</span> Nghe
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7 — FAQ ACCORDION
          ========================================================================= */}
      <section className="py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 reveal-init">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              GIẢI ĐÁP THẮC MẮC
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Câu hỏi thường gặp về V-English
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'V-English phù hợp với những ai?',
                a: 'V-English được thiết kế tối ưu cho học viên luyện thi IELTS (Target Band 5.0 - 9.0), học sinh THPT, sinh viên và người đi làm cần cải thiện vốn từ vựng học thuật, ngữ pháp và phát âm thực chiến.'
              },
              {
                q: 'Thuật toán Spaced Repetition (SM-2) có gì vượt trội?',
                a: 'SM-2 dựa trên khoa học thần kinh về đường cong lãng quên Ebbinghaus. Thuật toán tự động giãn cách ngày ôn tập theo phản hồi của bạn, giúp tiết kiệm tới 70% thời gian so với phương pháp học chép từ truyền thống.'
              },
              {
                q: 'Ứng dụng có thể học khi mất kết nối mạng (Offline) không?',
                a: 'Có. V-English được xây dựng theo kiến trúc Offline-First. Toàn bộ tiến độ và từ vựng của bạn được lưu trong hàng đợi Offline Outbox và tự động đồng bộ lên server ngay khi có kết nối trở lại.'
              },
              {
                q: 'Tôi có thể chuyển đổi giữa giọng Anh - Anh và Anh - Mỹ không?',
                a: 'Hoàn toàn được. Bạn có thể xoay núm chuyển đổi nhanh trên thanh điều hướng hoặc trong mục Cài đặt tài khoản bất kỳ lúc nào.'
              },
              {
                q: 'Dữ liệu học tập cá nhân có được bảo mật an toàn không?',
                a: 'Hệ thống áp dụng chuẩn bảo mật JWT HS256 kết hợp HttpOnly Refresh Token Rotation (RTR). Toàn bộ dữ liệu của từng người dùng được phân vùng riêng biệt tuyệt đối.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all reveal-init"
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-800 hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className={`text-slate-400 transform transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-indigo-600' : ''}`}>
                    ▾
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8 — FINAL HIGH-CONVERSION CTA
          ========================================================================= */}
      <section className="py-20 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10 reveal-init">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              BẮT ĐẦU NGAY HÔM NAY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Sẵn sàng nâng tầm tiếng Anh cùng V-English?
            </h2>
            <p className="text-sm sm:text-base text-indigo-200 max-w-xl mx-auto">
              Tham gia cùng hàng nghìn học viên đang áp dụng phương pháp Spaced Repetition thông minh mỗi ngày.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-base shadow-xl shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
            >
              Tạo tài khoản học miễn phí
            </button>
            <button
              onClick={() => onNavigate('news')}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base transition-all"
            >
              Khám phá bài viết & Mẹo học
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter onNavigate={onNavigate} onOpenAuth={onOpenAuth} />
    </div>
  );
};

export default LandingPage;
