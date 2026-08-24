import { progressService } from '../services/progressService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const progressController = {
  submitReview: async (req, res) => {
    const { userId, setId, cardId, isCorrect, grade } = req.body;

    if (!userId || !setId || !cardId) {
      return sendError(res, 'userId, setId, and cardId are required', 400, 'MISSING_REQUIRED_FIELDS');
    }

    try {
      const progress = await progressService.submitCardReview({ userId, setId, cardId, isCorrect, grade });
      return sendSuccess(res, progress);
    } catch (err) {
      return sendError(res, err.message, 500, 'PROGRESS_UPDATE_FAILED');
    }
  },

  getUserProgress: async (req, res) => {
    const { userId, setId } = req.params;

    if (!userId || !setId) {
      return sendError(res, 'userId and setId are required', 400, 'MISSING_REQUIRED_FIELDS');
    }

    try {
      const data = await progressService.getUserSetProgress(userId, setId);
      return sendSuccess(res, data);
    } catch (err) {
      return sendError(res, err.message, 500, 'PROGRESS_FETCH_FAILED');
    }
  }
};
