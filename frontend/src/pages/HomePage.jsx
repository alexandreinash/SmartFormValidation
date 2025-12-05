import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../css/HomePage.css';

function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleStartNow = () => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/forms');
      }
    } else {
      navigate('/register');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="homepage-container">
      {/* Smart Form Validator Logo */}
      <div className="homepage-logo">Smart Form Validator</div>

      {/* Logout Button */}
      {user && (
        <button
          type="button"
          className="homepage-logout-button"
          onClick={handleLogout}
        >
          Log out
        </button>
      )}

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
