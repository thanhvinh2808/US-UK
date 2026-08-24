import { topicService } from '../services/topicService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const topicController = {
  getTopics: async (req, res) => {
    try {
      const topics = await topicService.getAllTopics();
      return sendSuccess(res, topics);
    } catch (err) {
      return sendError(res, err.message, 500, 'TOPIC_FETCH_FAILED');
    }
  },

  getTopicById: async (req, res) => {
    try {
      const topic = await topicService.getTopicById(req.params.id);
      if (!topic) {
        return sendError(res, 'Topic not found', 404, 'TOPIC_NOT_FOUND');
      }
      return sendSuccess(res, topic);
    } catch (err) {
      return sendError(res, err.message, 500, 'TOPIC_FETCH_FAILED');
    }
  },

  createTopic: async (req, res) => {
    try {
      const newTopic = await topicService.createTopic(req.body);
      return sendSuccess(res, newTopic, 201);
    } catch (err) {
      return sendError(res, err.message, 400, 'TOPIC_CREATE_FAILED');
    }
  },

  updateTopic: async (req, res) => {
    try {
      const updatedTopic = await topicService.updateTopic(req.params.id, req.body);
      if (!updatedTopic) {
        return sendError(res, 'Topic not found', 404, 'TOPIC_NOT_FOUND');
      }
      return sendSuccess(res, updatedTopic);
    } catch (err) {
      return sendError(res, err.message, 400, 'TOPIC_UPDATE_FAILED');
    }
  },

  deleteTopic: async (req, res) => {
    try {
      const deletedTopic = await topicService.deleteTopic(req.params.id);
      if (!deletedTopic) {
        return sendError(res, 'Topic not found', 404, 'TOPIC_NOT_FOUND');
      }
      return sendSuccess(res, { message: 'Topic deleted successfully' });
    } catch (err) {
      return sendError(res, err.message, 500, 'TOPIC_DELETE_FAILED');
    }
  }
};
