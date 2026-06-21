// src/pages/Login/Login.tsx
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css';

// API base URL - change this to your actual API endpoint
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface LoginResponse {
  token?: string;
  email?: string;
  expiresAt?: string;
  message?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.token) {
        // Store token based on remember me preference
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('auth_token', data.token);
        storage.setItem('user_email', data.email || email);
        
        // Store expiration if provided
        if (data.expiresAt) {
          storage.setItem('token_expires_at', data.expiresAt);
        }

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        {/* Logo */}
        <div className={styles.logoWrapper}>
          <img 
            src="/logo.png" 
            alt="Business Logo" 
            className={styles.logo}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Login Form */}
        <div className={styles.loginFormContainer}>
          <div className={styles.loginFormHeader}>
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className={styles.loginErrorAlert}>
              <AlertCircle className={styles.alertIcon} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className={styles.loginOptions}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className={styles.forgotPassword}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.loadingSpinner}>
                  <span className={styles.spinner}></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className={styles.registerLink}>
            <p>
              Don't have an account?{' '}
              <Link to="/register" className={styles.link}>
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className={styles.loginFooter}>
        <p>© {new Date().getFullYear()} Invoice System. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;