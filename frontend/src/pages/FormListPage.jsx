import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/FormListPage.css';

function FormListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/forms');
        setForms(res.data.data || []);
        setStatus('');
      } catch (err) {
        setStatus('Failed to load forms.');
      }
      setLoading(false);
    };
    load();
  }, []);

  const deleteForm = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form? This will also delete all associated submissions.')) {
      return;
    }
    try {
      setIsBusy(true);
      await api.delete(`/api/forms/${formId}`);
      setForms((prev) => prev.filter((f) => f.id !== formId));
      setStatus('Form deleted.');
    } catch (err) {
      setStatus('Failed to delete form.');
    } finally {
      setIsBusy(false);
    }
  };

  if (loading) {
    return <p>Loading forms...</p>;
  }

  return (
    <div className="page-heading">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="button button-secondary"
            style={{ marginBottom: '0.75rem' }}
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
          <h2 className="page-title">Available Forms</h2>
          <p className="page-subtitle">
            Select a form below to fill out and submit.
          </p>
        </div>
      </div>

      {status && <p className="status">{status}</p>}

      {forms.length === 0 ? (
        <div className="card empty-state">
          <h3>No forms available</h3>
          <p>There are no forms available at the moment. Please check back later.</p>
        </div>
      ) : (
        <div className="forms-list">
          {forms.map((form) => (
            <div key={form.id} className="form-card">
              <div>
                <h3>{form.title}</h3>
                <p className="form-meta">Form ID: #{form.id}</p>
              </div>
              {user?.role === 'admin' && (
                <div className="form-card-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => navigate(`/admin/forms/${form.id}/submissions`)}
                    disabled={isBusy}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button-danger"
                    onClick={() => deleteForm(form.id)}
                    disabled={isBusy}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    Delete
                  </button>
                </div>
              )}
              <Link to={`/forms/${form.id}`} className="button">
                Fill Out Form
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormListPage;


