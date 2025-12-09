import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

function AnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [formAnalytics, setFormAnalytics] = useState(null);
  const formAnalyticsRef = useRef(null);
  const [openSubmissionId, setOpenSubmissionId] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    loadAnalytics();
  }, [user, navigate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/analytics');
      setAnalytics(res.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load analytics data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFormAnalytics = async (formId) => {
    try {
      setSelectedFormId(formId);
      const res = await api.get(`/api/analytics/forms/${formId}`);
      setFormAnalytics(res.data.data);
    } catch (err) {
      console.error('Failed to load form analytics:', err);
    }
  };

  // Smooth scroll helper — 400ms with ease-in-out-like curve
  const smoothScrollTo = (targetY, duration = 400) => {
    const startY = window.pageYOffset;
    const diff = targetY - startY;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const time = timestamp - startTime;
      const progress = Math.min(time / duration, 1);
      // easeInOutCubic
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, Math.round(startY + diff * eased));
      if (time < duration) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  // When formAnalytics is set, scroll to the analytics panel smoothly
  useEffect(() => {
    if (formAnalytics && formAnalyticsRef.current) {
      // compute target position (slightly above element)
      const rect = formAnalyticsRef.current.getBoundingClientRect();
      const headerOffset = 24; // small offset so panel isn't flush to top
      const targetY = window.pageYOffset + rect.top - headerOffset;
      smoothScrollTo(targetY, 400);
    }
  }, [formAnalytics]);

  if (loading) {
    return (
      <div className="page-heading">
        <div className="card">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-heading">
        <div className="card">
          <p className="status" style={{ color: '#ef4444' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-heading">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="button button-secondary"
            style={{ marginBottom: '0.75rem' }}
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <div className="page-kicker">Analytics Dashboard</div>
          <h2 className="page-title">System Analytics</h2>
        </div>
      </div>

      {analytics && (
        <>
          {/* Overview Cards */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Overview</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Total Forms</div>
                <div className="summary-value">{analytics.overview.totalForms}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Submissions</div>
                <div className="summary-value">{analytics.overview.totalSubmissions}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Users</div>
                <div className="summary-value">{analytics.overview.totalUsers}</div>
              </div>
            </div>
          </div>

          {/* AI Validation Stats (show 'Not tracked' when backend doesn't provide these values) */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>AI Validation Statistics</h3>
            <div className="summary-grid">
              {analytics.aiValidation && (typeof analytics.aiValidation.totalEvaluated === 'number') ? (
                <>
                  <div className="summary-card">
                    <div className="summary-label">Total Evaluated</div>
                    <div className="summary-value">{analytics.aiValidation.totalEvaluated}</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Sentiment Flagged</div>
                    <div className="summary-value highlight-danger">
                      {analytics.aiValidation.sentimentFlagged}
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Entity Flagged</div>
                    <div className="summary-value highlight-danger">
                      {analytics.aiValidation.entityFlagged}
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Not Evaluated</div>
                    <div className="summary-value highlight-muted">
                      {analytics.aiValidation.notEvaluated}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="summary-card">
                    <div className="summary-label">Total Evaluated</div>
                    <div className="summary-value">Not tracked</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Sentiment Flagged</div>
                    <div className="summary-value">Not tracked</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Entity Flagged</div>
                    <div className="summary-value">Not tracked</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-label">Not Evaluated</div>
                    <div className="summary-value">Not tracked</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top Forms */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Top Forms by Submissions</h3>
            {analytics.topForms.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Form Title</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Submissions</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topForms.map((form) => (
                    <tr key={form.formId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '0.75rem' }}>{form.formTitle}</td>
                      <td style={{ padding: '0.75rem' }}>{form.submissionCount}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => loadFormAnalytics(form.formId)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No forms with submissions yet.</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Recent Activity</h3>
            {analytics.recentActivity.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {analytics.recentActivity.map((activity) => (
                  <li
                    key={activity.id}
                    style={{
                      padding: '0.75rem',
                      borderBottom: '1px solid #f5f5f5',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <strong>Submission #{activity.id}</strong> - {activity.formTitle}
                    </div>
                    <div style={{ color: '#999' }}>
                      {new Date(activity.submittedAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent activity.</p>
            )}
          </div>

          {/* Form-specific Analytics */}
          {formAnalytics && (
            <div ref={formAnalyticsRef} className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>
                Analytics for: {formAnalytics.form.title}
              </h3>
              {/* 'Back to System Analytics' button removed to simplify UI */}

              <div className="summary-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="summary-card">
                  <div className="summary-label">Total Submissions</div>
                  <div className="summary-value">{formAnalytics.overview.totalSubmissions}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Sentiment Flagged</div>
                  <div className="summary-value highlight-danger">
                    {formAnalytics.aiValidation && typeof formAnalytics.aiValidation.sentimentFlagged === 'number' ? formAnalytics.aiValidation.sentimentFlagged : 'Not tracked'}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Entity Flagged</div>
                  <div className="summary-value highlight-danger">
                    {formAnalytics.aiValidation && typeof formAnalytics.aiValidation.entityFlagged === 'number' ? formAnalytics.aiValidation.entityFlagged : 'Not tracked'}
                  </div>
                </div>
              </div>

              {formAnalytics.fieldStatistics.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '1rem' }}>Field Statistics</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>Field</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>Responses</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>Flagged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formAnalytics.fieldStatistics.map((field) => (
                        <tr key={field.fieldId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '0.75rem' }}>{field.fieldLabel}</td>
                          <td style={{ padding: '0.75rem' }}>{field.fieldType}</td>
                          <td style={{ padding: '0.75rem' }}>{field.totalResponses}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {field.flaggedCount > 0 ? (
                              <span className="flag">{field.flaggedCount}</span>
                            ) : (
                              '0'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Submissions List */}
              {formAnalytics.submissions && formAnalytics.submissions.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>Recent Submissions</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>Submission ID</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>Submitted At</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem' }}>Answers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formAnalytics.submissions.map((sub) => (
                        <React.Fragment key={sub.id}>
                          <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                            <td style={{ padding: '0.75rem' }}>{sub.id}</td>
                            <td style={{ padding: '0.75rem' }}>{new Date(sub.submittedAt).toLocaleString()}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <button
                                type="button"
                                className="button button-secondary"
                                onClick={() => setOpenSubmissionId(openSubmissionId === sub.id ? null : sub.id)}
                              >
                                {openSubmissionId === sub.id ? 'Hide Answers' : 'View Answers'}
                              </button>
                            </td>
                          </tr>

                          {openSubmissionId === sub.id && (
                            <tr>
                              <td colSpan={3} style={{ padding: '0.75rem', background: '#fafafa' }}>
                                <table style={{ width: '100%' }}>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Field</th>
                                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Value</th>
                                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>AI Flags</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sub.answers.map((a, idx) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '0.5rem' }}>{a.fieldLabel || a.fieldId}</td>
                                        <td style={{ padding: '0.5rem', whiteSpace: 'pre-wrap' }}>{a.value}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                          {a.aiNotEvaluated ? (
                                            <span style={{ color: '#999' }}>Not evaluated</span>
                                          ) : (
                                            <>
                                              {a.aiSentimentFlag ? <span style={{ color: '#ef4444' }}>Sentiment</span> : null}
                                              {a.aiEntityFlag ? <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>Entity</span> : null}
                                              {!a.aiSentimentFlag && !a.aiEntityFlag ? <span style={{ color: '#16a34a' }}>OK</span> : null}
                                            </>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;

