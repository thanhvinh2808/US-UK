import React, { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log safe error summary
    if (typeof console !== 'undefined' && console.error) {
      console.error('ErrorBoundary caught an unhandled render error:', error?.message);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              ⚠️
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Đã xảy ra sự cố hiển thị
              </h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Ứng dụng gặp lỗi không mong muốn nhưng toàn bộ tiến độ học tập và từ vựng của bạn vẫn được lưu an toàn.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200 transition-colors"
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
