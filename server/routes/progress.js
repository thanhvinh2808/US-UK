import express from 'express';
import UserCardProgress from '../models/UserCardProgress.js';

const router = express.Router();

// Spaced Repetition SM-2 Algorithm Implementation for Backend
function calculateSM2(grade, repetitions, previousInterval, previousEase) {
  let ease = parseFloat(previousEase) || 2.5;
  let reps = parseInt(repetitions) || 0;
  let interval = 1;

  if (grade === 1) {
    return {
      repetitions: 0,
      interval: 0,
      easinessFactor: Math.max(1.3, ease - 0.2),
      nextReviewDate: Date.now()
    };
  }

  if (grade >= 3) {
    if (reps === 0) {
      interval = 1;
    } else if (reps === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * ease);
    }
    reps++;
  } else {
    reps = 0;
    interval = 1;
  }

  ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (ease < 1.3) ease = 1.3;

  return {
    repetitions: reps,
    interval: interval,
    easinessFactor: ease,
    nextReviewDate: Date.now() + interval * 24 * 60 * 60 * 1000
  };
}

// POST submit card review answer (Calculates SM-2 parameters & next review date)
router.post('/review', async (req, res) => {
  const { userId, setId, cardId, isCorrect, grade: gradeInput } = req.body;

  if (!userId || !setId || !cardId) {
    return res.status(400).json({ error: 'userId, setId, and cardId are required' });
  }

  let grade = gradeInput !== undefined ? parseInt(gradeInput) : (isCorrect ? 4 : 1);

  try {
    let progress = await UserCardProgress.findOne({ userId, cardId });

    if (!progress) {
      progress = new UserCardProgress({ userId, setId, cardId });
    }

    const sm2Result = calculateSM2(
      grade,
      progress.repetitions,
      progress.interval,
      progress.easinessFactor
    );

    progress.repetitions = sm2Result.repetitions;
    progress.interval = sm2Result.interval;
    progress.easinessFactor = sm2Result.easinessFactor;
    progress.timesReviewed += 1;
    progress.lastReviewedAt = new Date();
    progress.nextReviewAt = new Date(sm2Result.nextReviewDate);
    progress.status = sm2Result.repetitions >= 3 ? 'mastered' : 'learning';

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
    
    let newCount = 0;
    let learningCount = 0;
    let masteredCount = 0;

    progressList.forEach(p => {
      if (p.status === 'mastered') masteredCount++;
      else if (p.status === 'learning') learningCount++;
      else newCount++;
    });

    const stats = {
      total: progressList.length,
      statusCounts: {
        new: newCount,
        learning: learningCount,
        mastered: masteredCount
      }
    };

    res.json({ progress: progressList, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
