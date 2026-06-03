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
  const [token,     setToken]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);

    authApi
      .getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { token: newToken, user: userData } = await authApi.login(email, password);

      localStorage.setItem('token', newToken);

      setToken(newToken);
      setUser(userData);

      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/seller/products');
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = {
    user,
    token,
    isLoading,
    login,
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
