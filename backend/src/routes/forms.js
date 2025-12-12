const express = require('express');
const auth = require('../middleware/auth');
const {
  validateCreateForm,
  createForm,
  getForm,
  listForms,
  deleteForm,
  updateForm,
  deleteMultipleForms,
  deleteAllForms,
  shareForm,
  shareFormWithGroup,
  revokeFormAccess,
  getFormPermissions,
  replicateFormToAdmin,
  listAdmins,
  sendFormTo,
} = require('../controllers/formController');

const router = express.Router();

// Create a new form (Admin only)
router.post('/', auth('admin'), validateCreateForm, createForm);

// List forms (optional auth - admins see account forms, users see public + shared, anonymous see nothing)
router.get('/', auth(), listForms);

// Get a single form with fields (authenticated)
// Get a single form with fields (optional auth)
router.get('/:id', auth(), getForm);

// Update a form (Admin only)
router.put('/:id', auth('admin'), validateCreateForm, updateForm);

// Share a form (Admin only - form creator/owner)
router.post('/:formId/share', auth('admin'), shareForm);

// Share a form with a group (Admin only - form creator/owner)
router.post('/:formId/share-group', auth('admin'), shareFormWithGroup);

// Send form to recipients (groups, users, or admin)
router.post('/:formId/send', auth('admin'), sendFormTo);

// Replicate form to another admin
router.post('/:formId/replicate', auth('admin'), replicateFormToAdmin);

// Get list of admins for replication
router.get('/admins/list', auth('admin'), listAdmins);

// Get form permissions (Admin only - form creator/owner)
router.get('/:formId/permissions', auth('admin'), getFormPermissions);

// Revoke form access (Admin only - form creator/owner)
router.delete('/:formId/permissions/:permissionId', auth('admin'), revokeFormAccess);

// Delete all forms (Admin only) - must come before /:id
router.delete('/all', auth('admin'), deleteAllForms);

// Delete multiple forms (Admin only) - must come before /:id
router.delete('/multiple', auth('admin'), deleteMultipleForms);

// Delete a form (Admin only)
router.delete('/:id', auth('admin'), deleteForm);

module.exports = router;


