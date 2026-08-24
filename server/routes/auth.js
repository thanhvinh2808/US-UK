import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRegister, validateLogin } from '../middleware/validateAuth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', validateRegister, authRateLimiter, authController.register);
router.post('/login', validateLogin, authRateLimiter, authController.login);
router.post('/refresh', authController.refresh);

// Protected Session & User Endpoints
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);

export default router;
