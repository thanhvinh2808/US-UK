import { authService } from '../services/authService.js';
import { sessionService } from '../services/sessionService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

/**
 * Auth Controller
 * Handles HTTP transport, cookie lifecycle, and delegates to services
 */
export const authController = {
  /**
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const result = await authService.register(req.body);

      if (!result.success) {
        return sendError(res, result.message, result.status, result.code);
      }

      return sendSuccess(
        res,
        { user: result.user, message: 'User registered successfully' },
        201
      );
    } catch (err) {
      console.error('Registration error:', err.message);
      return sendError(res, 'Internal server error during registration', 500, 'REGISTER_ERROR');
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const deviceInfo = {
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
      };

      const result = await authService.login({
        email: req.body.email,
        password: req.body.password,
        deviceInfo
      });

      if (!result.success) {
        return sendError(res, result.message, result.status, result.code);
      }

      // Set HttpOnly Refresh Token Cookie
      res.cookie(COOKIE_NAME, result.refreshToken, getCookieOptions());

      return sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken,
        message: 'Login successful'
      });
    } catch (err) {
      console.error('Login error:', err.message);
      return sendError(res, 'Internal server error during login', 500, 'LOGIN_ERROR');
    }
  },

  /**
   * POST /api/auth/refresh
   * Rotates refresh token and issues a new access token
   */
  async refresh(req, res) {
    try {
      const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;

      if (!rawRefreshToken) {
        return sendError(res, 'Refresh token is missing from cookie or request', 401, 'MISSING_REFRESH_TOKEN');
      }

      const deviceInfo = {
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
      };

      const rotation = await sessionService.rotateSession(rawRefreshToken, deviceInfo);

      if (rotation.replayDetected) {
        // Clear cookie immediately upon replay detection
        res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
        return sendError(
          res,
          'Security Alert: Refresh token reuse detected. All active sessions have been terminated.',
          401,
          'INVALID_SESSION'
        );
      }

      if (!rotation.rotated) {
        res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
        return sendError(res, 'Session is invalid or has expired', 401, 'INVALID_SESSION');
      }

      // Retrieve user associated with session
      const user = await authService.getUserById(rotation.session.userId);
      if (!user) {
        res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
        return sendError(res, 'User associated with session no longer exists', 401, 'USER_NOT_FOUND');
      }

      // Generate new Access Token
      const newAccessToken = authService.createAccessToken(user);

      // Set new rotated Refresh Token Cookie
      res.cookie(COOKIE_NAME, rotation.rawToken, getCookieOptions());

      return sendSuccess(res, {
        accessToken: newAccessToken,
        user
      });
    } catch (err) {
      console.error('Refresh token error:', err.message);
      return sendError(res, 'Failed to refresh authentication session', 500, 'REFRESH_ERROR');
    }
  },

  /**
   * POST /api/auth/logout
   * Revokes current session and clears refresh cookie
   */
  async logout(req, res) {
    try {
      const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;

      if (rawRefreshToken) {
        await sessionService.revokeSession(rawRefreshToken, 'user_logout');
      }

      res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      console.error('Logout error:', err.message);
      return sendError(res, 'Failed to logout', 500, 'LOGOUT_ERROR');
    }
  },

  /**
   * POST /api/auth/logout-all
   * Revokes all active sessions for the authenticated user
   */
  async logoutAll(req, res) {
    try {
      const userId = req.user.id;
      await sessionService.revokeAllUserSessions(userId, 'logout_all');

      res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
      return sendSuccess(res, { message: 'All active sessions have been revoked' });
    } catch (err) {
      console.error('Logout-all error:', err.message);
      return sendError(res, 'Failed to revoke sessions', 500, 'LOGOUT_ALL_ERROR');
    }
  },

  /**
   * GET /api/auth/me
   * Returns current authenticated user profile (enforcing req.user.id)
   */
  async me(req, res) {
    try {
      const userId = req.user.id;
      const user = await authService.getUserById(userId);

      if (!user) {
        return sendError(res, 'User profile not found', 404, 'USER_NOT_FOUND');
      }

      return sendSuccess(res, { user });
    } catch (err) {
      console.error('Profile fetch error:', err.message);
      return sendError(res, 'Failed to retrieve profile', 500, 'PROFILE_ERROR');
    }
  }
};

export default authController;
