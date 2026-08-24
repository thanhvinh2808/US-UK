import { sendError } from '../utils/responseHelper.js';

// Standard RFC 5322 simplified email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Username regex: 3-30 chars, letters, numbers, underscores, hyphens
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

// Forbidden fields that must never be set directly via registration payload (Mass Assignment)
const FORBIDDEN_REGISTRATION_FIELDS = [
  'role',
  'failedLoginAttempts',
  'lockUntil',
  'mustResetPassword',
  'passwordHash',
  '_id',
  'id',
  'createdAt',
  'updatedAt'
];

/**
 * Validates registration request payload and strips forbidden fields
 */
export const validateRegister = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return sendError(res, 'Request body is required and must be a JSON object', 400, 'INVALID_REQUEST_BODY');
  }

  const { username, email, password, preferredAccent, targetBand } = body;

  // 1. Username validation
  if (!username || typeof username !== 'string') {
    return sendError(res, 'Username is required', 400, 'INVALID_USERNAME');
  }
  const cleanUsername = username.trim();
  if (!USERNAME_REGEX.test(cleanUsername)) {
    return sendError(
      res,
      'Username must be 3-30 characters long and contain only letters, numbers, hyphens, and underscores',
      400,
      'INVALID_USERNAME_FORMAT'
    );
  }

  // 2. Email validation
  if (!email || typeof email !== 'string') {
    return sendError(res, 'Email is required', 400, 'INVALID_EMAIL');
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return sendError(res, 'Email address format is invalid', 400, 'INVALID_EMAIL_FORMAT');
  }

  // 3. Password validation (8-128 chars, at least 1 letter and 1 number)
  if (!password || typeof password !== 'string') {
    return sendError(res, 'Password is required', 400, 'INVALID_PASSWORD');
  }
  if (password.length < 8 || password.length > 128) {
    return sendError(res, 'Password must be between 8 and 128 characters long', 400, 'PASSWORD_LENGTH_INVALID');
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return sendError(res, 'Password must contain at least one letter and one digit', 400, 'WEAK_PASSWORD');
  }

  // 4. Mass Assignment Protection: Strip forbidden fields and enforce sanitized payload
  const sanitizedBody = {
    username: cleanUsername,
    email: cleanEmail,
    password: password,
    preferredAccent: ['US', 'UK'].includes(preferredAccent) ? preferredAccent : 'US',
    targetBand: typeof targetBand === 'number' && targetBand >= 0 && targetBand <= 9 ? targetBand : 7.5
  };

  // Strip any mass-assignment fields explicitly
  for (const field of FORBIDDEN_REGISTRATION_FIELDS) {
    delete req.body[field];
  }

  req.body = sanitizedBody;
  next();
};

/**
 * Validates login request payload
 */
export const validateLogin = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return sendError(res, 'Request body is required and must be a JSON object', 400, 'INVALID_REQUEST_BODY');
  }

  const { email, password } = body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return sendError(res, 'Email is required', 400, 'MISSING_EMAIL');
  }

  if (!password || typeof password !== 'string') {
    return sendError(res, 'Password is required', 400, 'MISSING_PASSWORD');
  }

  req.body.email = email.trim().toLowerCase();
  next();
};
