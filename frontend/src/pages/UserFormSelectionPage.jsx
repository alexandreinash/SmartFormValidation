import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import RemoveAccountModal from '../components/RemoveAccountModal';
import '../css/UserFormSelectionPage.css';
import '../css/components.css';

function UserFormSelectionPage({ defaultTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [forms, setForms] = useState([]);
  const [textForms, setTextForms] = useState([]);
  const [emailForms, setEmailForms] = useState([]);
  const [numberForms, setNumberForms] = useState([]);
  const [quizForms, setQuizForms] = useState([]);
  const [activeTab, setActiveTab] = useState(defaultTab || 'text');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showRemoveAccountModal, setShowRemoveAccountModal] = useState(false);
  const [isRemovingAccount, setIsRemovingAccount] = useState(false);

  // Helper function to categorize form based on field types
  const categorizeForm = (form) => {
    if (!form.fields || form.fields.length === 0) {
      return 'text'; // Default to text if no fields
    }

    const fieldTypes = form.fields.map(field => field.type);
    
    // Check for quiz fields (has quiz data in options or expected_entity)
    const hasQuizFields = form.fields.some(field => {
      try {
        // Check options field first (new method), then expected_entity (old method)
        const quizData = field.options 
          ? JSON.parse(field.options)
          : (field.expected_entity && field.expected_entity !== 'none' && field.expected_entity !== 'quiz'
              ? JSON.parse(field.expected_entity)
              : null);
        return quizData && quizData.questionType;
      } catch {
        return false;
      }
    });
    if (hasQuizFields) {
      return 'quiz';
    }
    
    // Check for number fields
    if (fieldTypes.some(type => type === 'number')) {
      return 'number';
    }
    
    // Check for email fields
    if (fieldTypes.some(type => type === 'email')) {
      return 'email';
    }
    
    // Default to text (text, textarea)
    return 'text';
  };

  // Load forms function - memoized to prevent unnecessary re-renders
  const loadForms = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const res = await api.get('/api/forms');
      const formsData = res.data.data || [];
      
      // Fetch fields for each form
      const formsWithFields = await Promise.all(
        formsData.map(async (form) => {
          try {
            const formRes = await api.get(`/api/forms/${form.id}`);
            return { ...form, fields: formRes.data.data?.fields || [] };
          } catch {
            return { ...form, fields: [] };
          }
        })
      );
      
      setForms(formsWithFields);
      
      // Categorize forms
      const text = [];
      const email = [];
      const number = [];
      const quiz = [];
      
      formsWithFields.forEach(form => {
        const category = categorizeForm(form);
        if (category === 'text') {
          text.push(form);
        } else if (category === 'email') {
          email.push(form);
        } else if (category === 'number') {
          number.push(form);
        } else if (category === 'quiz') {
          quiz.push(form);
        }
      });
      
      setTextForms(text);
      setEmailForms(email);
      setNumberForms(number);
      setQuizForms(quiz);
      
      // Set active tab: use defaultTab if provided, otherwise use first available category
      if (defaultTab) {
        setActiveTab(defaultTab);
      } else if (text.length > 0) {
        setActiveTab('text');
      } else if (email.length > 0) {
        setActiveTab('email');
      } else if (number.length > 0) {
        setActiveTab('number');
      } else if (quiz.length > 0) {
        setActiveTab('quiz');
      }
      
      setStatus('');
    } catch (err) {
      console.error('Failed to load forms:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load forms.';
      if (!silent) {
        setStatus(`Failed to load forms: ${errorMessage}`);
      }
    }
    if (!silent) {
      setLoading(false);
    }
  }, [defaultTab]);

  useEffect(() => {
    loadForms();
  }, [location.pathname, defaultTab, loadForms]); // Reload when route or defaultTab changes

  // Auto-refresh mechanism: check for new forms every 5 seconds when page is visible
  useEffect(() => {
    let intervalId;
    
    const handleVisibilityChange = () => {
      // Clear any existing interval first
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      
      if (document.visibilityState === 'visible') {
        // Page became visible, refresh immediately
        loadForms(true); // Silent refresh
        // Then set up interval
        intervalId = setInterval(() => {
          if (document.visibilityState === 'visible') {
            loadForms(true); // Silent refresh every 5 seconds
          }
        }, 5000);
      }
    };

    // Set up initial interval if page is visible
    if (document.visibilityState === 'visible') {
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadForms(true); // Silent refresh every 5 seconds
        }
      }, 5000);
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadForms]); // Re-run when loadForms changes

  // Update activeTab when defaultTab prop changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  if (loading) {
    return (
      <div className="user-form-selection-container">
        <div className="loading-container">
          <p>Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-form-selection-container">
      {/* Logout confirmation text in top right corner */}
      {showLogoutConfirm && (
        <div className="logout-confirmation-text">
          <div className="logout-confirmation-content">
            <div className="logout-confirmation-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="logout-confirmation-text-content">
              You have successfully been logged out.
            </div>
          </div>
        </div>
      )}
      {/* Left Sidebar */}
      <div className="user-form-selection-sidebar">
        <h2 className="sidebar-title">Forms</h2>
        <div className="sidebar-nav-container">
          <nav className="sidebar-nav sidebar-nav-box">
            <Link to="/" className="sidebar-nav-item">
              <span className="sidebar-icon">🏠</span>
              <span>Home</span>
            </Link>
            <div className="sidebar-divider"></div>
            <button
              className={`sidebar-nav-item ${activeTab === 'text' ? 'sidebar-nav-item-active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              <span className="sidebar-icon">💬</span>
              <span>Text Form</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'email' ? 'sidebar-nav-item-active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              <span className="sidebar-icon">✉️</span>
              <span>Email</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'number' ? 'sidebar-nav-item-active' : ''}`}
              onClick={() => setActiveTab('number')}
            >
              <span className="sidebar-icon">#</span>
              <span>Number</span>
            </button>
            <button
              className={`sidebar-nav-item ${activeTab === 'quiz' ? 'sidebar-nav-item-active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              <span className="sidebar-icon">📝</span>
              <span>Quiz</span>
            </button>
            {user?.role === 'admin' && (
              <Link to="/admin" className="sidebar-nav-item">
                <span className="sidebar-icon">⚙️</span>
                <span>Settings</span>
              </Link>
            )}
          </nav>
          <nav className="sidebar-nav sidebar-nav-box">
            <button
              type="button"
              onClick={() => {
                setShowLogoutConfirm(true);
                localStorage.setItem('sfv_just_logged_out', 'true');
                logout();
                setTimeout(() => {
                  navigate('/login');
                }, 800);
              }}
              className="sidebar-nav-item sidebar-logout-button"
            >
              <span className="sidebar-icon">↗️</span>
              <span>Log Out</span>
            </button>
              <button
                type="button"
                onClick={() => setShowRemoveAccountModal(true)}
                className="sidebar-nav-item sidebar-remove-account-button"
              >
                <span className="sidebar-icon">🗑️</span>
                <span>Remove Account</span>
              </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="user-form-selection-main">
        <div className="user-form-selection-header">
          <div>
            <h1 
              className="user-form-selection-title clickable-title"
              onClick={loadForms}
              title="Click to refresh forms"
            >
              Available Forms
            </h1>
            <p className="user-form-selection-subtitle">
              Select a form below to fill out and submit. All forms use AI-powered validation for better accuracy.
            </p>
          </div>
          {user && (
            <div className="user-info">
              <div className="user-welcome">Welcome, <strong>{user.email.split('@')[0]}</strong></div>
            </div>
          )}
        </div>

        {status && (
          <div className={`status-message ${status.includes('Failed') ? 'status-error' : 'status-success'}`}>
            {status}
          </div>
        )}

        {forms.length === 0 ? (
          <div className="empty-state-card">
            <h3>No forms available</h3>
            <p>There are no forms available at the moment. Please check back later.</p>
          </div>
        ) : (
          <>
            {/* Form Type Tabs */}
            <div className="form-type-tabs">
              <button
                className={`form-type-tab ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                <span className="tab-icon">💬</span>
                <span>Text Forms</span>
                {textForms.length > 0 && (
                  <span className="tab-count">{textForms.length}</span>
                )}
              </button>
              <button
                className={`form-type-tab ${activeTab === 'email' ? 'active' : ''}`}
                onClick={() => setActiveTab('email')}
              >
                <span className="tab-icon">✉️</span>
                <span>Email Forms</span>
                {emailForms.length > 0 && (
                  <span className="tab-count">{emailForms.length}</span>
                )}
              </button>
            <button
              className={`form-type-tab ${activeTab === 'number' ? 'active' : ''}`}
              onClick={() => setActiveTab('number')}
            >
              <span className="tab-icon">#</span>
              <span>Number Forms</span>
              {numberForms.length > 0 && (
                <span className="tab-count">{numberForms.length}</span>
              )}
            </button>
            <button
              className={`form-type-tab ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              <span className="tab-icon">📝</span>
              <span>Quiz Forms</span>
              {quizForms.length > 0 && (
                <span className="tab-count">{quizForms.length}</span>
              )}
            </button>
          </div>

            {/* Forms Grid by Type */}
            <div className="forms-section">
              {activeTab === 'text' && (
                <div className="forms-grid">
                  {textForms.length === 0 ? (
                    <div className="empty-state-card">
                      <h3>No Text Forms Available</h3>
                      <p>There are no text forms available at the moment.</p>
                    </div>
                  ) : (
                    textForms.map((form) => (
                      <div key={form.id} className="form-selection-card">
                        <div className="form-card-content">
                          <div className="form-card-header">
                            <h3 className="form-card-title">{form.title}</h3>
                            <span className="form-id-badge">ID: #{form.id}</span>
                          </div>
                          <p className="form-card-description">
                            Click below to fill out this text form. All fields are validated using AI-powered technology.
                          </p>
                          {form.creator && (
                            <p className="form-card-creator">
                              Created by: {form.creator.email}
                            </p>
                          )}
                        </div>
                        <Link to={`/forms/${form.id}`} className="form-fill-button">
                          Fill Out Form →
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'email' && (
                <div className="forms-grid">
                  {emailForms.length === 0 ? (
                    <div className="empty-state-card">
                      <h3>No Email Forms Available</h3>
                      <p>There are no email forms available at the moment.</p>
                    </div>
                  ) : (
                    emailForms.map((form) => (
                      <div key={form.id} className="form-selection-card">
                        <div className="form-card-content">
                          <div className="form-card-header">
                            <h3 className="form-card-title">{form.title}</h3>
                            <span className="form-id-badge">ID: #{form.id}</span>
                          </div>
                          <p className="form-card-description">
                            Click below to fill out this email form. All fields are validated using AI-powered technology.
                          </p>
                          {form.creator && (
                            <p className="form-card-creator">
                              Created by: {form.creator.email}
                            </p>
                          )}
                        </div>
                        <Link to={`/forms/${form.id}`} className="form-fill-button">
                          Fill Out Form →
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'number' && (
                <div className="forms-grid">
                  {numberForms.length === 0 ? (
                    <div className="empty-state-card">
                      <h3>No Number Forms Available</h3>
                      <p>There are no number forms available at the moment.</p>
                    </div>
                  ) : (
                    numberForms.map((form) => (
                      <div key={form.id} className="form-selection-card">
                        <div className="form-card-content">
                          <div className="form-card-header">
                            <h3 className="form-card-title">{form.title}</h3>
                            <span className="form-id-badge">ID: #{form.id}</span>
                          </div>
                          <p className="form-card-description">
                            Click below to fill out this number form. All fields are validated using AI-powered technology.
                          </p>
                          {form.creator && (
                            <p className="form-card-creator">
                              Created by: {form.creator.email}
                            </p>
                          )}
                        </div>
                        <Link to={`/forms/${form.id}`} className="form-fill-button">
                          Fill Out Form →
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'quiz' && (
                <div className="forms-grid">
                  {quizForms.length === 0 ? (
                    <div className="empty-state-card">
                      <h3>No Quiz Forms Available</h3>
                      <p>There are no quiz forms available at the moment.</p>
                    </div>
                  ) : (
                    quizForms.map((form) => (
                      <div key={form.id} className="form-selection-card">
                        <div className="form-card-content">
                          <div className="form-card-header">
                            <h3 className="form-card-title">{form.title}</h3>
                            <span className="form-id-badge">ID: #{form.id}</span>
                          </div>
                          <p className="form-card-description">
                            Click below to take this quiz. Your score will be calculated automatically after submission.
                          </p>
                          {form.creator && (
                            <p className="form-card-creator">
                              Created by: {form.creator.email}
                            </p>
                          )}
                        </div>
                        <Link to={`/forms/${form.id}`} className="form-fill-button">
                          Take Quiz →
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Remove Account Modal */}
      {showRemoveAccountModal && (
        <RemoveAccountModal
          user={user}
          onConfirm={async () => {
            setIsRemovingAccount(true);
            try {
              const res = await api.delete('/api/accounts/remove', { data: { confirm: 'YES' } });
              if (res.data && res.data.success) {
                setShowRemoveAccountModal(false);
                setShowLogoutConfirm(true);
                localStorage.setItem('sfv_just_logged_out', 'true');
                logout();
                setTimeout(() => {
                  navigate('/login');
                }, 800);
              } else {
                window.alert('Failed to remove account association');
                setIsRemovingAccount(false);
              }
            } catch (err) {
              console.error(err);
              window.alert(err.response?.data?.error?.message || 'Error removing account');
              setIsRemovingAccount(false);
            }
          }}
          onCancel={() => {
            if (!isRemovingAccount) {
              setShowRemoveAccountModal(false);
            }
          }}
          isRemoving={isRemovingAccount}
        />
      )}
    </div>
  );
}

export default UserFormSelectionPage;

