import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function UserProfileMenu({
  onNavigate,
  showToast,
  voiceAccent,
  onToggleVoiceAccent,
  onOpenAccountSettings,
  onOpenSessionManager,
  onOpenDataManagement
}) {
  const { user, isAdmin, logout, logoutAll } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsOpen(false);
      if (onNavigate) onNavigate('landing');
      if (showToast) {
        showToast('Đã đăng xuất thành công 👋', 'info');
      }
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi TẤT CẢ các thiết bị đang đăng nhập?')) {
      return;
    }
    setIsLoggingOut(true);
    try {
      await logoutAll();
      setIsOpen(false);
      if (onNavigate) onNavigate('landing');
      if (showToast) {
        showToast('Đã thu hồi và đăng xuất tất cả thiết bị thành công 🔒', 'info');
      }
    } catch (e) {
      console.warn('Logout-all error:', e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  const initialLetter = (user.username || user.email || 'U')[0].toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        title="Tài khoản cá nhân"
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ${
          isAdmin ? 'bg-gradient-to-tr from-amber-500 to-rose-500' : 'bg-gradient-to-tr from-indigo-500 to-sky-500'
        }`}>
          {initialLetter}
        </div>
        <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">
          {user.username || 'Học viên'}
        </span>
        {isAdmin && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 rounded-md border border-amber-200">
            Admin
          </span>
        )}
        <span className="text-[10px] text-slate-400">▾</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5 border border-slate-100 z-50 animate-fade-in">
          {/* User Details Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md ${
                isAdmin ? 'bg-gradient-to-tr from-amber-500 to-rose-500' : 'bg-gradient-to-tr from-indigo-500 to-sky-500'
              }`}>
                {initialLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user.username}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    isAdmin ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {isAdmin ? '🛡️ Quản trị viên' : '🎓 Học viên'}
                  </span>
                  {user.targetBand && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      🎯 Band {user.targetBand}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Settings & Navigation */}
          <div className="space-y-1 py-1">
            {onToggleVoiceAccent && (
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                onClick={() => {
                  onToggleVoiceAccent();
                }}
              >
                <span className="flex items-center gap-2">
                  <span>📻 Giọng đọc:</span>
                  <span className="font-bold text-indigo-600">
                    {voiceAccent === 'UK' ? '🇬🇧 UK (Anh)' : '🇺🇸 US (Mỹ)'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">Đổi</span>
              </button>
            )}

            {onOpenAccountSettings && (
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAccountSettings();
                }}
              >
                <span>⚙️</span>
                <span>Cài đặt tài khoản</span>
              </button>
            )}

            {onOpenSessionManager && (
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSessionManager();
                }}
              >
                <span>📱</span>
                <span>Quản lý phiên đăng nhập</span>
              </button>
            )}

            {onOpenDataManagement && (
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                onClick={() => {
                  setIsOpen(false);
                  onOpenDataManagement();
                }}
              >
                <span>💾</span>
                <span>Sao lưu & Quản lý dữ liệu</span>
              </button>
            )}

            {isAdmin && onNavigate && (
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-900 bg-amber-50/70 hover:bg-amber-100 rounded-lg transition-colors font-semibold"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('admin');
                }}
              >
                <span>🛡️</span>
                <span>Vào trang Quản trị hệ thống</span>
              </button>
            )}
          </div>

          {/* Logout Actions */}
          <div className="border-t border-slate-100 pt-1 mt-1 space-y-1">
            <button
              type="button"
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={handleLogout}
            >
              <span>🚪</span>
              <span>Đăng xuất thiết bị này</span>
            </button>

            <button
              type="button"
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              onClick={handleLogoutAll}
            >
              <span>🔒</span>
              <span>Đăng xuất tất cả thiết bị</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
