/**
 * Generates a structured, prioritized "Today's Plan" for the learner.
 * Limit to 3-5 high-impact activities to prevent decision fatigue.
 */
export function getDailyLearningPlan(profile, topicsList = []) {
  if (!profile) return { tasks: [], totalEstimatedMinutes: 0, completionRate: 0 };

  const tasks = [];

  // Priority 1: Due SM-2 Spaced Repetition Flashcards
  if (profile.dueCount > 0) {
    tasks.push({
      id: 'task_due_flashcards',
      type: 'review',
      icon: '⚡',
      title: `Ôn tập ${profile.dueCount} từ vựng Flashcards đến hạn`,
      subtitle: 'Củng cố trí nhớ dài hạn theo chu kỳ Spaced Repetition (SM-2)',
      badge: 'Ưu tiên cao',
      badgeColor: 'amber',
      estimatedMinutes: Math.max(3, Math.ceil(profile.dueCount * 0.5)),
      screen: 'flashcards',
      ctaText: 'Ôn tập ngay',
      reason: `Có ${profile.dueCount} từ vựng đã đến chu kỳ cần ôn tập hôm nay.`
    });
  }

  // Priority 2: Forgotten Words Reinforcement
  if (profile.forgottenVocabulary && profile.forgottenVocabulary.length > 0 && tasks.length < 4) {
    const topForgotten = profile.forgottenVocabulary.slice(0, 5);
    const wordsList = topForgotten.map(w => w.word).join(', ');
    tasks.push({
      id: 'task_weak_vocab',
      type: 'vocabulary',
      icon: '📙',
      title: `Củng cố ${topForgotten.length} từ vựng hay quên`,
      subtitle: `Bao gồm: ${wordsList}`,
      badge: 'Cần chú ý',
      badgeColor: 'rose',
      estimatedMinutes: 5,
      screen: 'notebook',
      ctaText: 'Xem sổ tay',
      reason: 'Nhóm từ này có số lần đánh giá khó hoặc quên cao nhất.'
    });
  }

  // Priority 3: Fix Recent Mistakes
  if (profile.mistakeCount > 0 && tasks.length < 4) {
    tasks.push({
      id: 'task_fix_mistakes',
      type: 'mistakes',
      icon: '📌',
      title: `Luyện lại ${profile.mistakeCount} câu trong Ngân hàng câu sai`,
      subtitle: profile.primaryWeakSkill ? `Chủ yếu về kỹ năng: ${profile.primaryWeakSkill}` : 'Sửa các câu trả lời sai trước đây',
      badge: 'Luyện sửa lỗi',
      badgeColor: 'indigo',
      estimatedMinutes: Math.min(15, Math.max(4, Math.ceil(profile.mistakeCount * 1.5))),
      screen: 'mistake_bank',
      ctaText: 'Sửa lỗi ngay',
      reason: 'Xem lại và khắc phục các bẫy ngữ pháp & từ vựng thường gặp.'
    });
  }

  // Priority 4: Continue In-Progress Topic or Start New Topic
  if (topicsList && topicsList.length > 0 && tasks.length < 4) {
    let targetTopic = null;
    let isContinuation = false;

    // Look for in-progress topic
    if (profile.inProgressTopicIds && profile.inProgressTopicIds.length > 0) {
      targetTopic = topicsList.find(t => t && String(t.id || t._id) === String(profile.inProgressTopicIds[0]));
      isContinuation = true;
    }

    // Otherwise find first incomplete topic
    if (!targetTopic) {
      targetTopic = topicsList.find(t => {
        const topId = String(t.id || t._id);
        return !profile.completedTopicIds.includes(topId);
      }) || topicsList[0];
    }

    if (targetTopic) {
      tasks.push({
        id: 'task_topic_learning',
        type: 'topic',
        icon: '📚',
        title: isContinuation ? `Tiếp tục chủ đề: ${targetTopic.title || targetTopic.name}` : `Khám phá chủ đề: ${targetTopic.title || targetTopic.name}`,
        subtitle: `Trình độ ${targetTopic.level || 'B1'} • ${targetTopic.description || 'Bài đọc học thuật và bài tập'}`,
        badge: isContinuation ? 'Đang học' : 'Bài mới',
        badgeColor: 'emerald',
        estimatedMinutes: 10,
        screen: 'topic_detail',
        topicData: targetTopic,
        ctaText: 'Vào học chủ đề',
        reason: isContinuation ? 'Bạn đang học dở chủ đề này.' : 'Chủ đề phù hợp tiếp theo trong lộ trình.'
      });
    }
  }

  // Priority 5: Fallback for brand new user with 0 data
  if (tasks.length === 0) {
    const starterTopic = (topicsList && topicsList[0]) || null;
    tasks.push({
      id: 'task_onboarding_starter',
      type: 'topic',
      icon: '🚀',
      title: 'Bắt đầu bài học đầu tiên',
      subtitle: starterTopic ? `Khám phá chủ đề "${starterTopic.title || starterTopic.name}"` : 'Chọn chủ đề yêu thích từ thư viện',
      badge: 'Khởi động',
      badgeColor: 'indigo',
      estimatedMinutes: 8,
      screen: starterTopic ? 'topic_detail' : 'dashboard',
      topicData: starterTopic,
      ctaText: 'Bắt đầu học',
      reason: 'Khởi đầu lộ trình học tiếng Anh với bài đọc và từ vựng tương tác.'
    });
  }

  const totalEstimatedMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 5), 0);

  return {
    tasks,
    totalEstimatedMinutes,
    totalTasks: tasks.length
  };
}
