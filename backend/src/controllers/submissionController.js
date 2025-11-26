const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const FormField = require('../models/FormField');
const Submission = require('../models/Submission');
const SubmissionData = require('../models/SubmissionData');
const { analyzeSentiment, analyzeEntities } = require('../services/googleNlp');

const validateSubmitForm = [body('values').isObject()];

// Handles public form submission with basic + AI validation
async function submitForm(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const form = await Form.findByPk(req.params.formId, {
      include: [{ model: FormField, as: 'fields' }],
    });
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: 'Form not found' });
    }

    const values = req.body.values;
    const validationErrors = [];
    const aiSummaries = {}; // fieldId -> { status: 'correct' | 'needs_review', details }

    // Basic validation
    for (const field of form.fields) {
      const v = values[field.id];
      if (field.is_required && (v === undefined || v === '')) {
        validationErrors.push({
          fieldId: field.id,
          type: 'basic',
          message: 'This field is required.',
        });
      }
      if (field.type === 'email' && v) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(v)) {
          validationErrors.push({
            fieldId: field.id,
            type: 'basic',
            message: 'Please enter a valid email address.',
          });
        }
      }
      if (field.type === 'number' && v && isNaN(Number(v))) {
        validationErrors.push({
          fieldId: field.id,
          type: 'basic',
          message: 'Please enter a numeric value.',
        });
      }
    }

    // AI validation (sentiment & entity)
    for (const field of form.fields) {
      const v = values[field.id];
      if (!field.ai_validation_enabled || !v) continue;

      try {
        const sent = await analyzeSentiment(v);
        const entities = await analyzeEntities(v);

        let needsReview = false;
        const reasons = [];

        if (sent.score < -0.6) {
          needsReview = true;
          reasons.push(
            'The tone of your answer is very negative. Please consider rephrasing.'
          );
          validationErrors.push({
            fieldId: field.id,
            type: 'ai_sentiment',
            message:
              'The tone of your input is very negative. Please consider rephrasing.',
          });
        }

        if (
          entities.entities &&
          entities.entities.length === 0 &&
          /name|company/i.test(field.label)
        ) {
          needsReview = true;
          reasons.push("This doesn't look like a typical name or company.");
          validationErrors.push({
            fieldId: field.id,
            type: 'ai_entity',
            message:
              "This doesn't look like a typical name or company. Please check your input.",
          });
        }

        aiSummaries[field.id] = {
          status: needsReview ? 'needs_review' : 'correct',
          details:
            reasons.join(' ') ||
            'Your answer looks appropriate according to AI analysis.',
        };
      } catch (e) {
        console.error('AI validation failed, falling back to basic only', e);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some answers need review based on validation and AI checking.',
        errors: validationErrors,
        aiSummaries,
      });
    }

    const submission = await Submission.create({
      form_id: form.id,
      submitted_by: null,
    });

    const dataRows = [];
    for (const field of form.fields) {
      const v = values[field.id] || '';
      const summary = aiSummaries[field.id];
      dataRows.push({
        submission_id: submission.id,
        field_id: field.id,
        value: v,
        ai_sentiment_flag: summary?.status === 'needs_review' ? true : false,
        ai_entity_flag: summary?.status === 'needs_review' ? true : false,
      });
    }
    await SubmissionData.bulkCreate(dataRows);

    res.status(201).json({
      success: true,
      data: { submissionId: submission.id, aiSummaries },
      message: 'Form submitted successfully. AI marked all answers as correct.',
    });
  } catch (err) {
    next(err);
  }
}

// Admin-only: list submissions and answers for a form
async function getFormSubmissions(req, res, next) {
  try {
    const form = await Form.findByPk(req.params.formId);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: 'Form not found' });
    }

    const submissions = await Submission.findAll({
      where: { form_id: form.id },
      order: [['submitted_at', 'DESC']],
      include: [
        {
          model: SubmissionData,
          as: 'answers',
          include: [{ model: FormField, as: 'field' }],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        form: { id: form.id, title: form.title },
        submissions,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateSubmitForm,
  submitForm,
  getFormSubmissions,
};




