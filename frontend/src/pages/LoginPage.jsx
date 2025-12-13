import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../AuthContext';
import api from '../api';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLogout, setIsLogout] = useState(false);

  useEffect(() => {
    // Load remembered credentials if they exist
    const rememberedEmail = localStorage.getItem('sfv_remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    // Show success message if user just registered
    if (location.state?.justRegistered) {
      setIsSuccess(true);
      setStatus('Registration successful! You can now log in.');
      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setStatus('');
        setIsSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    // Show success message if user just logged out
    if (location.state?.justLoggedOut) {
      setIsLogout(true);
      setStatus('You have successfully logged out!');
      // Clear the message after 1 second
      const timer = setTimeout(() => {
        setStatus('');
        setIsLogout(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setIsSuccess(false);
    try {
      const user = await login(email, password);
      
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('sfv_remembered_email', email);
      } else {
        localStorage.removeItem('sfv_remembered_email');
      }
      
      setIsSuccess(true);
      setStatus('Login successful! Redirecting...');
      // Wait 0.5 seconds before navigating
      setTimeout(() => {
        navigate('/', { state: { justLoggedIn: true } });
      }, 500);
    } catch (err) {
      setIsSuccess(false);
      if (!err.response) {
        setStatus(
          'Cannot reach the API server. Make sure the backend is running on port 5000.'
        );
      } else {
        setStatus(
          err.response.data?.message ||
            'Login failed. Please check your email and password.'
        );
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setStatus('');
      setIsSuccess(false);
      
      const response = await api.post('/api/auth/google-login', {
        credential: credentialResponse.credential
      });
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('sfv_token', response.data.data.token);
        localStorage.setItem('sfv_user', JSON.stringify(response.data.data.user));
        
        setIsSuccess(true);
        setStatus('Google login successful! Redirecting...');
        
        // Wait 0.5 seconds before navigating
        setTimeout(() => {
          navigate('/', { state: { justLoggedIn: true } });
          window.location.reload(); // Refresh to update auth context
        }, 500);
      }
    } catch (err) {
      setIsSuccess(false);
      if (!err.response) {
        setStatus(
          'Cannot reach the API server. Make sure the backend is running on port 5000.'
        );
      } else {
        setStatus(
          err.response.data?.message || 'Google login failed. Please try again.'
        );
      }
    }
  };

  const handleGoogleError = () => {
    setIsSuccess(false);
    setStatus('Google login failed. Please try again.');
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-hero">
          <div className="auth-hero-banner-top">Smart Form Validator</div>
          <div className="auth-hero-inner">
            <div className="auth-hero-text-block">
              <h1 className="auth-hero-title">Welcome Back</h1>
              <p className="auth-hero-subtitle">
                Log in to access your dashboard and manage your forms. Create intelligent forms, review submissions, and gain comprehensive insights into your data.
              </p>
            </div>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-card">
            <h2 className="auth-title">Login</h2>
            <p className="auth-subtitle">
              Enter your credentials to access your account
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
                  />
                </label>
              </div>
              <div className="field-column">
                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </label>
              </div>
              <div className="auth-remember-row">
                <label className="checkbox">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="#" className="auth-link-muted">Forgot Password?</Link>
              </div>
              <button type="submit" className="auth-button">
                Login
              </button>
              {status && (
                <p 
                  className="status" 
                  style={{ 
                    marginTop: '1rem', 
                    color: isLogout ? '#ef4444' : (isSuccess ? '#10b981' : '#ef4444'),
                    fontWeight: (isSuccess || isLogout) ? '600' : '400'
                  }}
                >
                  {status}
                </p>
              )}
            </form>
            <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '0', 
                right: '0', 
                height: '1px', 
                backgroundColor: '#334155',
                zIndex: 0
              }}></div>
              <span style={{ 
                position: 'relative', 
                padding: '0 1rem', 
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                zIndex: 1,
                color: '#94a3b8',
                fontSize: '0.875rem'
              }}>
                OR
              </span>
            </div>
            <div style={{ display: 'none' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
              />
            </div>
            <button 
              type="button" 
              className="auth-button google-signin-button"
              onClick={() => {
                // Trigger the hidden Google button
                const googleButton = document.querySelector('[role="button"][aria-labelledby]');
                if (googleButton) {
                  googleButton.click();
                } else {
                  // Fallback: manually initialize Google Sign-In
                  window.google?.accounts.id.prompt();
                }
              }}
              style={{
                background: '#4285f4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                marginTop: '0'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10.2V12.05H15.5818C15.3273 13.3 14.5636 14.3591 13.4273 15.0682V17.5773H16.7364C18.7091 15.7682 19.8 13.2318 19.8 10.2273Z" fill="#4285F4"/>
                <path d="M10.2 20C12.9 20 15.1727 19.1045 16.7364 17.5773L13.4273 15.0682C12.4636 15.6682 11.2364 16.0227 10.2 16.0227C7.59091 16.0227 5.37273 14.2 4.50909 11.8H1.09091V14.3909C2.64545 17.4864 6.19091 20 10.2 20Z" fill="#34A853"/>
                <path d="M4.50909 11.8C4.29091 11.2 4.16364 10.5591 4.16364 9.90909C4.16364 9.25909 4.29091 8.61818 4.50909 8.01818V5.42727H1.09091C0.390909 6.81818 0 8.40909 0 10C0 11.5909 0.390909 13.1818 1.09091 14.5727L4.50909 11.8Z" fill="#FBBC05"/>
                <path d="M10.2 3.97727C11.3364 3.97727 12.3545 4.35909 13.1545 5.12727L16.0636 2.21818C15.1636 1.38182 12.9 0 10.2 0C6.19091 0 2.64545 2.51364 1.09091 5.60909L4.50909 8.2C5.37273 5.78182 7.59091 3.97727 10.2 3.97727Z" fill="#EA4335"/>
              </svg>
              Sign in to Google
            </button>
            <div className="auth-footer">
              Don&apos;t have an account? <Link to="/register">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;



