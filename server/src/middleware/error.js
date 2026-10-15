const { isProd } = require('../config/env');
const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// Convert known library errors into AppErrors.
const normalizeError = (err) => {
  if (err.isOperational) return err;
  if (err.code === 11000) return new AppError('Email is already registered', 409);
  if (err.name === 'ValidationError') return new AppError('Validation failed', 400);
  if (err.type === 'entity.parse.failed') return new AppError('Invalid JSON body', 400);
  return err;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && isProd ? 'Internal server error' : error.message,
    ...(error.errors && { errors: error.errors }),
  });
};

module.exports = { notFound, errorHandler };
