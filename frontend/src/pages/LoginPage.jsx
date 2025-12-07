import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLogout, setIsLogout] = useState(false);

  useEffect(() => {
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
                    placeholder="drei2@gmail.com"
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
                    placeholder="••••••"
                    required
                  />
                </label>
              </div>
              <div className="auth-remember-row">
                <label className="checkbox">
                  <input type="checkbox" />
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



