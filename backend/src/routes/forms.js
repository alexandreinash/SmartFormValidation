const express = require('express');
const auth = require('../middleware/auth');
const {
  validateCreateForm,
  createForm,
  getForm,
  listForms,
  deleteForm,
  updateForm,
} = require('../controllers/formController');

const router = express.Router();

// Create a new form (Admin only)
router.post('/', auth('admin'), validateCreateForm, createForm);

// List forms (public - users can see available forms)
router.get('/', listForms);

// Get a single form with fields (public)
router.get('/:id', getForm);

// Update a form (Admin only)
router.put('/:id', auth('admin'), validateCreateForm, updateForm);

// Delete a form (Admin only)
router.delete('/:id', auth('admin'), deleteForm);

module.exports = router;


