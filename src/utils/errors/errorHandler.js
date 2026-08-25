/**
 * Global Error Handler & Sanitizer
 * Maps HTTP and application errors to safe, user-friendly Vietnamese messages.
 * Prevents exposure of sensitive credentials, tokens, and raw stack traces.
 */

export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác.',
  ACCOUNT_LOCKED: 'Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.',
  UNAUTHENTICATED: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
  TOKEN_EXPIRED: 'Phiên xác thực đã hết hạn.',
  INVALID_TOKEN: 'Mã xác thực không hợp lệ.',
  INSUFFICIENT_PERMISSIONS: 'Bạn không có quyền thực hiện thao tác này.',
  EMAIL_ALREADY_EXISTS: 'Địa chỉ email này đã được đăng ký.',
  USERNAME_ALREADY_EXISTS: 'Tên người dùng này đã tồn tại.',
  AUTH_RATE_LIMIT_EXCEEDED: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi trong giây lát.',
  AI_RATE_LIMIT_EXCEEDED: 'Đã đạt giới hạn yêu cầu AI. Vui lòng thử lại sau 1 phút.',

  // Client Validation (400)
  INVALID_INPUT: 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.',
  MALICIOUS_INPUT_DETECTED: 'Phát hiện dữ liệu không an toàn trong tệp nhập.',
  UNSUPPORTED_FORMAT: 'Định dạng tệp không được hỗ trợ.',

  // Network & Server
  NETWORK_ERROR: 'Không thể kết nối đến máy chủ. Dữ liệu sẽ được lưu offline và tự động đồng bộ.',
  SERVER_ERROR: 'Máy chủ gặp sự cố xử lý. Vui lòng thử lại sau.',
  RESOURCE_NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu.'
};

/**
 * Maps any error object or HTTP status into a user-facing safe error message.
 * @param {Error|Object|string} err - Error object, API response error, or error code
 * @param {number} [status] - HTTP status code
 * @returns {{ message: string, code: string }}
 */
export const getErrorMessage = (err, status = null) => {
  if (!err && !status) {
    return { message: 'Đã xảy ra lỗi không xác định.', code: 'UNKNOWN_ERROR' };
  }

  // 1. Direct code lookup
  const errorCode = typeof err === 'string' ? err : err?.code || err?.error?.code;
  if (errorCode && ERROR_CODES[errorCode]) {
    return { message: ERROR_CODES[errorCode], code: errorCode };
  }

  // 2. HTTP Status mapping
  if (status) {
    switch (status) {
      case 400:
        return { message: ERROR_CODES.INVALID_INPUT, code: 'INVALID_INPUT' };
      case 401:
        return { message: ERROR_CODES.UNAUTHENTICATED, code: 'UNAUTHENTICATED' };
      case 403:
        return { message: ERROR_CODES.INSUFFICIENT_PERMISSIONS, code: 'INSUFFICIENT_PERMISSIONS' };
      case 404:
        return { message: ERROR_CODES.RESOURCE_NOT_FOUND, code: 'RESOURCE_NOT_FOUND' };
      case 409:
        return { message: 'Dữ liệu bị trùng lặp hoặc xung đột.', code: 'CONFLICT' };
      case 429:
        return { message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ít phút.', code: 'RATE_LIMITED' };
      case 500:
      case 502:
      case 503:
      case 504:
        return { message: ERROR_CODES.SERVER_ERROR, code: 'SERVER_ERROR' };
    }
  }

  // 3. Network or Offline error
  if (err instanceof Error) {
    if (err.message.includes('fetch failed') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
      return { message: ERROR_CODES.NETWORK_ERROR, code: 'NETWORK_ERROR' };
    }
    // Safe message without leaking secrets
    return { message: sanitizeText(err.message), code: 'GENERIC_ERROR' };
  }

  return { message: 'Đã xảy ra lỗi, vui lòng thử lại.', code: 'UNKNOWN_ERROR' };
};

/**
 * Strips sensitive keys/values from text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED]')
    .replace(/(password|secret|key|token)["']?\s*[:=]\s*["'][^"']+["']/gi, '$1="[REDACTED]"');
};

export default {
  ERROR_CODES,
  getErrorMessage,
  sanitizeText
};
