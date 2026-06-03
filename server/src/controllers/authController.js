/**
 * server/src/controllers/authController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTH CONTROLLER — MongoDB / Mongoose version (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../config/models.js';

// ── Helper: sign a JWT ────────────────────────────────────────────────────────
function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload = {
    id:    user._id.toString(),
    email: user.email,
    role:  user.role,
    name:  user.name,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id:    user._id.toString(),
          name:  user.name,
          email: user.email,
          role:  user.role,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await new User({
      name:         name.trim(),
      email:        email.toLowerCase().trim(),
      passwordHash,
      role:         'seller',
    }).save();

    const token = signToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id:    newUser._id.toString(),
          name:  newUser.name,
          email: newUser.email,
          role:  newUser.role,
        },
      },
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }
    console.error('[Auth] Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export async function getMe(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id:        user._id.toString(),
        name:      user.name,
        email:     user.email,
        role:      user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth] getMe error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
