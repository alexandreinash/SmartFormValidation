const express = require('express');
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const { Op } = require('sequelize');

const router = express.Router();

// Get audit logs (admin only)
router.get('/', auth('admin'), async (req, res, next) => {
  try {
    const { action, entityType, userId, startDate, endDate, limit = 100 } = req.query;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;
    if (userId) where.user_id = userId;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const logs = await AuditLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      include: [
        {
          model: require('../models/User'),
          as: 'user',
          attributes: ['id', 'email', 'role'],
        },
      ],
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
});

// Get audit log statistics
router.get('/stats', auth('admin'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { fn, col } = require('sequelize');
    const stats = await AuditLog.findAll({
      attributes: [
        'action',
        [fn('COUNT', col('AuditLog.id')), 'count'],
      ],
      where,
      group: ['action'],
      order: [[fn('COUNT', col('AuditLog.id')), 'DESC']],
      raw: true,
    });

    res.json({
      success: true,
      data: stats.map((stat) => ({
        action: stat.action,
        count: parseInt(stat.count) || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

