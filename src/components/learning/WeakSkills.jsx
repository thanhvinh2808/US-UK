import React from 'react';

export default function WeakSkills({ weaknessStats = [], mistakeCount = 0, onNavigate }) {
  const hasMistakes = mistakeCount > 0 && weaknessStats.length > 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
            PHÂN TÍCH ĐIỂM YẾU
          </span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
            Kỹ năng & Dạng câu cần củng cố
          </h3>
        </div>
        {hasMistakes && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('mistake_bank')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Mở Ngân hàng lỗi sai →
          </button>
        )}
      </div>

      {!hasMistakes ? (
        <div className="text-center py-8 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2">
          <span className="text-3xl">✨</span>
          <p className="text-xs font-bold text-slate-700">Chưa ghi nhận lỗi sai</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Hệ thống sẽ tự động phân tích điểm yếu khi bạn thực hành làm bài đọc, trắc nghiệm ngữ pháp hoặc chính tả.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {weaknessStats.slice(0, 4).map((item, idx) => {
            const percentage = Math.min(100, Math.round((item.count / mistakeCount) * 100));
            return (
              <div key={item.skill || idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {item.skill}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {item.count} lỗi ({percentage}%)
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full bg-slate-100 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
