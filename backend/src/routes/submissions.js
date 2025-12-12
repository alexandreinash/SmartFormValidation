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
} = require('../controllers/submissionController');

const router = express.Router();

// Submit a form (public, but capture user if logged in)
router.post('/:formId', auth(), validateSubmitForm, submitForm);

// View submissions for a form (Admin only)
router.get('/form/:formId', auth('admin'), getFormSubmissions);

// View all submissions from all forms (Admin only)
router.get('/all', auth('admin'), getAllSubmissions);

// Update a submission (Admin only)
router.put('/:submissionId', auth('admin'), updateSubmission);

// Delete all submissions (Admin only) - must come before /:submissionId
router.delete('/all', auth('admin'), deleteAllSubmissions);

// Delete a submission (Admin only)
router.delete('/:submissionId', auth('admin'), deleteSubmission);

module.exports = router;


