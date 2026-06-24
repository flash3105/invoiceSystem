// src/pages/Login/ForgotPassword.tsx
import React, { useState } from 'react';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Login.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess('If an account with this email exists, a password reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
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

        <div className={styles.loginFormContainer}>
          <div className={styles.loginFormHeader}>
            <h2>Reset Password</h2>
            <p>Enter your email to receive a reset link</p>
          </div>

          {error && (
            <div className={styles.loginErrorAlert}>
              <AlertCircle className={styles.alertIcon} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.loginSuccessAlert}>
              <CheckCircle className={styles.alertIcon} />
              <span>{success}</span>
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
                  disabled={isLoading || !!success}
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading || !!success}
            >
              {isLoading ? (
                <span className={styles.loadingSpinner}>
                  <span className={styles.spinner}></span>
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className={styles.registerLink}>
            <p>
              <Link to="/login" className={styles.link}>
                <ArrowLeft size={16} />
                Back to Login
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

export default ForgotPassword;