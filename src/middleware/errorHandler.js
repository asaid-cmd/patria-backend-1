const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', err);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return sendError(res, 'Validation Error', 400, { errors });
  }

  if (err.name === 'CastError') {
    return sendError(res, 'Invalid ID format', 400);
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendError(res, `${field} already exists`, 409);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid or expired token', 401);
  }

  sendError(res, message, statusCode, err);
};

module.exports = errorHandler;
