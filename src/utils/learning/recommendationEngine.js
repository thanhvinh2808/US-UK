/**
 * Deterministic recommendation engine.
 * Generates personalized, explainable learning recommendations with clear reasons.
 */
export function getRecommendations(profile, topicsList = [], limit = 4) {
  if (!profile) return [];

  const recommendations = [];
  const seenKeys = new Set();

  const addRecommendation = (rec) => {
    if (!rec || !rec.key || seenKeys.has(rec.key)) return;
    seenKeys.add(rec.key);
    recommendations.push(rec);
  };

  // 1. Spaced Repetition Due Reviews
  if (profile.dueCount > 0) {
    addRecommendation({
      key: 'rec_sm2_due',
      priority: 1,
      type: 'review',
      icon: '⚡',
      title: 'Ôn tập Spaced Repetition',
      description: `${profile.dueCount} từ vựng đã đến hạn ôn tập hôm nay để tránh quên.`,
      reason: `Thuật toán SM-2 phát hiện ${profile.dueCount} từ cần củng cố lại hôm nay.`,
      tag: 'Đến hạn SM-2',
      tagColor: 'amber',
      screen: 'flashcards',
      ctaText: 'Ôn tập Flashcards'
    });
  }

  // 2. High Forgetting Curve / Weak Vocabulary
  if (profile.forgottenVocabulary && profile.forgottenVocabulary.length > 0) {
    const topWord = profile.forgottenVocabulary[0];
    addRecommendation({
      key: 'rec_weak_vocab',
      priority: 2,
      type: 'vocabulary',
      icon: '📙',
      title: 'Khắc phục từ vựng hay quên',
      description: `Từ "${topWord.word}" đã bị quên hoặc đánh giá khó ${topWord.lowGradeCount} lần.`,
      reason: `Bạn có ${profile.forgottenVocabulary.length} từ trong sổ tay có số lần quên cao.`,
      tag: 'Từ vựng yếu',
      tagColor: 'rose',
      screen: 'notebook',
      ctaText: 'Xem Sổ tay'
    });
  }

  // 3. Weakest Skill from Mistakes
  if (profile.primaryWeakSkill && profile.mistakeCount > 0) {
    addRecommendation({
      key: 'rec_mistake_skill',
      priority: 3,
      type: 'skill',
      icon: '📌',
      title: `Rèn luyện kỹ năng: ${profile.primaryWeakSkill}`,
      description: `Bạn có ${profile.mistakeCount} câu sai được ghi nhận, chủ yếu thuộc nhóm ${profile.primaryWeakSkill}.`,
      reason: `Tỷ lệ lỗi sai cao nhất tập trung vào ${profile.primaryWeakSkill}.`,
      tag: 'Kỹ năng cần cải thiện',
      tagColor: 'rose',
      screen: 'mistake_bank',
      ctaText: 'Sửa lỗi sai'
    });
  }

  // 4. In-Progress Topic Continuation
  if (profile.inProgressTopicIds && profile.inProgressTopicIds.length > 0 && topicsList.length > 0) {
    const inProgTopic = topicsList.find(t => t && String(t.id || t._id) === String(profile.inProgressTopicIds[0]));
    if (inProgTopic) {
      addRecommendation({
        key: `rec_topic_inprog_${inProgTopic.id || inProgTopic._id}`,
        priority: 4,
        type: 'topic',
        icon: '📖',
        title: `Hoàn thành chủ đề: ${inProgTopic.title || inProgTopic.name}`,
        description: `Trình độ ${inProgTopic.level || 'B1'} • Tiếp tục hoàn thành các module còn lại.`,
        reason: 'Bạn đã bắt đầu chủ đề này trước đó và chưa hoàn thành hết các module.',
        tag: 'Đang học',
        tagColor: 'emerald',
        screen: 'topic_detail',
        topicData: inProgTopic,
        ctaText: 'Học tiếp'
      });
    }
  }

  // 5. Recommended Next Topic by Level
  if (topicsList && topicsList.length > 0) {
    const nextTopic = topicsList.find(t => {
      const topId = String(t.id || t._id);
      return !profile.completedTopicIds.includes(topId) && !profile.inProgressTopicIds.includes(topId);
    });

    if (nextTopic) {
      addRecommendation({
        key: `rec_topic_next_${nextTopic.id || nextTopic._id}`,
        priority: 5,
        type: 'topic',
        icon: '📚',
        title: `Bài học mới: ${nextTopic.title || nextTopic.name}`,
        description: `Trình độ ${nextTopic.level || 'A2'} • ${nextTopic.description || 'Chủ đề từ vựng & đọc hiểu học thuật.'}`,
        reason: `Chủ đề chuẩn hóa tiếp theo phù hợp với trình độ Level ${nextTopic.level || 'A2'}.`,
        tag: 'Gợi ý bài mới',
        tagColor: 'indigo',
        screen: 'topic_detail',
        topicData: nextTopic,
        ctaText: 'Khám phá bài học'
      });
    }
  }

  // 6. AI Translator & Pronunciation Exploration
  if (recommendations.length < limit) {
    addRecommendation({
      key: 'rec_explore_translator',
      priority: 6,
      type: 'tool',
      icon: '🔍',
      title: 'Tra từ điển & Phân tích ngữ pháp AI',
      description: 'Tra cứu từ vựng học thuật, phân tích thì động từ và nghe phát âm US/UK chuẩn xác.',
      reason: 'Công cụ hỗ trợ dịch và phân tích chuyên sâu cho bài đọc IELTS.',
      tag: 'Công cụ hỗ trợ',
      tagColor: 'indigo',
      screen: 'translator',
      ctaText: 'Mở tra từ'
    });
  }

  return recommendations.slice(0, limit);
}
