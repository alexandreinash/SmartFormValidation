import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../css/GoogleSignInNotification.css';

function GoogleSignInNotification() {
  const { user } = useAuth();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [isLogout, setIsLogout] = useState(false);

  useEffect(() => {
    // Note: Logout notifications are now handled directly on each page, not here

    // Check if user just logged in via Google (only check Google flag, not generic state)
    const justLoggedInGoogle = localStorage.getItem('sfv_google_just_logged_in');
    
    if (justLoggedInGoogle === 'true' && user) {
      setIsLogout(false);
      setShow(true);
      // Remove the flag after showing
      localStorage.removeItem('sfv_google_just_logged_in');
      
      // Auto-hide after animation completes (0.8 seconds)
      const timer = setTimeout(() => {
        setShow(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [user, location.state]);

  if (!show) {
    return null;
  }

  return (
    <div className={`google-signin-notification ${isLogout ? 'logout-notification' : ''}`}>
      <div className="google-signin-notification-content">
        <div className="google-signin-notification-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="google-signin-notification-text">
          {isLogout 
            ? 'You have successfully been logged out.' 
            : user?.role === 'admin'
              ? `Signed in with your approved Google account as an Admin - ${user?.email || ''}`
              : `Signed in with your approved Google account as a User - ${user?.email || ''}`
          }
        </div>
      </div>
    </div>
  );
}

export default GoogleSignInNotification;

