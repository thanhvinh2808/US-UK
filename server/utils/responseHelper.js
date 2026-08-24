/**
 * Standardized API Response Helper
 */
export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

export const sendError = (res, message, statusCode = 500, code = 'API_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
};
