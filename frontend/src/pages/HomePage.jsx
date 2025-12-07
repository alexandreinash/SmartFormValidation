import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../css/HomePage.css';

function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);

  useEffect(() => {
    // Show welcome message if user just logged in
    if (location.state?.justLoggedIn && user) {
      setShowWelcomeMessage(true);
      // Hide message after 1 second
      const timer = setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.state, user]);

  const handleStartNow = () => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user/forms');
      }
    } else {
      navigate('/register');
    }
  };

  const handleLogout = () => {
    setShowLogoutMessage(true);
    logout();
    // Wait 0.5 seconds before navigating
    setTimeout(() => {
      navigate('/login', { state: { justLoggedOut: true }, replace: true });
    }, 500);
  };

  return (
    <div className="homepage-container">
      {/* Smart Form Validator Logo */}
      <div className="homepage-logo">Smart Form Validator</div>

      {/* Logout Button */}
      <button
        type="button"
        className="homepage-logout-button"
        onClick={handleLogout}
        disabled={!user}
      >
        Log out
      </button>

      {/* Box on Right Side */}
      <div className="homepage-right-box">
        {/* Abstract Graphics on Right Side */}
        <div className="homepage-graphics">
          {/* Glowing Blue Card with Form Validation */}
          <div className="homepage-validation-card">
            <div className="homepage-validation-item">
              <div className="homepage-checkmark-circle">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="homepage-validation-line"></div>
            </div>
            <div className="homepage-validation-item">
              <div className="homepage-checkmark-circle">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="homepage-validation-line"></div>
            </div>
            <div className="homepage-validation-item">
              <div className="homepage-checkmark-circle">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="homepage-validation-line"></div>
            </div>
            <div className="homepage-validation-item">
              <div className="homepage-checkmark-circle">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="homepage-validation-line"></div>
            </div>
          </div>

          {/* Dark Card Below */}
          <div className="homepage-dark-card"></div>

          {/* Document Icon with Magnifying Glass */}
          <div className="homepage-document-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="8" y="6" width="20" height="26" rx="2" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" fill="none"/>
              <circle cx="28" cy="12" r="6" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" fill="none"/>
              <line x1="31" y1="15" x2="34" y2="18" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Connecting Lines and Dots */}
          <div className="homepage-connecting-line homepage-line-1"></div>
          <div className="homepage-connecting-line homepage-line-2"></div>
          <div className="homepage-connecting-line homepage-line-3"></div>
          <div className="homepage-connecting-dot homepage-dot-1"></div>
          <div className="homepage-connecting-dot homepage-dot-2"></div>
          <div className="homepage-connecting-dot homepage-dot-3"></div>
          <div className="homepage-connecting-dot homepage-dot-4"></div>

          {/* Vertical White Bar */}
          <div className="homepage-vertical-bar"></div>
        </div>
      </div>

      {/* Welcome Message */}
      {showWelcomeMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          fontWeight: '600',
          animation: 'slideIn 0.3s ease-out'
        }}>
          ✓ You have successfully logged in!
        </div>
      )}

      {/* Logout Message */}
      {showLogoutMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          fontWeight: '600',
          animation: 'slideIn 0.3s ease-out'
        }}>
          ✓ You have successfully logged out! Redirecting...
        </div>
      )}

      {/* Main Content */}
      <div className="homepage-content">
        <h1 className="homepage-title">
          <span className="homepage-title-yellow">Discover Your</span>{' '}
          <span className="homepage-title-white">Dream Form</span>
        </h1>
        <p className="homepage-description">
          Explore our powerful AI-powered form validation system. Create intelligent forms, manage submissions, and gain comprehensive insights into your data effortlessly.
        </p>
        <div className="homepage-buttons">
          <button
            type="button"
            className="homepage-start-button homepage-button-primary"
            onClick={handleStartNow}
          >
            Start Now &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
