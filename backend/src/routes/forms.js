const express = require('express');
const auth = require('../middleware/auth');
const {
  validateCreateForm,
  createForm,
  getForm,
  listForms,
} = require('../controllers/formController');

const router = express.Router();

// Create a new form (Admin)
router.post('/', auth('admin'), validateCreateForm, createForm);

// Get a single form with fields (public)
router.get('/:id', getForm);

// List forms (Admin)
router.get('/', auth('admin'), listForms);

module.exports = router;


