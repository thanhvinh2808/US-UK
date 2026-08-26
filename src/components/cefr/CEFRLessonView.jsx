import React, { useState, useMemo } from 'react';
import { getCEFRLesson, getNextRecommendedLesson } from '../../utils/cefr/cefrEngine.js';
import { cefrProgressStorage } from '../../utils/cefr/cefrProgressStorage.js';
import { speak } from '../../utils/sounds.js';
import { getUnitVisual } from '../../data/visualLearningData.js';
import LessonHeroVisual from '../learning/LessonHeroVisual.jsx';
import VisualVocabularyGrid from '../learning/VisualVocabularyGrid.jsx';
import ContextImage from '../learning/ContextImage.jsx';

export default function CEFRLessonView({
  lessonId,
  unitId,
  _cefrProgress = {},
  onCompleteLesson,
  onNavigateNextLesson,
  onNavigateBackToUnit
}) {
  const lessonData = useMemo(() => getCEFRLesson(lessonId), [lessonId]);
  const lesson = lessonData?.lesson;
  const unit = lessonData?.unit;
  const unitVisual = useMemo(() => getUnitVisual(unitId), [unitId]);

  const activities = useMemo(() => {
    return Array.isArray(lesson?.activities) ? lesson.activities : [];
  }, [lesson]);

  const [currentActIdx, setCurrentActIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userSentenceOrder, setUserSentenceOrder] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionMistakes, setSessionMistakes] = useState(0);
  const [isLessonFinished, setIsLessonFinished] = useState(false);

  const currentActivity = activities[currentActIdx];

  const handleSpeak = (text) => {
    speak(text, { accent: 'US', rate: 0.9 });
  };

  const handleCheckMultipleChoice = (q, selected) => {
    if (isChecked) return;
    setSelectedOption(selected);
    const correct = selected === q.correctAnswer;
    setIsCorrect(correct);
    setIsChecked(true);

    if (!correct) {
      setSessionMistakes(prev => prev + 1);
    }

    cefrProgressStorage.completeCEFRActivity({
      activityId: currentActivity.id,
      lessonId,
      unitId,
      isCorrect: correct,
      score: correct ? 1.0 : 0.5,
      xpReward: correct ? 10 : 5,
      mistakeData: !correct ? {
        skill: lesson.type || 'Grammar & Vocabulary',
        question: q.question,
        userAnswer: selected,
        correctAnswer: q.correctAnswer
      } : null
    });
  };

  const handleCheckSentenceOrder = (act) => {
    if (isChecked) return;
    const formed = userSentenceOrder.join(' ').replace(/\s+\./g, '.');
    const correct = formed.trim().toLowerCase() === act.correctSentence.trim().toLowerCase();
    setIsCorrect(correct);
    setIsChecked(true);

    if (!correct) {
      setSessionMistakes(prev => prev + 1);
    }

    cefrProgressStorage.completeCEFRActivity({
      activityId: act.id,
      lessonId,
      unitId,
      isCorrect: correct,
      score: correct ? 1.0 : 0.5,
      xpReward: correct ? 10 : 5,
      mistakeData: !correct ? {
        skill: 'Sentence Construction',
        question: `Sắp xếp câu: ${act.scrambledWords.join(', ')}`,
        userAnswer: formed,
        correctAnswer: act.correctSentence
      } : null
    });
  };

  const handleNextStep = () => {
    if (currentActIdx < activities.length - 1) {
      setCurrentActIdx(prev => prev + 1);
      setSelectedOption(null);
      setUserSentenceOrder([]);
      setIsChecked(false);
      setIsCorrect(false);
    } else {
      // Complete the lesson
      const score = Math.max(0.6, 1.0 - (sessionMistakes * 0.1));
      const updated = cefrProgressStorage.completeCEFRLesson({
        lessonId,
        unitId,
        score,
        xpReward: lesson.xpReward || 25
      });
      setIsLessonFinished(true);
      if (onCompleteLesson) onCompleteLesson(updated);
    }
  };

  if (!lesson || !unit) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <p className="text-sm font-bold text-slate-800">Không tìm thấy nội dung bài học.</p>
        <button
          type="button"
          onClick={onNavigateBackToUnit}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          Quay lại Unit
        </button>
      </div>
    );
  }

  // Final Summary Screen
  if (isLessonFinished) {
    const nextRec = getNextRecommendedLesson(cefrProgressStorage.getCEFRProgress());

    return (
      <div className="max-w-xl mx-auto space-y-6 animate-slideup pt-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              HOÀN THÀNH BÀI HỌC
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {lesson.title}
            </h2>
            <p className="text-xs text-slate-500">
              Bạn đã hoàn tất toàn bộ hoạt động của bài học này.
            </p>
          </div>

          {/* XP Reward & Progress Summary */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">ĐIỂM TÍCH LŨY</span>
              <span className="text-xl font-black text-indigo-600 font-mono">+{lesson.xpReward || 25} XP</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">UNIT TIẾN ĐỘ</span>
              <span className="text-xl font-black text-emerald-600 font-mono">Đã cập nhật</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateBackToUnit}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              Quay lại danh sách bài học
            </button>
            {nextRec && nextRec.lesson.id !== lesson.id && (
              <button
                type="button"
                onClick={() => onNavigateNextLesson(nextRec.lesson.id, nextRec.unit.id)}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
              >
                Học tiếp bài sau →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Lesson Header with Progress Steps */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateBackToUnit}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← Quay lại {unit.title}
        </button>
        <span className="text-xs font-medium text-slate-400">
          Hoạt động {currentActIdx + 1} / {activities.length}
        </span>
      </div>

      {/* Lesson Hero Visual Banner for First Activity */}
      {currentActIdx === 0 && unitVisual?.hero && (
        <LessonHeroVisual
          visual={unitVisual.hero}
          title={lesson.title}
          subtitle={unit.title}
        />
      )}

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentActIdx + 1) / activities.length) * 100}%` }}
        />
      </div>

      {/* Activity Content Card */}
      {currentActivity && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {currentActivity.title || 'Luyện tập'}
            </span>
            {currentActivity.instructions && (
              <p className="text-xs text-slate-500 pt-1">
                {currentActivity.instructions}
              </p>
            )}
          </div>

          {/* Type 1: Flashcard Preview with Contextual Visuals */}
          {currentActivity.type === 'flashcard_preview' && (
            <div className="space-y-6">
              <VisualVocabularyGrid
                vocabularyList={currentActivity.words || []}
                onSpeak={handleSpeak}
                columns={3}
              />

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all mt-4"
              >
                Tiếp tục làm bài tập →
              </button>
            </div>
          )}

          {/* Type 2: Multiple Choice Questions */}
          {currentActivity.questions && currentActivity.questions.length > 0 && (
            <div className="space-y-5">
              {currentActivity.questions.map((q, qIdx) => (
                <div key={qIdx} className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {q.question}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selectedOption === opt;
                      let btnStyle = 'bg-white border-slate-200 hover:border-slate-300 text-slate-800';

                      if (isChecked) {
                        if (opt === q.correctAnswer) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                        } else {
                          btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isChecked}
                          onClick={() => handleCheckMultipleChoice(q, opt)}
                          className={`p-3.5 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {isChecked && (
                    <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                      isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      <p className="font-bold">
                        {isCorrect ? '✓ Chính xác!' : 'Chưa chính xác'}
                      </p>
                      {q.explanation && (
                        <p className="text-slate-600">{q.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isChecked && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors mt-4"
                >
                  {currentActIdx < activities.length - 1 ? 'Câu tiếp theo →' : 'Hoàn thành bài học'}
                </button>
              )}
            </div>
          )}

          {/* Type 3: Sentence Order Arranger */}
          {currentActivity.type === 'sentence_order' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[56px] flex flex-wrap items-center gap-2">
                {userSentenceOrder.length === 0 ? (
                  <span className="text-xs text-slate-400">Nhấp các từ bên dưới để ghép câu hoàn chỉnh...</span>
                ) : (
                  userSentenceOrder.map((token, tIdx) => (
                    <span
                      key={tIdx}
                      onClick={() => {
                        if (!isChecked) {
                          setUserSentenceOrder(userSentenceOrder.filter((_, idx) => idx !== tIdx));
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                    >
                      {token} ✕
                    </span>
                  ))
                )}
              </div>

              {/* Scrambled Word Pool */}
              <div className="flex flex-wrap gap-2">
                {(currentActivity.scrambledWords || []).map((w, wIdx) => {
                  const usedCount = userSentenceOrder.filter(x => x === w).length;
                  const totalCount = currentActivity.scrambledWords.filter(x => x === w).length;
                  const isExhausted = usedCount >= totalCount;

                  return (
                    <button
                      key={wIdx}
                      type="button"
                      disabled={isExhausted || isChecked}
                      onClick={() => setUserSentenceOrder([...userSentenceOrder, w])}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                        isExhausted
                          ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800 shadow-xs'
                      }`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>

              {!isChecked ? (
                <button
                  type="button"
                  disabled={userSentenceOrder.length === 0}
                  onClick={() => handleCheckSentenceOrder(currentActivity)}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  Kiểm tra câu trả lời
                </button>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                    isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <p className="font-bold">{isCorrect ? '✓ Sắp xếp chính xác!' : 'Chưa đúng thứ tự'}</p>
                    <p className="text-slate-600">Đáp án chuẩn: {currentActivity.correctSentence}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    {currentActIdx < activities.length - 1 ? 'Hoạt động tiếp theo →' : 'Hoàn thành bài học'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Type 3.5: Dialogue Comprehension with Context Visual */}
          {currentActivity.type === 'dialogue_comprehension' && (
            <div className="space-y-5">
              {unitVisual?.situation && (
                <ContextImage
                  src={unitVisual.situation.image}
                  alt={unitVisual.situation.alt}
                  caption={unitVisual.situation.caption}
                  aspectRatio="16-9"
                />
              )}

              {currentActivity.dialogue && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ĐOẠN HỘI THOẠI
                  </span>
                  {currentActivity.dialogue.map((line, lIdx) => (
                    <div key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                      <span className="font-bold text-indigo-600 shrink-0 min-w-[55px]">
                        {line.speaker}:
                      </span>
                      <span className="text-slate-800">{line.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {currentActivity.questions && currentActivity.questions.map((q, qIdx) => (
                <div key={qIdx} className="space-y-3">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selectedOption === opt;
                      let btnStyle = 'bg-white border-slate-200 hover:border-slate-300 text-slate-800';

                      if (isChecked) {
                        if (opt === q.correctAnswer) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                        } else {
                          btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isChecked}
                          onClick={() => handleCheckMultipleChoice(q, opt)}
                          className={`p-3.5 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {isChecked && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors mt-4"
                >
                  {currentActIdx < activities.length - 1 ? 'Hoạt động tiếp theo →' : 'Hoàn thành bài học'}
                </button>
              )}
            </div>
          )}

          {/* Type 4: Reading Passage with Questions & Contextual Visual */}
          {currentActivity.type === 'reading_passage' && (
            <div className="space-y-5">
              {unitVisual?.hero && (
                <ContextImage
                  src={unitVisual.hero.image}
                  alt={unitVisual.hero.alt}
                  caption={unitVisual.hero.caption}
                  aspectRatio="16-9"
                />
              )}

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ĐOẠN VĂN ĐỌC HIỂU
                </span>
                <p>{currentActivity.passage}</p>
              </div>

              {currentActivity.questions && currentActivity.questions.map((q, qIdx) => (
                <div key={qIdx} className="space-y-3">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selectedOption === opt;
                      let btnStyle = 'bg-white border-slate-200 hover:border-slate-300 text-slate-800';

                      if (isChecked) {
                        if (opt === q.correctAnswer) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                        } else {
                          btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isChecked}
                          onClick={() => handleCheckMultipleChoice(q, opt)}
                          className={`p-3.5 rounded-xl border text-left text-xs transition-all ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {isChecked && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors mt-4"
                >
                  {currentActIdx < activities.length - 1 ? 'Hoạt động tiếp theo →' : 'Hoàn thành bài học'}
                </button>
              )}
            </div>
          )}

          {/* Type 5: Pronunciation Repeat */}
          {currentActivity.type === 'pronunciation_repeat' && (
            <div className="space-y-4">
              {(currentActivity.prompts || []).map((p, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{p.text}</span>
                    <button
                      type="button"
                      onClick={() => handleSpeak(p.text)}
                      className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs"
                    >
                      Nghe mẫu 🔊
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-mono block">{p.ipa}</span>
                </div>
              ))}
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors mt-4"
              >
                Hoàn thành phần luyện nói →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
