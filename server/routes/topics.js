import express from 'express';
import { topicController } from '../controllers/topicController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// GET all topics
router.get('/', topicController.getTopics);

// GET single topic by ID or slugId
router.get('/:id', topicController.getTopicById);

// POST create new topic (Protected with admin key)
router.post('/', adminAuth, topicController.createTopic);

// PUT update existing topic (Protected with admin key)
router.put('/:id', adminAuth, topicController.updateTopic);

// DELETE topic by ID or slugId (Protected with admin key)
router.delete('/:id', adminAuth, topicController.deleteTopic);

export default router;
