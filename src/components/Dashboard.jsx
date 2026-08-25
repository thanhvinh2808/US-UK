import React, { useState, useMemo } from 'react';
import { storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { getLearnerProfile } from '../utils/learning/learningProfile';
import { getDailyLearningPlan } from '../utils/learning/dailyPlan';
import { getRecommendations } from '../utils/learning/recommendationEngine';
import { getLearningInsights } from '../utils/learning/learningInsights';
import TodayPlan from './learning/TodayPlan';
import RecommendationCard from './learning/RecommendationCard';
import WeakSkills from './learning/WeakSkills';
import LearningInsights from './learning/LearningInsights';
import WeeklyProgress from './learning/WeeklyProgress';

export default function Dashboard({ 
  stats = { streak: 1, level: 'A2', points: 0, completedModules: 0 }, 
  progress = {}, 
  savedVocabCount = 0, 
  onSelectTopic, 
  onNavigate, 
  topics = [], 
  topicsList = [] 
}) {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const safeTopics = useMemo(() => {
    if (Array.isArray(topics) && topics.length > 0) return topics;
    if (Array.isArray(topicsList) && topicsList.length > 0) return topicsList;
    return [];
  }, [topics, topicsList]);

  // Derived Learner Intelligence & Plans
  const learnerProfile = useMemo(() => {
    return getLearnerProfile(safeTopics);
  }, [safeTopics, savedVocabCount, progress, stats]);

  const dailyPlan = useMemo(() => {
    return getDailyLearningPlan(learnerProfile, safeTopics);
  }, [learnerProfile, safeTopics]);

  const recommendations = useMemo(() => {
    return getRecommendations(learnerProfile, safeTopics, 3);
  }, [learnerProfile, safeTopics]);

  const insights = useMemo(() => {
    return getLearningInsights(learnerProfile);
  }, [learnerProfile]);

  const reviewsDue = learnerProfile.dueCount || 0;
  const mistakesCount = learnerProfile.mistakeCount || 0;

  // Filter topics by level tag
  const filteredTopics = useMemo(() => {
    if (selectedFilter === 'ALL') return safeTopics;
    return safeTopics.filter(t => t && t.level === selectedFilter);
  }, [safeTopics, selectedFilter]);

  // Find in-progress topic
  const featuredTopic = useMemo(() => {
    if (!filteredTopics || filteredTopics.length === 0) return null;
    const inProgress = filteredTopics.find(t => {
      const p = (progress || {})[t.id || t._id];
      return p && (!p.is_reading_completed || p.max_listening_score >= 0 || p.max_speaking_score >= 0);
    });
    return inProgress || filteredTopics[0];
  }, [filteredTopics, progress]);

  const safeStats = stats || { streak: 1, level: 'A2', points: 0, completedModules: 0 };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
      {/* 1. Hero Greeting Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-indigo-200">
            <span>✨ V-English Learning Workspace</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            {getGreeting()}, {user?.username || 'Học viên'} 👋
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {reviewsDue > 0
              ? `Hôm nay bạn có ${reviewsDue} từ vựng trong sổ tay cần ôn tập theo thuật toán Spaced Repetition (SM-2). Hãy hoàn thành mục tiêu ngày nhé!`
              : 'Tuyệt vời! Bạn đã hoàn thành toàn bộ bài ôn tập từ vựng hôm nay. Hãy tiếp tục khám phá các chủ đề mới bên dưới.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('flashcards')}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <span>⚡ Ôn tập Flashcards ({reviewsDue})</span>
            </button>
            <button
              onClick={() => onNavigate('translator')}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <span>🔍 Tra từ AI [Ctrl+K]</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Personalized Daily Learning Plan */}
      <TodayPlan
        dailyPlan={dailyPlan}
        onNavigate={onNavigate}
        onSelectTopic={onSelectTopic}
      />

      {/* 3. Intelligent Recommendations Grid */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                GỢI Ý HỌC TẬP THÔNG MINH
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                Dành riêng cho lộ trình của bạn
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Định hướng giảm tải quyết định
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.key}
                recommendation={rec}
                onNavigate={onNavigate}
                onSelectTopic={onSelectTopic}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. 4-Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Chuỗi học (Streak)</span>
            <span className="text-xl">🔥</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {safeStats.streak || 0} <span className="text-xs font-normal text-slate-500">ngày</span>
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Duy trì đều đặn mỗi ngày</p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Điểm tích lũy</span>
            <span className="text-xl">⭐</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono">
            {safeStats.points || 0} <span className="text-xs font-normal text-slate-500">XP</span>
          </p>
          <p className="text-[11px] text-slate-500">Hạng: {safeStats.level || 'A1'}</p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Sổ tay từ vựng</span>
            <span className="text-xl">📚</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {savedVocabCount} <span className="text-xs font-normal text-slate-500">từ</span>
          </p>
          <p className="text-[11px] text-indigo-600 font-semibold">{reviewsDue} từ cần ôn hôm nay</p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ngân hàng câu sai</span>
            <span className="text-xl">📌</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {mistakesCount} <span className="text-xs font-normal text-slate-500">câu</span>
          </p>
          <button
            onClick={() => onNavigate('mistake_bank')}
            className="text-[11px] text-rose-600 font-semibold hover:underline"
          >
            Xem phân tích lỗi sai →
          </button>
        </div>
      </div>

      {/* 5. 2-Column Analytics Grid (Weak Skills + Weekly Progress) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeakSkills
          weaknessStats={learnerProfile.weaknessStats}
          mistakeCount={mistakesCount}
          onNavigate={onNavigate}
        />
        <WeeklyProgress
          activityHistory={learnerProfile.activityHistory}
          streak={safeStats.streak || 0}
        />
      </div>

      {/* 6. Learning Insights */}
      {insights && insights.length > 0 && (
        <LearningInsights insights={insights} />
      )}

      {/* 3. Continue Learning Spotlight Card */}
      {featuredTopic && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                CHỦ ĐỀ ĐANG HỌC
              </span>
              <span className="text-xs font-bold text-slate-400">• Level {featuredTopic.level || 'B1'}</span>
            </div>
            <button
              onClick={() => onSelectTopic(featuredTopic)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Vào học tiếp</span>
              <span>→</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {featuredTopic.title || featuredTopic.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {featuredTopic.description || 'Chủ đề từ vựng & bài đọc học thuật chuẩn IELTS.'}
              </p>
            </div>
            <button
              onClick={() => onSelectTopic(featuredTopic)}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 whitespace-nowrap transition-colors"
            >
              Tiếp tục học ngay
            </button>
          </div>
        </div>
      )}

      {/* 4. Topic Explorer with Level Filters */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Khám phá lộ trình bài học
            </h2>
            <p className="text-xs text-slate-500">
              Chọn chủ đề phù hợp với trình độ từ A1 đến C2
            </p>
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedFilter(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === lvl
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {lvl === 'ALL' ? 'Tất cả' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((top, idx) => {
            const topId = top.id || top._id;
            const prog = (progress || {})[topId] || {};
            const isCompleted = prog.is_reading_completed;

            return (
              <div
                key={topId || idx}
                onClick={() => onSelectTopic(top)}
                className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {top.level || 'B1'}
                    </span>
                    {isCompleted ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <span>✓</span> Hoàn thành
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        {top.wordsCount || top.vocab?.length || 10} từ
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {top.title || top.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {top.description || 'Chủ đề luyện tập từ vựng, đọc hiểu và phát âm theo ngữ cảnh.'}
                  </p>
                </div>

                <div className="pt-5 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Bắt đầu học</span>
                  <span className="font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    Học ngay →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
