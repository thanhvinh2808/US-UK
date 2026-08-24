const KEY_MISTAKES = "eng_app_mistake_bank";
const MAX_MISTAKES_STORED = 500;

export const mistakeStorage = {
  /**
   * Lưu 1 câu làm sai vào ngân hàng.
   * @param {Object} mistake
   * @param {string} mistake.module    - khoá định danh module, vd: 'grammar', 'minimal_pairs', 'flashcards'
   * @param {string} mistake.skill     - tên kỹ năng hiển thị tiếng Việt, vd: 'Ngữ pháp', 'Phát âm'
   * @param {string} mistake.question  - câu hỏi / nội dung đề bài
   * @param {string} [mistake.userAnswer]    - câu trả lời của người dùng (nếu có)
   * @param {string} [mistake.correctAnswer] - đáp án đúng (nếu có)
   * @param {string} [mistake.topicId]       - id bài học liên quan (nếu có)
   */
  saveMistake: (mistake) => {
    try {
      const list = mistakeStorage.getMistakes();
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        module: mistake.module || 'khac',
        skill: mistake.skill || 'Khác',
        question: mistake.question || '',
        userAnswer: mistake.userAnswer || '',
        correctAnswer: mistake.correctAnswer || '',
        topicId: mistake.topicId || null,
      };
      // Thêm vào đầu danh sách (mới nhất lên trước), giới hạn kích thước để tránh phình to
      const updated = [entry, ...list].slice(0, MAX_MISTAKES_STORED);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_MISTAKES, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error("Error saving mistake", e);
      return [];
    }
  },

  getMistakes: (moduleFilter = null) => {
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(KEY_MISTAKES);
      const list = data ? JSON.parse(data) : [];
      if (moduleFilter) {
        return list.filter(m => m.module === moduleFilter);
      }
      return list;
    } catch (e) {
      console.error("Error reading mistake bank", e);
      return [];
    }
  },

  deleteMistake: (id) => {
    try {
      const list = mistakeStorage.getMistakes();
      const updated = list.filter(m => m.id !== id);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_MISTAKES, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error("Error deleting mistake", e);
      return [];
    }
  },

  clearMistakes: (moduleFilter = null) => {
    try {
      if (!moduleFilter) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(KEY_MISTAKES, JSON.stringify([]));
        }
        return [];
      }
      const list = mistakeStorage.getMistakes();
      const updated = list.filter(m => m.module !== moduleFilter);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEY_MISTAKES, JSON.stringify(updated));
      }
      return updated;
    } catch (e) {
      console.error("Error clearing mistake bank", e);
      return [];
    }
  },

  /**
   * Tổng hợp thống kê điểm yếu: đếm số câu sai theo từng kỹ năng (skill),
   * sắp xếp giảm dần — kỹ năng nào sai nhiều nhất đứng đầu.
   */
  getWeaknessStats: () => {
    try {
      const list = mistakeStorage.getMistakes();
      const counts = {};
      list.forEach(m => {
        counts[m.skill] = (counts[m.skill] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count);
    } catch (e) {
      console.error("Error computing weakness stats", e);
      return [];
    }
  }
};
