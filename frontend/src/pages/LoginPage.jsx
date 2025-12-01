import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/forms');
      }
    } catch (err) {
      if (!err.response) {
        setStatus(
          'Cannot reach the API server. Make sure the backend is running on port 4000.'
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
          <div className="auth-hero-inner">
            <div className="auth-hero-logo">SF</div>
            <div className="auth-hero-text-block">
              <h1 className="auth-hero-title">
                Smart validations,<br />
                better submissions.
              </h1>
              <p className="auth-hero-subtitle">
                Capture higher quality responses with AI-assisted checks for every important field.
              </p>
            </div>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-card">
            <h2 className="auth-title">Login</h2>
            <p className="auth-subtitle">
              Already have an account? Enter your details to access the admin dashboard.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="field-column">
                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="drei2i@gmail.com"
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
                <Link to="#" className="auth-link-muted">Forgot your password?</Link>
              </div>
              <button type="submit" className="auth-button">
                Login
              </button>
              {status && <p className="status" style={{ marginTop: '1rem', color: '#ef4444' }}>{status}</p>}
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



