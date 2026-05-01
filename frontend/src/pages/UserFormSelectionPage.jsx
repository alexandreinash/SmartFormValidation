import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/UserFormSelectionPage.css';
import '../css/components.css';

function SidebarGlyph({ className, children }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

function renderSidebarIcon(iconName, className = 'ufs-nav-icon') {
  switch (iconName) {
    case 'brand':
      return (
        <SidebarGlyph className={className}>
          <path d="M3.5 7.5L9 12L3.5 16.5V7.5Z" fill="currentColor" stroke="none" />
          <path d="M20.5 7.5L15 12L20.5 16.5V7.5Z" fill="currentColor" stroke="none" />
          <path d="M9 12L12 9.5L15 12L12 14.5L9 12Z" fill="currentColor" stroke="none" />
          <path d="M6.5 8H17.5" opacity="0.35" />
          <path d="M6.5 16H17.5" opacity="0.35" />
        </SidebarGlyph>
      );
    case 'home':
      return (
        <SidebarGlyph className={className}>
          <path d="M4 10.5L12 4L20 10.5" />
          <path d="M6.5 9.5V20H17.5V9.5" />
          <path d="M9.5 20V13H14.5V20" />
        </SidebarGlyph>
      );
    case 'text':
      return (
        <SidebarGlyph className={className}>
          <path d="M6 18L4 20V6.5C4 5.67 4.67 5 5.5 5H18.5C19.33 5 20 5.67 20 6.5V15.5C20 16.33 19.33 17 18.5 17H8" />
          <path d="M8 9H16" />
          <path d="M8 13H14" />
        </SidebarGlyph>
      );
    case 'email':
      return (
        <SidebarGlyph className={className}>
          <path d="M4 7.5H20V16.5H4Z" />
          <path d="M4 8L12 13L20 8" />
        </SidebarGlyph>
      );
    case 'number':
      return (
        <SidebarGlyph className={className}>
          <path d="M9 4L7 20" />
          <path d="M17 4L15 20" />
          <path d="M4 9H19" />
          <path d="M3 15H18" />
        </SidebarGlyph>
      );
    case 'quiz':
      return (
        <SidebarGlyph className={className}>
          <path d="M7 5H17" />
          <path d="M7 5C5.34 5 4 6.34 4 8V16C4 17.66 5.34 19 7 19H17C18.66 19 20 17.66 20 16V8C20 6.34 18.66 5 17 5" />
          <path d="M9.25 11.5C9.25 10.12 10.37 9 11.75 9C13.13 9 14.25 10.12 14.25 11.5C14.25 12.43 13.73 13.07 12.94 13.61C12.22 14.1 11.75 14.56 11.75 15.5" />
          <path d="M11.75 18.25H11.76" />
        </SidebarGlyph>
      );
    case 'settings':
      return (
        <SidebarGlyph className={className}>
          <path d="M8 8L4 12L8 16" />
          <path d="M16 8L20 12L16 16" />
          <path d="M13 5L11 19" />
        </SidebarGlyph>
      );
    case 'logout':
      return (
        <SidebarGlyph className={className}>
          <path d="M10 7V5.5C10 4.67 10.67 4 11.5 4H18.5C19.33 4 20 4.67 20 5.5V18.5C20 19.33 19.33 20 18.5 20H11.5C10.67 20 10 19.33 10 18.5V17" />
          <path d="M4 12H15" />
          <path d="M11 8L15 12L11 16" />
        </SidebarGlyph>
      );
    default:
      return null;
  }
}

function getDisplayName(user) {
  if (!user) {
    return 'User';
  }

  if (user.username && user.username.trim()) {
    return user.username.trim();
  }

  if (user.email) {
    return user.email.split('@')[0];
  }

  return 'User';
}

function buildDefaultAvatar(displayName) {
  const initial = (displayName || 'U').trim().charAt(0).toUpperCase() || 'U';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <defs>
        <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#98001f" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill="url(#avatarGradient)" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#fffaf3" font-family="Arial, sans-serif" font-size="30" font-weight="700">${initial}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getProfileImage(user, fallbackAvatar) {
  return user?.profilePicture
    || user?.profile_picture
    || user?.avatarUrl
    || user?.avatar_url
    || user?.avatar
    || user?.picture
    || fallbackAvatar;
}

function formatPublishedGrade(grading) {
  if (!grading || grading.finalGradeScore === null || grading.finalGradeScore === undefined || grading.finalGradeMaxScore === null || grading.finalGradeMaxScore === undefined) {
    return 'Awaiting score';
  }

  return `${Number(grading.finalGradeScore).toFixed(2)} / ${Number(grading.finalGradeMaxScore).toFixed(2)}`;
}

function formatSubmissionStatus(grading) {
  const status = grading?.gradeStatus || 'pending_review';
  if (status === 'published') {
    return 'Published';
  }
  if (status === 'reviewed') {
    return 'Reviewed';
  }
  return 'Pending Review';
}

function PanelToggleIcon({ isOpen }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d={isOpen ? 'M6 14L12 8L18 14' : 'M6 10L12 16L18 10'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [publishedGrades, setPublishedGrades] = useState([]);
  const [gradesStatus, setGradesStatus] = useState('');
  const [gradesLoading, setGradesLoading] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [submissionHistoryStatus, setSubmissionHistoryStatus] = useState('');
  const [submissionHistoryLoading, setSubmissionHistoryLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPublishedGrades, setShowPublishedGrades] = useState(true);
  const [showSubmittedForms, setShowSubmittedForms] = useState(true);

  const displayName = getDisplayName(user);
  const defaultAvatar = buildDefaultAvatar(displayName);
  const profileImage = getProfileImage(user, defaultAvatar);

  const formTypeMenuItems = [
    { key: 'text', label: 'General Forms', icon: 'text' },
    { key: 'email', label: 'Email', icon: 'email' },
    { key: 'number', label: 'Number', icon: 'number' },
    { key: 'quiz', label: 'Quiz', icon: 'quiz' }
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    localStorage.setItem('sfv_just_logged_out', 'true');
    logout();
    setTimeout(() => {
      navigate('/login');
    }, 800);
  };

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

    const uniqueFieldTypes = [...new Set(fieldTypes)];
    if (uniqueFieldTypes.length > 1) {
      return 'text';
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

  const loadPublishedGrades = useCallback(async (silent = false) => {
    if (!user || user.role !== 'user') {
      setPublishedGrades([]);
      setGradesStatus('');
      return;
    }

    if (!silent) {
      setGradesLoading(true);
    }

    try {
      const res = await api.get('/api/submissions/mine/grades');
      setPublishedGrades(res.data.data?.submissions || []);
      setGradesStatus('');
    } catch (err) {
      if (!silent) {
        setGradesStatus(err.response?.data?.message || 'Failed to load published grades.');
      }
    } finally {
      if (!silent) {
        setGradesLoading(false);
      }
    }
  }, [user]);

  const loadSubmissionHistory = useCallback(async (silent = false) => {
    if (!user || user.role !== 'user') {
      setSubmissionHistory([]);
      setSubmissionHistoryStatus('');
      return;
    }

    if (!silent) {
      setSubmissionHistoryLoading(true);
    }

    try {
      const res = await api.get('/api/submissions/mine/history');
      setSubmissionHistory(res.data.data?.submissions || []);
      setSubmissionHistoryStatus('');
    } catch (err) {
      if (!silent) {
        setSubmissionHistoryStatus(err.response?.data?.message || 'Failed to load submission history.');
      }
    } finally {
      if (!silent) {
        setSubmissionHistoryLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    loadForms();
  }, [location.pathname, defaultTab, loadForms]); // Reload when route or defaultTab changes

  useEffect(() => {
    loadPublishedGrades();
  }, [loadPublishedGrades]);

  useEffect(() => {
    loadSubmissionHistory();
  }, [loadSubmissionHistory]);

  // Auto-refresh mechanism: check for new forms every 5 seconds when page is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadForms(true); // Silent refresh
        loadPublishedGrades(true);
        loadSubmissionHistory(true);
      }
    };

    const handleWindowFocus = () => {
      loadForms(true);
      loadPublishedGrades(true);
      loadSubmissionHistory(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadForms, loadPublishedGrades, loadSubmissionHistory]); // Re-run when loaders change

  // Update activeTab when defaultTab prop changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  if (loading) {
    return (
      <div className="user-form-selection-container user-form-selection-container-loading">
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
        <div className="ufs-sidebar-header">
          <div className="ufs-sidebar-logo">
            {renderSidebarIcon('brand', 'ufs-logo-icon')}
            <div className="ufs-logo-copy">
              <span className="ufs-logo-text">Smart Form Validator</span>
              <span className="ufs-logo-subtitle">Forms Workspace</span>
            </div>
          </div>
        </div>

        <nav className="ufs-sidebar-nav" aria-label="Form navigation">
          <div className="ufs-primary-nav">
            <Link to="/" className="ufs-nav-item">
              {renderSidebarIcon('home')}
              <span className="ufs-nav-label">Home</span>
            </Link>

            {formTypeMenuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`ufs-nav-item ${activeTab === item.key ? 'ufs-nav-item-active' : ''}`}
                aria-current={activeTab === item.key ? 'page' : undefined}
                onClick={() => setActiveTab(item.key)}
              >
                {renderSidebarIcon(item.icon)}
                <span className="ufs-nav-label">{item.label}</span>
              </button>
            ))}
          </div>

          {user?.role === 'admin' && (
            <Link to="/admin" className="ufs-nav-item">
              {renderSidebarIcon('settings')}
              <span className="ufs-nav-label">Settings</span>
            </Link>
          )}
        </nav>

        <div className="ufs-sidebar-footer">
          <div className="ufs-footer-actions">
            <button
              type="button"
              onClick={handleLogout}
              className="ufs-footer-button ufs-footer-button-primary"
            >
              {renderSidebarIcon('logout', 'ufs-footer-icon')}
              <span className="ufs-nav-label">Logout</span>
            </button>
          </div>

          <div className="ufs-sidebar-version">Smart Form Validator V1.0</div>
          <div className="ufs-sidebar-cit">CIT University</div>
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
              <div className="user-profile-badge">
                <img
                  src={profileImage}
                  alt={`${displayName} profile`}
                  className="user-avatar"
                  onError={(event) => {
                    event.currentTarget.src = defaultAvatar;
                  }}
                />
                <div className="user-welcome">Welcome, <strong>{displayName}</strong></div>
              </div>
            </div>
          )}
        </div>

        {status && (
          <div className={`status-message ${status.includes('Failed') ? 'status-error' : 'status-success'}`}>
            {status}
          </div>
        )}

        {user?.role === 'user' && (
          <>
            <section className="published-grades-panel">
              <div className="published-grades-header">
                <div>
                  <h2 className="published-grades-title">Published Grades</h2>
                  <p className="published-grades-subtitle">
                    Teacher-approved results appear here after the review and approval step.
                  </p>
                </div>
                <div className="published-grades-header-actions">
                  <div className="published-grades-count">{publishedGrades.length} published</div>
                  <button
                    type="button"
                    className="panel-toggle-button"
                    onClick={() => setShowPublishedGrades((current) => !current)}
                    aria-expanded={showPublishedGrades}
                    aria-label={showPublishedGrades ? 'Hide published grades' : 'Show published grades'}
                  >
                    <span>{showPublishedGrades ? 'Hide' : 'Show'}</span>
                    <PanelToggleIcon isOpen={showPublishedGrades} />
                  </button>
                </div>
              </div>

              {showPublishedGrades && (
                gradesLoading ? (
                  <div className="published-grades-empty">Loading published grades...</div>
                ) : gradesStatus ? (
                  <div className="published-grades-empty published-grades-error">{gradesStatus}</div>
                ) : publishedGrades.length === 0 ? (
                  <div className="published-grades-empty">
                    Your teacher has not published any grades to your account yet.
                  </div>
                ) : (
                  <div className="published-grades-grid">
                    {publishedGrades.map((submission) => {
                      const grading = submission.grading || {};
                      return (
                        <article key={submission.id} className="published-grade-card">
                          <div className="published-grade-card-header">
                            <div>
                              <h3>{submission.form?.title || `Form #${submission.form_id}`}</h3>
                              <p>
                                Published {grading.publishedAt ? new Date(grading.publishedAt).toLocaleString() : 'recently'}
                              </p>
                            </div>
                            <div className="published-grade-score">{formatPublishedGrade(grading)}</div>
                          </div>

                          <div className="published-grade-meta">
                            Submitted {new Date(submission.submitted_at).toLocaleString()}
                          </div>

                          <div className="published-grade-feedback">
                            {grading.finalFeedback || 'Your teacher approved this grade without additional notes.'}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )
              )}
            </section>

            <section className="published-grades-panel">
              <div className="published-grades-header">
                <div>
                  <h2 className="published-grades-title">Submitted Forms</h2>
                  <p className="published-grades-subtitle">
                    Track which forms you submitted and whether each one is still pending, reviewed, or published.
                  </p>
                </div>
                <div className="published-grades-header-actions">
                  <div className="published-grades-count">{submissionHistory.length} submitted</div>
                  <button
                    type="button"
                    className="panel-toggle-button"
                    onClick={() => setShowSubmittedForms((current) => !current)}
                    aria-expanded={showSubmittedForms}
                    aria-label={showSubmittedForms ? 'Hide submitted forms' : 'Show submitted forms'}
                  >
                    <span>{showSubmittedForms ? 'Hide' : 'Show'}</span>
                    <PanelToggleIcon isOpen={showSubmittedForms} />
                  </button>
                </div>
              </div>

              {showSubmittedForms && (
                submissionHistoryLoading ? (
                  <div className="published-grades-empty">Loading submission history...</div>
                ) : submissionHistoryStatus ? (
                  <div className="published-grades-empty published-grades-error">{submissionHistoryStatus}</div>
                ) : submissionHistory.length === 0 ? (
                  <div className="published-grades-empty">
                    You have not submitted any forms yet.
                  </div>
                ) : (
                  <div className="published-grades-grid">
                    {submissionHistory.map((submission) => {
                      const grading = submission.grading || {};
                      const statusLabel = formatSubmissionStatus(grading);
                      const statusMessage = grading.gradeStatus === 'published'
                        ? 'Your teacher has published this grade to your account.'
                        : grading.gradeStatus === 'reviewed'
                          ? 'Your submission was reviewed and is waiting to be published.'
                          : 'Your submission was received and is waiting for teacher review.';

                      return (
                        <article key={submission.id} className="published-grade-card">
                          <div className="published-grade-card-header">
                            <div>
                              <h3>{submission.form?.title || `Form #${submission.form_id}`}</h3>
                              <p>
                                Submitted {new Date(submission.submitted_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="published-grade-score">
                              {grading.gradeStatus === 'published' ? formatPublishedGrade(grading) : statusLabel}
                            </div>
                          </div>

                          <div className="published-grade-meta">
                            Status: {statusLabel}
                          </div>

                          <div className="published-grade-feedback">
                            {grading.gradeStatus === 'published'
                              ? (grading.finalFeedback || 'Published without additional teacher notes.')
                              : statusMessage}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )
              )}
            </section>
          </>
        )}

        {forms.length === 0 ? (
          <div className="empty-state-card">
            <h3>No forms available</h3>
            <p>There are no forms available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="forms-section">
              {activeTab === 'text' && (
                <div className="forms-grid">
                  {textForms.length === 0 ? (
                    <div className="empty-state-card">
                      <h3>No General Forms Available</h3>
                      <p>There are no general forms available at the moment.</p>
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
                            Click below to fill out this form. Mixed field types and AI-assisted validation are supported where configured.
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
        )}
      </div>
    </div>
  );
}

export default UserFormSelectionPage;

