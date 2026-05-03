import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import GoogleRoleSelectionModal from '../components/GoogleRoleSelectionModal';
import camImage from '../picture/cam.jpg';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '593069010968-07lknp6t8a8vjcpv5n08hv81sf6v6iir.apps.googleusercontent.com';

function LoginPage() {
  const { user, authReady, syncUserFromStorage } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState(null);
  const googleScriptLoaded = useRef(false);

  const handleGoogleCredentialResponse = async (credentialResponse) => {
    try {
      setStatus('');
      setIsSuccess(false);

      if (!credentialResponse?.credential) {
        throw new Error('No credential received from Google');
      }

      const response = await api.post('/api/auth/google-login', {
        credential: credentialResponse.credential,
      });

      if (!response.data) {
        throw new Error('No response data from server');
      }

      if (response.data.success && response.data.needsRoleSelection) {
        if (!response.data.sessionToken || !response.data.email) {
          throw new Error('Missing session token or email in response');
        }

        setPendingGoogleData({
          sessionToken: response.data.sessionToken,
          email: response.data.email,
        });
        setShowRoleSelection(true);
        return;
      }

      if (!response.data.success || !response.data?.data?.token || !response.data?.data?.user) {
        throw new Error('Invalid response from server');
      }

      const { token, user: authenticatedUser } = response.data.data;

      localStorage.setItem('sfv_token', token);
      localStorage.setItem('sfv_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('sfv_google_just_logged_in', 'true');

      if (typeof syncUserFromStorage === 'function') {
        syncUserFromStorage();
      }

      setIsSuccess(true);
      setStatus('Google sign-in successful! Redirecting...');

      setTimeout(() => {
        navigate(authenticatedUser.role === 'admin' ? '/admin' : '/user/forms', { replace: true });
      }, 500);
    } catch (err) {
      setIsSuccess(false);
      console.error('Google login error:', err);
      console.error('Error response:', err.response?.data);

      if (!err.response) {
        setStatus('Cannot reach the API server. Make sure the backend is running on port 5000.');
        return;
      }

      const errorMessage = err.response.data?.message || err.message || 'Google sign-in failed. Please try again.';
      setStatus(errorMessage);

      if (errorMessage.includes('token') || errorMessage.includes('expired') || errorMessage.includes('verification')) {
        setTimeout(() => {
          setStatus('Please try signing in with Google again.');
        }, 3000);
      }
    }
  };

  const initializeGoogleSignIn = () => {
    if (!window.google || !window.google.accounts) {
      return;
    }

    try {
      // Log the client ID being used for debugging
      console.log('[Google Sign-In] Initializing with client ID:', GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 30) + '...' : 'NOT SET');
      
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      
      console.log('[Google Sign-In] Initialized successfully');

      const buttonContainer = document.getElementById('google-signin-button-container');
      if (buttonContainer && buttonContainer.children.length === 0) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%',
          type: 'standard',
        });
      }
    } catch (err) {
      console.error('Error initializing Google Sign-In:', err);
      setStatus('Failed to initialize Google Sign-In. Please refresh the page and try again.');
      setIsSuccess(false);
    }
  };

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/user/forms', { replace: true });
      return;
    }

    localStorage.removeItem('sfv_just_logged_out');

    if (!googleScriptLoaded.current && !window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleScriptLoaded.current = true;
        initializeGoogleSignIn();
      };
      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
        setStatus('Failed to load Google Sign-In. Please refresh the page and try again.');
        setIsSuccess(false);
      };
      document.head.appendChild(script);
    } else if (window.google) {
      initializeGoogleSignIn();
    }
  }, [authReady, navigate, user]);

  const handleGoogleSignInClick = () => {
    if (!window.google || !window.google.accounts) {
      setStatus('Google Sign-In is not loaded. Please refresh the page.');
      setIsSuccess(false);
      return;
    }

    try {
      const buttonContainer = document.getElementById('google-signin-button-container');

      if (buttonContainer) {
        buttonContainer.innerHTML = '';
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%',
          type: 'standard',
        });

        setTimeout(() => {
          const googleButton = buttonContainer.querySelector('div[role="button"]');
          if (googleButton) {
            googleButton.click();
          } else {
            window.google.accounts.id.prompt();
          }
        }, 100);
      } else {
        window.google.accounts.id.prompt();
      }
    } catch (err) {
      console.error('Error triggering Google Sign-In:', err);
      setStatus('Failed to start Google Sign-In. Please try again.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-picture">
        <img
          src={camImage}
          alt="Background"
          className="auth-background-image"
        />
      </div>

      <div className="auth-layout">
        <div className="auth-hero">
          <div className="auth-hero-banner-top">Smart Form Validator</div>
          <div className="auth-hero-inner">
            <div className="auth-hero-text-block">
              <h1 className="auth-hero-title">University Access</h1>
              <p className="auth-hero-subtitle">
                Sign in with your approved university Google account to access forms, review submissions, and manage your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-card login-page-card">
            <h2 className="auth-title">Google Sign-In Only</h2>
            <p className="auth-subtitle">
              Email/password login, registration, and password reset are disabled.
            </p>

            <div className="field-column" style={{ marginBottom: '1rem' }}>
              <div className="login-page-notice">
                Access is limited to Google accounts approved by your university. If your Google account is not on the allowed domain or allowlist configured by the university, sign-in will be rejected.
              </div>
            </div>

            <div id="google-signin-button-container" style={{ display: 'none' }} />

            <button
              type="button"
              className="auth-button google-signin-button"
              onClick={handleGoogleSignInClick}
              style={{
                background: '#4285f4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                marginTop: '0',
                width: '100%',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10.2V12.05H15.5818C15.3273 13.3 14.5636 14.3591 13.4273 15.0682V17.5773H16.7364C18.7091 15.7682 19.8 13.2318 19.8 10.2273Z" fill="#4285F4"/>
                <path d="M10.2 20C12.9 20 15.1727 19.1045 16.7364 17.5773L13.4273 15.0682C12.4636 15.6682 11.2364 16.0227 10.2 16.0227C7.59091 16.0227 5.37273 14.2 4.50909 11.8H1.09091V14.3909C2.64545 17.4864 6.19091 20 10.2 20Z" fill="#34A853"/>
                <path d="M4.50909 11.8C4.29091 11.2 4.16364 10.5591 4.16364 9.90909C4.16364 9.25909 4.29091 8.61818 4.50909 8.01818V5.42727H1.09091C0.390909 6.81818 0 8.40909 0 10C0 11.5909 0.390909 13.1818 1.09091 14.5727L4.50909 11.8Z" fill="#FBBC05"/>
                <path d="M10.2 3.97727C11.3364 3.97727 12.3545 4.35909 13.1545 5.12727L16.0636 2.21818C15.1636 1.38182 12.9 0 10.2 0C6.19091 0 2.64545 2.51364 1.09091 5.60909L4.50909 8.2C5.37273 5.78182 7.59091 3.97727 10.2 3.97727Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {status && (
              <p
                className="status"
                style={{
                  marginTop: '1rem',
                  color: isSuccess ? '#ffffff' : '#ef4444',
                  fontWeight: isSuccess ? '600' : '400',
                }}
              >
                {status}
              </p>
            )}
          </div>
        </div>
      </div>

      {showRoleSelection && pendingGoogleData && (
        <GoogleRoleSelectionModal
          email={pendingGoogleData.email}
          onSelectRole={async (role) => {
            try {
              setStatus('');
              const response = await api.post('/api/auth/google-login/complete', {
                email: pendingGoogleData.email,
                role,
                sessionToken: pendingGoogleData.sessionToken,
              });

              if (!response.data?.success || !response.data?.data?.token || !response.data?.data?.user) {
                throw new Error('Invalid response from server');
              }

              const { token, user: authenticatedUser } = response.data.data;
              localStorage.setItem('sfv_token', token);
              localStorage.setItem('sfv_user', JSON.stringify(authenticatedUser));
              localStorage.setItem('sfv_google_just_logged_in', 'true');

              if (typeof syncUserFromStorage === 'function') {
                syncUserFromStorage();
              }

              setShowRoleSelection(false);
              setPendingGoogleData(null);
              setIsSuccess(true);
              setStatus('Google sign-in successful! Redirecting...');

              setTimeout(() => {
                navigate(authenticatedUser.role === 'admin' ? '/admin' : '/user/forms', { replace: true });
              }, 500);
            } catch (err) {
              console.error('Complete Google login error:', err);
              setStatus(err.response?.data?.message || err.message || 'Failed to complete Google sign-in.');
            }
          }}
          onClose={() => {
            setShowRoleSelection(false);
            setPendingGoogleData(null);
          }}
        />
      )}
    </div>
  );
}

export default LoginPage;
