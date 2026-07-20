// Spaced Repetition SM-2 Algorithm Implementation
export function calculateSM2(grade, repetitions, previousInterval, previousEase) {
  let ease = parseFloat(previousEase) || 2.5;
  let reps = parseInt(repetitions) || 0;
  let interval = 1;

  // Handle grade = 1 (Again / Reset) to review immediately in current session
  if (grade === 1) {
    return {
      repetitions: 0,
      interval: 0,
      easinessFactor: Math.max(1.3, ease - 0.2),
      nextReviewDate: Date.now() // due immediately
    };
  }

  if (grade >= 3) {
    if (reps === 0) {
      interval = 1;
    } else if (reps === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * ease);
    }
    reps++;
  } else {
    reps = 0;
    interval = 1;
  }

  // Adjust ease factor based on SM-2 formula
  ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (ease < 1.3) ease = 1.3;

  return {
    repetitions: reps,
    interval: interval,
    easinessFactor: ease,
    nextReviewDate: Date.now() + interval * 24 * 60 * 60 * 1000
  };
}

// Storage keys
const KEY_VOCAB = "eng_app_saved_vocab";
const KEY_STATS = "eng_app_user_stats";
const KEY_TOPIC_PROGRESS = "eng_app_topic_progress";

// Initialize default stats if not present
const defaultStats = {
  streak: 0,
  points: 0,
  level: "A1",
  lastActive: null,
  completedModules: 0,
  activityHistory: {} // "YYYY-MM-DD" -> count
};

export const storage = {
  getSavedVocab: () => {
    try {
      const data = localStorage.getItem(KEY_VOCAB);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading vocab from localStorage", e);
      return [];
    }
  },

  saveWord: (wordObj) => {
    try {
      const list = storage.getSavedVocab();
      // Avoid duplicate saves
      const existingWord = list.find(item => item.word.toLowerCase() === wordObj.word.toLowerCase());
      if (existingWord) {
        // If word exists, update deck information if provided
        const updatedList = list.map(item => {
          if (item.word.toLowerCase() === wordObj.word.toLowerCase()) {
            return {
              ...item,
              deckId: wordObj.deckId !== undefined ? wordObj.deckId : item.deckId,
              deckName: wordObj.deckName !== undefined ? wordObj.deckName : item.deckName
            };
          }
          return item;
        });
        localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
        return updatedList;
      }
      
      const newWord = {
        word: wordObj.word,
        ipa: wordObj.ipa || "",
        vietnamese: wordObj.vietnamese || "",
        example: wordObj.example || "",
        topic: wordObj.topic || "General",
        deckId: wordObj.deckId || null,
        deckName: wordObj.deckName || null,
        lowGradeCount: 0,
        // SM-2 fields
        repetitions: 0,
        interval: 1,
        easinessFactor: 2.5,
        nextReviewDate: Date.now(), // Ready to review immediately
        status: "learning",
        savedAt: Date.now()
      };
      
      const updatedList = [newWord, ...list];
      localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      return updatedList;
    } catch (e) {
      console.error("Error saving word to localStorage", e);
      return [];
    }
  },

  deleteWord: (wordText) => {
    try {
      const list = storage.getSavedVocab();
      const updatedList = list.filter(item => item.word.toLowerCase() !== wordText.toLowerCase());
      localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      return updatedList;
    } catch (e) {
      console.error("Error deleting word from localStorage", e);
      return [];
    }
  },

  updateWordProgress: (wordText, grade) => {
    try {
      const list = storage.getSavedVocab();
      const updatedList = list.map(item => {
        if (item.word.toLowerCase() === wordText.toLowerCase()) {
          const sm2Result = calculateSM2(
            grade,
            item.repetitions,
            item.interval,
            item.easinessFactor
          );
          
          const isLowGrade = grade <= 2;
          
          return {
            ...item,
            ...sm2Result,
            status: sm2Result.repetitions >= 3 ? "mastered" : "learning",
            lowGradeCount: (item.lowGradeCount || 0) + (isLowGrade ? 1 : 0)
          };
        }
        return item;
      });
      localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      // Increment user learning activity as well
      storage.incrementActivity(1);
      return updatedList;
    } catch (e) {
      console.error("Error updating word progress", e);
      return [];
    }
  },

  resetWord: (wordText) => {
    try {
      const list = storage.getSavedVocab();
      const updatedList = list.map(item =>
        item.word.toLowerCase() === wordText.toLowerCase()
          ? {
              ...item,
              repetitions: 0,
              interval: 1,
              easinessFactor: 2.5,
              nextReviewDate: Date.now(),
              status: "learning"
            }
          : item
      );
      localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      return updatedList;
    } catch (e) {
      console.error("Error resetting word", e);
      return [];
    }
  },

  getUserStats: () => {
    try {
      const data = localStorage.getItem(KEY_STATS);
      let stats = data ? JSON.parse(data) : { ...defaultStats };
      
      // Ensure activityHistory exists
      if (!stats.activityHistory) {
        stats.activityHistory = {};
      }
      
      // Automatic streak validation/update
      const now = new Date();
      if (stats.lastActive) {
        const lastActiveDate = new Date(stats.lastActive);
        
        // Calculate difference in days
        const diffTime = Math.abs(now.setHours(0,0,0,0) - lastActiveDate.setHours(0,0,0,0));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          // Reset streak if more than 1 day missed and save immediately to database
          stats.streak = 0;
          localStorage.setItem(KEY_STATS, JSON.stringify(stats));
        }
      }
      
      return stats;
    } catch (e) {
      console.error("Error getting user stats", e);
      return { ...defaultStats };
    }
  },

  updateUserStats: (updates) => {
    try {
      const current = storage.getUserStats();
      const updated = {
        ...current,
        ...updates,
        lastActive: Date.now()
      };
      localStorage.setItem(KEY_STATS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Error updating user stats", e);
      return { ...defaultStats };
    }
  },

  recordActivity: () => {
    try {
      const stats = storage.getUserStats();
      const now = new Date();
      const todayString = now.toDateString();
      const dateKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      
      let updatedStats = { ...stats };
      if (!updatedStats.activityHistory) {
        updatedStats.activityHistory = {};
      }
      
      if (!stats.lastActive) {
        updatedStats.streak = 1;
      } else {
        const lastActiveDate = new Date(stats.lastActive);
        const lastActiveString = lastActiveDate.toDateString();
        
        if (lastActiveString !== todayString) {
          const diffTime = Math.abs(now.setHours(0,0,0,0) - lastActiveDate.setHours(0,0,0,0));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            updatedStats.streak += 1;
          } else if (diffDays > 1) {
            updatedStats.streak = 1;
          }
        }
      }
      
      // Initialize today's count to 0 if not present (does not count as an interaction unless incremented)
      if (updatedStats.activityHistory[dateKey] === undefined) {
        updatedStats.activityHistory[dateKey] = 0;
      }
      
      updatedStats.lastActive = Date.now();
      localStorage.setItem(KEY_STATS, JSON.stringify(updatedStats));
      return updatedStats;
    } catch (e) {
      console.error("Error recording user activity", e);
      return { ...defaultStats };
    }
  },

  incrementActivity: (amount = 1) => {
    try {
      const stats = storage.getUserStats();
      const now = new Date();
      const dateKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      
      let updatedStats = { ...stats };
      if (!updatedStats.activityHistory) {
        updatedStats.activityHistory = {};
      }
      updatedStats.activityHistory[dateKey] = (updatedStats.activityHistory[dateKey] || 0) + amount;
      updatedStats.lastActive = Date.now();
      
      localStorage.setItem(KEY_STATS, JSON.stringify(updatedStats));
      return updatedStats;
    } catch (e) {
      console.error("Error incrementing user activity", e);
      return null;
    }
  },

  getTopicProgress: () => {
    try {
      const data = localStorage.getItem(KEY_TOPIC_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Error getting topic progress", e);
      return {};
    }
  },

  updateTopicProgress: (topicId, moduleKey, score) => {
    try {
      const progress = storage.getTopicProgress();
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
      
      localStorage.setItem(KEY_TOPIC_PROGRESS, JSON.stringify(updatedProgress));
      
      if (pointsAdded > 0 || completedModulesAdded > 0) {
        const stats = storage.getUserStats();
        storage.updateUserStats({
          points: stats.points + pointsAdded,
          completedModules: stats.completedModules + completedModulesAdded
        });
      }

      // Record daily learning activity
      storage.incrementActivity(3);

      return updatedProgress;
    } catch (e) {
      console.error("Error updating topic progress", e);
      return {};
    }
  },

  getCustomTopics: () => {
    try {
      const data = localStorage.getItem("eng_app_custom_topics");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading custom topics", e);
      return [];
    }
  },

  saveCustomTopic: (topicObj) => {
    try {
      const list = storage.getCustomTopics();
      const filtered = list.filter(t => t.id !== topicObj.id);
      const updated = [...filtered, topicObj];
      localStorage.setItem("eng_app_custom_topics", JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Error saving custom topic", e);
      return [];
    }
  },

  deleteCustomTopic: (topicId) => {
    try {
      const list = storage.getCustomTopics();
      const updated = list.filter(t => t.id !== topicId);
      localStorage.setItem("eng_app_custom_topics", JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Error deleting custom topic", e);
      return [];
    }
  },

  getPendingTopics: () => {
    try {
      const data = localStorage.getItem("eng_app_pending_topics");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading pending topics", e);
      return [];
    }
  },

  savePendingTopic: (topicObj) => {
    try {
      const list = storage.getPendingTopics();
      const filtered = list.filter(t => t.id !== topicObj.id);
      const updated = [...filtered, topicObj];
      localStorage.setItem("eng_app_pending_topics", JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Error saving pending topic", e);
      return [];
    }
  },

  deletePendingTopic: (topicId) => {
    try {
      const list = storage.getPendingTopics();
      const updated = list.filter(t => t.id !== topicId);
      localStorage.setItem("eng_app_pending_topics", JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Error deleting pending topic", e);
      return [];
    }
  },

  // Custom Decks management
  getCustomDecks: () => {
    try {
      const data = localStorage.getItem("eng_app_custom_decks");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading custom decks", e);
      return [];
    }
  },

  saveCustomDeck: (deckObj) => {
    try {
      const list = storage.getCustomDecks();
      const filtered = list.filter(d => d.id !== deckObj.id);
      const updated = [...filtered, deckObj];
      localStorage.setItem("eng_app_custom_decks", JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Error saving custom deck", e);
      return [];
    }
  },

  deleteCustomDeck: (deckId) => {
    try {
      const list = storage.getCustomDecks();
      const updated = list.filter(d => d.id !== deckId);
      localStorage.setItem("eng_app_custom_decks", JSON.stringify(updated));
      
      // Clear deck field from words in this deck
      const vocab = storage.getSavedVocab();
      const updatedVocab = vocab.map(item => {
        if (item.deckId === deckId) {
          const { deckId: _, deckName: __, ...rest } = item;
          return rest;
        }
        return item;
      });
      localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedVocab));
      
      return updated;
    } catch (e) {
      console.error("Error deleting custom deck", e);
      return [];
    }
  },

  assignWordToDeck: (wordText, deckId, deckName) => {
    try {
      const list = storage.getSavedVocab();
      const updatedList = list.map(item => {
        if (item.word.toLowerCase() === wordText.toLowerCase()) {
          return {
            ...item,
            deckId,
            deckName
          };
        }
        return item;
      });
      localStorage.setItem(KEY_VOCAB, JSON.stringify(updatedList));
      return updatedList;
    } catch (e) {
      console.error("Error assigning word to deck", e);
      return [];
    }
  }
};
