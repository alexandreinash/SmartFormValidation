import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

const fieldTemplate = { label: '', type: 'text', is_required: false, ai_validation_enabled: false };

function AdminDashboard() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([{ ...fieldTemplate }]);
  const [message, setMessage] = useState('');
  const [viewFormId, setViewFormId] = useState('');
  const navigate = useNavigate();

  const updateField = (index, key, value) => {
    const next = [...fields];
    next[index] = { ...next[index], [key]: value };
    setFields(next);
  };

  const addField = () => setFields([...fields, { ...fieldTemplate }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!user || user.role !== 'admin') {
      setMessage('You must be logged in as an administrator to create forms.');
      return;
    }
    try {
      const res = await api.post('/api/forms', { title, fields });
      setMessage(`Form created with ID ${res.data.data.form.id}`);
    } catch (err) {
      setMessage(
        err.response?.data?.message || 'Failed to create form. Check backend configuration.'
      );
    }
  };

  return (
    <div>
      <h2>Administrator – Create Form</h2>
      <form onSubmit={handleSubmit} className="card">
        <label>
          Form Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <h3>Fields</h3>
        {fields.map((field, index) => (
          <div key={index} className="field-row">
            <input
              placeholder="Label"
              value={field.label}
              onChange={(e) => updateField(index, 'label', e.target.value)}
              required
            />
            <select
              value={field.type}
              onChange={(e) => updateField(index, 'type', e.target.value)}
            >
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
            </select>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={field.is_required}
                onChange={(e) => updateField(index, 'is_required', e.target.checked)}
              />
              Required
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={field.ai_validation_enabled}
                onChange={(e) =>
                  updateField(index, 'ai_validation_enabled', e.target.checked)
                }
              />
              AI Validation
            </label>
          </div>
        ))}
        <button type="button" onClick={addField}>
          + Add Field
        </button>
        <button type="submit">Save Form</button>
        {message && <p className="status">{message}</p>}
      </form>

      <div className="card">
        <h3>View Submissions</h3>
        <p>
          Enter a form ID to view all submissions and AI validation flags for that
          form.
        </p>
        <div className="field-row">
          <input
            type="number"
            placeholder="Form ID"
            value={viewFormId}
            onChange={(e) => setViewFormId(e.target.value)}
          />
          <button
            type="button"
            onClick={() => viewFormId && navigate(`/admin/forms/${viewFormId}/submissions`)}
          >
            Open Submissions
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Analytics Dashboard</h3>
        <p>
          View comprehensive analytics and statistics for all forms and submissions.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/analytics')}
          className="button"
        >
          View Analytics
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;


