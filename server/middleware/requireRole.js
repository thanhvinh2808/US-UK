import { sendError } from '../utils/responseHelper.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces that req.user has one of the allowed roles
 * 
 * @param {...string} allowedRoles - List of authorized roles (e.g. 'admin', 'user')
 */
export const requireRole = (...allowedRoles) => {
  const rolesList = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before checking permissions', 401, 'UNAUTHENTICATED');
    }

    const userRole = req.user.role || 'user';

    if (!rolesList.includes(userRole)) {
      return sendError(
        res,
        `Access denied. Required role: [${rolesList.join(', ')}], but current role is '${userRole}'`,
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};

export default requireRole;
