const express = require('express');
const auth = require('../middleware/auth');
const {
  validateSubmitForm,
  submitForm,
  getFormSubmissions,
  getAllSubmissions,
  deleteSubmission,
  deleteAllSubmissions,
  updateSubmission,
  generateSubmissionGradeDraft,
  reviewSubmissionGrade,
  publishSubmissionGrade,
  getMyPublishedGrades,
  getMySubmissionHistory,
  getStudentSubmissionHistory,
} = require('../controllers/submissionController');

const router = express.Router();

// Submit a form (public, but capture user if logged in)
router.post('/:formId', auth(), validateSubmitForm, submitForm);

// View submissions for a form (Admin only)
router.get('/form/:formId', auth('admin'), getFormSubmissions);

// View all submissions from all forms (Admin only)
router.get('/all', auth('admin'), getAllSubmissions);

// View published grades for the authenticated student account
router.get('/mine/grades', auth(), getMyPublishedGrades);

// View submission history for the authenticated student account
router.get('/mine/history', auth(), getMySubmissionHistory);

// View submission history for a specific student account (Admin only)
router.get('/student/:studentId/history', auth('admin'), getStudentSubmissionHistory);

// Generate or regenerate AI grading draft (Admin only)
router.post('/:submissionId/generate-grade', auth('admin'), generateSubmissionGradeDraft);

// Save teacher grade overrides and feedback (Admin only)
router.put('/:submissionId/review-grade', auth('admin'), reviewSubmissionGrade);

// Publish a reviewed grade to the student account (Admin only)
router.post('/:submissionId/publish-grade', auth('admin'), publishSubmissionGrade);

// Update a submission (Admin only)
router.put('/:submissionId', auth('admin'), updateSubmission);

// Delete all submissions (Admin only) - must come before /:submissionId
router.delete('/all', auth('admin'), deleteAllSubmissions);

// Delete a submission (Admin only)
router.delete('/:submissionId', auth('admin'), deleteSubmission);

module.exports = router;


