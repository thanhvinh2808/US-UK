import React from 'react';

export default function AppSidebar({ activeScreen, onNavigate, isAdmin, stats = { streak: 0, points: 0 } }) {
  const menuGroups = [
    {
      title: 'HỌC TẬP & LỘ TRÌNH',
      items: [
        { id: 'dashboard', label: 'Trang chủ Workspace', icon: '🏠' },
        { id: 'flashcards', label: 'Flashcards SM-2', icon: '⚡' },
        { id: 'notebook', label: 'Sổ tay từ vựng', icon: '📙' },
        { id: 'mistake_bank', label: 'Ngân hàng câu sai', icon: '📌' }
      ]
    },
    {
      title: 'PHÁT ÂM & AI LEXICON',
      items: [
        { id: 'translator', label: 'Tra từ AI [Ctrl+K]', icon: '🔍' },
        { id: 'minimal_pairs', label: 'Luyện âm Minimal Pairs', icon: '🎙️' }
      ]
    },
    {
      title: 'NGỮ PHÁP & CỤM TỪ',
      items: [
        { id: 'tenses_handbook', label: '12 Thì Tiếng Anh', icon: '📖' },
        { id: 'idioms_handbook', label: 'Idioms & Cụm từ', icon: '💡' }
      ]
    },
    {
      title: 'KHÁM PHÁ & TIỆN ÍCH',
      items: [
        { id: 'news', label: 'Tin tức & Mẹo học', icon: '📰' },
        { id: 'mini_games', label: 'Playzone Games', icon: '🕹️' },
        { id: 'alphabet', label: 'Bảng chữ cái US-UK', icon: '🔤' },
        ...(isAdmin ? [{ id: 'admin', label: 'Quản trị hệ thống', icon: '⚙️' }] : []),
        { id: 'landing', label: '✨ Trang giới thiệu Public', icon: '🌐' }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-6 select-none">
      {/* Navigation Group Items */}
      <div className="space-y-5">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
              {group.title}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs border border-indigo-100/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mini Streak & Points Badge at bottom */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-2 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1">
          🔥 {stats.streak || 0} ngày
        </span>
        <span className="font-bold text-indigo-600 font-mono">
          ⭐ {stats.points || 0} XP
        </span>
      </div>
    </div>
  );
}
