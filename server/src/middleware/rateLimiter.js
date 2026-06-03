/**
 * server/src/middleware/rateLimiter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * RATE LIMITING MIDDLEWARE
 * ─────────────────────────────────────────────────────────────────────────────
 */

import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter: limit each IP to 200 requests per 15 minutes.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Auth rate limiter: limit each IP to 10 requests per 15 minutes for authentication.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
});
