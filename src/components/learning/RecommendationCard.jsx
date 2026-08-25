import React from 'react';

export default function RecommendationCard({ recommendation, onNavigate, onSelectTopic }) {
  if (!recommendation) return null;

  const handleClick = () => {
    if (recommendation.screen === 'topic_detail' && recommendation.topicData && onSelectTopic) {
      onSelectTopic(recommendation.topicData);
    } else if (onNavigate) {
      onNavigate(recommendation.screen);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{recommendation.icon}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            recommendation.tagColor === 'amber' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
            recommendation.tagColor === 'rose' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
            recommendation.tagColor === 'emerald' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}>
            {recommendation.tag}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {recommendation.title}
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed">
          {recommendation.description}
        </p>

        {recommendation.reason && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-snug">
            <span className="font-semibold text-slate-700">Lý do gợi ý:</span> {recommendation.reason}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Khuyên học</span>
        <span className="font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
          {recommendation.ctaText || 'Khám phá'} →
        </span>
      </div>
    </div>
  );
}
