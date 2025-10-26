/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging (always log to console)
  console.error('=== Error Details ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Code:', err.code);
  console.error('===================');

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;

  // Handle known errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = err.message;
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.message && err.message.includes('External data source unavailable')) {
    statusCode = 503;
    message = err.message;
  } else if (err.code && err.code.startsWith('ER_')) {
    // MySQL errors
    statusCode = 500;
    message = 'Database error occurred';
    // Only expose specific error details in development
    if (process.env.NODE_ENV === 'development') {
      details = err.message;
    }
  } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Build error response
  const response = {
    error: message
  };

  // Add details if available
  if (details) {
    response.details = details;
  }

  // Only include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.errorCode = err.code;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found'
  });
}

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler
};
