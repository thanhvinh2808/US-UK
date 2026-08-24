import jwt from 'jsonwebtoken';
import { sendError } from '../utils/responseHelper.js';

/**
 * Authentication Middleware
 * Validates the JWT Bearer token from the Authorization header and attaches req.user
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendError(res, 'Authorization header is missing', 401, 'MISSING_TOKEN');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return sendError(res, 'Authorization header must follow format: Bearer <token>', 401, 'INVALID_TOKEN');
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('CRITICAL: JWT_SECRET environment variable is missing.');
    return sendError(res, 'Internal server authentication configuration error', 500, 'AUTH_CONFIG_ERROR');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    });

    if (!decoded || !decoded.sub) {
      return sendError(res, 'Token payload is missing subject identifier', 401, 'INVALID_TOKEN');
    }

    // Populate authenticated identity from verified token payload (Zero Trust)
    req.user = {
      id: decoded.sub,
      username: decoded.username || '',
      role: decoded.role || 'user'
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Access token has expired', 401, 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Access token is invalid or corrupted', 401, 'INVALID_TOKEN');
  }
};

export default authenticate;
