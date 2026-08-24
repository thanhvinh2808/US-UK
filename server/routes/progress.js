import express from 'express';
import { progressController } from '../controllers/progressController.js';

const router = express.Router();

// POST submit card review answer (Calculates SM-2 parameters & next review date)
router.post('/review', progressController.submitReview);

// GET user progress stats for a study set
router.get('/user/:userId/set/:setId', progressController.getUserProgress);

export default router;
