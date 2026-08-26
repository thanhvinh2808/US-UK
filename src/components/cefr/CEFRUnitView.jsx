import React, { useMemo } from 'react';
import { getCEFRUnit, isLessonUnlocked, getLessonStatus } from '../../utils/cefr/cefrEngine.js';
import { calculateUnitMastery } from '../../utils/cefr/masteryEngine.js';
import { speak } from '../../utils/sounds.js';
import { getUnitVisual } from '../../data/visualLearningData.js';
import ContextImage from '../learning/ContextImage.jsx';
import VisualVocabularyGrid from '../learning/VisualVocabularyGrid.jsx';
import LessonIllustration from '../learning/LessonIllustration.jsx';

export default function CEFRUnitView({
  unitId,
  cefrProgress = {},
  onStartLesson,
  onNavigateBack
}) {
  const unit = useMemo(() => getCEFRUnit(unitId), [unitId]);
  const unitVisual = useMemo(() => getUnitVisual(unitId), [unitId]);

  const mastery = useMemo(() => {
    if (!unit) return 0;
    return calculateUnitMastery(unit, cefrProgress);
  }, [unit, cefrProgress]);

  if (!unit) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy thông tin Unit</h3>
        <button
          type="button"
          onClick={onNavigateBack}
          className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          Quay lại Lộ trình
        </button>
      </div>
    );
  }

  const handleSpeak = (word) => {
    speak(word, { accent: 'US', rate: 0.9 });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateBack}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
        >
          ← Quay lại Lộ trình CEFR
        </button>
        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
          {unit.levelId} · UNIT {String(unit.order).padStart(2, '0')}
        </span>
      </div>

      {/* Unit Hero Card with Contextual Image */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {unitVisual?.hero && (
          <ContextImage
            src={unitVisual.hero.image}
            alt={unitVisual.hero.alt}
            caption={unitVisual.hero.caption}
            aspectRatio="16-9"
          />
        )}

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {unit.title}
          </h1>
          <p className="text-sm font-bold text-indigo-600">
            {unit.titleVi}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
            {unit.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 uppercase tracking-wider">Tiến độ hoàn thành Unit</span>
            <span className="text-indigo-600 font-mono">{mastery}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>

        {/* Learning Objectives */}
        {unit.objectives && unit.objectives.length > 0 && (
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mục tiêu bài học (Learning Objectives):
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              {unit.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Contextual Illustration (Routine timeline, Family Tree, or Grammar Pronouns) */}
      {unitVisual?.sequence && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <LessonIllustration type="sequence" data={unitVisual.sequence} />
        </div>
      )}

      {unitVisual?.familyTree && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <LessonIllustration type="family_tree" data={unitVisual.familyTree} />
        </div>
      )}

      {unitVisual?.grammarVisual && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <LessonIllustration type="grammar_pronouns" data={unitVisual.grammarVisual} />
        </div>
      )}

      {/* Core Vocabulary Preview Grid */}
      {unit.coreVocabulary && unit.coreVocabulary.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Từ vựng trọng tâm ({unit.coreVocabulary.length} từ)
            </h3>
            <span className="text-xs text-slate-400">Hình ảnh minh họa & Phát âm chuẩn</span>
          </div>

          <VisualVocabularyGrid
            vocabularyList={unit.coreVocabulary}
            onSpeak={handleSpeak}
            columns={4}
          />
        </div>
      )}

      {/* Lessons Curriculum List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Danh sách bài học trong Unit
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {(unit.lessons || []).length} bài học tuần tự
          </span>
        </div>

        <div className="space-y-3">
          {(unit.lessons || []).map((lesson, idx) => {
            const status = getLessonStatus(lesson.id, cefrProgress);
            const unlocked = isLessonUnlocked(lesson.id, cefrProgress);
            const isCompleted = status === 'completed';

            return (
              <div
                key={lesson.id || idx}
                onClick={() => {
                  if (unlocked && onStartLesson) {
                    onStartLesson(lesson.id, unit.id);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : unlocked
                    ? 'bg-white border-indigo-200 shadow-xs hover:border-indigo-400 hover:shadow-md'
                    : 'bg-slate-50/70 border-slate-200/70 opacity-60'
                } ${unlocked ? 'cursor-pointer group' : 'cursor-not-allowed'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700'
                      : unlocked
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? '✓' : String(lesson.order).padStart(2, '0')}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-bold transition-colors ${
                        unlocked ? 'text-slate-900 group-hover:text-indigo-600' : 'text-slate-500'
                      }`}>
                        {lesson.title}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {lesson.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {lesson.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right text-xs text-slate-400">
                    <span className="block font-medium">~{lesson.estimatedMinutes || 10} phút</span>
                    <span className="font-semibold text-indigo-600 font-mono">+{lesson.xpReward || 20} XP</span>
                  </div>

                  <div className="min-w-[100px] text-right">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                        ✓ Hoàn thành
                      </span>
                    ) : unlocked ? (
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors"
                      >
                        Bắt đầu →
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                        Chưa mở
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
