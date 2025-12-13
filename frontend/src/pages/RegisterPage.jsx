import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [status, setStatus] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setIsSuccess(false);
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      setIsSuccess(false);
      setStatus('Passwords do not match. Please try again.');
      return;
    }
    
    try {
      const user = await register(email, password, role);
      setIsSuccess(true);
      setStatus('Registration successful! Redirecting...');
      // Wait 0.5 seconds before navigating to appropriate dashboard
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user/forms');
        }
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
                  Username
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                  />
                </label>
              </div>
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
              <div className="field-column">
                <label>
                  Confirm Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
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
              {status && (
                <p 
                  className="status" 
                  style={{ 
                    marginTop: '1rem', 
                    color: isSuccess ? '#10b981' : '#ef4444',
                    fontWeight: isSuccess ? '600' : '400'
                  }}
                >
                  {status}
                </p>
              )}
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



