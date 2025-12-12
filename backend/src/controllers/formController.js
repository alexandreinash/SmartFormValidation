const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const FormField = require('../models/FormField');
const Submission = require('../models/Submission');
const AuditLog = require('../models/AuditLog');
const FormPermission = require('../models/FormPermission');
const User = require('../models/User');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const { sequelize } = require('../sequelize');
const { logAudit } = require('../services/auditLogger');
const { Op } = require('sequelize');

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
    
    // Determine account_id: if user is an account owner, use their id; otherwise use their account_id
    let accountId = null;
    if (req.user.role === 'admin') {
      accountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    }

    const form = await Form.create({
      title,
      created_by: req.user.id,
      account_id: accountId,
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
          options: f.options || null,
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

    // Check if user has access to this form
    const hasAccess = await checkFormAccess(form, req.user);
    if (!hasAccess) {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
}

// Helper function to check if a user has access to a form
async function checkFormAccess(form, user) {
  // If form has no account_id
  if (!form.account_id) {
    // Only users with no account_id can access it
    return !user.account_id;
  }

  // If user is an admin in the same account, they have access
  if (user.role === 'admin') {
    const userAccountId = user.is_account_owner ? user.id : user.account_id;
    if (userAccountId === form.account_id) {
      return true;
    }
  }

  // If user is a regular member of the same account, they have access
  if (user.role === 'user' && user.account_id && user.account_id === form.account_id) {
    return true;
  }

  // Check for explicit form permissions (only user-specific permissions)
  const permission = await FormPermission.findOne({
    where: {
      form_id: form.id,
      user_id: user.id
    }
  });

  return !!permission;
}

async function listForms(req, res, next) {
  try {
    let forms;

    if (!req.user) {
      // Anonymous user - return no forms
      forms = [];
    } else if (req.user.role === 'admin') {
      // Admin users see only forms from their account
      const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
      
      if (userAccountId) {
        // Admin has an account - show only their account's forms
        forms = await Form.findAll({
          where: {
            account_id: userAccountId
          },
          order: [['created_at', 'DESC']]
        });
      } else {
        // Admin has no account - show only forms with no account_id
        forms = await Form.findAll({
          where: {
            account_id: null
          },
          order: [['created_at', 'DESC']]
        });
      }
    } else {
      // Regular users see forms from their account and forms explicitly shared with them
      const sharedForms = await FormPermission.findAll({
        attributes: ['form_id'],
        where: {
          user_id: req.user.id
        }
      });

      const sharedFormIds = sharedForms.map(perm => perm.form_id);

      const whereConditions = [];
      
      // Include forms from user's account if they have one
      if (req.user.account_id) {
        whereConditions.push({ account_id: req.user.account_id });
      }
      
      // Include explicitly shared forms
      if (sharedFormIds.length > 0) {
        whereConditions.push({ id: { [Op.in]: sharedFormIds } });
      }
      
      // If user has no account, include unassigned forms
      if (!req.user.account_id) {
        whereConditions.push({ account_id: null });
      }

      forms = await Form.findAll({
        where: whereConditions.length > 0 ? {
          [Op.or]: whereConditions
        } : { id: 0 }, // No results if no conditions
        order: [['created_at', 'DESC']]
      });
    }

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

    // Check if user is the creator or account admin
    if (form.created_by !== req.user.id) {
      const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
      if (form.account_id !== userAccountId) {
        return res
          .status(403)
          .json({ success: false, message: 'Access denied' });
      }
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

    // Check if user is the creator or account admin
    if (form.created_by !== req.user.id) {
      const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
      if (form.account_id !== userAccountId) {
        return res
          .status(403)
          .json({ success: false, message: 'Access denied' });
      }
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
        // Check permission
        if (form.created_by !== req.user.id) {
          const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
          if (form.account_id !== userAccountId) {
            continue; // Skip forms user doesn't have permission to delete
          }
        }

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

// Share a form with a user or account
async function shareForm(req, res, next) {
  try {
    const { formId } = req.params;
    const { userId, accountId, permissionType } = req.body;

    if (!userId && !accountId) {
      return res.status(400).json({
        success: false,
        message: 'Either userId or accountId must be provided'
      });
    }

    const form = await Form.findByPk(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if user is the creator or account admin
    if (form.created_by !== req.user.id) {
      const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
      if (form.account_id !== userAccountId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Create or update permission
    await FormPermission.upsert({
      form_id: formId,
      user_id: userId || null,
      account_id: accountId || null,
      permission_type: permissionType || 'view'
    });

    await logAudit({
      userId: req.user.id,
      action: 'form_shared',
      entityType: 'form',
      entityId: formId,
      metadata: { shared_with: userId || accountId, permission_type: permissionType }
    });

    res.json({
      success: true,
      message: 'Form shared successfully'
    });
  } catch (err) {
    next(err);
  }
}

// Remove form sharing
async function revokeFormAccess(req, res, next) {
  try {
    const { formId, permissionId } = req.params;

    const form = await Form.findByPk(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if user is the creator or account admin
    if (form.created_by !== req.user.id) {
      const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
      if (form.account_id !== userAccountId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await FormPermission.destroy({
      where: { id: permissionId, form_id: formId }
    });

    await logAudit({
      userId: req.user.id,
      action: 'form_access_revoked',
      entityType: 'form',
      entityId: formId
    });

    res.json({
      success: true,
      message: 'Access revoked successfully'
    });
  } catch (err) {
    next(err);
  }
}

// Get form permissions
async function getFormPermissions(req, res, next) {
  try {
    const { formId } = req.params;

    const form = await Form.findByPk(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if user is the creator or account admin
    if (form.created_by !== req.user.id) {
      const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
      if (form.account_id !== userAccountId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const permissions = await FormPermission.findAll({
      where: { form_id: formId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email'] },
        { model: User, as: 'accountOwner', attributes: ['id', 'email'] }
      ]
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (err) {
    next(err);
  }
}

// Share a form with a group
async function shareFormWithGroup(req, res, next) {
  try {
    const { formId } = req.params;
    const { groupId, permissionType } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'groupId is required'
      });
    }

    const form = await Form.findByPk(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if user is the creator or account admin
    if (form.created_by !== req.user.id) {
      const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
      if (form.account_id !== userAccountId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Verify group exists and belongs to the same account
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    if (group.account_id !== userAccountId) {
      return res.status(403).json({
        success: false,
        message: 'Group does not belong to your account'
      });
    }

    // Get all members of the group
    const members = await GroupMember.findAll({
      where: { group_id: groupId },
      attributes: ['user_id'],
    });

    if (members.length === 0) {
      return res.json({
        success: true,
        message: 'Group has no members',
        data: { shared_count: 0 }
      });
    }

    // Create permissions for all group members
    const permissions = members.map(member => ({
      form_id: formId,
      user_id: member.user_id,
      account_id: null,
      permission_type: permissionType || 'view'
    }));

    // Use bulkCreate with updateOnDuplicate to handle existing permissions
    await FormPermission.bulkCreate(permissions, {
      updateOnDuplicate: ['permission_type']
    });

    await logAudit({
      userId: req.user.id,
      action: 'form_shared_with_group',
      entityType: 'form',
      entityId: formId,
      metadata: { 
        group_id: groupId, 
        group_name: group.name,
        member_count: members.length,
        permission_type: permissionType 
      }
    });

    res.json({
      success: true,
      message: `Form shared with ${members.length} group member(s)`,
      data: { shared_count: members.length }
    });
  } catch (err) {
    next(err);
  }
}

// Replicate form to another admin
async function replicateFormToAdmin(req, res, next) {
  try {
    const { formId } = req.params;
    const { adminUserId } = req.body;

    if (!adminUserId) {
      return res.status(400).json({
        success: false,
        message: 'adminUserId is required'
      });
    }

    const originalForm = await Form.findByPk(formId, {
      include: [{ model: FormField, as: 'fields' }],
    });

    if (!originalForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Verify sender has access to this form
    const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    if (originalForm.account_id !== userAccountId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Verify recipient is an admin
    const recipientAdmin = await User.findByPk(adminUserId);
    if (!recipientAdmin || recipientAdmin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Recipient must be an admin user'
      });
    }

    const recipientAccountId = recipientAdmin.is_account_owner 
      ? recipientAdmin.id 
      : recipientAdmin.account_id;

    const transaction = await sequelize.transaction();

    try {
      // Create replicated form
      const replicatedForm = await Form.create({
        title: originalForm.title,
        created_by: adminUserId, // New admin becomes the creator
        account_id: recipientAccountId,
        shared_by: req.user.id, // Track who shared it
        original_form_id: originalForm.id, // Link to original
      }, { transaction });

      // Replicate all fields
      const replicatedFields = await Promise.all(
        originalForm.fields.map(field =>
          FormField.create({
            form_id: replicatedForm.id,
            label: field.label,
            type: field.type,
            is_required: field.is_required,
            ai_validation_enabled: field.ai_validation_enabled,
            expected_entity: field.expected_entity,
            expected_sentiment: field.expected_sentiment,
            options: field.options,
          }, { transaction })
        )
      );

      await transaction.commit();

      await logAudit({
        userId: req.user.id,
        action: 'form_replicated_to_admin',
        entityType: 'form',
        entityId: originalForm.id,
        metadata: { 
          recipient_admin_id: adminUserId,
          new_form_id: replicatedForm.id 
        }
      });

      res.json({
        success: true,
        message: `Form replicated to admin successfully`,
        data: { 
          replicatedForm: {
            ...replicatedForm.toJSON(),
            fields: replicatedFields
          }
        }
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// Get list of admins (for replication)
async function listAdmins(req, res, next) {
  try {
    const currentUserAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    
    // Get all admins except current user
    const admins = await User.findAll({
      where: {
        role: 'admin',
        id: { [Op.ne]: req.user.id }
      },
      attributes: ['id', 'email', 'account_id', 'is_account_owner'],
      order: [['email', 'ASC']],
    });

    res.json({ success: true, data: admins });
  } catch (err) {
    next(err);
  }
}

// Send form to groups and/or users
async function sendFormTo(req, res, next) {
  try {
    const { formId } = req.params;
    const { groupIds, userIds, adminUserId } = req.body;

    const form = await Form.findByPk(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check access
    const userAccountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    if (form.created_by !== req.user.id && form.account_id !== userAccountId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let totalShared = 0;
    const results = {
      groups: 0,
      users: 0,
      admin: false
    };

    // Handle group sharing
    if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
      for (const groupId of groupIds) {
        const result = await shareFormWithGroup(
          { params: { formId }, body: { groupId, permissionType: 'view' }, user: req.user },
          { json: (data) => data },
          () => {}
        );
        if (result.success) {
          results.groups += result.data?.shared_count || 0;
          totalShared += result.data?.shared_count || 0;
        }
      }
    }

    // Handle individual user sharing
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const permissions = userIds.map(userId => ({
        form_id: formId,
        user_id: userId,
        account_id: null,
        permission_type: 'view'
      }));

      await FormPermission.bulkCreate(permissions, {
        updateOnDuplicate: ['permission_type']
      });
      results.users = userIds.length;
      totalShared += userIds.length;
    }

    // Handle admin replication
    if (adminUserId) {
      const replicateResult = await replicateFormToAdmin(
        { params: { formId }, body: { adminUserId }, user: req.user },
        { json: (data) => data, status: () => ({ json: (data) => data }) },
        () => {}
      );
      results.admin = replicateResult.success;
    }

    await logAudit({
      userId: req.user.id,
      action: 'form_sent_to_recipients',
      entityType: 'form',
      entityId: formId,
      metadata: results
    });

    res.json({
      success: true,
      message: `Form sent successfully`,
      data: results
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
  shareForm,
  shareFormWithGroup,
  revokeFormAccess,
  getFormPermissions,
  replicateFormToAdmin,
  listAdmins,
  sendFormTo,
};




