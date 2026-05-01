import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

function formatGrade(score, maxScore) {
  if (score === null || score === undefined || maxScore === null || maxScore === undefined) {
    return 'Not graded yet';
  }

  return `${Number(score).toFixed(2)} / ${Number(maxScore).toFixed(2)}`;
}

function formatStatusLabel(status) {
  if (!status) {
    return 'Pending Review';
  }

  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function StudentSubmissionHistoryPage() {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const loadSubmissions = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/submissions/student/${studentId}/history`);
        setSubmissions(response.data.data?.submissions || []);
        setStatus('');
      } catch (error) {
        setStatus(error.response?.data?.message || 'Failed to load student submissions.');
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [navigate, studentId, user]);

  const student = useMemo(() => {
    const stateStudent = location.state?.student;
    if (stateStudent) {
      return stateStudent;
    }

    const submitter = submissions[0]?.submitter;
    if (submitter) {
      return submitter;
    }

    return {
      id: studentId,
      username: `Student #${studentId}`,
      email: '',
    };
  }, [location.state, studentId, submissions]);

  const totalPublished = submissions.filter((submission) => submission.grading?.gradeStatus === 'published').length;
  const totalReviewed = submissions.filter((submission) => submission.grading?.gradeStatus === 'reviewed').length;
  const totalPending = submissions.filter((submission) => submission.grading?.gradeStatus !== 'published' && submission.grading?.gradeStatus !== 'reviewed').length;

  return (
    <div className="page-heading">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="button button-secondary"
            style={{ marginBottom: '0.75rem' }}
            onClick={() => navigate('/admin/users')}
          >
            ← Back to Users
          </button>
          <div className="page-kicker">Student Activity</div>
          <h2 className="page-title">{student.username || student.email || `Student #${studentId}`}</h2>
          <p className="page-subtitle">
            {student.email || 'Student account'} submission history, grading progress, and published results.
          </p>
        </div>
      </div>

      {status && <p className="status">{status}</p>}

      {loading ? (
        <div className="card">
          <p>Loading submissions...</p>
        </div>
      ) : (
        <>
          <div className="card submissions-summary">
            <div className="summary-grid summary-grid-wide">
              <div className="summary-card">
                <div className="summary-label">Total Submissions</div>
                <div className="summary-value">{submissions.length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Pending Review</div>
                <div className="summary-value highlight-muted">{totalPending}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Reviewed</div>
                <div className="summary-value">{totalReviewed}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Published</div>
                <div className="summary-value highlight-success">{totalPublished}</div>
              </div>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="card empty-state">
              <h3>No submissions yet</h3>
              <p>This student account has not submitted any forms visible to your account.</p>
            </div>
          ) : (
            <div className="card submissions-list">
              <div className="submissions-header">
                <div>
                  <h3>Submitted forms</h3>
                  <p className="summary-subtitle">Review what this student has submitted across your accessible forms.</p>
                </div>
              </div>

              {submissions.map((submission) => {
                const grading = submission.grading || {};
                const isExpanded = expandedSubmissionId === submission.id;

                return (
                  <div key={submission.id} className="submission-block submission-block-detailed">
                    <div className="submission-header submission-header-stacked">
                      <div className="submission-title-group">
                        <div>
                          <h4 className="submission-title submission-title-rich">
                            {submission.form?.title || `Form #${submission.form_id}`}
                            <span className={`status-pill status-pill-${grading.gradeStatus || 'pending_review'}`}>
                              {formatStatusLabel(grading.gradeStatus || 'pending_review')}
                            </span>
                          </h4>
                          <div className="submission-meta">
                            <strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}
                            <br />
                            <strong>Final Grade:</strong> {formatGrade(grading.finalGradeScore, grading.finalGradeMaxScore)}
                            <br />
                            <strong>Published:</strong> {grading.publishedAt ? new Date(grading.publishedAt).toLocaleString() : 'Not yet'}
                          </div>
                        </div>
                      </div>

                      <div className="submission-actions">
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => setExpandedSubmissionId(isExpanded ? null : submission.id)}
                        >
                          {isExpanded ? 'Hide Answers' : 'Show Answers'}
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => navigate('/admin/submissions/all')}
                        >
                          Open Review Queue
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="submission-review-body">
                        <section className="grading-review-card">
                          <div className="grading-review-header">
                            <div>
                              <h5>Submission details</h5>
                              <p>Teacher-facing view of the answers and the current grading state.</p>
                            </div>
                          </div>

                          <div className="grading-feedback-grid">
                            <article className="grading-feedback-card">
                              <span className="grading-feedback-label">Current Feedback</span>
                              <div className="grading-feedback-text">
                                {grading.finalFeedback || 'No feedback has been saved for this submission yet.'}
                              </div>
                            </article>
                          </div>

                          <ul className="answers-list">
                            {(submission.answers || []).map((answer) => (
                              <li key={answer.id} className="answer-row answer-row-detailed">
                                <div className="answer-label answer-label-stacked">
                                  <span>{answer.field?.label || 'Field'}</span>
                                </div>
                                <div className="answer-value">
                                  <div className="answer-card-surface">
                                    {answer.value || <span className="answer-empty">No answer</span>}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}