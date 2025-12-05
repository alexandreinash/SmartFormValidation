const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const FormField = require('../models/FormField');
const Submission = require('../models/Submission');
const AuditLog = require('../models/AuditLog');
const { sequelize } = require('../sequelize');
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

// Helper function to renumber all forms sequentially starting from 1
async function renumberForms() {
  const transaction = await sequelize.transaction();
  try {
    // Get all forms ordered by current ID
    const forms = await Form.findAll({
      order: [['id', 'ASC']],
      transaction,
    });

    if (forms.length === 0) {
      // No forms, reset AUTO_INCREMENT
      await sequelize.query('ALTER TABLE `forms` AUTO_INCREMENT = 1', { transaction });
      await transaction.commit();
      return;
    }

    // Create mapping of old ID to new sequential ID
    const idMapping = {};
    forms.forEach((form, index) => {
      const newId = index + 1;
      if (form.id !== newId) {
        idMapping[form.id] = newId;
      }
    });

    // If no renumbering needed, just reset AUTO_INCREMENT
    if (Object.keys(idMapping).length === 0) {
      const maxId = forms.length;
      await sequelize.query(`ALTER TABLE \`forms\` AUTO_INCREMENT = ${maxId + 1}`, { transaction });
      await transaction.commit();
      return;
    }

    // Temporarily disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

    // Update foreign keys in form_fields
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await sequelize.query(
        'UPDATE `form_fields` SET `form_id` = ? WHERE `form_id` = ?',
        { replacements: [newId, oldId], transaction }
      );
    }

    // Update foreign keys in submissions
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await sequelize.query(
        'UPDATE `submissions` SET `form_id` = ? WHERE `form_id` = ?',
        { replacements: [newId, oldId], transaction }
      );
    }

    // Update entity_id in audit_logs where entity_type = 'form'
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await sequelize.query(
        'UPDATE `audit_logs` SET `entity_id` = ? WHERE `entity_type` = ? AND `entity_id` = ?',
        { replacements: [newId, 'form', oldId], transaction }
      );
    }

    // Update form IDs (need to use temporary IDs to avoid conflicts)
    // First, set all to negative values
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await sequelize.query(
        'UPDATE `forms` SET `id` = ? WHERE `id` = ?',
        { replacements: [-newId, oldId], transaction }
      );
    }

    // Then set to positive values
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await sequelize.query(
        'UPDATE `forms` SET `id` = ? WHERE `id` = ?',
        { replacements: [newId, -newId], transaction }
      );
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });

    // Reset AUTO_INCREMENT to next available number
    const maxId = forms.length;
    await sequelize.query(`ALTER TABLE \`forms\` AUTO_INCREMENT = ${maxId + 1}`, { transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
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

    const deletedId = form.id;

    // Delete associated fields (cascade should handle this, but being explicit)
    await FormField.destroy({ where: { form_id: form.id } });
    await form.destroy();

    // Renumber remaining forms sequentially
    await renumberForms();

    await logAudit({
      userId: req.user?.id || null,
      action: 'form_deleted',
      entityType: 'form',
      entityId: deletedId,
    });

    res.json({ success: true, message: 'Form deleted successfully. Forms have been renumbered sequentially.' });
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

// Admin-only: delete multiple forms
async function deleteMultipleForms(req, res, next) {
  try {
    const { formIds } = req.body;
    if (!Array.isArray(formIds) || formIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'formIds array is required' 
      });
    }

    const deletedIds = [];
    for (const formId of formIds) {
      const form = await Form.findByPk(formId);
      if (form) {
        await FormField.destroy({ where: { form_id: form.id } });
        await form.destroy();
        deletedIds.push(formId);
        
        await logAudit({
          userId: req.user?.id || null,
          action: 'form_deleted',
          entityType: 'form',
          entityId: formId,
        });
      }
    }

    // Renumber remaining forms sequentially (only once after all deletions)
    await renumberForms();

    res.json({ 
      success: true, 
      message: `${deletedIds.length} form(s) deleted successfully. Forms have been renumbered sequentially.` 
    });
  } catch (err) {
    next(err);
  }
}

// Admin-only: delete all forms and reset AUTO_INCREMENT
async function deleteAllForms(req, res, next) {
  try {
    const count = await Form.count();
    
    // Delete all form fields first (cascade should handle this, but being explicit)
    await FormField.destroy({ where: {} });
    // Delete all forms
    await Form.destroy({ where: {} });
    
    // Reset AUTO_INCREMENT counter to 1
    await sequelize.query('ALTER TABLE `forms` AUTO_INCREMENT = 1');

    await logAudit({
      userId: req.user?.id || null,
      action: 'all_forms_deleted',
      entityType: 'form',
      entityId: null,
      metadata: { count },
    });

    res.json({ 
      success: true, 
      message: `All ${count} form(s) deleted successfully. Form ID counter has been reset.` 
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
  deleteMultipleForms,
  deleteAllForms,
};




