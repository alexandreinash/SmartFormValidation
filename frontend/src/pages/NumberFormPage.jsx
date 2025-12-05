import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

function NumberFormPage() {
  const { user } = useAuth();
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#1e293b',
        color: '#fff',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Forms
        </div>
        {user && (
          <div style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            {user.email || user.username || user.name}
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate('/admin/submissions/all')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Settings
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '2rem' }}>Create Number Form</h2>
        
        <form onSubmit={handleSubmit} className="card">
          <label style={{ display: 'block', marginBottom: '1rem' }}>
            Form Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem'
              }}
            />
          </label>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Number Fields</h3>
          
          {fields.map((field, index) => (
            <div key={index} style={{
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Number Field Label (numbers only)"
                  value={field.label}
                  onChange={(e) => updateField(index, 'label', e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.375rem'
                  }}
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={field.is_required}
                    onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                  />
                  Required
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={field.ai_validation_enabled}
                    onChange={(e) => updateField(index, 'ai_validation_enabled', e.target.checked)}
                  />
                  AI Validation
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addField}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#64748b',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            + Add Number Field
          </button>

          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Save Form
          </button>

          {message && (
            <p style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: message.includes('successfully') ? '#d1fae5' : '#fee2e2',
              color: message.includes('successfully') ? '#065f46' : '#991b1b',
              borderRadius: '0.375rem'
            }}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default NumberFormPage;
