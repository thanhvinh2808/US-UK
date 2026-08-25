import React from 'react';

export default function LearningInsights({ insights = [] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">💡</span>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Góc phân tích học tập (Insights)
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {insights.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border space-y-2 ${
              item.level === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' :
              item.level === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-950' :
              'bg-indigo-50/50 border-indigo-100 text-indigo-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <h4 className="text-sm font-bold leading-snug">
                  {item.title}
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
