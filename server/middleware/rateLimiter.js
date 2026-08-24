import { sendError } from '../utils/responseHelper.js';

/**
 * In-Memory Lightweight Rate Limiter Store
 * Periodically sweeps expired records to prevent memory growth
 */
class MemoryRateLimitStore {
  constructor(cleanupIntervalMs = 60000) {
    this.hits = new Map(); // key -> { count: number, resetTime: number }
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupIntervalMs);
    // Ensure timer doesn't hold open Node process in unit tests
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  increment(key, windowMs) {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || now > entry.resetTime) {
      const resetTime = now + windowMs;
      this.hits.set(key, { count: 1, resetTime });
      return { count: 1, resetTime, remainingMs: windowMs };
    }

    entry.count += 1;
    return { count: entry.count, resetTime: entry.resetTime, remainingMs: Math.max(0, entry.resetTime - now) };
  }

  get(key) {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || now > entry.resetTime) {
      return null;
    }
    return entry;
  }

  reset(key) {
    this.hits.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.hits.entries()) {
      if (now > entry.resetTime) {
        this.hits.delete(key);
      }
    }
  }
}

export const sharedRateLimitStore = new MemoryRateLimitStore();

/**
 * Creates a configurable rate limiter middleware
 */
export const createRateLimiter = ({
  windowMs = 60000,
  max = 60,
  keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
  errorCode = 'RATE_LIMIT_EXCEEDED',
  message = 'Too many requests. Please try again later.',
  store = sharedRateLimitStore,
  prefix = 'global'
}) => {
  return (req, res, next) => {
    const identifier = keyGenerator(req);
    const key = `${prefix}:${identifier}`;

    const { count, resetTime, remainingMs } = store.increment(key, windowMs);
    const retryAfterSec = Math.ceil(remainingMs / 1000);

    // Standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    if (count > max) {
      res.setHeader('Retry-After', retryAfterSec);
      return sendError(
        res,
        `${message} Please retry after ${retryAfterSec} seconds.`,
        429,
        errorCode
      );
    }

    next();
  };
};

/**
 * Public API Limiter: 100 requests / minute / IP
 */
export const publicRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  prefix: 'public',
  errorCode: 'RATE_LIMIT_EXCEEDED',
  message: 'Public rate limit exceeded.'
});

/**
 * AI Gateway Limiter: 20 requests / min / authenticated user, fallback 5 / min / IP
 */
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  prefix: 'ai',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous_ai',
  errorCode: 'AI_RATE_LIMIT_EXCEEDED',
  message: 'AI request quota exceeded for this minute.'
});

/**
 * Failed Auth Tracking Store for Login Brute Force Protection
 * 5 failed login attempts / 15 minutes / IP
 */
export const authFailureStore = new MemoryRateLimitStore();

export const recordFailedAuth = (ip, windowMs = 15 * 60 * 1000) => {
  return authFailureStore.increment(`auth_fail:${ip}`, windowMs);
};

export const clearFailedAuth = (ip) => {
  authFailureStore.reset(`auth_fail:${ip}`);
};

export const isAuthBlocked = (ip, maxFailures = 5) => {
  const entry = authFailureStore.get(`auth_fail:${ip}`);
  return entry && entry.count >= maxFailures;
};

/**
 * Auth Middleware Limiter for login endpoints
 */
export const authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

  if (isAuthBlocked(ip, 5)) {
    const entry = authFailureStore.get(`auth_fail:${ip}`);
    const remainingMs = entry ? Math.max(0, entry.resetTime - Date.now()) : 0;
    const retryAfterSec = Math.ceil(remainingMs / 1000);

    res.setHeader('Retry-After', retryAfterSec);
    return sendError(
      res,
      `Too many failed login attempts from this IP. Please try again after ${retryAfterSec} seconds.`,
      429,
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
  }

  next();
};
