import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess, showToast }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferredAccent: 'US',
    targetBand: 7.5
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setServerError('');
    setFormErrors({});
  }, [initialMode, isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'targetBand' ? parseFloat(value) || 0 : value
    }));
    // Clear field-specific error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const errors = {};
    const cleanEmail = (formData.email || '').trim();

    if (!cleanEmail) {
      errors.email = 'Vui lòng nhập email.';
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (formData.password.length < 8) {
      errors.password = 'Mật khẩu phải từ 8 ký tự trở lên.';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = 'Mật khẩu phải bao gồm cả chữ cái và chữ số.';
    }

    if (mode === 'register') {
      const cleanUsername = (formData.username || '').trim();
      if (!cleanUsername) {
        errors.username = 'Vui lòng nhập tên tài khoản.';
      } else if (!USERNAME_REGEX.test(cleanUsername)) {
        errors.username = 'Tên tài khoản 3-30 ký tự, chỉ chứa chữ cái, số, _, -';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const mapServerError = (code, defaultMsg) => {
    switch (code) {
      case 'INVALID_CREDENTIALS':
        return 'Email hoặc mật khẩu không chính xác.';
      case 'ACCOUNT_LOCKED':
        return 'Tài khoản bị tạm khóa 15 phút do nhập sai 5 lần liên tiếp.';
      case 'EMAIL_ALREADY_EXISTS':
        return 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.';
      case 'USERNAME_ALREADY_EXISTS':
        return 'Tên người dùng đã được sử dụng. Vui lòng chọn tên khác.';
      case 'WEAK_PASSWORD':
        return 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số.';
      case 'PASSWORD_LENGTH_INVALID':
        return 'Mật khẩu phải từ 8 đến 128 ký tự.';
      case 'AUTH_RATE_LIMIT_EXCEEDED':
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.';
      default:
        return defaultMsg || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      if (mode === 'login') {
        const result = await login({
          email: formData.email.trim(),
          password: formData.password
        });

        if (result.success) {
          if (showToast) {
            showToast(`Chào mừng trở lại, ${result.user?.username || 'học viên'}! 👋`, 'success');
          }
          if (onSuccess) onSuccess(result.user);
          onClose();
        } else {
          setServerError(mapServerError(result.code, result.error));
        }
      } else {
        const result = await register({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          preferredAccent: formData.preferredAccent,
          targetBand: formData.targetBand
        });

        if (result.success) {
          if (showToast) {
            showToast('Đăng ký tài khoản thành công! 🎉', 'success');
          }
          if (onSuccess) onSuccess(result.user);
          onClose();
        } else {
          setServerError(mapServerError(result.code, result.error));
        }
      }
    } catch (err) {
      setServerError('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70">
          <button
            type="button"
            className={`flex-1 py-4 text-sm font-semibold transition-all ${
              mode === 'login'
                ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
            onClick={() => { setMode('login'); setServerError(''); }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={`flex-1 py-4 text-sm font-semibold transition-all ${
              mode === 'register'
                ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
            onClick={() => { setMode('register'); setServerError(''); }}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          className="absolute top-3.5 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-full hover:bg-slate-100 transition-colors"
          onClick={onClose}
          disabled={isSubmitting}
        >
          ✕
        </button>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 animate-shake">
              <span className="font-bold">⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên tài khoản (Username)</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="VD: alex_nguyen"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                  formErrors.username ? 'border-rose-400 ring-rose-100' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'
                }`}
                disabled={isSubmitting}
                autoComplete="username"
              />
              {formErrors.username && <p className="mt-1 text-xs text-rose-600">{formErrors.username}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="VD: user@example.com"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                formErrors.email ? 'border-rose-400 ring-rose-100' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'
              }`}
              disabled={isSubmitting}
              autoComplete="email"
            />
            {formErrors.email && <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Tối thiểu 8 ký tự, gồm chữ & số"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                formErrors.password ? 'border-rose-400 ring-rose-100' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'
              }`}
              disabled={isSubmitting}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {formErrors.password && <p className="mt-1 text-xs text-rose-600">{formErrors.password}</p>}
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                    formErrors.confirmPassword ? 'border-rose-400 ring-rose-100' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'
                  }`}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                {formErrors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{formErrors.confirmPassword}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giọng ưa thích</label>
                  <select
                    name="preferredAccent"
                    value={formData.preferredAccent}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                  >
                    <option value="US">🇺🇸 Giọng Mỹ (en-US)</option>
                    <option value="UK">🇬🇧 Giọng Anh (en-GB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mục tiêu Band</label>
                  <select
                    name="targetBand"
                    value={formData.targetBand}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                  >
                    <option value={6.0}>Band 6.0</option>
                    <option value={6.5}>Band 6.5</option>
                    <option value={7.0}>Band 7.0</option>
                    <option value={7.5}>Band 7.5 (Mặc định)</option>
                    <option value={8.0}>Band 8.0</option>
                    <option value={8.5}>Band 8.5+</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang xử lý...</span>
              </>
            ) : mode === 'login' ? (
              'Đăng nhập ngay'
            ) : (
              'Hoàn tất đăng ký'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
