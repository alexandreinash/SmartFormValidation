import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/UserFormSelectionPage.css';

function UserFormSelectionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [textForms, setTextForms] = useState([]);
  const [emailForms, setEmailForms] = useState([]);
  const [numberForms, setNumberForms] = useState([]);
  const [quizForms, setQuizForms] = useState([]);
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

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

  useEffect(() => {
    const load = async () => {
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
        
        // Set active tab to first available category
        if (text.length > 0) {
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
        setStatus('Failed to load forms.');
      }
      setLoading(false);
    };
    load();
  }, []);

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
                const ok = window.confirm('Are you sure you want to log out?');
                if (!ok) return;
                logout();
                navigate('/login');
              }}
              className="sidebar-nav-item sidebar-logout-button"
            >
              <span className="sidebar-icon">↗️</span>
              <span>Log Out</span>
            </button>
              <button
                type="button"
                onClick={async () => {
                  const input = window.prompt("Type 'confirm' to remove your account association (this cannot be undone)");
                  if (input !== 'confirm') {
                    window.alert('Cancelled or incorrect confirmation text.');
                    return;
                  }
                  try {
                    const res = await api.delete('/api/accounts/remove', { data: { confirm: 'confirm' } });
                    if (res.data && res.data.success) {
                      window.alert(res.data.message || 'Account association removed');
                      logout();
                      navigate('/login');
                    } else {
                      window.alert('Failed to remove account association');
                    }
                  } catch (err) {
                    console.error(err);
                    window.alert('Error removing account');
                  }
                }}
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
              onClick={() => {
                setLoading(true);
                const load = async () => {
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
                    
                    // Re-categorize forms
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
                    
                    setStatus('');
                  } catch (err) {
                    setStatus('Failed to load forms.');
                  }
                  setLoading(false);
                };
                load();
              }}
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
    </div>
  );
}

export default UserFormSelectionPage;

