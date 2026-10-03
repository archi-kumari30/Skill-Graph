const { AppError } = require('../utils/customErrors');

const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log programming errors in dev/prod
  if (process.env.NODE_ENV !== 'test' && !err.isOperational) {
    console.error('CRITICAL ERROR:', err);
  }

  // 1. Mongoose Cast Error (invalid ObjectId)
  if (err.name === 'CastError' || err.kind === 'ObjectId') {
    const message = `Invalid ID format for path: ${err.path}`;
    error = new AppError(message, 400);
  }

  // 2. Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    const message = `Duplicate value for field(s): ${fields}. Please use another value!`;
    error = new AppError(message, 409);
  }

  // 3. Validation Error (Mongoose or custom declarative validation)
  if (err.name === 'ValidationError') {
    let messages = [];
    if (Array.isArray(err.errors)) {
      messages = err.errors.map(el => (typeof el === 'string' ? el : el.message || el.field));
    } else if (err.errors && typeof err.errors === 'object') {
      messages = Object.values(err.errors).map(el => el.message || el);
    }
    const message = messages.length > 0 ? `Validation failed: ${messages.join('. ')}` : (err.message || 'Validation failed');
    error = new AppError(message, 400);
    if (err.errors) {
      error.details = err.errors;
    }
  }

  // 4. JWT JsonWebTokenError
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token. Please log in again!', 401);
  }

  // 5. JWT TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your authentication token has expired. Please log in again!', 401);
  }

  const statusCode = error.statusCode || 500;
  const responseMessage = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message: responseMessage,
      ...(error.details || err.details ? { details: error.details || err.details } : {})
    }
  });
};

module.exports = errorMiddleware;
