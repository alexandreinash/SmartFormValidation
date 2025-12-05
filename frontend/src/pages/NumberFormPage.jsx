import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/CreateFormPage.css';

function NumberFormPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([{ label: '', type: 'number', is_required: false, ai_validation_enabled: false }]);
  const [message, setMessage] = useState('');

  const updateField = (index, key, value) => {
    const next = [...fields];
    next[index] = { ...next[index], [key]: value };
    setFields(next);
  };

  const addField = () => {
    setFields([...fields, { label: '', type: 'number', is_required: false, ai_validation_enabled: false }]);
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

    // Validate number field labels - reject text and email patterns
    const labelErrors = [];
    fields.forEach((field, index) => {
      const labelValue = field.label.trim();
      if (labelValue) {
        // Check for text (letters)
        if (/[a-zA-Z]/.test(labelValue)) {
          labelErrors.push(`Number field label "${labelValue}" cannot contain text. Only numbers are accepted.`);
        }
        // Check for email pattern (@)
        if (/@/.test(labelValue)) {
          labelErrors.push(`Number field label "${labelValue}" cannot contain email addresses. Only numbers are accepted.`);
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
      setFields([{ label: '', type: 'number', is_required: false, ai_validation_enabled: false }]);
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
            <Link to="/email-form" className="sidebar-nav-item">
              <span className="sidebar-icon">✉️</span>
              <span>Email</span>
            </Link>
            <Link to="/number-form" className="sidebar-nav-item sidebar-nav-item-active">
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
            <h1 className="create-form-title">Create Number Form</h1>
            <p className="create-form-subtitle">
              Create a form with number fields only. Add custom labels and validation settings.
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
            <h3 className="form-section-title">Number Fields</h3>
            
            {fields.map((field, index) => (
              <div key={index} className="field-card">
                <div className="field-row">
                  <input
                    type="text"
                    placeholder="Enter field label (numbers only)"
                    value={field.label}
                    onChange={(e) => updateField(index, 'label', e.target.value)}
                    required
                    className="field-input"
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      style={{
                        padding: '0.75rem 1.25rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="field-options">
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
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addField}
              className="add-field-button"
            >
              + Add Number Field
            </button>
          </div>

          <button
            type="submit"
            className="save-form-button"
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

export default NumberFormPage;
