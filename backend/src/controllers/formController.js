const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const FormField = require('../models/FormField');
const { logAudit } = require('../services/auditLogger');

const validateCreateForm = [
  body('title').notEmpty(),
  body('fields').isArray({ min: 1 }),
];

async function createForm(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, fields } = req.body;
    const form = await Form.create({
      title,
      created_by: req.user.id,
    });

    const createdFields = await Promise.all(
      fields.map((f) =>
        FormField.create({
          form_id: form.id,
          label: f.label,
          type: f.type,
          is_required: !!f.is_required,
          ai_validation_enabled: !!f.ai_validation_enabled,
          expected_entity: f.expected_entity || 'none',
          expected_sentiment: f.expected_sentiment || 'any',
        })
      )
    );

    await logAudit({
      userId: req.user.id,
      action: 'form_created',
      entityType: 'form',
      entityId: form.id,
    });

    res.status(201).json({
      success: true,
      data: { form, fields: createdFields },
    });
  } catch (err) {
    next(err);
  }
}

async function getForm(req, res, next) {
  try {
    const form = await Form.findByPk(req.params.id, {
      include: [{ model: FormField, as: 'fields' }],
    });
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: 'Form not found' });
    }
    res.json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
}

async function listForms(req, res, next) {
  try {
    const forms = await Form.findAll();
    res.json({ success: true, data: forms });
  } catch (err) {
    next(err);
  }
}

// Admin-only: delete a form
async function deleteForm(req, res, next) {
  try {
    const form = await Form.findByPk(req.params.id);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: 'Form not found' });
    }

    // Delete associated fields (cascade should handle this, but being explicit)
    await FormField.destroy({ where: { form_id: form.id } });
    await form.destroy();

    await logAudit({
      userId: req.user?.id || null,
      action: 'form_deleted',
      entityType: 'form',
      entityId: form.id,
    });

    res.json({ success: true, message: 'Form deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

// Admin-only: update a form
async function updateForm(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const form = await Form.findByPk(req.params.id);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: 'Form not found' });
    }

    const { title, fields } = req.body;
    
    // Update form title
    form.title = title;
    await form.save();

    // Delete existing fields and create new ones
    await FormField.destroy({ where: { form_id: form.id } });
    
    const updatedFields = await Promise.all(
      fields.map((f) =>
        FormField.create({
          form_id: form.id,
          label: f.label,
          type: f.type,
          is_required: !!f.is_required,
          ai_validation_enabled: !!f.ai_validation_enabled,
          expected_entity: f.expected_entity || 'none',
          expected_sentiment: f.expected_sentiment || 'any',
        })
      )
    );

    await logAudit({
      userId: req.user.id,
      action: 'form_updated',
      entityType: 'form',
      entityId: form.id,
    });

    res.json({
      success: true,
      data: { form, fields: updatedFields },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateCreateForm,
  createForm,
  getForm,
  listForms,
  deleteForm,
  updateForm,
};




