const express = require('express');
const auth = require('../middleware/auth');
const {
  validateCreateForm,
  createForm,
  getForm,
  listForms,
} = require('../controllers/formController');

const router = express.Router();

// Create a new form (Admin only)
router.post('/', auth('admin'), validateCreateForm, createForm);

// Get a single form with fields (public)
router.get('/:id', getForm);

// List forms (public - users can see available forms)
router.get('/', listForms);

module.exports = router;


