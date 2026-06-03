/**
 * server/src/routes/auth.js
 * Auth routes: login, register, get current user
 */
import { Router } from 'express';
import { login, register, logout, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/login
router.post('/login', authLimiter, login);

// POST /api/auth/register
router.post('/register', authLimiter, register);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

export default router;
