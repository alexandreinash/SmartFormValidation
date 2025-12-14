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
    
    // Client-side validation
    if (!username || username.trim() === '') {
      setStatus('Username is required.');
      return;
    }
    
    if (!email || email.trim() === '') {
      setStatus('Email is required.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('Please enter a valid email address.');
      return;
    }
    
    if (!password || password.length < 6) {
      setStatus('Password must be at least 6 characters long.');
      return;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      setIsSuccess(false);
      setStatus('Passwords do not match. Please try again.');
      return;
    }
    
    if (!role || (role !== 'admin' && role !== 'user')) {
      setStatus('Please select a valid role.');
      return;
    }
    
    try {
      const user = await register(username, email, password, role);
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
      
      // Log full error for debugging
      console.error('=== Registration Error Debug ===');
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      console.error('Error message:', err.message);
      console.error('==============================');
      
      if (!err.response) {
        setStatus(
          'Cannot reach the API server. Make sure the backend is running on port 5000.'
        );
        return;
      }
      
      const errorData = err.response.data || {};
      const statusCode = err.response.status || 500;
      
      // Handle validation errors (400 status)
      if (statusCode === 400) {
        // Priority 1: Check for message field (our improved backend returns this)
        if (errorData.message && typeof errorData.message === 'string' && errorData.message.trim() !== '') {
          setStatus(errorData.message);
          return;
        }
        
        // Priority 2: Check for errors array (express-validator format)
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const errorMessages = errorData.errors.map((error) => {
            if (error && error.msg) {
              const fieldName = error.param ? error.param.charAt(0).toUpperCase() + error.param.slice(1) : '';
              return fieldName ? `${fieldName}: ${error.msg}` : error.msg;
            }
            return `${error?.param || 'Field'}: Invalid value`;
          }).filter(msg => msg && msg.trim() !== '');
          
          if (errorMessages.length > 0) {
            setStatus(errorMessages.join('. '));
            return;
          }
        }
        
        // Priority 3: Check if success is false (indicates validation failure)
        if (errorData.success === false) {
          setStatus('Please check all fields are filled correctly. Username, email, and password (min 6 characters) are required.');
          return;
        }
      }
      
      // Handle other error statuses
      if (errorData.message && typeof errorData.message === 'string' && errorData.message.trim() !== '') {
        setStatus(errorData.message);
        return;
      }
      
      // Show detailed error for debugging (temporary)
      const debugInfo = JSON.stringify(errorData, null, 2);
      setStatus(`Registration failed. Please check the browser console for details. Status: ${statusCode}`);
      console.error('Unhandled error data:', debugInfo);
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
                <div 
                  className="status" 
                  style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem',
                    borderRadius: '6px',
                    backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
                    color: isSuccess ? '#10b981' : '#ef4444',
                    fontWeight: isSuccess ? '600' : '400',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}
                >
                  {status}
                </div>
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



