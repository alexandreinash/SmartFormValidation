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
      await login(email, password);
      navigate('/admin');
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
      <div className="auth-card">
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">
          Sign in to manage smart forms, review submissions, and AI validation.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field-column">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
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
                placeholder="••••••••"
                required
              />
            </label>
          </div>
          <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>
            Log in
          </button>
          {status && <p className="status">{status}</p>}
        </form>
        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;



