import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/CreateFormPage.css';

function EmailFormPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([{ label: '', type: 'email', is_required: true, ai_validation_enabled: false }]);
  const [message, setMessage] = useState('');

  const updateField = (index, key, value) => {
    const next = [...fields];
    next[index] = { ...next[index], [key]: value };
    // Email fields are always required
    if (key !== 'is_required') {
      next[index].is_required = true;
    }
    setFields(next);
  };

  const addField = () => {
    setFields([...fields, { label: '', type: 'email', is_required: true, ai_validation_enabled: false }]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!user || user.role !== 'admin') {
      setMessage('You must be logged in as an administrator to create forms.');
      return;
    }

    // Validate email field labels - must be valid email format, no numbers
    const labelErrors = [];
    fields.forEach((field, index) => {
      const labelValue = field.label.trim();
      if (labelValue) {
        // Check for numbers
        if (/\d/.test(labelValue)) {
          labelErrors.push(`Email field label "${labelValue}" cannot contain numbers. Only email addresses are accepted.`);
        }
        // Check for @ symbol
        if (!/@/.test(labelValue)) {
          labelErrors.push(`Email field label "${labelValue}" must be a valid email address with @ symbol.`);
        }
        // Check for valid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(labelValue)) {
          labelErrors.push(`Email field label "${labelValue}" must be a valid email address (e.g., user@domain.com).`);
        }
      }
    });

    if (labelErrors.length > 0) {
      setMessage(labelErrors.join(' '));
      return;
    }

    try {
      const res = await api.post('/api/forms', { title, fields });
      setMessage(`Form created successfully with ID ${res.data.data.form.id}`);
      setTitle('');
      setFields([{ label: '', type: 'email', is_required: true, ai_validation_enabled: false }]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create form.');
    }
  };

  return (
    <div className="create-form-container">
      {/* Left Sidebar */}
      <div className="create-form-sidebar">
        <h2 className="sidebar-title">Forms</h2>
        <div className="sidebar-nav-container">
          <nav className="sidebar-nav sidebar-nav-box">
            <Link to="/" className="sidebar-nav-item">
              <span className="sidebar-icon">⌂</span>
              <span>Home</span>
            </Link>
            <Link to="/text-form" className="sidebar-nav-item">
              <span className="sidebar-icon">📄</span>
              <span>Text Form</span>
            </Link>
            <Link to="/email-form" className="sidebar-nav-item sidebar-nav-item-active">
              <span className="sidebar-icon">✉️</span>
              <span>Email</span>
            </Link>
            <Link to="/number-form" className="sidebar-nav-item">
              <span className="sidebar-icon">🔢</span>
              <span>Number</span>
            </Link>
          </nav>
          <nav className="sidebar-nav sidebar-nav-box">
            <Link to="/admin" className="sidebar-nav-item">
              <span className="sidebar-icon">⚙️</span>
              <span>Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="sidebar-nav-item sidebar-logout-button"
            >
              <span className="sidebar-icon">⊟</span>
              <span>Log Out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="create-form-main">
        <div className="create-form-header">
          <div>
            <p className="create-form-subtitle">
              Create a form with email fields only. Add custom labels and validation settings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="back-button"
          >
            ← Back
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="create-form-form">
          <div className="form-section">
            <label className="form-label">Form Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title"
              required
              className="form-input"
            />
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Email Fields</h3>
            
            {fields.map((field, index) => (
              <div key={index} className="text-field-card">
                <div className="text-field-header">
                  <span className="field-label-text">Field Label</span>
                  <div className="field-input-wrapper">
                    <input
                      type="text"
                      placeholder="Email Field Label (must be valid email)"
                      value={field.label}
                      onChange={(e) => updateField(index, 'label', e.target.value)}
                      required
                      className="text-field-input"
                      style={{
                        borderColor: field.label && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.label) ? '#f59e0b' : undefined
                      }}
                    />
                    <button
                      type="button"
                      className="text-field-type-button"
                    >
                      Email Field
                    </button>
                  </div>
                </div>
                
                <div className="text-field-options">
                  <label className="text-field-checkbox">
                    <input
                      type="checkbox"
                      checked={field.is_required}
                      onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                      disabled
                    />
                    <span>Required</span>
                  </label>
                  <label className="text-field-checkbox">
                    <input
                      type="checkbox"
                      checked={field.ai_validation_enabled}
                      onChange={(e) => updateField(index, 'ai_validation_enabled', e.target.checked)}
                    />
                    <span>AI Validation</span>
                  </label>
                  <button
                    type="button"
                    onClick={addField}
                    className="add-field-button-text"
                  >
                    + Add Field
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="save-form-button-text"
          >
            Save Form
          </button>

          {message && (
            <div className={`message ${message.includes('successfully') ? 'message-success' : 'message-error'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default EmailFormPage;
