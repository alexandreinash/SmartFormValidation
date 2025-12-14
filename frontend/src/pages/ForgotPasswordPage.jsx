import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import '../css/auth.css';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Set loading state FIRST for instant visual feedback
    setIsLoading(true);
    setIsAnimating(true);
    setStatus('');
    setIsSuccess(false);

    try {
      // Start API call and animation timer in parallel
      const [res] = await Promise.all([
        api.post('/api/auth/forgot-password', { email }),
        new Promise(resolve => setTimeout(resolve, 300)) // Ensure 0.3s animation plays
      ]);
      
      setIsSuccess(true);
      setStatus(res.data.message || 'Password reset link has been sent to your email.');
    } catch (err) {
      setIsSuccess(false);
      if (!err.response) {
        setStatus('Cannot reach the API server. Make sure the backend is running on port 5000.');
      } else {
        setStatus(err.response.data?.message || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      // Wait a bit more to ensure animation completes smoothly
      setTimeout(() => {
        setIsLoading(false);
        setIsAnimating(false);
      }, 50);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-hero">
          <div className="auth-hero-banner-top">Smart Form Validator</div>
          <div className="auth-hero-inner">
            <div className="auth-hero-text-block">
              <h1 className="auth-hero-title">Reset Password</h1>
              <p className="auth-hero-subtitle">
                Forgot your password? No worries! Enter your email address and we'll send you a secure link to reset it.
              </p>
            </div>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-card">
            <h2 className="auth-title">Forgot Password?</h2>
            <p className="auth-subtitle">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="field-column">
                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </label>
              </div>
              <button 
                type="submit" 
                className={`auth-button ${isAnimating ? 'sending-animation' : ''} ${isSuccess ? 'success-animation' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : isSuccess ? '✓ Sent!' : 'Send Reset Link'}
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

export default ForgotPasswordPage;

