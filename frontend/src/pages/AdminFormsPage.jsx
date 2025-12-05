import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/submissions.css';

function AdminFormsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [status, setStatus] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [selectedForms, setSelectedForms] = useState([]);

  const loadForms = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setStatus('You must be logged in as an administrator to view forms.');
      return;
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
      setStatus('');
    } catch (err) {
      setStatus('Failed to load forms.');
    }
  }, [user]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const deleteForm = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form? This will also delete all associated submissions.')) {
      return;
    }
    try {
      setIsBusy(true);
      await api.delete(`/api/forms/${formId}`);
      setForms((prev) => prev.filter((f) => f.id !== formId));
      setSelectedForms((prev) => prev.filter((id) => id !== formId));
      setStatus('Form deleted.');
    } catch (err) {
      setStatus('Failed to delete form.');
    } finally {
      setIsBusy(false);
    }
  };

  const deleteAllForms = async () => {
    if (!window.confirm(`Are you sure you want to delete all ${forms.length} form(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      setIsBusy(true);
      await Promise.all(forms.map((form) => api.delete(`/api/forms/${form.id}`)));
      setForms([]);
      setSelectedForms([]);
      setStatus(`All ${forms.length} form(s) deleted.`);
    } catch (err) {
      setStatus('Failed to delete all forms.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectForm = (formId) => {
    setSelectedForms((prev) =>
      prev.includes(formId)
        ? prev.filter((id) => id !== formId)
        : [...prev, formId]
    );
  };

  const handleSelectAll = () => {
    if (selectedForms.length === forms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(forms.map((form) => form.id));
    }
  };

  const deleteSelectedForms = async () => {
    if (selectedForms.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedForms.length} selected form(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      setIsBusy(true);
      await Promise.all(
        selectedForms.map((id) => api.delete(`/api/forms/${id}`))
      );
      setForms((prev) => prev.filter((f) => !selectedForms.includes(f.id)));
      setSelectedForms([]);
      setStatus(`${selectedForms.length} form(s) deleted.`);
    } catch (err) {
      setStatus('Failed to delete selected forms.');
    } finally {
      setIsBusy(false);
    }
  };

  const isAllSelected = forms.length > 0 && selectedForms.length === forms.length;

  const totalForms = forms.length;
  const totalFields = forms.reduce((acc, form) => acc + (form.fields?.length || 0), 0);
  
  // Calculate total submissions by fetching count for each form
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  
  useEffect(() => {
    const fetchTotalSubmissions = async () => {
      try {
        const res = await api.get('/api/submissions/all');
        setTotalSubmissions(res.data.data?.submissions?.length || 0);
      } catch {
        setTotalSubmissions(0);
      }
    };
    if (forms.length > 0) {
      fetchTotalSubmissions();
    }
  }, [forms.length]);

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
          <h2 className="page-title" style={{ color: '#94a3b8', fontWeight: 400 }}>
            Viewing all forms
          </h2>
        </div>
      </div>

      {status && <p className="status">{status}</p>}

      {forms.length > 0 && (
        <div className="card submissions-summary">
          <div className="summary-header">
            <div>
              <h3>Overview</h3>
              <p className="summary-subtitle">
                High-level snapshot of all forms.
              </p>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">TOTAL FORMS</div>
              <div className="summary-value">{totalForms}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">TOTAL FIELDS</div>
              <div className="summary-value">{totalFields}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">TOTAL SUBMISSIONS</div>
              <div className="summary-value highlight-muted">
                {totalSubmissions}
              </div>
            </div>
          </div>
        </div>
      )}

      {forms.length === 0 ? (
        <div className="card empty-state">
          <h3>No forms yet</h3>
          <p>
            You haven't created any forms yet. Create your first form to get started.
          </p>
        </div>
      ) : (
        <div className="card submissions-list">
          <div className="submissions-header">
            <div style={{ flex: 1 }}>
              <h3>All forms</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                <p className="summary-subtitle" style={{ margin: 0 }}>
                  Showing {forms.length} form{forms.length !== 1 ? 's' : ''} with current filter.
                </p>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={isBusy}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      borderRadius: '999px',
                      border: '1px solid rgba(148, 163, 184, 0.6)',
                      background: '#f9fafb',
                      color: '#111827',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => e.target.style.borderColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.6)'}
                  >
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      style={{ margin: 0, cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    Select All
                  </button>
                  {selectedForms.length > 0 ? (
                    <button
                      type="button"
                      onClick={deleteSelectedForms}
                      disabled={isBusy}
                      style={{ 
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        borderRadius: '999px',
                        border: 'none',
                        background: '#ef4444',
                        color: '#ffffff',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        fontWeight: 500
                      }}
                    >
                      Delete Selected {selectedForms.length} Form{selectedForms.length !== 1 ? 's' : ''}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={deleteAllForms}
                      disabled={isBusy}
                      style={{ 
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        borderRadius: '999px',
                        border: 'none',
                        background: '#ef4444',
                        color: '#ffffff',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        fontWeight: 500
                      }}
                    >
                      Delete All {forms.length} Form{forms.length !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <hr style={{ margin: '0.75rem 0', border: 'none', borderTop: '1px dashed #e2e8f0' }} />
          {forms.map((form) => (
            <div key={form.id} className="submission-block">
              <div className="submission-header">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedForms.includes(form.id)}
                    onChange={() => handleSelectForm(form.id)}
                    style={{ marginTop: '0.25rem', cursor: 'pointer' }}
                  />
                  <div>
                    <h4 className="submission-title">
                      Form: {form.title} (#{form.id})
                    </h4>
                    <div className="submission-meta">
                      Created: {form.created_at ? new Date(form.created_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="submission-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => navigate(`/admin/forms/${form.id}/submissions`)}
                    disabled={isBusy}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button-danger"
                    onClick={() => deleteForm(form.id)}
                    disabled={isBusy}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminFormsPage;

