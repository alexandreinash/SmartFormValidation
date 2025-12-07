import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';

function FormSubmissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [formInfo, setFormInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('all'); // all | ai_flagged | ai_not_evaluated
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [isBusy, setIsBusy] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);

  const isAllSubmissions = location.pathname === '/admin/submissions/all';

  // WebSocket for real-time updates
  const { isConnected, lastMessage } = useWebSocket(
    user?.role === 'admin' ? ['admin', id ? `form-${id}` : null].filter(Boolean) : []
  );

  const loadSubmissions = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setStatus('You must be logged in as an administrator to view submissions.');
      return;
    }
    try {
      if (isAllSubmissions) {
        const res = await api.get('/api/submissions/all');
        setSubmissions(res.data.data.submissions || []);
        setFormInfo(null);
      } else {
        const res = await api.get(`/api/submissions/form/${id}`);
        setFormInfo(res.data.data.form);
        setSubmissions(res.data.data.submissions || []);
      }
      setStatus('');
    } catch (err) {
      setStatus('Failed to load submissions.');
    }
  }, [id, user, isAllSubmissions]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'new-submission') {
      const { formId, submissionId } = lastMessage.data;
      if (isAllSubmissions || formId === parseInt(id)) {
        // Reload submissions when a new one arrives
        loadSubmissions();
        setStatus(`New submission #${submissionId} received!`);
        setTimeout(() => setStatus(''), 3000);
      }
    }
  }, [lastMessage, id, isAllSubmissions]);

  const startEdit = (submission) => {
    const values = {};
    (submission.answers || []).forEach((ans) => {
      values[ans.field_id] = ans.value || '';
    });
    setEditingId(submission.id);
    setEditValues(values);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleEditChange = (fieldId, value) => {
    setEditValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const saveEdit = async (submissionId) => {
    try {
      setIsBusy(true);
      await api.put(`/api/submissions/${submissionId}`, {
        values: editValues,
      });

      // Refresh list after successful update
      await loadSubmissions();
      setStatus('Submission updated.');
      setEditingId(null);
      setEditValues({});
    } catch (err) {
      setStatus('Failed to update submission.');
    } finally {
      setIsBusy(false);
    }
  };

  const deleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return;
    }
    try {
      setIsBusy(true);
      await api.delete(`/api/submissions/${submissionId}`);
      // Reload submissions to get updated list
      await loadSubmissions();
      setSelectedSubmissions((prev) => prev.filter((id) => id !== submissionId));
      setStatus('Submission deleted.');
    } catch (err) {
      setStatus('Failed to delete submission.');
    } finally {
      setIsBusy(false);
    }
  };

  const deleteAllSubmissions = async () => {
    const count = submissions.length;
    if (!window.confirm(`Are you sure you want to delete all ${count} submission(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      setIsBusy(true);
      await api.delete('/api/submissions/all');
      // Reload submissions to get updated list (will be empty)
      await loadSubmissions();
      setSelectedSubmissions([]);
      setStatus(`All ${count} submission(s) deleted.`);
    } catch (err) {
      setStatus('Failed to delete all submissions.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectSubmission = (submissionId) => {
    setSelectedSubmissions((prev) =>
      prev.includes(submissionId)
        ? prev.filter((id) => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.length === filteredSubmissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(filteredSubmissions.map((sub) => sub.id));
    }
  };

  const deleteSelectedSubmissions = async () => {
    if (selectedSubmissions.length === 0) return;
    const count = selectedSubmissions.length;
    if (!window.confirm(`Are you sure you want to delete ${count} selected submission(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      setIsBusy(true);
      await Promise.all(
        selectedSubmissions.map((id) => api.delete(`/api/submissions/${id}`))
      );
      // Reload submissions to get updated list
      await loadSubmissions();
      setSelectedSubmissions([]);
      setStatus(`${count} submission(s) deleted.`);
    } catch (err) {
      setStatus('Failed to delete selected submissions.');
    } finally {
      setIsBusy(false);
    }
  };

  const filteredSubmissions = submissions.map((sub) => ({
    ...sub,
    answers:
      filter === 'all'
        ? sub.answers
        : sub.answers.filter((ans) =>
            filter === 'ai_flagged'
              ? ans.ai_sentiment_flag || ans.ai_entity_flag
              : ans.ai_not_evaluated
          ),
  }));

  const isAllSelected = filteredSubmissions.length > 0 && selectedSubmissions.length === filteredSubmissions.length;

  const totalSubmissions = submissions.length;
  const totalAiFlagged = submissions.reduce(
    (acc, sub) =>
      acc +
      (sub.answers || []).filter(
        (ans) => ans.ai_sentiment_flag || ans.ai_entity_flag
      ).length,
    0
  );
  const totalAiNotEvaluated = submissions.reduce(
    (acc, sub) => acc + (sub.answers || []).filter((ans) => ans.ai_not_evaluated).length,
    0
  );

  return (
    <div className="page-heading">
      <div className="page-header">
        <div>
          {isAllSubmissions ? (
            <>
              <button
                type="button"
                className="button button-secondary"
                style={{ marginBottom: '0.75rem' }}
                onClick={() => navigate('/admin')}
              >
                ← Back
              </button>
              <h2 className="page-title" style={{ color: '#94a3b8', fontWeight: 400 }}>
                Viewing all submissions from all forms
              </h2>
            </>
          ) : (
            <>
              <button
                type="button"
                className="button button-secondary"
                style={{ marginBottom: '0.75rem' }}
                onClick={() => navigate(-1)}
              >
                ← Back
              </button>
              <div className="page-kicker">Form submissions</div>
              <h2 className="page-title">
                {formInfo?.title || 'Form'}{' '}
                {formInfo?.id && (
                  <span className="badge badge-soft">#{formInfo.id}</span>
                )}
              </h2>
              {formInfo?.description && (
                <p className="page-subtitle">{formInfo.description}</p>
              )}
            </>
          )}
        </div>
      </div>

      {status && <p className="status">{status}</p>}

      {submissions.length > 0 && (
        <div className="card submissions-summary">
          <div className="summary-header">
            <div>
              <h3>Overview</h3>
              <p className="summary-subtitle">
                High-level snapshot of how this form is performing.
              </p>
            </div>
            <div className="filter-group">
              <span className="filter-label">SHOW ANSWERS</span>
              <div className="filter-chips" role="tablist" aria-label="Filter answers">
                <button
                  type="button"
                  className={
                    filter === 'all'
                      ? 'chip chip-active'
                      : 'chip'
                  }
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={
                    filter === 'ai_flagged'
                      ? 'chip chip-active chip-warning'
                      : 'chip chip-warning'
                  }
                  onClick={() => setFilter('ai_flagged')}
                >
                  AI‑flagged
                  {totalAiFlagged > 0 && (
                    <span className="chip-count">{totalAiFlagged}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={
                    filter === 'ai_not_evaluated'
                      ? 'chip chip-active chip-muted'
                      : 'chip chip-muted'
                  }
                  onClick={() => setFilter('ai_not_evaluated')}
                >
                  AI not evaluated
                  {totalAiNotEvaluated > 0 && (
                    <span className="chip-count">
                      {totalAiNotEvaluated}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">TOTAL SUBMISSIONS</div>
              <div className="summary-value">{totalSubmissions}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">AI-FLAGGED ANSWERS</div>
              <div className="summary-value highlight-danger">
                {totalAiFlagged}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">NOT EVALUATED BY AI</div>
              <div className="summary-value highlight-muted">
                {totalAiNotEvaluated}
              </div>
            </div>
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="card empty-state">
          <h3>No submissions yet</h3>
          <p>
            This just means nobody has filled out this form yet. Share the form
            link with your users; once they start submitting responses, every
            submission and its AI review status will appear here.
          </p>
        </div>
      ) : (
        <div className="card submissions-list">
          <div className="submissions-header">
            <div style={{ flex: 1 }}>
              <h3>All submissions</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                <p className="summary-subtitle" style={{ margin: 0 }}>
                  Showing {filteredSubmissions.length} submission
                  {filteredSubmissions.length !== 1 && 's'} with current filter.
                </p>
                {isAllSubmissions && submissions.length > 0 && (
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
                    {selectedSubmissions.length > 0 ? (
                      <button
                        type="button"
                        onClick={deleteSelectedSubmissions}
                        disabled={isBusy}
                        style={{ 
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap',
                          borderRadius: '999px',
                          border: '1px solid rgba(248, 113, 113, 0.7)',
                          background: '#ef4444',
                          color: '#ffffff',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.2s',
                          fontFamily: 'inherit',
                          fontWeight: 500
                        }}
                      >
                        Delete Selected {selectedSubmissions.length} Submission{selectedSubmissions.length !== 1 ? 's' : ''}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={deleteAllSubmissions}
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
                        Delete All {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <hr style={{ margin: '0.75rem 0', border: 'none', borderTop: '1px dashed #e2e8f0' }} />
          {filteredSubmissions.map((sub, index) => {
            // Get the index from the original submissions array to maintain sequential numbering
            // Always start at 1, not 0
            const submissionIndex = submissions.findIndex(s => s.id === sub.id);
            const submissionNumber = submissionIndex >= 0 ? submissionIndex + 1 : index + 1;
            return (
            <div key={sub.id} className="submission-block">
              <div className="submission-header">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedSubmissions.includes(sub.id)}
                    onChange={() => handleSelectSubmission(sub.id)}
                    style={{ marginTop: '0.25rem', cursor: 'pointer' }}
                  />
                  <div>
                    <h4 className="submission-title">
                      Submission #{submissionNumber}
                    </h4>
                    <div className="submission-meta">
                      {isAllSubmissions && sub.form && (
                        <>Form: {sub.form.title} (#{sub.form.id})<br /></>
                      )}
                      {new Date(sub.submitted_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="submission-actions">
                  {editingId === sub.id ? (
                    <>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={cancelEdit}
                        disabled={isBusy}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="button button-danger"
                        onClick={() => saveEdit(sub.id)}
                        disabled={isBusy}
                      >
                        Save changes
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => startEdit(sub)}
                        disabled={isBusy}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button-danger"
                        onClick={() => deleteSubmission(sub.id)}
                        disabled={isBusy}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isAllSubmissions && (
                <div style={{ marginTop: '0.75rem', paddingLeft: '1.75rem' }}>
                  {editingId === sub.id ? (
                    <ul className="answers-list">
                      {(sub.answers || []).map((ans) => (
                        <li key={ans.id} className="answer-row">
                          <div className="answer-label">
                            {ans.field?.label || 'Field'}
                          </div>
                          <div className="answer-value">
                            <textarea
                              className="input"
                              value={editValues[ans.field_id] ?? ''}
                              onChange={(e) =>
                                handleEditChange(ans.field_id, e.target.value)
                              }
                              rows={2}
                              style={{ width: '100%', resize: 'vertical' }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <textarea
                      className="input"
                      value={(sub.answers || []).map((ans) => ans.value).filter(Boolean).join('\n')}
                      readOnly
                      rows={2}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  )}
                </div>
              )}
              {!isAllSubmissions && (
                <ul className="answers-list">
                  {(sub.answers || []).map((ans) => (
                    <li key={ans.id} className="answer-row">
                      <div className="answer-label">
                        {ans.field?.label || 'Field'}
                      </div>
                      <div className="answer-value">
                        {editingId === sub.id ? (
                          <textarea
                            className="input"
                            value={editValues[ans.field_id] ?? ''}
                            onChange={(e) =>
                              handleEditChange(ans.field_id, e.target.value)
                            }
                            rows={2}
                          />
                        ) : (
                          ans.value || (
                            <span className="answer-empty">No answer</span>
                          )
                        )}
                        {(ans.ai_sentiment_flag || ans.ai_entity_flag) && (
                          <span className="flag">AI flagged for review</span>
                        )}
                        {ans.ai_not_evaluated && (
                          <span className="flag secondary">
                            AI not evaluated
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}

export default FormSubmissionsPage;



