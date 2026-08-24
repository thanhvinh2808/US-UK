import express from 'express';
import { aiController } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authenticate.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Protected AI Gateway Endpoint (20 reqs/min/user)
router.post('/generate', authenticate, aiRateLimiter, aiController.generate);

export default router;
