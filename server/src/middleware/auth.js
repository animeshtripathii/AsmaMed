/**
 * server/src/middleware/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * JWT AUTHENTICATION MIDDLEWARE (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import jwt from 'jsonwebtoken';

/**
 * Validates a JWT Bearer token from the Authorization header.
 * Attaches the decoded payload to req.user on success.
 */
export function authenticate(req, res, next) {
  try {
    let token = req.cookies?.token;

    // Fallback to Bearer token in Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
      return;
    }

    console.error('[Auth Middleware] Unexpected error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
}

/**
 * Creates a middleware that enforces role-based access control.
 * MUST be placed AFTER authenticate in the middleware chain.
 */
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
