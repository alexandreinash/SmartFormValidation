import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

function FormSubmissionsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [formInfo, setFormInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('all'); // all | ai_flagged | ai_not_evaluated

  useEffect(() => {
    const load = async () => {
      if (!user || user.role !== 'admin') {
        setStatus('You must be logged in as an administrator to view submissions.');
        return;
      }
      try {
        const res = await api.get(`/api/submissions/form/${id}`);
        setFormInfo(res.data.data.form);
        setSubmissions(res.data.data.submissions || []);
      } catch (err) {
        setStatus('Failed to load submissions.');
      }
    };
    load();
  }, [id]);

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

  const totalSubmissions = submissions.length;
  const totalAiFlagged = submissions.reduce(
    (acc, sub) =>
      acc +
      sub.answers.filter(
        (ans) => ans.ai_sentiment_flag || ans.ai_entity_flag
      ).length,
    0
  );
  const totalAiNotEvaluated = submissions.reduce(
    (acc, sub) => acc + sub.answers.filter((ans) => ans.ai_not_evaluated).length,
    0
  );

  return (
    <div className="page-heading">
      <div className="page-header">
        <div>
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
              <span className="filter-label">Show answers</span>
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
              <div className="summary-label">Total submissions</div>
              <div className="summary-value">{totalSubmissions}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">AI‑flagged answers</div>
              <div className="summary-value highlight-danger">
                {totalAiFlagged}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Not evaluated by AI</div>
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
            <h3>All submissions</h3>
            <p className="summary-subtitle">
              Showing {filteredSubmissions.length} submission
              {filteredSubmissions.length !== 1 && 's'} with current filter.
            </p>
          </div>
          {filteredSubmissions.map((sub) => (
            <div key={sub.id} className="submission-block">
              <div className="submission-header">
                <div>
                  <h4 className="submission-title">
                    Submission #{sub.id}
                  </h4>
                  <div className="submission-meta">
                    {new Date(sub.submitted_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <ul className="answers-list">
                {(sub.answers || []).map((ans) => (
                  <li key={ans.id} className="answer-row">
                    <div className="answer-label">
                      {ans.field?.label || 'Field'}
                    </div>
                    <div className="answer-value">
                      {ans.value || <span className="answer-empty">No answer</span>}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormSubmissionsPage;



