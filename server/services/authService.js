import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sessionService } from './sessionService.js';

/**
 * Sanitizes User document to ensure sensitive fields are never exposed
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  return obj;
};

/**
 * Authentication Service
 * Manages user registration, credential verification, JWT generation, and account lockout
 */
export const authService = {
  /**
   * Generates a 15-minute Access Token (JWT HS256)
   */
  createAccessToken(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role || 'user'
    };

    return jwt.sign(payload, secret, {
      algorithm: 'HS256',
      expiresIn: '15m'
    });
  },

  /**
   * Registers a new user account with bcrypt password hashing
   */
  async register({ username, email, password, preferredAccent = 'US', targetBand = 7.5 }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // Check for existing username or email
    const existing = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }]
    });

    if (existing) {
      const isEmail = existing.email.toLowerCase() === cleanEmail;
      return {
        success: false,
        status: 409,
        code: isEmail ? 'EMAIL_ALREADY_EXISTS' : 'USERNAME_ALREADY_EXISTS',
        message: isEmail ? 'Email address is already in use' : 'Username is already taken'
      };
    }

    // Hash password with bcryptjs (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Enforce role: 'user' explicitly (Zero Mass Assignment)
    const newUser = new User({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: 'user',
      mustResetPassword: false,
      failedLoginAttempts: 0,
      lockUntil: null,
      preferredAccent: ['US', 'UK'].includes(preferredAccent) ? preferredAccent : 'US',
      targetBand: typeof targetBand === 'number' ? targetBand : 7.5,
      streakDays: 0,
      lastActiveAt: new Date()
    });

    await newUser.save();

    return {
      success: true,
      status: 201,
      user: sanitizeUser(newUser)
    };
  },

  /**
   * Authenticates user credentials, handles lockout, and creates session tokens
   */
  async login({ email, password, deviceInfo = {} }) {
    const cleanEmail = (email || '').trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

    if (!user) {
      return {
        success: false,
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      };
    }

    // Check temporary account lockout
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - now.getTime()) / 60000);
      return {
        success: false,
        status: 423,
        code: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      };
    }

    // Verify bcrypt password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account for 15 minutes after 5 consecutive failures
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await user.save();

      if (user.failedLoginAttempts >= 5) {
        return {
          success: false,
          status: 423,
          code: 'ACCOUNT_LOCKED',
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        };
      }

      return {
        success: false,
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      };
    }

    // Reset failed login tracking on success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastActiveAt = new Date();
    await user.save();

    // Create Access Token and Session Refresh Token
    const accessToken = this.createAccessToken(user);
    const { rawToken: refreshToken, session } = await sessionService.createSession({
      userId: user._id,
      deviceInfo
    });

    return {
      success: true,
      status: 200,
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      session
    };
  },

  /**
   * Retrieves safe user profile by ID
   */
  async getUserById(userId) {
    const user = await User.findById(userId);
    return sanitizeUser(user);
  }
};

export default authService;
