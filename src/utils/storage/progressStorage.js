import { userStorage } from './userStorage.js';

const KEY_TOPIC_PROGRESS = "eng_app_topic_progress";

export const progressStorage = {
  getTopicProgress: () => {
    try {
      if (typeof localStorage === 'undefined') return {};
      const data = localStorage.getItem(KEY_TOPIC_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Error getting topic progress", e);
      return {};
    }
  },

  updateTopicProgress: (topicId, moduleKey, score) => {
    try {
      const progress = progressStorage.getTopicProgress();
      const topicProg = progress[topicId] || {
        is_reading_completed: false,
        max_speaking_score: -1,
        max_listening_score: -1,
        is_grammar_completed: false,
        max_writing_score: -1
      };

      if (topicProg.max_speaking_score === undefined) topicProg.max_speaking_score = -1;
      if (topicProg.max_listening_score === undefined) topicProg.max_listening_score = -1;
      if (topicProg.max_writing_score === undefined) topicProg.max_writing_score = -1;

      let pointsAdded = 0;
      let completedModulesAdded = 0;

      if (moduleKey === "reading") {
        if (!topicProg.is_reading_completed) {
          topicProg.is_reading_completed = true;
          pointsAdded = 10;
          completedModulesAdded = 1;
        }
      } else if (moduleKey === "speaking") {
        const currentBest = topicProg.max_speaking_score;
        if (score >= currentBest) {
          topicProg.max_speaking_score = score;
          const prevScore = currentBest === -1 ? 0 : currentBest;
          pointsAdded = Math.round((score - prevScore) * 10);
          if (currentBest === -1) {
            completedModulesAdded = 1;
          }
        }
      } else if (moduleKey === "listening") {
        const currentBest = topicProg.max_listening_score;
        if (score >= currentBest) {
          topicProg.max_listening_score = score;
          const prevScore = currentBest === -1 ? 0 : currentBest;
          pointsAdded = Math.round((score - prevScore) * 10);
          if (currentBest === -1) {
            completedModulesAdded = 1;
          }
        }
      } else if (moduleKey === "grammar") {
        if (!topicProg.is_grammar_completed) {
          topicProg.is_grammar_completed = true;
          pointsAdded = 10;
          completedModulesAdded = 1;
        }
      } else if (moduleKey === "writing") {
        const currentBest = topicProg.max_writing_score;
        if (score >= currentBest) {
          topicProg.max_writing_score = score;
          const prevScore = currentBest === -1 ? 0 : currentBest;
          pointsAdded = Math.round((score - prevScore) * 10);
          if (currentBest === -1) {
            completedModulesAdded = 1;
          }
        }
      }

      const updatedProgress = {
        ...progress,
        [topicId]: topicProg
      };

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_TOPIC_PROGRESS, JSON.stringify(updatedProgress));
      }

      if (pointsAdded > 0 || completedModulesAdded > 0) {
        const stats = userStorage.getUserStats();
        userStorage.updateUserStats({
          points: stats.points + pointsAdded,
          completedModules: stats.completedModules + completedModulesAdded
        });
      }

      // Record daily learning activity
      userStorage.incrementActivity(3);

      return updatedProgress;
    } catch (e) {
      console.error("Error updating topic progress", e);
      return {};
    }
  }
};
