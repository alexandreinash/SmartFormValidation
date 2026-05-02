import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';

function parseAiErrors(aiErrors) {
  if (!aiErrors) {
    return [];
  }

  if (Array.isArray(aiErrors)) {
    return aiErrors;
  }

  try {
    const parsed = JSON.parse(aiErrors);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isAiFlaggedFormTitle(title) {
  return /\bai-flag\b/i.test(String(title || ''));
}

function hasAiIssues(submission, fallbackFormTitle = '') {
  const formTitle = submission.form?.title || fallbackFormTitle;
  if (isAiFlaggedFormTitle(formTitle)) {
    return true;
  }

  return (submission.answers || []).some((answer) => {
    const parsedErrors = parseAiErrors(answer.ai_errors);
    return parsedErrors.length > 0 || answer.ai_sentiment_flag || answer.ai_entity_flag;
  });
}

function hasAiNotEvaluated(submission) {
  return (submission.answers || []).some((answer) => answer.ai_not_evaluated);
}

function formatGrade(score, maxScore) {
  if (score === null || score === undefined || maxScore === null || maxScore === undefined) {
    return 'Not ready';
  }

  return `${Number(score).toFixed(2)} / ${Number(maxScore).toFixed(2)}`;
}

function formatPercentage(score, maxScore) {
  if (!maxScore) {
    return '0%';
  }

  return `${Math.round((Number(score) / Number(maxScore)) * 100)}%`;
}

function formatPercentageForExport(score, maxScore) {
  if (score === null || score === undefined || maxScore === null || maxScore === undefined || Number(maxScore) === 0) {
    return '';
  }

  return `${Math.round((Number(score) / Number(maxScore)) * 100)}%`;
}

function formatNumericGrade(score) {
  if (score === null || score === undefined || score === '') {
    return '';
  }

  return Number(score).toFixed(2);
}

function formatDateTimeParts(value) {
  if (!value) {
    return { date: '', time: '', display: '' };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '', display: '' };
  }

  const date = parsed.toLocaleDateString();
  const time = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    date,
    time,
    display: `${date} ${time}`,
  };
}

function formatStatusLabel(status) {
  return String(status || 'pending_review')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getSubmissionTimestamp(submission) {
  const parsed = new Date(submission?.submitted_at || 0).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getFinalGradeRatio(submission) {
  const grading = submission.grading || {};
  if (!grading.finalGradeMaxScore) {
    return -1;
  }

  return Number(grading.finalGradeScore || 0) / Number(grading.finalGradeMaxScore || 1);
}

function getReviewPriority(submission, fallbackFormTitle = '') {
  const gradeStatus = submission.grading?.gradeStatus || 'pending_review';

  if (hasAiNotEvaluated(submission)) {
    return 4;
  }

  if (hasAiIssues(submission, fallbackFormTitle)) {
    return 3;
  }

  if (gradeStatus !== 'published') {
    return 2;
  }

  return 1;
}

function getDateRangeStart(dateRange) {
  if (dateRange === 'all_time') {
    return null;
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (dateRange === 'today') {
    return start;
  }

  if (dateRange === 'last_7_days') {
    start.setDate(start.getDate() - 6);
    return start;
  }

  if (dateRange === 'last_30_days') {
    start.setDate(start.getDate() - 29);
    return start;
  }

  return null;
}

function isSubmissionWithinDateRange(submission, dateRange) {
  const start = getDateRangeStart(dateRange);
  if (!start) {
    return true;
  }

  const submittedAt = new Date(submission?.submitted_at || 0);
  if (Number.isNaN(submittedAt.getTime())) {
    return false;
  }

  return submittedAt >= start;
}

function normalizeFeedbackText(value) {
  return String(value || '')
    .replace(/\r?\n+/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim();
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildGradeSheetRows(submissions, isAllSubmissions) {
  return submissions.map((submission) => {
    const grading = submission.grading || {};
    const submittedAt = formatDateTimeParts(submission.submitted_at);
    const publishedAt = formatDateTimeParts(grading.publishedAt);
    return {
      submissionId: submission.id,
      formTitle: isAllSubmissions ? submission.form?.title || 'Unknown form' : 'Current form',
      student: submission.submitter?.email || 'Anonymous',
      submittedAt: submittedAt.display,
      submittedDate: submittedAt.date,
      submittedTime: submittedAt.time,
      aiDraft: formatGrade(grading.aiGradeScore, grading.aiGradeMaxScore),
      aiScore: formatNumericGrade(grading.aiGradeScore),
      aiMaxScore: formatNumericGrade(grading.aiGradeMaxScore),
      aiPercentage: formatPercentageForExport(grading.aiGradeScore, grading.aiGradeMaxScore),
      finalGrade: formatGrade(grading.finalGradeScore, grading.finalGradeMaxScore),
      finalScore: formatNumericGrade(grading.finalGradeScore),
      finalMaxScore: formatNumericGrade(grading.finalGradeMaxScore),
      finalPercentage: formatPercentageForExport(grading.finalGradeScore, grading.finalGradeMaxScore),
      reviewStatus: grading.gradeStatus || 'pending_review',
      reviewStatusLabel: formatStatusLabel(grading.gradeStatus || 'pending_review'),
      publishedAt: publishedAt.display,
      publishedDate: publishedAt.date,
      publishedTime: publishedAt.time,
      feedback: normalizeFeedbackText(grading.finalFeedback),
    };
  });
}

function downloadGradeSheetCsv(rows) {
  const headers = [
    'Submission ID',
    'Form',
    'Student',
    'Submitted Date',
    'Submitted Time',
    'Review Status',
    'AI Score',
    'AI Max Score',
    'AI Percentage',
    'Final Score',
    'Final Max Score',
    'Final Percentage',
    'Published Date',
    'Published Time',
    'Feedback',
  ];
  const lines = ['sep=,', headers.map(csvEscape).join(',')];

  rows.forEach((row) => {
    lines.push([
      row.submissionId,
      row.formTitle,
      row.student,
      row.submittedDate,
      row.submittedTime,
      row.reviewStatusLabel,
      row.aiScore,
      row.aiMaxScore,
      row.aiPercentage,
      row.finalScore,
      row.finalMaxScore,
      row.finalPercentage,
      row.publishedDate,
      row.publishedTime,
      row.feedback,
    ].map(csvEscape).join(','));
  });

  const blob = new Blob([`\ufeff${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `graded-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function printGradeSheet(rows) {
  const bodyRows = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.submissionId)}</td>
      <td>${escapeHtml(row.formTitle)}</td>
      <td>${escapeHtml(row.student)}</td>
      <td>${escapeHtml(row.submittedAt)}</td>
      <td>${escapeHtml(row.finalGrade)}</td>
      <td>${escapeHtml(row.finalPercentage)}</td>
      <td>${escapeHtml(row.aiDraft)}</td>
      <td>${escapeHtml(row.reviewStatusLabel)}</td>
      <td>${escapeHtml(row.publishedAt)}</td>
      <td>${escapeHtml(row.feedback)}</td>
    </tr>
  `).join('');

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Grade Sheet</title>
        <style>
          @page { size: landscape; margin: 12mm; }
          body {
            font-family: "Segoe UI", Arial, sans-serif;
            margin: 0;
            color: #111827;
            background: #ffffff;
          }
          .sheet {
            padding: 24px;
          }
          .sheet-header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: flex-end;
            margin-bottom: 18px;
          }
          h1 {
            margin: 0 0 6px;
            font-size: 24px;
          }
          .subtitle {
            margin: 0;
            color: #4b5563;
            font-size: 13px;
          }
          .count-badge {
            padding: 8px 12px;
            border-radius: 999px;
            background: #f3f4f6;
            color: #1f2937;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 9px;
            font-size: 11px;
            vertical-align: top;
            text-align: left;
            word-break: break-word;
          }
          th {
            background: #f8fafc;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #334155;
          }
          tbody tr:nth-child(even) {
            background: #fcfcfd;
          }
          .feedback-cell {
            white-space: normal;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="sheet-header">
            <div>
              <h1>Teacher Grade Sheet</h1>
              <p class="subtitle">Generated ${escapeHtml(new Date().toLocaleString())}</p>
            </div>
            <div class="count-badge">${escapeHtml(rows.length)} submission${rows.length === 1 ? '' : 's'}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 6%;">ID</th>
                <th style="width: 13%;">Form</th>
                <th style="width: 14%;">Student</th>
                <th style="width: 12%;">Submitted</th>
                <th style="width: 9%;">Final Grade</th>
                <th style="width: 8%;">Final %</th>
                <th style="width: 9%;">AI Draft</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 12%;">Published</th>
                <th style="width: 27%;">Feedback</th>
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.focus();
              window.print();
            }, 250);
          });

          window.addEventListener('afterprint', () => {
            window.close();
          });
        <\/script>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank', 'width=1180,height=760');
  if (!printWindow) {
    window.URL.revokeObjectURL(url);
    return false;
  }

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 60000);

  return true;
}

export default function FormSubmissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [formInfo, setFormInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('pending_first');
  const [dateRange, setDateRange] = useState('all_time');
  const [formFilter, setFormFilter] = useState('all');
  const [exportAction, setExportAction] = useState('');
  const [viewingId, setViewingId] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [activeSubmissionAction, setActiveSubmissionAction] = useState({ submissionId: null, type: '' });
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});

  const isAllSubmissions = location.pathname === '/admin/submissions/all';

  const { lastMessage } = useWebSocket(
    user?.role === 'admin' ? ['admin', id ? `form-${id}` : null].filter(Boolean) : []
  );

  const hydrateReviewDrafts = useCallback((items) => {
    const nextDrafts = {};
    items.forEach((submission) => {
      const grading = submission.grading || {};
      nextDrafts[submission.id] = {
        teacherGradeScore: grading.teacherGradeScore ?? '',
        teacherGradeMaxScore: grading.teacherGradeMaxScore ?? grading.finalGradeMaxScore ?? '',
        teacherFeedback: grading.teacherFeedback || '',
      };
    });
    setReviewDrafts(nextDrafts);
  }, []);

  const loadSubmissions = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setStatus('You must be logged in as an administrator to view submissions.');
      return;
    }

    try {
      if (isAllSubmissions) {
        const response = await api.get('/api/submissions/all');
        const items = response.data.data.submissions || [];
        setSubmissions(items);
        setFormInfo(null);
        hydrateReviewDrafts(items);
      } else {
        const response = await api.get(`/api/submissions/form/${id}`);
        const items = response.data.data.submissions || [];
        setFormInfo(response.data.data.form);
        setSubmissions(items);
        hydrateReviewDrafts(items);
      }
      setStatus('');
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to load submissions.');
    }
  }, [hydrateReviewDrafts, id, isAllSubmissions, user]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'new-submission') {
      return;
    }

    const { formId, submissionId } = lastMessage.data;
    if (isAllSubmissions || formId === Number(id)) {
      loadSubmissions();
      setStatus(`New submission #${submissionId} received.`);
      window.setTimeout(() => setStatus(''), 3000);
    }
  }, [id, isAllSubmissions, lastMessage, loadSubmissions]);

  const availableForms = useMemo(() => {
    if (!isAllSubmissions) {
      return [];
    }

    const uniqueForms = new Map();
    submissions.forEach((submission) => {
      if (submission.form?.id) {
        uniqueForms.set(String(submission.form.id), submission.form.title || `Form #${submission.form.id}`);
      }
    });

    return Array.from(uniqueForms, ([formId, title]) => ({ formId, title }))
      .sort((left, right) => left.title.localeCompare(right.title));
  }, [isAllSubmissions, submissions]);

  const scopedSubmissions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return submissions.filter((submission) => {
      if (isAllSubmissions && formFilter !== 'all' && String(submission.form?.id) !== formFilter) {
        return false;
      }

      if (!isSubmissionWithinDateRange(submission, dateRange)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        `submission ${submission.id}`,
        submission.form?.title,
        submission.submitter?.email,
        submission.submitter?.username,
        formatStatusLabel(submission.grading?.gradeStatus),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [dateRange, formFilter, isAllSubmissions, searchTerm, submissions]);

  const filterCounts = useMemo(() => ({
    all: scopedSubmissions.length,
    pending_review: scopedSubmissions.filter((submission) => submission.grading?.gradeStatus !== 'published').length,
    published: scopedSubmissions.filter((submission) => submission.grading?.gradeStatus === 'published').length,
    ai_flagged: scopedSubmissions.filter((submission) => hasAiIssues(submission, formInfo?.title)).length,
    ai_not_evaluated: scopedSubmissions.filter(hasAiNotEvaluated).length,
  }), [formInfo?.title, scopedSubmissions]);

  const filteredSubmissions = useMemo(() => {
    const nextItems = scopedSubmissions.filter((submission) => {
      if (filter === 'all') {
        return true;
      }
      if (filter === 'ai_flagged') {
        return hasAiIssues(submission, formInfo?.title);
      }
      if (filter === 'ai_not_evaluated') {
        return hasAiNotEvaluated(submission);
      }
      if (filter === 'pending_review') {
        return submission.grading?.gradeStatus !== 'published';
      }
      if (filter === 'published') {
        return submission.grading?.gradeStatus === 'published';
      }
      return true;
    });

    nextItems.sort((left, right) => {
      if (sortBy === 'oldest') {
        return getSubmissionTimestamp(left) - getSubmissionTimestamp(right);
      }

      if (sortBy === 'newest') {
        return getSubmissionTimestamp(right) - getSubmissionTimestamp(left);
      }

      if (sortBy === 'ai_priority') {
        const priorityDifference = getReviewPriority(right, formInfo?.title) - getReviewPriority(left, formInfo?.title);
        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return getSubmissionTimestamp(right) - getSubmissionTimestamp(left);
      }

      if (sortBy === 'highest_score') {
        const ratioDifference = getFinalGradeRatio(right) - getFinalGradeRatio(left);
        if (ratioDifference !== 0) {
          return ratioDifference;
        }

        return getSubmissionTimestamp(right) - getSubmissionTimestamp(left);
      }

      const leftPublished = left.grading?.gradeStatus === 'published';
      const rightPublished = right.grading?.gradeStatus === 'published';
      if (leftPublished !== rightPublished) {
        return leftPublished ? 1 : -1;
      }

      const priorityDifference = getReviewPriority(right, formInfo?.title) - getReviewPriority(left, formInfo?.title);
      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return getSubmissionTimestamp(right) - getSubmissionTimestamp(left);
    });

    return nextItems;
  }, [filter, formInfo?.title, scopedSubmissions, sortBy]);

  useEffect(() => {
    const visibleIds = new Set(filteredSubmissions.map((submission) => submission.id));
    setSelectedSubmissions((current) => {
      const nextSelection = current.filter((submissionId) => visibleIds.has(submissionId));
      return nextSelection.length === current.length ? current : nextSelection;
    });
  }, [filteredSubmissions]);

  useEffect(() => {
    if (!viewingId) {
      return;
    }

    if (!filteredSubmissions.some((submission) => submission.id === viewingId)) {
      setViewingId(null);
      return;
    }

    window.requestAnimationFrame(() => {
      const panel = document.querySelector(`[data-review-panel-id="${viewingId}"]`);
      if (panel && typeof panel.scrollIntoView === 'function') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [filteredSubmissions, viewingId]);

  const totalAiFlagged = submissions.filter((submission) => hasAiIssues(submission, formInfo?.title)).length;
  const totalPending = submissions.filter((submission) => submission.grading?.gradeStatus !== 'published').length;
  const totalAiNotEvaluated = submissions.filter(hasAiNotEvaluated).length;

  const handleReviewChange = (submissionId, field, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [submissionId]: {
        ...current[submissionId],
        [field]: value,
      },
    }));
  };

  const handleSelectSubmission = (submissionId) => {
    setSelectedSubmissions((current) => (
      current.includes(submissionId)
        ? current.filter((item) => item !== submissionId)
        : [...current, submissionId]
    ));
  };

  const deleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      setIsBusy(true);
      await api.delete(`/api/submissions/${submissionId}`);
      setStatus('Submission deleted.');
      setSelectedSubmissions((current) => current.filter((item) => item !== submissionId));
      await loadSubmissions();
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to delete submission.');
    } finally {
      setIsBusy(false);
    }
  };

  const deleteSelectedSubmissions = async () => {
    const count = selectedSubmissions.length;
    if (!count) {
      return;
    }

    if (!window.confirm(`Delete ${count} selected submission(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsBusy(true);
      await Promise.all(selectedSubmissions.map((submissionId) => api.delete(`/api/submissions/${submissionId}`)));
      setSelectedSubmissions([]);
      setStatus(`${count} submission(s) deleted.`);
      await loadSubmissions();
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to delete selected submissions.');
    } finally {
      setIsBusy(false);
    }
  };

  const generateGradeDraft = async (submissionId) => {
    try {
      setIsBusy(true);
      setActiveSubmissionAction({ submissionId, type: 'generate' });
      await api.post(`/api/submissions/${submissionId}/generate-grade`);
      setStatus(`AI grading draft regenerated for submission #${submissionId}.`);
      await loadSubmissions();
      setViewingId(submissionId);
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to generate AI grading draft.');
    } finally {
      setIsBusy(false);
      setActiveSubmissionAction({ submissionId: null, type: '' });
    }
  };

  const saveTeacherReview = async (submissionId) => {
    const payload = reviewDrafts[submissionId] || {};

    try {
      setIsBusy(true);
      await api.put(`/api/submissions/${submissionId}/review-grade`, payload);
      setStatus(`Teacher review saved for submission #${submissionId}.`);
      await loadSubmissions();
      setViewingId(submissionId);
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to save teacher review.');
    } finally {
      setIsBusy(false);
    }
  };

  const publishGrade = async (submissionId) => {
    if (!window.confirm('Publish this grade to the student account?')) {
      return;
    }

    try {
      setIsBusy(true);
      await api.post(`/api/submissions/${submissionId}/publish-grade`);
      setStatus(`Grade published for submission #${submissionId}.`);
      await loadSubmissions();
      setViewingId(submissionId);
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to publish grade.');
    } finally {
      setIsBusy(false);
    }
  };

  const exportRows = buildGradeSheetRows(filteredSubmissions, isAllSubmissions);
  const handleExportAction = (event) => {
    const action = event.target.value;
    setExportAction('');

    if (action === 'csv') {
      downloadGradeSheetCsv(exportRows);
      return;
    }

    if (action === 'print') {
      const printed = printGradeSheet(exportRows);
      if (!printed) {
        setStatus('Pop-up blocked. Allow pop-ups to print the grade sheet.');
      }
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All submissions' },
    { key: 'pending_review', label: 'Pending review' },
    { key: 'published', label: 'Published' },
    { key: 'ai_flagged', label: 'AI flagged' },
    { key: 'ai_not_evaluated', label: 'AI not evaluated' },
  ];
  const selectedFormOption = availableForms.find((form) => form.formId === formFilter);
  const currentReviewIndex = filteredSubmissions.findIndex((submission) => submission.id === viewingId);
  const activeReviewSubmission = currentReviewIndex >= 0 ? filteredSubmissions[currentReviewIndex] : null;

  const openAdjacentReview = (direction) => {
    if (currentReviewIndex < 0) {
      return;
    }

    const nextSubmission = filteredSubmissions[currentReviewIndex + direction];
    if (!nextSubmission) {
      return;
    }

    setViewingId(nextSubmission.id);
  };

  return (
    <div className="page-heading submissions-review-page">
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
              <div className="page-kicker">Teacher Review Workspace</div>
              <h2 className="page-title">All submission reviews</h2>
              <p className="page-subtitle">
                AI drafts, teacher overrides, publication to student accounts, and spreadsheet export all happen here.
              </p>
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
              <div className="page-kicker">Teacher Review Workspace</div>
              <h2 className="page-title">
                {formInfo?.title || 'Form'}{' '}
                {formInfo?.id && <span className="badge badge-soft">#{formInfo.id}</span>}
              </h2>
              <p className="page-subtitle">
                Review AI grading drafts, adjust grades for practical considerations, and publish approved results to students.
              </p>
            </>
          )}
        </div>
      </div>

      {status && <p className="status">{status}</p>}

      {submissions.length > 0 && (
        <div className="card submissions-summary submissions-summary-panel">
          <div className="summary-panel-copy">
            <div className="page-kicker">Review Snapshot</div>
            <h3 className="summary-panel-title">Focus on the submissions that still need teacher action.</h3>
            <p className="summary-subtitle">
              Keep the high-level numbers here, then use the filters below to narrow the review queue.
            </p>
          </div>

          <div className="summary-grid summary-grid-primary">
            <div className="summary-card">
                <div className="summary-label">Total in Queue</div>
                <div className="summary-value">{submissions.length}</div>
              </div>
              <div className="summary-card">
              <div className="summary-label">Pending Review</div>
              <div className="summary-value highlight-muted">{totalPending}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">AI Flagged</div>
              <div className="summary-value highlight-danger">{totalAiFlagged}</div>
            </div>
            <div className="summary-card">
                <div className="summary-label">AI Not Evaluated</div>
                <div className="summary-value highlight-danger">{totalAiNotEvaluated}</div>
            </div>
          </div>
        </div>
      )}

      {submissions.length > 0 && (
        <div className="card submissions-controls-panel">
          <div className="submissions-controls-header">
            <div>
              <h3 className="submissions-section-title">Filter and sort the review queue</h3>
              <p className="summary-subtitle">
                Search by student or form, narrow by status, and export the filtered queue only when needed.
              </p>
            </div>

            <div className="submissions-export-actions">
              <label className="submission-control-group submission-control-group-export">
                <span className="filter-label">Export queue</span>
                <select
                  className="submission-filter-select"
                  value={exportAction}
                  onChange={handleExportAction}
                >
                  <option value="">Choose export</option>
                  <option value="csv">Download CSV</option>
                  <option value="print">Print grade sheet</option>
                </select>
              </label>
            </div>
          </div>

          <div className="submissions-controls-grid">
            <label className="submission-control-group submission-control-group-search">
              <span className="filter-label">Search queue</span>
              <input
                type="text"
                className="submission-filter-input"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search student, form, or submission ID"
              />
            </label>

            {isAllSubmissions && (
              <label className="submission-control-group">
                <span className="filter-label">Filter by form</span>
                <select
                  className="submission-filter-select"
                  value={formFilter}
                  onChange={(event) => setFormFilter(event.target.value)}
                >
                  <option value="all">All forms</option>
                  {availableForms.map((form) => (
                    <option key={form.formId} value={form.formId}>{form.title}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="submission-control-group">
              <span className="filter-label">Sort queue</span>
              <select
                className="submission-filter-select"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="pending_first">Pending first</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="ai_priority">AI priority first</option>
                <option value="highest_score">Highest final score</option>
              </select>
            </label>

            <label className="submission-control-group">
              <span className="filter-label">Date range</span>
              <select
                className="submission-filter-select"
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
              >
                <option value="all_time">All time</option>
                <option value="today">Today</option>
                <option value="last_7_days">Last 7 days</option>
                <option value="last_30_days">Last 30 days</option>
              </select>
            </label>
          </div>

          <div className="filter-group filter-group-inline">
            <span className="filter-label">Review state</span>
            <div className="filter-chips" role="tablist" aria-label="Filter submissions">
              {filterOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={filter === item.key ? 'chip chip-active' : 'chip'}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                  <span className="chip-count">{filterCounts[item.key]}</span>
                </button>
              ))}
            </div>
          </div>

          {isAllSubmissions && ((formFilter !== 'all' && selectedFormOption) || selectedSubmissions.length > 0) && (
            <div className="bulk-selection-bar">
              <div className="bulk-selection-copy">
                {selectedSubmissions.length > 0
                  ? `${selectedSubmissions.length} submission${selectedSubmissions.length === 1 ? '' : 's'} selected in the current view.`
                  : `Focused on ${selectedFormOption?.title}. Open the dedicated form queue when you want the single-form workspace.`}
              </div>
              <div className="submission-toolbar-actions bulk-selection-actions">
                {formFilter !== 'all' && selectedFormOption && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => navigate(`/admin/forms/${selectedFormOption.formId}/submissions`)}
                  >
                    Open {selectedFormOption.title}
                  </button>
                )}
                {selectedSubmissions.length > 0 && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setSelectedSubmissions([])}
                    disabled={isBusy}
                  >
                    Clear Selection
                  </button>
                )}
                {selectedSubmissions.length > 0 && (
                  <button
                    type="button"
                    className="button button-danger"
                    onClick={deleteSelectedSubmissions}
                    disabled={isBusy}
                  >
                    Delete Selected ({selectedSubmissions.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="card empty-state">
          <h3>No submissions yet</h3>
          <p>
            When students submit responses, this workspace will generate AI grading drafts for the teacher to review and publish.
          </p>
        </div>
      ) : (
        <div className="card submissions-list">
          <div className="submissions-header">
            <div>
              <h3 className="submissions-section-title">Submission grading queue</h3>
              <p className="summary-subtitle">
                Showing {filteredSubmissions.length} of {scopedSubmissions.length} submission{scopedSubmissions.length !== 1 ? 's' : ''} in the current queue scope.
              </p>
            </div>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="empty-filter-state">
              <h4>No submissions match the current filters</h4>
              <p>Try clearing the search, changing the status chip, or switching the selected form.</p>
            </div>
          )}

          {filteredSubmissions.map((submission, index) => {
            const grading = submission.grading || {};
            const submissionNumber = submissions.findIndex((item) => item.id === submission.id) + 1 || index + 1;
            const draft = reviewDrafts[submission.id] || {
              teacherGradeScore: '',
              teacherGradeMaxScore: '',
              teacherFeedback: '',
            };
            const breakdownByField = new Map((grading.breakdown || []).map((item) => [item.fieldId, item]));
            const hasAiFlag = hasAiIssues(submission, formInfo?.title);
            const aiNotEvaluated = hasAiNotEvaluated(submission);
            const answerCount = (submission.answers || []).length;
            const isReviewOpen = viewingId === submission.id;
            const isRegeneratingDraft = activeSubmissionAction.submissionId === submission.id
              && activeSubmissionAction.type === 'generate';

            return (
              <div key={submission.id} className="submission-block submission-block-detailed submission-row-shell">
                <div className="submission-row-layout">
                  <div className="submission-title-group submission-row-main">
                    {isAllSubmissions && (
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission.id)}
                        onChange={() => handleSelectSubmission(submission.id)}
                        className="submission-checkbox"
                      />
                    )}

                    <div className="submission-row-content">
                      <div className="submission-row-topline">
                        <div>
                          <h4 className="submission-title submission-title-rich">Submission #{submissionNumber}</h4>
                          <div className="submission-badge-row">
                            <span className={`status-pill status-pill-${grading.gradeStatus || 'pending_review'}`}>
                              {formatStatusLabel(grading.gradeStatus || 'pending_review')}
                            </span>
                            {hasAiFlag && <span className="status-pill status-pill-ai">AI Flagged</span>}
                            {aiNotEvaluated && <span className="status-pill status-pill-muted">AI Not Evaluated</span>}
                          </div>
                        </div>

                        <div className="submission-row-actions submission-row-actions-primary">
                          <button
                            type="button"
                            className="button button-primary"
                            onClick={() => setViewingId(submission.id)}
                            disabled={isBusy || isReviewOpen}
                          >
                            {isReviewOpen ? 'Reviewing' : 'Open Review'}
                          </button>
                        </div>
                      </div>

                      <div className="submission-detail-grid">
                        {isAllSubmissions && submission.form && (
                          <div className="submission-detail-card">
                            <span className="submission-detail-label">Form</span>
                            <strong>{submission.form.title}</strong>
                            <small>#{submission.form.id}</small>
                          </div>
                        )}
                        <div className="submission-detail-card">
                          <span className="submission-detail-label">Student</span>
                          <strong>{submission.submitter?.email || 'Anonymous'}</strong>
                          {!submission.submitter && <small>Cannot receive published grades</small>}
                        </div>
                        <div className="submission-detail-card">
                          <span className="submission-detail-label">Submitted</span>
                          <strong>{new Date(submission.submitted_at).toLocaleString()}</strong>
                        </div>
                        <div className="submission-detail-card">
                          <span className="submission-detail-label">Final Grade</span>
                          <strong>{formatGrade(grading.finalGradeScore, grading.finalGradeMaxScore)}</strong>
                          <small>{formatPercentage(grading.finalGradeScore, grading.finalGradeMaxScore)}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {viewingId === submission.id && (
                  <div className="submission-review-body" data-review-panel-id={submission.id}>
                    <div className="submission-review-intro">
                      <div>
                        <div className="submission-detail-label">Review Workspace</div>
                        <h5 className="review-panel-title">Finalize grading for Submission #{submissionNumber}</h5>
                        <p className="summary-subtitle">
                          Confirm the AI draft, adjust the final score if needed, and review answer-level notes before publishing.
                        </p>
                      </div>
                      <div className="submission-review-intro-meta">
                        <span className="review-intro-chip">{answerCount} answer{answerCount === 1 ? '' : 's'}</span>
                        <span className="review-intro-chip">{formatStatusLabel(grading.gradeStatus || 'pending_review')}</span>
                      </div>
                    </div>

                    <section className="grading-review-card">
                      <div className="grading-review-header">
                        <div>
                          <h5>AI inspection and teacher approval</h5>
                          <p>
                            The AI draft is a starting point. Adjust the score or feedback for practical teaching reasons, then publish when ready.
                          </p>
                        </div>
                        {!submission.submitter && (
                          <span className="flag secondary">Anonymous submissions cannot receive published grades</span>
                        )}
                      </div>

                      <div className="grading-review-grid">
                        <div className="grading-review-metric">
                          <span>AI Draft Score</span>
                          <strong>{formatGrade(grading.aiGradeScore, grading.aiGradeMaxScore)}</strong>
                          <small>{formatPercentage(grading.aiGradeScore, grading.aiGradeMaxScore)}</small>
                        </div>
                        <div className="grading-review-metric">
                          <span>Current Final Score</span>
                          <strong>{formatGrade(grading.finalGradeScore, grading.finalGradeMaxScore)}</strong>
                          <small>{formatPercentage(grading.finalGradeScore, grading.finalGradeMaxScore)}</small>
                        </div>
                        <div className="grading-review-metric">
                          <span>Teacher Override</span>
                          <strong>{grading.hasTeacherOverride ? 'Yes' : 'No'}</strong>
                          <small>{grading.gradedAt ? `Reviewed ${new Date(grading.gradedAt).toLocaleString()}` : 'Awaiting teacher review'}</small>
                        </div>
                      </div>

                      <div className="grading-feedback-grid">
                        <article className="grading-feedback-card">
                          <span className="grading-feedback-label">AI Feedback</span>
                          <div className="grading-feedback-text">{grading.aiFeedback || 'No AI feedback generated yet.'}</div>
                        </article>
                        <article className="grading-feedback-card">
                          <span className="grading-feedback-label">Final Feedback</span>
                          <div className="grading-feedback-text">{grading.finalFeedback || 'No final feedback saved yet.'}</div>
                        </article>
                      </div>

                      <div className="grading-edit-grid">
                        <label className="grading-input-group">
                          <span>Teacher Score</span>
                          <input
                            type="number"
                            step="0.01"
                            value={draft.teacherGradeScore}
                            onChange={(event) => handleReviewChange(submission.id, 'teacherGradeScore', event.target.value)}
                            placeholder={grading.aiGradeScore ?? ''}
                          />
                        </label>
                        <label className="grading-input-group">
                          <span>Teacher Max Score</span>
                          <input
                            type="number"
                            step="0.01"
                            value={draft.teacherGradeMaxScore}
                            onChange={(event) => handleReviewChange(submission.id, 'teacherGradeMaxScore', event.target.value)}
                            placeholder={grading.aiGradeMaxScore ?? ''}
                          />
                        </label>
                      </div>

                      <label className="grading-input-group grading-textarea-group">
                        <span>Teacher Feedback</span>
                        <textarea
                          rows="4"
                          value={draft.teacherFeedback}
                          onChange={(event) => handleReviewChange(submission.id, 'teacherFeedback', event.target.value)}
                          placeholder="Add teacher notes, practical deductions, or approval comments here."
                        />
                      </label>

                      <div className="grading-review-actions">
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => generateGradeDraft(submission.id)}
                          disabled={isBusy}
                        >
                          {isRegeneratingDraft ? 'Regenerating…' : 'Regenerate AI Draft'}
                        </button>
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => saveTeacherReview(submission.id)}
                          disabled={isBusy}
                        >
                          Save Teacher Review / Approve AI Draft
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => publishGrade(submission.id)}
                          disabled={isBusy || !submission.submitter || grading.gradeStatus !== 'reviewed'}
                        >
                          Publish to Student Account
                        </button>
                        <button
                          type="button"
                          className="button button-secondary submission-danger-button"
                          onClick={() => deleteSubmission(submission.id)}
                          disabled={isBusy}
                        >
                          Delete Submission
                        </button>
                      </div>
                    </section>

                    <section className="grading-review-card answer-inspection-card">
                      <div className="grading-review-header grading-review-header-compact">
                        <div>
                          <h5 className="review-section-title">Answer inspection</h5>
                          <p>
                            Review field-by-field scoring notes, answer summaries, and AI issues before approving the final grade.
                          </p>
                        </div>
                        <span className="answer-count-badge">{answerCount} answer{answerCount === 1 ? '' : 's'}</span>
                      </div>
                      <ul className="answers-list">
                        {(submission.answers || []).map((answer) => {
                          const parsedErrors = parseAiErrors(answer.ai_errors);
                          const breakdown = breakdownByField.get(answer.field_id);

                          return (
                            <li key={answer.id} className="answer-row answer-row-detailed">
                              <div className="answer-label answer-label-stacked">
                                <span>{answer.field?.label || 'Field'}</span>
                                {breakdown && (
                                  <span className="answer-grade-chip">
                                    {formatGrade(breakdown.score, breakdown.maxScore)}
                                  </span>
                                )}
                              </div>

                              <div className="answer-value">
                                <div className="answer-card-surface">
                                  {answer.value || <span className="answer-empty">No answer</span>}
                                </div>

                                {breakdown?.summary && (
                                  <div className="answer-evaluation">{breakdown.summary}</div>
                                )}

                                {parsedErrors.length > 0 && (
                                  <div className="answer-issues-list">
                                    {parsedErrors.map((issue, issueIndex) => (
                                      <div key={`${answer.id}-${issueIndex}`} className={`answer-issue answer-issue-${issue.severity || 'warning'}`}>
                                        <strong>{issue.type}</strong>: {issue.issue}
                                        {issue.correction && (
                                          <div className="answer-issue-correction">
                                            Suggestion: {issue.correction}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {answer.ai_not_evaluated && (
                                  <span className="flag secondary">AI could not evaluate this answer</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeReviewSubmission && (
        <div className="review-sticky-nav" role="navigation" aria-label="Submission review navigator">
          <div className="review-sticky-copy">
            <span className="review-sticky-kicker">Review Navigator</span>
            <strong>
              {currentReviewIndex + 1} of {filteredSubmissions.length}
            </strong>
            <span>{activeReviewSubmission.submitter?.email || `Submission #${activeReviewSubmission.id}`}</span>
          </div>
          <div className="review-sticky-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => openAdjacentReview(-1)}
              disabled={currentReviewIndex <= 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => openAdjacentReview(1)}
              disabled={currentReviewIndex === -1 || currentReviewIndex >= filteredSubmissions.length - 1}
            >
              Next
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setViewingId(null)}
            >
              Close Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}