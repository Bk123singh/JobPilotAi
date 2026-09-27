const AppError = require('../errors/AppError');
const logger = require('../utils/logger');
const env = require('../config/env');

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    error = AppError.badRequest('Validation failed', formattedErrors);
  }

  // Handle Prisma Unique Constraint Errors (P2002)
  if (err.code === 'P2002') {
    const target = err.meta?.target ? ` (${err.meta.target})` : '';
    error = AppError.conflict(`A record with this field already exists${target}`);
  }

  // Handle Prisma Record Not Found Errors (P2025)
  if (err.code === 'P2025') {
    error = AppError.notFound('Requested record was not found');
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = AppError.unauthorized('Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    error = AppError.unauthorized('Authentication token has expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.stack || err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { details: error.details } : {}),
    ...(env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};

const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = {
  errorMiddleware,
  notFoundHandler,
};
