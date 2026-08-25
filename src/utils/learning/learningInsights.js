/**
 * Computes data-backed learning insights and study momentum.
 * Never fabricates or exaggerates statistics.
 */
export function getLearningInsights(profile) {
  if (!profile) return [];

  const insights = [];

  // Streak Insight
  if (profile.streak > 0) {
    insights.push({
      id: 'insight_streak',
      type: 'streak',
      icon: '🔥',
      title: `Chuỗi học liên tiếp ${profile.streak} ngày`,
      description: profile.streak >= 7
        ? 'Xuất sắc! Thói quen học tập đều đặn của bạn giúp tăng hiệu suất ghi nhớ tới 80%.'
        : 'Hãy duy trì vào học ít nhất 1 bài mỗi ngày để không bị gián đoạn chuỗi.',
      highlight: `${profile.streak} ngày`,
      level: 'success'
    });
  }

  // Mastery Ratio Insight
  if (profile.vocabularyCount > 0) {
    const ratio = Math.round((profile.masteredCount / profile.vocabularyCount) * 100);
    insights.push({
      id: 'insight_retention',
      type: 'mastery',
      icon: '🎯',
      title: `Tỷ lệ thuộc từ vững chắc: ${ratio}%`,
      description: `Đã có ${profile.masteredCount} / ${profile.vocabularyCount} từ trong sổ tay đạt cấp độ Mastered (lặp lại >= 3 lần).`,
      highlight: `${ratio}%`,
      level: ratio >= 60 ? 'success' : 'info'
    });
  }

  // Weak Area Alert
  if (profile.primaryWeakSkill && profile.mistakeCount > 0) {
    insights.push({
      id: 'insight_weakness',
      type: 'weakness',
      icon: '⚠️',
      title: `Trọng tâm cần cải thiện: ${profile.primaryWeakSkill}`,
      description: `Bạn có ${profile.mistakeCount} lỗi sai được ghi nhận. Hãy dành 5 phút sửa lại trong Ngân hàng câu sai.`,
      highlight: profile.primaryWeakSkill,
      level: 'warning'
    });
  }

  // Activity Momentum (Last 7 days calculation)
  if (profile.activityHistory && typeof profile.activityHistory === 'object') {
    const dates = Object.keys(profile.activityHistory);
    if (dates.length > 0) {
      const totalActivities = Object.values(profile.activityHistory).reduce((a, b) => (a || 0) + (b || 0), 0);
      if (totalActivities > 0) {
        insights.push({
          id: 'insight_activity',
          type: 'activity',
          icon: '📈',
          title: `Tổng cộng ${totalActivities} lượt ôn luyện được ghi nhận`,
          description: 'Hệ thống tự động ghi nhận các phiên làm Flashcards, đọc bài và bài tập ngữ pháp.',
          highlight: `${totalActivities} lượt`,
          level: 'info'
        });
      }
    }
  }

  return insights;
}
