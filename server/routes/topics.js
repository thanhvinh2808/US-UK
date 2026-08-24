import express from 'express';
import { topicController } from '../controllers/topicController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { publicRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET all topics (Public, rate limited)
router.get('/', publicRateLimiter, topicController.getTopics);

// GET single topic by ID or slugId (Public, rate limited)
router.get('/:id', publicRateLimiter, topicController.getTopicById);

// POST create new topic (Protected: admin role required)
router.post('/', authenticate, requireRole('admin'), topicController.createTopic);

// PUT update existing topic (Protected: admin role required)
router.put('/:id', authenticate, requireRole('admin'), topicController.updateTopic);

// DELETE topic by ID or slugId (Protected: admin role required)
router.delete('/:id', authenticate, requireRole('admin'), topicController.deleteTopic);

export default router;
