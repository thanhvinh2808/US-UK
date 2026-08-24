import { studySetService } from '../services/studySetService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const studySetController = {
  getStudySets: async (req, res) => {
    try {
      const studySets = await studySetService.getAllStudySets();
      return sendSuccess(res, studySets);
    } catch (err) {
      return sendError(res, err.message, 500, 'STUDY_SET_FETCH_FAILED');
    }
  },

  getStudySetById: async (req, res) => {
    try {
      const studySet = await studySetService.getStudySetById(req.params.id);
      if (!studySet) {
        return sendError(res, 'Study set not found', 404, 'STUDY_SET_NOT_FOUND');
      }
      return sendSuccess(res, studySet);
    } catch (err) {
      return sendError(res, err.message, 500, 'STUDY_SET_FETCH_FAILED');
    }
  },

  createStudySet: async (req, res) => {
    try {
      // Enforce Data Ownership: author is always the authenticated user
      const studySetData = {
        ...req.body,
        author: req.user?.id
      };

      const studySet = await studySetService.createStudySet(studySetData);
      return sendSuccess(res, studySet, 201);
    } catch (err) {
      return sendError(res, err.message, 400, 'STUDY_SET_CREATE_FAILED');
    }
  },

  updateStudySet: async (req, res) => {
    try {
      const existing = await studySetService.getStudySetById(req.params.id);
      if (!existing) {
        return sendError(res, 'Study set not found', 404, 'STUDY_SET_NOT_FOUND');
      }

      // Check author ownership or admin role
      if (existing.author && existing.author.toString() !== req.user?.id && req.user?.role !== 'admin') {
        return sendError(
          res,
          'Access denied. You can only edit your own study sets.',
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      const updatedStudySet = await studySetService.updateStudySet(req.params.id, {
        ...req.body,
        author: existing.author // Prevent modifying author ownership
      });

      return sendSuccess(res, updatedStudySet);
    } catch (err) {
      return sendError(res, err.message, 400, 'STUDY_SET_UPDATE_FAILED');
    }
  },

  deleteStudySet: async (req, res) => {
    try {
      const existing = await studySetService.getStudySetById(req.params.id);
      if (!existing) {
        return sendError(res, 'Study set not found', 404, 'STUDY_SET_NOT_FOUND');
      }

      // Check author ownership or admin role
      if (existing.author && existing.author.toString() !== req.user?.id && req.user?.role !== 'admin') {
        return sendError(
          res,
          'Access denied. You can only delete your own study sets.',
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      await studySetService.deleteStudySet(req.params.id);
      return sendSuccess(res, { message: 'Study set deleted successfully' });
    } catch (err) {
      return sendError(res, err.message, 500, 'STUDY_SET_DELETE_FAILED');
    }
  }
};

export default studySetController;
