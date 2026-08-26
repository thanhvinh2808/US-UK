import React, { useState, useMemo } from 'react';
import { getCEFRLevels, getCEFRUnits, isLevelUnlocked, isUnitUnlocked, getNextRecommendedLesson } from '../../utils/cefr/cefrEngine.js';
import { calculateLevelMastery, calculateUnitMastery } from '../../utils/cefr/masteryEngine.js';
import { getUnitVisual } from '../../data/visualLearningData.js';

export default function CEFRRoadmap({
  cefrProgress = {},
  onSelectUnit,
  onStartLesson,
  onNavigateBack
}) {
  const levels = useMemo(() => getCEFRLevels(), []);
  const [selectedLevelId, setSelectedLevelId] = useState('A1');

  const selectedLevel = useMemo(() => {
    return levels.find(l => l.id === selectedLevelId) || levels[0];
  }, [levels, selectedLevelId]);

  const levelUnits = useMemo(() => {
    return getCEFRUnits(selectedLevelId);
  }, [selectedLevelId]);

  const levelMastery = useMemo(() => {
    return calculateLevelMastery(selectedLevelId, levelUnits, cefrProgress);
  }, [selectedLevelId, levelUnits, cefrProgress]);

  const nextLessonData = useMemo(() => {
    return getNextRecommendedLesson(cefrProgress);
  }, [cefrProgress]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              LỘ TRÌNH CHUẨN QUỐC TẾ (CEFR)
            </span>
            <span className="text-xs text-slate-400 font-medium">Khung tham chiếu Châu Âu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Lộ trình học tập từ A1 đến C2
          </h1>
        </div>

        {onNavigateBack && (
          <button
            type="button"
            onClick={onNavigateBack}
            className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
          >
            ← Quay lại Dashboard
          </button>
        )}
      </div>

      {/* Next Up Spotlight Banner */}
      {nextLessonData && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                BÀI HỌC TIẾP THEO
              </span>
              <span className="text-xs text-slate-400">
                {nextLessonData.levelId} · {nextLessonData.unit.title}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {nextLessonData.lesson.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {nextLessonData.lesson.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onStartLesson(nextLessonData.lesson.id, nextLessonData.unit.id)}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Tiếp tục học ngay</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* CEFR Level Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {levels.map((lvl) => {
          const unlocked = isLevelUnlocked(lvl.id, cefrProgress);
          const isSelected = selectedLevelId === lvl.id;
          const unitsForLvl = getCEFRUnits(lvl.id);
          const mastery = calculateLevelMastery(lvl.id, unitsForLvl, cefrProgress);

          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => setSelectedLevelId(lvl.id)}
              className={`flex-1 min-w-[130px] p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                  : unlocked
                  ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  : 'bg-slate-50/60 border-slate-200/80 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className={isSelected ? 'text-indigo-700' : 'text-slate-800'}>
                  {lvl.id}
                </span>
                {!unlocked && <span className="text-[10px] text-slate-400 font-normal">Chưa mở</span>}
                {unlocked && mastery >= 100 && <span className="text-emerald-600 font-bold">✓</span>}
              </div>
              <p className="text-[11px] font-semibold text-slate-600 truncate">{lvl.subtitle}</p>
              <div className="w-full h-1.5 rounded-full bg-slate-200/80 mt-2 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${mastery}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Level Details & Units Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedLevel.title}
              </h2>
              <span className="text-xs font-bold text-slate-400">• {selectedLevel.subtitle}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              {selectedLevel.description}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              TIẾN ĐỘ TRÌNH ĐỘ
            </span>
            <span className="text-2xl font-black text-indigo-600 font-mono">
              {levelMastery}%
            </span>
          </div>
        </div>

        {/* Units Curriculum Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {levelUnits.map((unit) => {
            const unlocked = isUnitUnlocked(unit.id, cefrProgress);
            const mastery = calculateUnitMastery(unit, cefrProgress);
            const completedLessonsCount = (unit.lessons || []).filter(l => 
              (cefrProgress.completedLessons || []).includes(l.id)
            ).length;

            const unitVisual = getUnitVisual(unit.id);

            return (
              <div
                key={unit.id}
                onClick={() => {
                  if (unlocked && onSelectUnit) onSelectUnit(unit.id);
                }}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  unlocked
                    ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer group'
                    : 'bg-slate-50/80 border-slate-200/70 opacity-65 cursor-not-allowed'
                }`}
              >
                <div className="space-y-3">
                  {unitVisual?.hero && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                      <img
                        src={unitVisual.hero.image}
                        alt={unitVisual.hero.alt}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          unlocked ? 'group-hover:scale-105' : 'grayscale opacity-70'
                        }`}
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      UNIT {String(unit.order).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {unlocked ? (
                        mastery >= 100 ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <span>✓ Hoàn thành</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">{mastery}% hoàn thành</span>
                        )
                      ) : (
                        <span className="text-slate-400">Yêu cầu hoàn thành Unit trước</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {unit.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                      {unit.titleVi}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {unit.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    {completedLessonsCount} / {(unit.lessons || []).length} bài học
                  </span>
                  {unlocked ? (
                    <span className="font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Xem bài học →
                    </span>
                  ) : (
                    <span className="font-semibold text-slate-400">Chưa mở</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
