/**
 * Production Safe Logger
 * Automatically strips sensitive credentials (JWT, passwords, secrets, auth headers)
 * and disables verbose debug logging in production environments.
 */

import { sanitizeText } from './errors/errorHandler.js';

const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

const formatLogArgs = (args) => {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeText(arg);
    }
    if (arg instanceof Error) {
      return sanitizeText(arg.message);
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        const str = JSON.stringify(arg);
        return JSON.parse(sanitizeText(str));
      } catch (e) {
        return '[Object]';
      }
    }
    return arg;
  });
};

export const logger = {
  debug: (...args) => {
    if (!isProduction) {
      console.debug(...formatLogArgs(args));
    }
  },

  info: (...args) => {
    console.info(...formatLogArgs(args));
  },

  warn: (...args) => {
    console.warn(...formatLogArgs(args));
  },

  error: (...args) => {
    console.error(...formatLogArgs(args));
  }
};

export default logger;
