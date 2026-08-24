import { progressService } from '../services/progressService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const progressController = {
  /**
   * POST /api/progress/review
   * Submits card review answer (Data ownership enforced via req.user.id)
   */
  submitReview: async (req, res) => {
    // Zero Trust: Always bind to authenticated user identity
    const userId = req.user?.id;
    const { setId, cardId, isCorrect, grade } = req.body || {};

    if (!userId || !setId || !cardId) {
      return sendError(res, 'setId and cardId are required', 400, 'MISSING_REQUIRED_FIELDS');
    }

    try {
      const progress = await progressService.submitCardReview({ userId, setId, cardId, isCorrect, grade });
      return sendSuccess(res, progress);
    } catch (err) {
      return sendError(res, err.message, 500, 'PROGRESS_UPDATE_FAILED');
    }
  },

  /**
   * GET /api/progress/my-progress
   * Retrieves progress for authenticated user
   */
  getMyProgress: async (req, res) => {
    const userId = req.user?.id;
    const { setId } = req.query;

    if (!userId) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHENTICATED');
    }

    try {
      const data = setId
        ? await progressService.getUserSetProgress(userId, setId)
        : await progressService.getUserAllProgress?.(userId) || [];
      return sendSuccess(res, data);
    } catch (err) {
      return sendError(res, err.message, 500, 'PROGRESS_FETCH_FAILED');
    }
  },

  /**
   * GET /api/progress/user/:userId/set/:setId
   * Verifies that the requester owns the target userId or is an admin
   */
  getUserProgress: async (req, res) => {
    const { userId, setId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    if (!userId || !setId) {
      return sendError(res, 'userId and setId are required', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // IDOR Protection: User cannot read progress of other users unless role is admin
    if (currentUserId !== userId && currentUserRole !== 'admin') {
      return sendError(
        res,
        'Access denied. You are not authorized to view progress of other users.',
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    try {
      const data = await progressService.getUserSetProgress(userId, setId);
      return sendSuccess(res, data);
    } catch (err) {
      return sendError(res, err.message, 500, 'PROGRESS_FETCH_FAILED');
    }
  }
};

export default progressController;
