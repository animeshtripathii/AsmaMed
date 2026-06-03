/**
 * client/src/api/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTH API FUNCTIONS (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import api from './axiosInstance';

/**
 * POST /api/auth/login
 * Returns a JWT token and user info on success.
 */
export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data;
}

/**
 * POST /api/auth/register
 * Creates a new seller account and returns token + user.
 */
export async function register(data) {
  const res = await api.post('/auth/register', data);
  return res.data.data;
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data.data;
}

/**
 * POST /api/auth/logout
 * Clears the session cookie on the backend.
 */
export async function logout() {
  await api.post('/auth/logout');
}
