const rateLimit = require('express-rate-limit');

// Strict rate limit for authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Rate limit for password changes
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password changes per hour
  message: { message: 'Too many password change attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limit (more permissive)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for message submissions
const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 messages per hour
  message: { message: 'Too many messages submitted, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for view tracking (prevent spam)
const viewLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 view requests per 5 minutes
  message: { message: 'Too many view requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  message: { message: 'Too many upload requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  passwordChangeLimiter,
  apiLimiter,
  messageLimiter,
  viewLimiter,
  uploadLimiter,
};
