/**
 * client/src/pages/auth/LoginPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTHENTICATION PAGE — Login & Seller Signup
 * Matches modern purple theme and provides forms for both options.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Key, AlertCircle, Loader2, User, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const LoginPage = () => {
  const { user, login, register: signUp } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Field validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/seller/products');
      }
    }
  }, [user, navigate]);

  // Client side validation
  const validateName = (val) => {
    if (!val) {
      return 'Name is required.';
    }
    if (val.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }
    return '';
  };

  const validateEmail = (val) => {
    if (!val) {
      return 'Email address is required.';
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const validatePassword = (val) => {
    if (!val) {
      return 'Password is required.';
    }
    if (val.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return '';
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    setNameError(validateName(name));
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    setPasswordError(validatePassword(password));
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setEmail('');
    setPassword('');
    setName('');
    setEmailError('');
    setPasswordError('');
    setNameError('');
    setApiError(null);
    setTouched({ name: false, email: false, password: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister) {
      setTouched({ name: true, email: true, password: true });
      const nErr = validateName(name);
      const eErr = validateEmail(email);
      const pErr = validatePassword(password);

      if (nErr || eErr || pErr) {
        setNameError(nErr);
        setEmailError(eErr);
        setPasswordError(pErr);
        return;
      }

      setApiError(null);
      setIsLoading(true);

      try {
        await signUp(name.trim(), email.trim(), password);
      } catch (err) {
        console.error('[Register] Submission error:', err);
        setApiError(err.response?.data?.message ?? 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setTouched({ name: false, email: true, password: true });
      const eErr = validateEmail(email);
      const pErr = validatePassword(password);

      if (eErr || pErr) {
        setEmailError(eErr);
        setPasswordError(pErr);
        return;
      }

      setApiError(null);
      setIsLoading(true);

      try {
        await login(email.trim(), password);
      } catch (err) {
        console.error('[Login] Submission error:', err);
        if (err.response?.status === 401 || err.response?.data?.message?.toLowerCase().includes('invalid')) {
          setApiError('Invalid email or password');
        } else {
          setApiError(err.response?.data?.message ?? 'Network error. Is the server running?');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fillCredentials = (eMail, pass) => {
    setIsRegister(false);
    setEmail(eMail);
    setPassword(pass);
    setEmailError('');
    setPasswordError('');
    setTouched({ name: false, email: false, password: false });
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      {/* Auth Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        {/* Logo block */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-10 h-10 bg-purple-950 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white text-lg font-sans">A</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-3 font-sans">AasaMedChem</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRegister ? 'Create an account' : 'Welcome back'}
          </p>
          <p className="text-xs text-gray-400">
            {isRegister ? 'Sign up as a Seller' : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* API Error message */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-4 animate-fade-in">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <span className="text-red-600 text-sm font-medium">{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (Only visible for Register) */}
          {isRegister && (
            <div className="animate-slide-down">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) setNameError(validateName(e.target.value));
                  }}
                  onBlur={handleNameBlur}
                  placeholder="Enter your name"
                  disabled={isLoading}
                  className={`border rounded-lg pl-9 pr-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 ${
                    nameError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                      : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                  } transition-colors`}
                />
              </div>
              {nameError && (
                <p className="text-xs text-red-500 mt-1 font-medium">{nameError}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-gray-400" />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) setEmailError(validateEmail(e.target.value));
                }}
                onBlur={handleEmailBlur}
                placeholder="you@example.com"
                disabled={isLoading}
                className={`border rounded-lg pl-9 pr-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 ${
                  emailError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                } transition-colors`}
              />
            </div>
            {emailError && (
              <p className="text-xs text-red-500 mt-1 font-medium">{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) setPasswordError(validatePassword(e.target.value));
                }}
                onBlur={handlePasswordBlur}
                placeholder={isRegister ? "Create a password" : "Enter your password"}
                disabled={isLoading}
                className={`border rounded-lg pl-9 pr-10 py-2.5 w-full text-sm focus:outline-none focus:ring-2 ${
                  passwordError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                } transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-red-500 mt-1 font-medium">{passwordError}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-purple-700 hover:bg-purple-800 text-white w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isRegister ? 'Registering...' : 'Signing in...'}</span>
              </>
            ) : (
              <>
                {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
                <span>{isRegister ? 'Register as Seller' : 'Log in'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="mt-4 text-center">
          <button
            onClick={toggleMode}
            disabled={isLoading}
            className="text-sm font-semibold text-purple-700 hover:text-purple-900 transition-colors focus:outline-none"
          >
            {isRegister
              ? 'Already have an account? Log in'
              : 'New seller? Create a seller account'}
          </button>
        </div>

        {/* Test Credentials Box (Only on Login view) */}
        {!isRegister && (
          <div className="mt-6 bg-gray-50 border border-gray-100 rounded-lg p-4 animate-fade-in">
            <div className="flex items-center gap-1.5 mb-3">
              <Key size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Test Credentials
              </span>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => fillCredentials('admin@aasa.com', 'Admin@123')}
                type="button"
                className="flex w-full items-center justify-between text-left group hover:bg-white p-1 rounded transition-colors w-full"
              >
                <span className="text-xs text-gray-400 group-hover:text-purple-700 transition-colors">Admin</span>
                <span className="text-xs text-gray-600 font-mono">admin@aasa.com / Admin@123</span>
              </button>
              <button
                onClick={() => fillCredentials('seller@aasa.com', 'Seller@123')}
                type="button"
                className="flex w-full items-center justify-between text-left group hover:bg-white p-1 rounded transition-colors w-full"
              >
                <span className="text-xs text-gray-400 group-hover:text-purple-700 transition-colors">Seller</span>
                <span className="text-xs text-gray-600 font-mono">seller@aasa.com / Seller@123</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-gray-400 text-xs mt-6">© 2025 AasaMedChem. All rights reserved.</p>
    </div>
  );
};

export default LoginPage;
