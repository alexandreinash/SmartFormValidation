const express = require('express');
const auth = require('../middleware/auth');
const {
  validateSubmitForm,
  submitForm,
  getFormSubmissions,
} = require('../controllers/submissionController');

const router = express.Router();

// Submit a form (public)
router.post('/:formId', validateSubmitForm, submitForm);

// View submissions for a form (Admin only)
router.get('/form/:formId', auth('admin'), getFormSubmissions);

module.exports = router;


