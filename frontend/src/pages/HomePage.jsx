import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../css/HomePage.css';

function HomePage() {
  const { user } = useAuth();
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

  return (
    <div className="homepage-container">
      {/* Smart Form Validator Banner */}
      <div className="homepage-banner">Smart Form Validator</div>

      {/* Abstract Graphics in Upper Right */}
      <div className="homepage-graphics">
        <div className="homepage-cube"></div>
        <div className="homepage-cube"></div>
        <div className="homepage-cube"></div>
        <div className="homepage-line"></div>
        <div className="homepage-line"></div>
        <div className="homepage-dot"></div>
        <div className="homepage-dot"></div>
        <div className="homepage-dot"></div>
      </div>

      {/* Main Content */}
      <div className="homepage-content">
        <h1 className="homepage-title">Discover Your Dream Form</h1>
        <p className="homepage-description">
          Explore our powerful AI-powered form validation system. Create intelligent forms, manage submissions, and gain comprehensive insights into your data effortlessly.
        </p>
        <button
          type="button"
          className="homepage-start-button"
          onClick={handleStartNow}
        >
          Start Now
        </button>
      </div>
    </div>
  );
}

export default HomePage;
