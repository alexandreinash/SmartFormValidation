import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/CreateFormPage.css';

function EmailFormPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([{ label: '', type: 'email', is_required: false, ai_validation_enabled: false }]);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateFieldLabel = (label) => {
    if (!label.trim()) {
      return ''; // Empty is handled by required attribute
    }
    
    // Check if contains only numbers
    if (/^\d+$/.test(label.trim())) {
      return 'Field label cannot contain only numbers';
    }
    
    // Check if contains @ symbol (required for email)
    if (!label.includes('@')) {
      return 'Field label must contain an email address (@ symbol)';
    }
    
    return ''; // Valid
  };

  const updateField = (index, key, value) => {
    const next = [...fields];
    next[index] = { ...next[index], [key]: value };
    setFields(next);
    
    // Validate field label when it changes
    if (key === 'label') {
      const error = validateFieldLabel(value);
      setFieldErrors(prev => ({
        ...prev,
        [index]: error
      }));
    }
  };

  const addField = () => {
    setFields([...fields, { label: '', type: 'email', is_required: false, ai_validation_enabled: false }]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
    // Remove error for deleted field
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[index];
      // Reindex errors for fields after the removed one
      const reindexed = {};
      Object.keys(next).forEach(key => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          reindexed[keyNum - 1] = next[key];
        } else if (keyNum < index) {
          reindexed[keyNum] = next[key];
        }
      });
      return reindexed;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!user || user.role !== 'admin') {
      setMessage('You must be logged in as an administrator to create forms.');
      return;
    }

    // Validate all field labels before submission
    const errors = {};
    let hasErrors = false;
    
    fields.forEach((field, index) => {
      const error = validateFieldLabel(field.label);
      if (error) {
        errors[index] = error;
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setFieldErrors(errors);
      setMessage('Please fix the field label errors before submitting.');
      return;
    }

    try {
      const res = await api.post('/api/forms', { title, fields });
      setMessage(`Form created successfully with ID ${res.data.data.form.id}`);
      setTitle('');
      setFields([{ label: '', type: 'email', is_required: false, ai_validation_enabled: false }]);
      setFieldErrors({});
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
              <span className="sidebar-icon">🏠</span>
              <span>Home</span>
            </Link>
            <Link to="/text-form" className="sidebar-nav-item">
              <span className="sidebar-icon">💬</span>
              <span>Text Form</span>
            </Link>
            <Link to="/email-form" className="sidebar-nav-item sidebar-nav-item-active">
              <span className="sidebar-icon">✉️</span>
              <span>Email</span>
            </Link>
            <Link to="/number-form" className="sidebar-nav-item">
              <span className="sidebar-icon">#</span>
              <span>Number</span>
            </Link>
            <Link to="/admin" className="sidebar-nav-item">
              <span className="sidebar-icon">⚙️</span>
              <span>Settings</span>
            </Link>
          </nav>
          <nav className="sidebar-nav sidebar-nav-box">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="sidebar-nav-item sidebar-logout-button"
            >
              <span className="sidebar-icon">↗️</span>
              <span>Log Out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="create-form-main">
        <div className="create-form-header">
          <div>
            <h1 className="create-form-title">Create Email Form</h1>
            <p className="create-form-subtitle">
              Create a form with email fields only. Add custom labels and validation settings.
            </p>
          </div>
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
              <div key={index} className="field-card">
                <div className="field-label-row">
                  <label className="field-label-text">Field Label</label>
                  <div className="field-input-row">
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <input
                        type="text"
                        placeholder="Enter field label"
                        value={field.label}
                        onChange={(e) => updateField(index, 'label', e.target.value)}
                        required
                        className={`field-input field-input-yellow ${fieldErrors[index] ? 'field-input-error' : ''}`}
                      />
                      {fieldErrors[index] && (
                        <div className="field-error-message">{fieldErrors[index]}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="field-type-button field-type-button-yellow"
                    >
                      Email Field
                    </button>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="remove-field-button"
                        title="Remove this field"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                <div className="field-options-row">
                  <label className="field-checkbox">
                    <input
                      type="checkbox"
                      checked={field.is_required}
                      onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                    />
                    <span>Required</span>
                  </label>
                  <label className="field-checkbox">
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
                    className="add-field-button"
                  >
                    + Add Field
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="save-form-button save-form-button-yellow"
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
