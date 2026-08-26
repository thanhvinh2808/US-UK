import React from 'react';
import { useAuth } from '../context/AuthContext';
import UserProfileMenu from './UserProfileMenu';
import SyncStatus from './SyncStatus';
import StreakFlame from './common/StreakFlame';

export default function AppNavbar({
  activeScreen,
  onNavigate,
  voiceAccent = 'US',
  onToggleVoiceAccent,
  stats,
  onOpenAuthModal,
  onOpenAccountSettings,
  onOpenSessionManager,
  onOpenDataManagement,
  showToast
}) {
  const { isAuthenticated, isAdmin } = useAuth();

  const handleLogoKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigate('dashboard');
    }
  };

  return (
    <header className="qz-header-fixed" role="banner">
      <div className="qz-header-container">
        {/* Brand Logo & Wordmark */}
        <div 
          className="qz-brand cursor-pointer select-none" 
          onClick={() => onNavigate('dashboard')}
          onKeyDown={handleLogoKeyDown}
          tabIndex={0}
          role="button"
          aria-label="V-English Workspace — Về Trang chủ"
          title="Về Trang chủ Workspace"
        >
          <div className="qz-logo-badge font-black">
            V
          </div>
          <div className="flex flex-col">
            <span className="qz-logo-text">V-English</span>
            <span className="text-[9px] font-semibold text-indigo-500 uppercase tracking-widest hidden sm:inline -mt-1">
              v2.0 Workspace
            </span>
          </div>
        </div>

        {/* Analog Radio Dual-Dial Voice Knob */}
        <div 
          className="qz-voice-tuner cursor-pointer select-none" 
          onClick={onToggleVoiceAccent} 
          role="button"
          tabIndex={0}
          aria-label={`Giọng đọc hiện tại: ${voiceAccent === 'UK' ? 'Giọng Anh' : 'Giọng Mỹ'}. Nhấn để đổi.`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleVoiceAccent?.();
            }
          }}
          title="Nhấn để chuyển giọng Anh / Mỹ"
        >
          <div className={`qz-tuner-knob ${voiceAccent === 'UK' ? 'pos-uk' : 'pos-us'}`}>
            <div className="qz-knob-notch" />
          </div>
          <div className="qz-tuner-display">
            <span className={`qz-tuner-freq ${voiceAccent === 'US' ? 'active-us' : ''}`}>98.6 US</span>
            <span className="qz-tuner-sep">|</span>
            <span className={`qz-tuner-freq ${voiceAccent === 'UK' ? 'active-uk' : ''}`}>104.2 UK</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="qz-nav-links" aria-label="Menu điều hướng Workspace">
          <button
            type="button"
            className={`qz-nav-item ${activeScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            Trang chủ
          </button>
          <button
            type="button"
            className={`qz-nav-item ${activeScreen === 'flashcards' ? 'active' : ''}`}
            onClick={() => onNavigate('flashcards')}
          >
            Flashcards
          </button>
          <button
            type="button"
            className={`qz-nav-item ${activeScreen === 'notebook' ? 'active' : ''}`}
            onClick={() => onNavigate('notebook')}
          >
            Sổ tay
          </button>
          <button
            type="button"
            className={`qz-nav-item ${activeScreen === 'news' ? 'active' : ''}`}
            onClick={() => onNavigate('news')}
          >
            Tin tức & Mẹo
          </button>

          {/* Explore Dropdown */}
          <div className="qz-nav-dropdown-wrapper">
            <button type="button" className="qz-nav-item qz-dropdown-trigger" aria-haspopup="true">
              Chức năng ▾
            </button>
            <div className="qz-dropdown-menu" role="menu">
              <div className="qz-dropdown-label">LỘ TRÌNH CHUẨN (CEFR)</div>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('cefr_roadmap')}>
                Lộ trình CEFR (A1-C2)
              </button>

              <div className="qz-dropdown-label mt-2">HỌC TẬP & TỪ VỰNG</div>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('dashboard')}>
                Thư viện chủ đề
              </button>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('flashcards')}>
                Flashcards Spaced Repetition
              </button>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('notebook')}>
                Sổ tay từ vựng
              </button>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('mistake_bank')}>
                Ngân hàng câu sai
              </button>

              <div className="qz-dropdown-label mt-2">PHÁT ÂM & TRA CỨU</div>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('translator')}>
                Tra từ & Dịch [Ctrl+K]
              </button>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('minimal_pairs')}>
                Luyện phát âm Minimal Pairs
              </button>

              <div className="qz-dropdown-label mt-2">NGỮ PHÁP & CỤM TỪ</div>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('tenses_handbook')}>
                Cẩm nang 12 thì
              </button>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('idioms_handbook')}>
                Thành ngữ & Cụm từ
              </button>

              <div className="qz-dropdown-label mt-2">TIỆN ÍCH KHÁC</div>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('landing')}>
                Trang giới thiệu
              </button>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('mini_games')}>
                Trò chơi từ vựng
              </button>
              <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('alphabet')}>
                Bảng chữ cái US / UK
              </button>
              {isAdmin && (
                <button type="button" className="qz-dropdown-item" role="menuitem" onClick={() => onNavigate('admin')}>
                  Quản trị hệ thống
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* User Actions & Stats */}
        <div className="qz-user-actions">
          <div className="qz-stat-pill streak" title="Chuỗi ngày học liên tục">
            <StreakFlame streak={stats?.streak || 0} showLabel={false} />
          </div>
          <div className="qz-stat-pill xp" title="Điểm kinh nghiệm tích lũy">
            <span className="font-semibold text-xs font-mono">{stats?.points || 0} XP</span>
          </div>

          {/* Online / Offline / Sync Status Badge */}
          <SyncStatus />

          {/* Auth State: User Profile or Login Button */}
          {isAuthenticated ? (
            <UserProfileMenu
              onNavigate={onNavigate}
              showToast={showToast}
              voiceAccent={voiceAccent}
              onToggleVoiceAccent={onToggleVoiceAccent}
              onOpenAccountSettings={onOpenAccountSettings}
              onOpenSessionManager={onOpenSessionManager}
              onOpenDataManagement={onOpenDataManagement}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div 
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 select-none"
                title="Đang học chế độ Khách (Lưu trên thiết bị này)"
              >
                <span>Chế độ Khách</span>
              </div>
              <button
                type="button"
                className="qz-auth-btn"
                onClick={() => onOpenAuthModal('login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                title="Đăng nhập hoặc Đăng ký để lưu tiến độ vĩnh viễn và đồng bộ đa thiết bị"
              >
                <span>Đăng nhập / Lưu</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
