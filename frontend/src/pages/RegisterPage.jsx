import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await register(email, password, role);
      setStatus('Registration successful. You may now log in.');
      navigate('/login');
    } catch (err) {
      if (!err.response) {
        setStatus(
          'Cannot reach the API server. Make sure the backend is running on port 4000.'
        );
      } else {
        setStatus(
          err.response.data?.message ||
            'Registration failed. Please check your input.'
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
              <h1 className="auth-hero-title">Get Started</h1>
              <p className="auth-hero-subtitle">
                Create an account to access your dashboard and manage your forms. Create intelligent forms, review submissions, and gain comprehensive insights into your data.
              </p>
            </div>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-card">
            <h2 className="auth-title">Create an account</h2>
            <p className="auth-subtitle">
              Enter your details to create your account
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
              <div className="field-column">
                <label>
                  Role
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="admin">Administrator</option>
                    <option value="user">End-User</option>
                  </select>
                </label>
              </div>
              <button type="submit" className="auth-button">
                Create account
              </button>
              {status && <p className="status" style={{ marginTop: '1rem', color: '#ef4444' }}>{status}</p>}
            </form>
            <div className="auth-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;



