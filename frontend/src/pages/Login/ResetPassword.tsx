// src/pages/Login/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Login.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setError('No reset token provided');
      setIsValidating(false);
    }
  }, [searchParams]);

  const validateToken = async (tokenParam: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/validate-reset-token?token=${encodeURIComponent(tokenParam)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid or expired token');
      }

      setTokenValid(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired reset token');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess('Password reset successfully! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginContainer}>
          <div className={styles.loginFormContainer} style={{ textAlign: 'center', padding: '40px' }}>
            <div className={styles.spinner}></div>
            <p style={{ marginTop: '16px' }}>Validating reset token...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <h2>Create New Password</h2>
            <p>Enter your new password below</p>
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

          {tokenValid && !success && (
            <form onSubmit={handleSubmit} className={styles.loginForm}>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">New Password</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={isLoading}
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
                <p className={styles.passwordHint}>Must be at least 6 characters</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className={styles.loadingSpinner}>
                    <span className={styles.spinner}></span>
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {!tokenValid && !success && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#dc3545' }}>{error || 'Invalid or expired reset token'}</p>
              <Link to="/forgot-password" className={styles.link}>
                Request a new reset link
              </Link>
            </div>
          )}

          <div className={styles.registerLink}>
            <p>
              <Link to="/" className={styles.link}>
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

export default ResetPassword;