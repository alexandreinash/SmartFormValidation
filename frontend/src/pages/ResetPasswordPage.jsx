import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import '../css/auth.css';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('Invalid reset link. No token provided.');
        setIsValidating(false);
        return;
      }

      try {
        const res = await api.get(`/api/auth/validate-reset-token/${token}`);
        if (res.data.valid) {
          setIsTokenValid(true);
        } else {
          setStatus('Invalid or expired reset token. Please request a new password reset.');
        }
      } catch (err) {
        setStatus(err.response?.data?.message || 'Invalid or expired reset token. Please request a new password reset.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setIsSuccess(false);

    if (password !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setStatus('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post('/api/auth/reset-password', { token, password });
      setIsSuccess(true);
      setStatus(res.data.message || 'Password has been reset successfully.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { passwordReset: true } });
      }, 2000);
    } catch (err) {
      setIsSuccess(false);
      if (!err.response) {
        setStatus('Cannot reach the API server. Make sure the backend is running on port 5000.');
      } else {
        setStatus(err.response.data?.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="auth-page">
        <div className="auth-layout">
          <div className="auth-hero">
            <div className="auth-hero-banner-top">Smart Form Validator</div>
            <div className="auth-hero-inner">
              <div className="auth-hero-text-block">
                <h1 className="auth-hero-title">Validating</h1>
                <p className="auth-hero-subtitle">
                  Please wait while we validate your reset link...
                </p>
              </div>
            </div>
          </div>
          <div className="auth-form-panel">
            <div className="auth-card">
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#d1d5db' }}>Validating reset token...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="auth-page">
        <div className="auth-layout">
          <div className="auth-hero">
            <div className="auth-hero-banner-top">Smart Form Validator</div>
            <div className="auth-hero-inner">
              <div className="auth-hero-text-block">
                <h1 className="auth-hero-title">Invalid Link</h1>
                <p className="auth-hero-subtitle">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
            </div>
          </div>
          <div className="auth-form-panel">
            <div className="auth-card">
              <h2 className="auth-title">Invalid Reset Link</h2>
              <p className="auth-subtitle" style={{ color: '#ef4444' }}>
                {status || 'This password reset link is invalid or has expired.'}
              </p>
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <Link to="/forgot-password" className="auth-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Request New Reset Link
                </Link>
                <div style={{ marginTop: '1rem' }}>
                  <Link to="/login" className="auth-link-muted">
                    ← Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-hero">
          <div className="auth-hero-banner-top">Smart Form Validator</div>
          <div className="auth-hero-inner">
            <div className="auth-hero-text-block">
              <h1 className="auth-hero-title">New Password</h1>
              <p className="auth-hero-subtitle">
                Create a strong password to secure your account. Make sure it's at least 6 characters long.
              </p>
            </div>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-card">
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">
              Enter your new password below.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="field-column">
                <label>
                  New Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </label>
              </div>
              <div className="field-column">
                <label>
                  Confirm Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </label>
              </div>
              <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              {status && (
                <p 
                  className="status" 
                  style={{ 
                    marginTop: '1rem', 
                    color: isSuccess ? '#10b981' : '#ef4444',
                    fontWeight: isSuccess ? '600' : '400',
                    fontSize: '0.85rem'
                  }}
                >
                  {status}
                </p>
              )}
            </form>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link to="/login" className="auth-link-muted">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;

