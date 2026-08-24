import express from 'express';
import { studySetController } from '../controllers/studySetController.js';
import { authenticate } from '../middleware/authenticate.js';
import { publicRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET all study sets (Public, rate limited)
router.get('/', publicRateLimiter, studySetController.getStudySets);

// GET single study set by ID (Public, rate limited)
router.get('/:id', publicRateLimiter, studySetController.getStudySetById);

// POST create new study set (Protected: author bound to req.user.id)
router.post('/', authenticate, studySetController.createStudySet);

// PUT update existing study set (Protected: owner or admin)
router.put('/:id', authenticate, studySetController.updateStudySet);

// DELETE study set by ID (Protected: owner or admin)
router.delete('/:id', authenticate, studySetController.deleteStudySet);

export default router;
