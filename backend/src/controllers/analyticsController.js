const { Op, fn, col, literal } = require('sequelize');
const Form = require('../models/Form');
const FormField = require('../models/FormField');
const Submission = require('../models/Submission');
const SubmissionData = require('../models/SubmissionData');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Get overall system analytics (admin only)
async function getSystemAnalytics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.submitted_at = {};
      if (startDate) {
        dateFilter.submitted_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        dateFilter.submitted_at[Op.lte] = new Date(endDate);
      }
    }

    // Total forms
    const totalForms = await Form.count();

    // Total submissions
    const totalSubmissions = await Submission.count({
      where: dateFilter,
    });

    // Total users
    const totalUsers = await User.count();

    // Forms with most submissions
    const topFormsRaw = await Submission.findAll({
      attributes: [
        'form_id',
        [fn('COUNT', col('Submission.id')), 'submission_count'],
      ],
      where: dateFilter,
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'title'],
        },
      ],
      group: ['form_id'],
      order: [[fn('COUNT', col('Submission.id')), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Get form details for top forms
    const topForms = await Promise.all(
      topFormsRaw.map(async (item) => {
        const form = await Form.findByPk(item.form_id);
        return {
          formId: item.form_id,
          formTitle: form?.title || 'Unknown',
          submissionCount: parseInt(item.submission_count) || 0,
        };
      })
    );

    // AI validation statistics
    const aiStatsRaw = await SubmissionData.findAll({
      attributes: [
        [fn('COUNT', col('SubmissionData.id')), 'total'],
        [fn('SUM', literal('CASE WHEN ai_sentiment_flag = 1 THEN 1 ELSE 0 END')), 'sentiment_flagged'],
        [fn('SUM', literal('CASE WHEN ai_entity_flag = 1 THEN 1 ELSE 0 END')), 'entity_flagged'],
        [fn('SUM', literal('CASE WHEN ai_not_evaluated = 1 THEN 1 ELSE 0 END')), 'not_evaluated'],
      ],
      include: [
        {
          model: Submission,
          as: 'submission',
          attributes: [],
          where: dateFilter,
        },
      ],
      raw: true,
    });
    const aiStats = aiStatsRaw[0] || {};

    // Submissions over time (last 30 days by default)
    const days = parseInt(req.query.days) || 30;
    const submissionsOverTime = await Submission.findAll({
      attributes: [
        [fn('DATE', col('submitted_at')), 'date'],
        [fn('COUNT', col('Submission.id')), 'count'],
      ],
      where: {
        ...dateFilter,
        submitted_at: {
          [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      group: [fn('DATE', col('submitted_at'))],
      order: [[fn('DATE', col('submitted_at')), 'ASC']],
      raw: true,
    });

    // Recent activity (last 10 submissions)
    const recentSubmissions = await Submission.findAll({
      where: dateFilter,
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'title'],
        },
      ],
      order: [['submitted_at', 'DESC']],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalForms,
          totalSubmissions,
          totalUsers,
        },
        topForms,
        aiValidation: {
          totalEvaluated: parseInt(aiStats[0]?.total) || 0,
          sentimentFlagged: parseInt(aiStats[0]?.sentiment_flagged) || 0,
          entityFlagged: parseInt(aiStats[0]?.entity_flagged) || 0,
          notEvaluated: parseInt(aiStats[0]?.not_evaluated) || 0,
        },
        submissionsOverTime: submissionsOverTime.map((item) => ({
          date: item.date,
          count: parseInt(item.count) || 0,
        })),
        recentActivity: recentSubmissions.map((sub) => ({
          id: sub.id,
          formId: sub.form_id,
          formTitle: sub.form?.title || 'Unknown',
          submittedAt: sub.submitted_at,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// Get analytics for a specific form
async function getFormAnalytics(req, res, next) {
  try {
    const { formId } = req.params;
    const { startDate, endDate } = req.query;

    const form = await Form.findByPk(formId, {
      include: [{ model: FormField, as: 'fields' }],
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Build date filter
    const dateFilter = { form_id: formId };
    if (startDate || endDate) {
      dateFilter.submitted_at = {};
      if (startDate) {
        dateFilter.submitted_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        dateFilter.submitted_at[Op.lte] = new Date(endDate);
      }
    }

    // Total submissions for this form
    const totalSubmissions = await Submission.count({
      where: dateFilter,
    });

    // AI validation stats for this form
    const aiStatsRaw = await SubmissionData.findAll({
      attributes: [
        [fn('COUNT', col('SubmissionData.id')), 'total'],
        [fn('SUM', literal('CASE WHEN ai_sentiment_flag = 1 THEN 1 ELSE 0 END')), 'sentiment_flagged'],
        [fn('SUM', literal('CASE WHEN ai_entity_flag = 1 THEN 1 ELSE 0 END')), 'entity_flagged'],
        [fn('SUM', literal('CASE WHEN ai_not_evaluated = 1 THEN 1 ELSE 0 END')), 'not_evaluated'],
      ],
      include: [
        {
          model: Submission,
          as: 'submission',
          attributes: [],
          where: dateFilter,
        },
      ],
      raw: true,
    });
    const aiStats = aiStatsRaw[0] || {};

    // Field-level statistics
    const fieldStatsRaw = await SubmissionData.findAll({
      attributes: [
        'field_id',
        [fn('COUNT', col('SubmissionData.id')), 'total_responses'],
        [fn('SUM', literal('CASE WHEN ai_sentiment_flag = 1 OR ai_entity_flag = 1 THEN 1 ELSE 0 END')), 'flagged_count'],
      ],
      include: [
        {
          model: FormField,
          as: 'field',
          attributes: ['id', 'label', 'type'],
        },
        {
          model: Submission,
          as: 'submission',
          attributes: [],
          where: dateFilter,
        },
      ],
      group: ['field_id'],
      raw: true,
    });

    // Get field details
    const fieldStats = await Promise.all(
      fieldStatsRaw.map(async (stat) => {
        const field = await FormField.findByPk(stat.field_id);
        return {
          fieldId: stat.field_id,
          fieldLabel: field?.label || 'Unknown',
          fieldType: field?.type || 'unknown',
          totalResponses: parseInt(stat.total_responses) || 0,
          flaggedCount: parseInt(stat.flagged_count) || 0,
        };
      })
    );

    // Submissions over time for this form
    const days = parseInt(req.query.days) || 30;
    const submissionsOverTime = await Submission.findAll({
      attributes: [
        [fn('DATE', col('submitted_at')), 'date'],
        [fn('COUNT', col('Submission.id')), 'count'],
      ],
      where: {
        ...dateFilter,
        submitted_at: {
          [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      group: [fn('DATE', col('submitted_at'))],
      order: [[fn('DATE', col('submitted_at')), 'ASC']],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        form: {
          id: form.id,
          title: form.title,
        },
        overview: {
          totalSubmissions,
        },
        aiValidation: {
          totalEvaluated: parseInt(aiStats.total) || 0,
          sentimentFlagged: parseInt(aiStats.sentiment_flagged) || 0,
          entityFlagged: parseInt(aiStats.entity_flagged) || 0,
          notEvaluated: parseInt(aiStats.not_evaluated) || 0,
        },
        fieldStatistics: fieldStats,
        submissionsOverTime: submissionsOverTime.map((item) => ({
          date: item.date,
          count: parseInt(item.count) || 0,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSystemAnalytics,
  getFormAnalytics,
};

