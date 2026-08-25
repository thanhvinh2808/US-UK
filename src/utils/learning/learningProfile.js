import { storage } from '../storage/index.js';

/**
 * Derives a normalized, read-only learner profile from actual storage data.
 * Does not duplicate state or modify underlying storage.
 */
export function getLearnerProfile(_explicitTopics = []) {
  try {
    const vocabList = storage.getSavedVocab() || [];
    const stats = storage.getUserStats() || { streak: 0, points: 0, level: 'A1', activityHistory: {} };
    const mistakes = storage.getMistakes() || [];
    const topicProgress = storage.getTopicProgress() || {};

    const now = Date.now();
    
    // Categorize Vocabulary
    const dueVocabulary = vocabList.filter(item => {
      if (!item) return false;
      if (!item.nextReviewDate) return true;
      return new Date(item.nextReviewDate).getTime() <= now;
    });

    const masteredVocabulary = vocabList.filter(item => {
      return item && (item.status === 'mastered' || (item.repetitions || 0) >= 3);
    });

    const learningVocabulary = vocabList.filter(item => {
      return item && (item.status === 'learning' || (item.repetitions || 0) < 3);
    });

    const forgottenVocabulary = vocabList
      .filter(item => item && (item.lowGradeCount || 0) > 0)
      .sort((a, b) => (b.lowGradeCount || 0) - (a.lowGradeCount || 0));

    // Analyze Weakness Skills from mistakes
    const skillCounts = {};
    mistakes.forEach(m => {
      if (m && m.skill) {
        skillCounts[m.skill] = (skillCounts[m.skill] || 0) + 1;
      }
    });

    const weaknessStats = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);

    // Topic Analysis
    const completedTopicIds = [];
    const inProgressTopicIds = [];

    Object.entries(topicProgress).forEach(([tId, p]) => {
      if (!p) return;
      if (p.is_reading_completed && p.is_grammar_completed && (p.max_speaking_score >= 0.7 || p.max_listening_score >= 0.7)) {
        completedTopicIds.push(tId);
      } else if (p.is_reading_completed || p.max_listening_score >= 0 || p.max_speaking_score >= 0 || p.is_grammar_completed) {
        inProgressTopicIds.push(tId);
      }
    });

    const isNewUser = vocabList.length === 0 && mistakes.length === 0 && completedTopicIds.length === 0 && inProgressTopicIds.length === 0;

    return {
      vocabularyCount: vocabList.length,
      masteredCount: masteredVocabulary.length,
      learningCount: learningVocabulary.length,
      dueCount: dueVocabulary.length,
      dueVocabulary,
      masteredVocabulary,
      learningVocabulary,
      forgottenVocabulary,
      mistakeCount: mistakes.length,
      mistakes,
      weaknessStats,
      primaryWeakSkill: weaknessStats.length > 0 ? weaknessStats[0].skill : null,
      completedTopicIds,
      inProgressTopicIds,
      topicProgress,
      streak: stats.streak || 0,
      points: stats.points || 0,
      level: stats.level || 'A1',
      activityHistory: stats.activityHistory || {},
      isNewUser
    };
  } catch (error) {
    console.error('Error deriving learner profile:', error);
    return {
      vocabularyCount: 0,
      masteredCount: 0,
      learningCount: 0,
      dueCount: 0,
      dueVocabulary: [],
      masteredVocabulary: [],
      learningVocabulary: [],
      forgottenVocabulary: [],
      mistakeCount: 0,
      mistakes: [],
      weaknessStats: [],
      primaryWeakSkill: null,
      completedTopicIds: [],
      inProgressTopicIds: [],
      topicProgress: {},
      streak: 0,
      points: 0,
      level: 'A1',
      activityHistory: {},
      isNewUser: true
    };
  }
}
