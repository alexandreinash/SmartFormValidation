const express = require('express');
const auth = require('../middleware/auth');
const {
  validateSubmitForm,
  submitForm,
  getFormSubmissions,
  deleteSubmission,
  updateSubmission,
} = require('../controllers/submissionController');

const router = express.Router();

// Submit a form (public)
router.post('/:formId', validateSubmitForm, submitForm);

// View submissions for a form (Admin only)
router.get('/form/:formId', auth('admin'), getFormSubmissions);

// Update a submission (Admin only)
router.put('/:submissionId', auth('admin'), updateSubmission);

// Delete a submission (Admin only)
router.delete('/:submissionId', auth('admin'), deleteSubmission);

module.exports = router;


