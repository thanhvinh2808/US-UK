import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const AccountSettings = ({ isOpen, onClose }) => {
  const { user, updateUser, logout } = useAuth();
  const [preferredAccent, setPreferredAccent] = useState(user?.preferredAccent || 'US');
  const [targetBand, setTargetBand] = useState(user?.targetBand || 6.5);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setPreferredAccent(user.preferredAccent || 'US');
      setTargetBand(user.targetBand || 6.5);
    }
  }, [user]);

  // Handle ESC key dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSavePreferences = (e) => {
    e.preventDefault();
    updateUser({ preferredAccent, targetBand: Number(targetBand) });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 id="account-settings-title" className="text-lg font-bold text-slate-800">
              Cài đặt tài khoản
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng cài đặt"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Profile Overview Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-200">
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 truncate">{user.username}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  user.role === 'admin'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {user.role === 'admin' ? '🛡️ Quản trị viên' : '🎓 Học viên'}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Preferences Form */}
          <form onSubmit={handleSavePreferences} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Tùy chọn học tập
            </h3>

            {/* Target Band */}
            <div>
              <label htmlFor="target-band-select" className="block text-xs font-semibold text-slate-600 mb-1">
                Mục tiêu IELTS (Target Band)
              </label>
              <select
                id="target-band-select"
                value={targetBand}
                onChange={(e) => setTargetBand(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((band) => (
                  <option key={band} value={band}>
                    Band {band.toFixed(1)} {band >= 7.5 ? '⭐ (Advanced)' : band >= 6.5 ? '🎯 (Target)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Accent */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Giọng phát âm ưu tiên
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredAccent('US')}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    preferredAccent === 'US'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>🇺🇸</span> Tiếng Anh - Mỹ (US)
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredAccent('UK')}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    preferredAccent === 'UK'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>🇬🇧</span> Tiếng Anh - Anh (UK)
                </button>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
                <span>✓</span> Đã lưu cài đặt tùy chọn học tập!
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
            >
              Lưu thay đổi
            </button>
          </form>

          {/* Account Security Info */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Bảo mật & Phiên làm việc
            </h3>
            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span>Trạng thái tài khoản:</span>
                <span className="font-semibold text-emerald-600">🟢 Hoạt động</span>
              </div>
              <div className="flex justify-between">
                <span>Chuỗi học liên tiếp (Streak):</span>
                <span className="font-semibold text-indigo-600">{user.streakDays || 0} ngày 🔥</span>
              </div>
              <div className="flex justify-between">
                <span>Cơ chế bảo mật:</span>
                <span className="font-medium text-slate-500">JWT HS256 + HttpOnly RTR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
