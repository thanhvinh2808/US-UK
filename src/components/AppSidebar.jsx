import React from 'react';
import StreakFlame from './common/StreakFlame';

export default function AppSidebar({ activeScreen, onNavigate, isAdmin, stats = { streak: 0, points: 0 } }) {
  const menuGroups = [
    {
      title: 'HỌC TẬP & LỘ TRÌNH',
      items: [
        { id: 'dashboard', label: 'Trang chủ' },
        { id: 'cefr_roadmap', label: 'Lộ trình CEFR (A1-C2)' },
        { id: 'flashcards', label: 'Flashcards SM-2' },
        { id: 'notebook', label: 'Sổ tay từ vựng' },
        { id: 'mistake_bank', label: 'Ngân hàng câu sai' }
      ]
    },
    {
      title: 'PHÁT ÂM & TRA CỨU',
      items: [
        { id: 'translator', label: 'Tra từ & Dịch [Ctrl+K]' },
        { id: 'minimal_pairs', label: 'Luyện âm Minimal Pairs' }
      ]
    },
    {
      title: 'NGỮ PHÁP & CỤM TỪ',
      items: [
        { id: 'tenses_handbook', label: 'Cẩm nang 12 thì' },
        { id: 'idioms_handbook', label: 'Thành ngữ & Cụm từ' }
      ]
    },
    {
      title: 'TIỆN ÍCH KHÁC',
      items: [
        { id: 'news', label: 'Tin tức & Mẹo học' },
        { id: 'mini_games', label: 'Trò chơi từ vựng' },
        { id: 'alphabet', label: 'Bảng chữ cái US / UK' },
        ...(isAdmin ? [{ id: 'admin', label: 'Quản trị hệ thống' }] : []),
        { id: 'landing', label: 'Trang giới thiệu' }
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
                    className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs border border-indigo-100/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
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
        <StreakFlame streak={stats.streak || 0} compact={true} />
        <span className="font-semibold text-indigo-600 font-mono">
          {stats.points || 0} XP
        </span>
      </div>
    </div>
  );
}
