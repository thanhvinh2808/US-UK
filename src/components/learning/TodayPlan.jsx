import React from 'react';

export default function TodayPlan({ dailyPlan, onNavigate, onSelectTopic }) {
  if (!dailyPlan || !dailyPlan.tasks || dailyPlan.tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-3">
        <span className="text-3xl">🎉</span>
        <h3 className="text-lg font-bold text-slate-900">Bạn đã hoàn thành mọi mục tiêu hôm nay!</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Không còn từ vựng đến hạn hay lỗi sai cần sửa. Hãy khám phá thêm bài đọc hoặc tra từ điển AI bên dưới.
        </p>
      </div>
    );
  }

  const handleTaskClick = (task) => {
    if (task.screen === 'topic_detail' && task.topicData && onSelectTopic) {
      onSelectTopic(task.topicData);
    } else if (onNavigate) {
      onNavigate(task.screen);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              🎯 LỘ TRÌNH HÔM NAY
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Ước tính: ~{dailyPlan.totalEstimatedMinutes} phút
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Kế hoạch học tập cá nhân hóa
          </h2>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {dailyPlan.totalTasks} mục tiêu trọng tâm
        </div>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dailyPlan.tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className="group p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{task.icon}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  task.badgeColor === 'amber' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                  task.badgeColor === 'rose' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                  task.badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  'bg-indigo-50 text-indigo-800 border border-indigo-200'
                }`}>
                  {task.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {task.title}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {task.subtitle}
              </p>

              {task.reason && (
                <p className="text-[11px] text-slate-400 italic bg-white/80 p-2 rounded-xl border border-slate-100">
                  💡 {task.reason}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium font-mono">
                ⏱️ ~{task.estimatedMinutes} phút
              </span>
              <span className="font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                {task.ctaText} →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
