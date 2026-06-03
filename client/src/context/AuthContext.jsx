/**
 * client/src/context/AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTH CONTEXT (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '@/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in by calling /me. Browser sends cookie automatically.
    authApi
      .getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(
    async (email, password) => {
      // Cookie is set automatically in backend response
      const { user: userData } = await authApi.login(email, password);
      setUser(userData);

      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/seller/products');
      }
    },
    [navigate]
  );

  const register = useCallback(
    async (name, email, password) => {
      // Cookie is set automatically in backend response
      const { user: userData } = await authApi.register({ name, email, password });
      setUser(userData);

      navigate('/seller/products');
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    try {
      // Clear cookie on backend
      await authApi.logout();
    } catch (err) {
      console.error('[AuthContext] Logout failed:', err);
    } finally {
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth() must be called inside an <AuthProvider>');
  }

  return context;
}
