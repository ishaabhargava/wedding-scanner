import rateLimit from 'express-rate-limit';

// Rate limiter for guest photo uploads
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 upload batches per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many upload attempts from this network. Please wait a few moments and try again.',
  },
});

// Rate limiter for admin login to prevent brute force
export const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Max 15 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. For security, please wait 15 minutes before trying again.',
  },
});

// General public API limiter
export const publicApiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
});
