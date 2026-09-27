const AppError = require('../errors/AppError');
const { verifyAccessToken } = require('../utils/tokenUtils');
const authService = require('../modules/auth/authService');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(AppError.unauthorized('Authentication token required'));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(AppError.unauthorized('Token expired, please refresh your session'));
      }
      return next(AppError.unauthorized('Invalid authentication token'));
    }

    if (!decoded || !decoded.userId) {
      return next(AppError.unauthorized('Invalid or expired token'));
    }

    try {
      const user = await authService.getMe(decoded.userId);
      req.user = user;
    } catch (e) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles - e.g. 'JOB_SEEKER', 'RECRUITER', 'ADMIN'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(`Access forbidden: Requires one of [${roles.join(', ')}] role(s)`)
      );
    }

    next();
  };
};

const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        if (decoded && decoded.userId) {
          const user = await authService.getMe(decoded.userId);
          if (user) req.user = user;
        }
      } catch (err) {
        // Ignore invalid token on optional routes
      }
    }
  } catch (err) {
    // Ignore
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
};
