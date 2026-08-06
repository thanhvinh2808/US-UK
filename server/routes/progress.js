import express from 'express';
import UserCardProgress from '../models/UserCardProgress.js';

const router = express.Router();

// POST submit card review answer (Calculates Leitner box & next review date)
router.post('/review', async (req, res) => {
  const { userId, setId, cardId, isCorrect } = req.body;

  if (!userId || !setId || !cardId) {
    return res.status(400).json({ error: 'userId, setId, and cardId are required' });
  }

  try {
    let progress = await UserCardProgress.findOne({ userId, cardId });

    if (!progress) {
      progress = new UserCardProgress({ userId, setId, cardId });
    }

    let box = progress.leitnerBox;
    let consecutive = progress.consecutiveCorrect;

    if (isCorrect) {
      consecutive += 1;
      box = Math.min(5, box + 1); // Max Box 5
    } else {
      consecutive = 0;
      box = Math.max(1, box - 1); // Min Box 1
    }

    // Intervals in days: Box 1=1d, Box 2=3d, Box 3=7d, Box 4=14d, Box 5=30d
    const intervalsInDays = [1, 3, 7, 14, 30];
    const daysToAdd = intervalsInDays[box - 1];

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    progress.leitnerBox = box;
    progress.consecutiveCorrect = consecutive;
    progress.timesReviewed += 1;
    progress.lastReviewedAt = new Date();
    progress.nextReviewAt = nextReview;
    progress.status = box === 5 ? 'mastered' : 'learning';

    await progress.save();
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user progress stats for a study set
router.get('/user/:userId/set/:setId', async (req, res) => {
  try {
    const { userId, setId } = req.params;
    const progressList = await UserCardProgress.find({ userId, setId });
    
    const stats = {
      total: progressList.length,
      mastered: progressList.filter(p => p.status === 'mastered').length,
      learning: progressList.filter(p => p.status === 'learning').length,
      boxCounts: {
        1: progressList.filter(p => p.leitnerBox === 1).length,
        2: progressList.filter(p => p.leitnerBox === 2).length,
        3: progressList.filter(p => p.leitnerBox === 3).length,
        4: progressList.filter(p => p.leitnerBox === 4).length,
        5: progressList.filter(p => p.leitnerBox === 5).length
      }
    };

    res.json({ progress: progressList, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
