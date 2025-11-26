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
      <div className="auth-card">
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-subtitle">
          Set up an administrator or end-user account for Smart Form Validator.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field-column">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                placeholder="Choose a secure password"
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
          <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>
            Register
          </button>
          {status && <p className="status">{status}</p>}
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;



