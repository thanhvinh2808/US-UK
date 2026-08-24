import express from 'express';
import { progressController } from '../controllers/progressController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// POST submit card review answer (Protected: req.user.id binding)
router.post('/review', authenticate, progressController.submitReview);

// GET my-progress for authenticated user
router.get('/my-progress', authenticate, progressController.getMyProgress);

// GET user progress stats for a study set (Protected: IDOR validation)
router.get('/user/:userId/set/:setId', authenticate, progressController.getUserProgress);

export default router;
