/**
 * Standardized API Response Helpers
 */
const successResponse = (res, statusCode = 200, data = null, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const createdResponse = (res, data = null, message = 'Created successfully') => {
  return successResponse(res, 201, data, message);
};

const errorResponse = (res, statusCode = 500, message = 'Something went wrong', details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
};

module.exports = {
  successResponse,
  createdResponse,
  errorResponse,
};
