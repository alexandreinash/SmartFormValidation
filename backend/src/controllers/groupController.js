const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const User = require('../models/User');
const { sequelize } = require('../sequelize');
const { logAudit } = require('../services/auditLogger');
const { Op } = require('sequelize');

// Validation rules for creating a group
const validateCreateGroup = [
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('description').optional(),
  body('member_ids').optional().isArray().withMessage('member_ids must be an array'),
];

// Create a new group
async function createGroup(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, member_ids } = req.body;
    
    // Determine account_id
    let accountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    
    // If admin doesn't have an account, automatically set them up as an account owner
    if (!accountId && req.user.role === 'admin') {
      try {
        const dbUser = await User.findByPk(req.user.id);
        if (dbUser) {
          dbUser.is_account_owner = true;
          dbUser.account_id = req.user.id;
          await dbUser.save();
          accountId = req.user.id;
          // Update req.user for subsequent operations in this request
          req.user.is_account_owner = true;
          req.user.account_id = req.user.id;
        }
      } catch (err) {
        console.error('Error setting up account owner:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to set up account. Please try again.' 
        });
      }
    }
    
    if (!accountId) {
      return res.status(400).json({ 
        success: false, 
        message: 'You must have an account to create groups' 
      });
    }

    const transaction = await sequelize.transaction();
    
    try {
      // Create the group
      const group = await Group.create({
        name,
        description: description || null,
        account_id: accountId,
        created_by: req.user.id,
      }, { transaction });

      // Add members if provided
      if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
        // Verify all users exist and don't have accounts (end-users)
        const users = await User.findAll({
          where: {
            id: { [Op.in]: member_ids },
            role: 'user', // Only regular users can be group members
          },
          transaction,
        });

        if (users.length !== member_ids.length) {
          await transaction.rollback();
          return res.status(400).json({ 
            success: false, 
            message: 'Some user IDs are invalid or not end-users' 
          });
        }

        // Create group memberships
        const memberships = member_ids.map(userId => ({
          group_id: group.id,
          user_id: userId,
        }));

        await GroupMember.bulkCreate(memberships, { transaction });
      }

      await transaction.commit();

      await logAudit({
        userId: req.user.id,
        action: 'group_created',
        entityType: 'group',
        entityId: group.id,
      });

      // Fetch the group with members
      const groupWithMembers = await Group.findByPk(group.id, {
        include: [{
          model: GroupMember,
          as: 'memberships',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'role'],
          }],
        }],
      });

      res.status(201).json({
        success: true,
        data: groupWithMembers,
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// List all groups for the admin's account
async function listGroups(req, res, next) {
  try {
    const accountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    
    if (!accountId) {
      return res.json({ success: true, data: [] });
    }

    const { search } = req.query;
    
    const whereClause = { account_id: accountId };
    
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const groups = await Group.findAll({
      where: whereClause,
      include: [{
        model: GroupMember,
        as: 'memberships',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role'],
        }],
      }],
      order: [['created_at', 'DESC']],
    });

    // Add member count to each group
    const groupsWithCount = groups.map(group => {
      const groupData = group.toJSON();
      groupData.member_count = groupData.memberships ? groupData.memberships.length : 0;
      return groupData;
    });

    res.json({ success: true, data: groupsWithCount });
  } catch (err) {
    next(err);
  }
}

// Get a single group with members
async function getGroup(req, res, next) {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [{
        model: GroupMember,
        as: 'memberships',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role'],
        }],
      }],
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify access
    const accountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    if (group.account_id !== accountId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
}

// Update a group
async function updateGroup(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description } = req.body;
    
    const group = await Group.findByPk(req.params.id);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify access
    const accountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    if (group.account_id !== accountId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    group.updated_at = new Date();
    
    await group.save();

    await logAudit({
      userId: req.user.id,
      action: 'group_updated',
      entityType: 'group',
      entityId: group.id,
    });

    const updatedGroup = await Group.findByPk(group.id, {
      include: [{
        model: GroupMember,
        as: 'memberships',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role'],
        }],
      }],
    });

    res.json({ success: true, data: updatedGroup });
  } catch (err) {
    next(err);
  }
}

// Delete a group
async function deleteGroup(req, res, next) {
  try {
    const group = await Group.findByPk(req.params.id);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify access
    const accountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    if (group.account_id !== accountId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await group.destroy(); // Cascade will remove group members

    await logAudit({
      userId: req.user.id,
      action: 'group_deleted',
      entityType: 'group',
      entityId: group.id,
    });

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// Add members to a group
async function addMembers(req, res, next) {
  try {
    const { user_ids } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'user_ids array is required' 
      });
    }

    const group = await Group.findByPk(req.params.id);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify access
    const accountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    if (group.account_id !== accountId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Verify all users exist and are end-users
    const users = await User.findAll({
      where: {
        id: { [Op.in]: user_ids },
        role: 'user',
      },
    });

    if (users.length !== user_ids.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some user IDs are invalid or not end-users' 
      });
    }

    // Check for existing memberships
    const existingMembers = await GroupMember.findAll({
      where: {
        group_id: group.id,
        user_id: { [Op.in]: user_ids },
      },
    });

    const existingUserIds = existingMembers.map(m => m.user_id);
    const newUserIds = user_ids.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return res.json({ 
        success: true, 
        message: 'All users are already members',
        data: { added: 0 },
      });
    }

    // Add new memberships
    const memberships = newUserIds.map(userId => ({
      group_id: group.id,
      user_id: userId,
    }));

    await GroupMember.bulkCreate(memberships);

    await logAudit({
      userId: req.user.id,
      action: 'group_members_added',
      entityType: 'group',
      entityId: group.id,
      metadata: { added_count: newUserIds.length },
    });

    res.json({ 
      success: true, 
      message: `Added ${newUserIds.length} member(s)`,
      data: { added: newUserIds.length },
    });
  } catch (err) {
    next(err);
  }
}

// Remove members from a group
async function removeMembers(req, res, next) {
  try {
    const { user_ids } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'user_ids array is required' 
      });
    }

    const group = await Group.findByPk(req.params.id);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify access
    const accountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    if (group.account_id !== accountId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const removed = await GroupMember.destroy({
      where: {
        group_id: group.id,
        user_id: { [Op.in]: user_ids },
      },
    });

    await logAudit({
      userId: req.user.id,
      action: 'group_members_removed',
      entityType: 'group',
      entityId: group.id,
      metadata: { removed_count: removed },
    });

    res.json({ 
      success: true, 
      message: `Removed ${removed} member(s)`,
      data: { removed },
    });
  } catch (err) {
    next(err);
  }
}

// Get available users (end-users not yet in this group)
async function getAvailableUsers(req, res, next) {
  try {
    const group = await Group.findByPk(req.params.id);
    
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify access
    const accountId = req.user.is_account_owner ? req.user.id : req.user.account_id;
    if (group.account_id !== accountId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get current members
    const currentMembers = await GroupMember.findAll({
      where: { group_id: group.id },
      attributes: ['user_id'],
    });

    const currentMemberIds = currentMembers.map(m => m.user_id);

    // Get all end-users not in the group
    const availableUsers = await User.findAll({
      where: {
        role: 'user',
        id: { [Op.notIn]: currentMemberIds.length > 0 ? currentMemberIds : [0] },
      },
      attributes: ['id', 'email'],
      order: [['email', 'ASC']],
    });

    res.json({ success: true, data: availableUsers });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateCreateGroup,
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers,
  getAvailableUsers,
};
