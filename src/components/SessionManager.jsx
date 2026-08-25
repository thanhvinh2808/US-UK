import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const SessionManager = ({ isOpen, onClose }) => {
  const { user, logout, logoutAll } = useAuth();
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle ESC key dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !confirmLogoutAll) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, confirmLogoutAll]);

  if (!isOpen || !user) return null;

  const getBrowserInfo = () => {
    if (typeof navigator === 'undefined') return 'Trình duyệt hiện tại';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Google Chrome / Chromium';
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Apple Safari';
    if (ua.includes('Edg')) return 'Microsoft Edge';
    return 'Trình duyệt Web';
  };

  const handleLogoutCurrent = async () => {
    setIsProcessing(true);
    try {
      await logout();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteLogoutAll = async () => {
    setIsProcessing(true);
    try {
      await logoutAll();
      setConfirmLogoutAll(false);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-manager-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmLogoutAll) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <h2 id="session-manager-title" className="text-lg font-bold text-slate-800">
              Quản lý phiên đăng nhập
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng quản lý phiên"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Active Session List */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Thiết bị hiện tại
            </h3>
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">💻</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{getBrowserInfo()}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Thiết bị này
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Đang hoạt động • Phiên xác thực Refresh Token Rotation (RTR)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security explanation */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <p className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>🛡️</span> Cơ chế bảo vệ phiên đăng nhập
            </p>
            <p>
              Hệ thống sử dụng HttpOnly Refresh Token xoay vòng (Rotation). Khi bạn đăng xuất tất cả thiết bị, tất cả mã refresh token cũ trên mọi máy khác sẽ bị thu hồi ngay lập tức.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleLogoutCurrent}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>🚪</span> Đăng xuất khỏi thiết bị này
            </button>

            <button
              onClick={() => setConfirmLogoutAll(true)}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>🔒</span> Đăng xuất khỏi TẤT CẢ thiết bị
            </button>
          </div>
        </div>

        {/* Confirmation Modal Overlay for Logout All */}
        {confirmLogoutAll && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 p-6 flex flex-col justify-center items-center text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1.5">
              Xác nhận đăng xuất tất cả thiết bị?
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              Hành động này sẽ vô hiệu hóa tất cả các phiên đăng nhập khác của bạn trên mọi trình duyệt và máy tính. Bạn sẽ cần đăng nhập lại.
            </p>
            <div className="flex items-center gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setConfirmLogoutAll(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteLogoutAll}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-200 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        )}

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

export default SessionManager;
