import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/CreateFormPage.css';
import '../css/components.css';

function EditFormPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasSubmissions, setHasSubmissions] = useState(false);
  const [formType, setFormType] = useState('number'); // text, email, number
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    try {
      setLoading(true);
      // Load form data
      const formRes = await api.get(`/api/forms/${id}`);
      const formData = formRes.data.data;
      
      setTitle(formData.title);
      setFields(formData.fields || []);
      
      // Determine form type based on first field
      if (formData.fields && formData.fields.length > 0) {
        setFormType(formData.fields[0].type);
      }
      
      // Check if form has submissions
      const submissionsRes = await api.get(`/api/forms/${id}/has-submissions`);
      setHasSubmissions(submissionsRes.data.data.hasSubmissions);
      
      setLoading(false);
    } catch (err) {
      setMessage('Failed to load form.');
      setLoading(false);
    }
  };

  const updateField = (index, key, value) => {
    const next = [...fields];
    next[index] = { ...next[index], [key]: value };
    setFields(next);
  };

  const addField = () => {
    setFields([...fields, { label: '', type: formType, is_required: false, ai_validation_enabled: false }]);
  };

  const removeField = (index) => {
    if (fields.length <= 1) {
      setMessage('Form must have at least one field.');
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!user || user.role !== 'admin') {
      setMessage('You must be logged in as an administrator to edit forms.');
      return;
    }

    try {
      await api.put(`/api/forms/${id}`, { title, fields });
      setMessage('Form updated successfully!');
      setTimeout(() => navigate('/admin/forms/all'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update form.');
    }
  };

  const handleCancel = () => {
    const ok = window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.');
    if (ok) {
      navigate('/admin/forms/all');
    }
  };

  if (loading) {
    return (
      <div className="create-form-container">
        <div className="create-form-main">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading form...</div>
        </div>
      </div>
    );
  }

  if (hasSubmissions) {
    return (
      <div className="create-form-container">
        <div className="create-form-main">
          <div style={{ padding: '2rem' }}>
            <h2>Cannot Edit Form</h2>
            <p>This form cannot be edited because it has already been submitted by one or more users.</p>
            <button
              onClick={() => navigate('/admin/forms/all')}
              className="button button-primary"
            >
              Back to Forms
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formTypeDisplay = formType === 'text' ? 'Text' : formType === 'email' ? 'Email' : 'Number';

  return (
    <div className="create-form-container">
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
      <div className="create-form-sidebar">
        <h2 className="sidebar-title">Forms</h2>
        <div className="sidebar-nav-container">
          <nav className="sidebar-nav sidebar-nav-box">
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.');
                if (ok) {
                  navigate('/admin');
                }
              }}
              className="sidebar-nav-item"
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <span className="sidebar-icon">🏠</span>
              <span>Home</span>
            </button>
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
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="create-form-main">
        <div className="create-form-header">
          <div>
            <h1 className="create-form-title">Modify {formTypeDisplay} Form</h1>
            <p className="create-form-subtitle">
              Edit the form title, labels, and validation settings.
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
            <h3 className="form-section-title">{formTypeDisplay} Fields</h3>
            
            {fields.map((field, index) => (
              <div key={index} className="field-card">
                <div className="field-label-row">
                  <label className="field-label-text">Field Label</label>
                  <div className="field-input-row">
                    <input
                      type="text"
                      placeholder="Enter field label"
                      value={field.label}
                      onChange={(e) => updateField(index, 'label', e.target.value)}
                      required
                      className={`field-input ${formType === 'number' ? 'field-input-yellow' : formType === 'email' ? 'field-input-purple' : 'field-input-blue'}`}
                    />
                    <button
                      type="button"
                      className={`field-type-button ${formType === 'number' ? 'field-type-button-yellow' : formType === 'email' ? 'field-type-button-purple' : 'field-type-button-blue'}`}
                    >
                      {formTypeDisplay} Field
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

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className={`save-form-button ${formType === 'number' ? 'save-form-button-yellow' : formType === 'email' ? 'save-form-button-purple' : 'save-form-button-blue'}`}
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="save-form-button"
              style={{ 
                background: '#6b7280', 
                color: '#ffffff',
                border: 'none'
              }}
            >
              Cancel
            </button>
          </div>

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

export default EditFormPage;
