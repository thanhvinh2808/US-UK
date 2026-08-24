import crypto from 'crypto';
import UserSession from '../models/UserSession.js';

/**
 * Session Service
 * Manages opaque Refresh Tokens, SHA-256 token hashing, session rotation, and replay attack detection
 */
export const sessionService = {
  /**
   * Generates a 48-byte cryptographically secure random token (96 hex characters)
   */
  generateRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
  },

  /**
   * Computes SHA-256 hash of raw token for safe database persistence
   */
  hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  },

  /**
   * Creates a new user session with a hashed refresh token
   */
  async createSession({ userId, deviceInfo = {}, expiresInDays = 7 }) {
    const rawToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const session = await UserSession.create({
      userId,
      refreshTokenHash,
      deviceInfo,
      expiresAt,
      lastUsedAt: new Date(),
      isRevoked: false
    });

    return { rawToken, session };
  },

  /**
   * Validates a raw refresh token and returns session status
   */
  async findValidSession(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      return { valid: false, reason: 'INVALID_TOKEN' };
    }

    const refreshTokenHash = this.hashToken(rawToken);
    const session = await UserSession.findOne({ refreshTokenHash });

    if (!session) {
      return { valid: false, reason: 'NOT_FOUND' };
    }

    if (session.isRevoked) {
      return { valid: false, reason: 'REVOKED', session };
    }

    if (session.expiresAt <= new Date()) {
      return { valid: false, reason: 'EXPIRED', session };
    }

    return { valid: true, session };
  },

  /**
   * Refresh Token Rotation (RTR)
   * Rotates token on every refresh call and detects token reuse/replay attacks
   */
  async rotateSession(rawToken, deviceInfo = null) {
    const check = await this.findValidSession(rawToken);

    // Replay attack detection: Attempting to use an already revoked token
    if (check.reason === 'REVOKED' && check.session) {
      console.warn(`SECURITY ALERT: Token reuse detected for User ID ${check.session.userId}. Revoking all sessions.`);
      await this.revokeAllUserSessions(check.session.userId, 'rotation_reuse_detected');
      return { rotated: false, replayDetected: true, reason: 'REPLAY_DETECTED' };
    }

    if (!check.valid) {
      return { rotated: false, replayDetected: false, reason: check.reason };
    }

    const session = check.session;
    const newRawToken = this.generateRefreshToken();
    const newRefreshTokenHash = this.hashToken(newRawToken);

    session.refreshTokenHash = newRefreshTokenHash;
    session.lastUsedAt = new Date();
    if (deviceInfo) {
      session.deviceInfo = { ...session.deviceInfo, ...deviceInfo };
    }

    await session.save();

    return {
      rotated: true,
      replayDetected: false,
      rawToken: newRawToken,
      session
    };
  },

  /**
   * Revokes a specific session (single device logout)
   */
  async revokeSession(rawToken, reason = 'user_logout') {
    if (!rawToken || typeof rawToken !== 'string') return null;

    const refreshTokenHash = this.hashToken(rawToken);
    return await UserSession.findOneAndUpdate(
      { refreshTokenHash, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
      },
      { new: true }
    );
  },

  /**
   * Revokes all active sessions belonging to a user (logout-all or breach containment)
   */
  async revokeAllUserSessions(userId, reason = 'logout_all') {
    return await UserSession.updateMany(
      { userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
      }
    );
  }
};

export default sessionService;
