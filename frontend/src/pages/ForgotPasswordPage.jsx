import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import '../css/auth.css';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Set loading state FIRST for instant visual feedback
    setIsLoading(true);
    setIsAnimating(true);
    setStatus('');
    setResetUrl('');
    setIsSuccess(false);

    try {
      // Start API call and animation timer in parallel
      const [res] = await Promise.all([
        api.post('/api/auth/forgot-password', { email }),
        new Promise(resolve => setTimeout(resolve, 300)) // Ensure 0.3s animation plays
      ]);
      
      setIsSuccess(true);
      const message = res.data.message || 'Password reset link has been sent to your email.';
      setStatus(message);
      
      // Store reset URL if provided (for development/testing)
      if (res.data.resetUrl) {
        setResetUrl(res.data.resetUrl);
      }
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
              <h1 className="auth-hero-title">Forgot Password</h1>
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
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 1rem',
                    backgroundColor: isSuccess ? '#d1fae5' : '#fee2e2',
                    border: `2px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
                    borderRadius: '8px',
                    marginBottom: isSuccess && resetUrl ? '1rem' : '0',
                    boxShadow: isSuccess 
                      ? '0 2px 4px rgba(16, 185, 129, 0.1)' 
                      : '0 2px 4px rgba(239, 68, 68, 0.1)'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {isSuccess ? '✓' : '⚠️'}
                    </span>
                    <p 
                      style={{ 
                        color: isSuccess ? '#065f46' : '#991b1b',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        margin: 0
                      }}
                    >
                      {status}
                    </p>
                  </div>
                  {isSuccess && !resetUrl && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem', 
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      border: '2px solid #bae6fd', 
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      color: '#0369a1',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontSize: '1.1rem' }}>💡</span>
                        <span>Tips:</span>
                      </div>
                      <ul style={{ 
                        margin: '0.5rem 0 0 1.25rem', 
                        padding: 0,
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        <li style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                          <span style={{ color: '#0ea5e9' }}>•</span>
                          <span>Check your spam/junk folder</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                          <span style={{ color: '#0ea5e9' }}>•</span>
                          <span>The email may take a few minutes to arrive</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                          <span style={{ color: '#0ea5e9' }}>•</span>
                          <span>Check your backend server console for the reset link</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
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

