/**
 * client/src/api/axiosInstance.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AXIOS INSTANCE — Configured HTTP client for AasaMedChem API (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
