const logger = require('../lib/logger');

/**
 * 404 Not Found handler
 * Must be registered after all routes
 */
function notFoundHandler(req, res) {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path 
  });
}

/**
 * Global error handler
 * Must be registered last (after notFoundHandler)
 */
function errorHandler(err, req, res, next) {
  // Log error details
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
