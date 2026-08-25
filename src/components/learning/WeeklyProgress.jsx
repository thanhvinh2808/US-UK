import React, { useMemo } from 'react';

export default function WeeklyProgress({ activityHistory = {}, streak = 0 }) {
  // Calculate activity for the past 7 days (Monday -> Sunday)
  const weekData = useMemo(() => {
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    const result = [];
    let maxCount = 1;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const count = (activityHistory && activityHistory[dateKey]) || 0;
      if (count > maxCount) maxCount = count;

      const dayIdx = d.getDay();
      const normIdx = dayIdx === 0 ? 6 : dayIdx - 1;

      result.push({
        label: days[normIdx],
        dateKey,
        count,
        isToday: i === 0
      });
    }

    return { days: result, maxCount };
  }, [activityHistory]);

  const totalWeekActivity = weekData.days.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            TIẾN ĐỘ TUẦN
          </span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1">
            Nhịp độ học tập 7 ngày qua
          </h3>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-indigo-600 font-mono">
            {totalWeekActivity}
          </span>
          <span className="text-xs text-slate-400 block -mt-0.5">lượt học</span>
        </div>
      </div>

      {/* 7-Day Visual Bar Chart using Pure CSS/HTML */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end pt-4 h-32 border-b border-slate-100 pb-2">
        {weekData.days.map((d) => {
          const heightPercent = d.count > 0 ? Math.max(15, Math.round((d.count / weekData.maxCount) * 100)) : 6;
          return (
            <div key={d.dateKey} className="flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.count}
              </span>
              <div
                className="w-full max-w-[28px] rounded-t-xl transition-all duration-300 relative"
                style={{
                  height: `${heightPercent}%`,
                  background: d.count > 0
                    ? (d.isToday ? 'linear-gradient(180deg, #10B981, #059669)' : 'linear-gradient(180deg, #6366F1, #4F46E5)')
                    : '#F1F5F9'
                }}
                title={`${d.dateKey}: ${d.count} lượt học`}
              />
              <span className={`text-xs font-bold ${d.isToday ? 'text-emerald-600' : 'text-slate-500'}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Hôm nay</span>
        </span>
        <span className="font-semibold text-slate-700">
          🔥 Chuỗi ngày hiện tại: {streak} ngày
        </span>
      </div>
    </div>
  );
}
