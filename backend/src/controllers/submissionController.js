const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const FormField = require('../models/FormField');
const Submission = require('../models/Submission');
const SubmissionData = require('../models/SubmissionData');
const User = require('../models/User');
const { analyzeSentiment, analyzeEntities } = require('../services/googleNlp');
const { logAudit } = require('../services/auditLogger');
const {
  sendSubmissionNotificationEmail,
  sendSubmissionConfirmationEmail,
} = require('../services/emailService');

const validateSubmitForm = [body('values').isObject()];

// Re‑usable helper to perform basic (non‑AI) validation of values against form fields
async function validateBasicFormValues(formId, values) {
  const form = await Form.findByPk(formId, {
    include: [{ model: FormField, as: 'fields' }],
  });
  if (!form) {
    return { form: null, validationErrors: [{ message: 'Form not found' }] };
  }

  const validationErrors = [];

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

  return { form, validationErrors };
}

// Handles public form submission with basic + AI validation
async function submitForm(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const values = req.body.values;

    const { form, validationErrors } = await validateBasicFormValues(
      req.params.formId,
      values
    );

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: 'Form not found' });
    }

    const aiSummaries = {}; // fieldId -> { status: 'correct' | 'needs_review' | 'not_evaluated', details }

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
        aiSummaries[field.id] = {
          status: 'not_evaluated',
          details:
            'AI validation is temporarily unavailable. Basic validation was applied only.',
        };
        await logAudit({
          userId: null,
          action: 'ai_validation_failed',
          entityType: 'form_field',
          entityId: field.id,
          metadata: { formId: form.id, reason: e.message },
        });
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
        ai_not_evaluated: summary?.status === 'not_evaluated' ? true : false,
      });
    }
    await SubmissionData.bulkCreate(dataRows);

    await logAudit({
      userId: null,
      action: 'form_submitted',
      entityType: 'form',
      entityId: form.id,
      metadata: { submissionId: submission.id },
    });

    // Check if submission has AI flags
    const hasAiFlags = dataRows.some(
      (row) => row.ai_sentiment_flag || row.ai_entity_flag
    );

    // Send email notifications (non-blocking)
    // Notify admin if form creator exists
    if (form.created_by) {
      const formCreator = await User.findByPk(form.created_by);
      if (formCreator && formCreator.email) {
        sendSubmissionNotificationEmail(
          formCreator.email,
          form.title,
          submission.id,
          hasAiFlags
        ).catch((err) => {
          console.error('Failed to send admin notification email:', err);
        });
      }
    }

    // Try to send confirmation to submitter if email is provided in form values
    // (This assumes one of the fields might be an email field)
    const emailField = form.fields.find((f) => f.type === 'email');
    if (emailField && values[emailField.id]) {
      sendSubmissionConfirmationEmail(
        values[emailField.id],
        form.title,
        submission.id
      ).catch((err) => {
        console.error('Failed to send confirmation email:', err);
      });
    }

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      // Notify admin room
      io.to('admin-room').emit('new-submission', {
        formId: form.id,
        formTitle: form.title,
        submissionId: submission.id,
        hasAiFlags,
        timestamp: new Date(),
      });

      // Notify form-specific room
      io.to(`form-${form.id}`).emit('new-submission', {
        formId: form.id,
        formTitle: form.title,
        submissionId: submission.id,
        hasAiFlags,
        timestamp: new Date(),
      });
    }

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

// Admin-only: list all submissions from all forms
async function getAllSubmissions(req, res, next) {
  try {
    const submissions = await Submission.findAll({
      order: [['submitted_at', 'DESC']],
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'title'],
        },
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
        submissions,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Admin-only: delete a submission and its answers
async function deleteSubmission(req, res, next) {
  try {
    const submission = await Submission.findByPk(req.params.submissionId);
    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: 'Submission not found' });
    }

    await SubmissionData.destroy({
      where: { submission_id: submission.id },
    });
    await submission.destroy();

    await logAudit({
      userId: req.user?.id || null,
      action: 'submission_deleted',
      entityType: 'submission',
      entityId: submission.id,
      metadata: { formId: submission.form_id },
    });

    res.json({ success: true, message: 'Submission deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

// Admin-only: update submission answers (basic validation only)
async function updateSubmission(req, res, next) {
  try {
    const submission = await Submission.findByPk(req.params.submissionId);
    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: 'Submission not found' });
    }

    const values = req.body.values || {};
    const { form, validationErrors } = await validateBasicFormValues(
      submission.form_id,
      values
    );

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: 'Form not found' });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some answers did not pass basic validation.',
        errors: validationErrors,
      });
    }

    const existingAnswers = await SubmissionData.findAll({
      where: { submission_id: submission.id },
    });

    // Update values for each existing answer row
    for (const answer of existingAnswers) {
      if (Object.prototype.hasOwnProperty.call(values, answer.field_id)) {
        answer.value = values[answer.field_id] || '';
        await answer.save();
      }
    }

    const updated = await Submission.findByPk(submission.id, {
      include: [
        {
          model: SubmissionData,
          as: 'answers',
          include: [{ model: FormField, as: 'field' }],
        },
      ],
    });

    await logAudit({
      userId: req.user?.id || null,
      action: 'submission_updated',
      entityType: 'submission',
      entityId: submission.id,
      metadata: { formId: submission.form_id },
    });

    res.json({
      success: true,
      message: 'Submission updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

// Admin-only: delete all submissions
async function deleteAllSubmissions(req, res, next) {
  try {
    const count = await Submission.count();
    
    await SubmissionData.destroy({ where: {} });
    await Submission.destroy({ where: {} });

    await logAudit({
      userId: req.user?.id || null,
      action: 'all_submissions_deleted',
      entityType: 'submission',
      entityId: null,
      metadata: { count },
    });

    res.json({ 
      success: true, 
      message: `All ${count} submission(s) deleted successfully.` 
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateSubmitForm,
  submitForm,
  getFormSubmissions,
  getAllSubmissions,
  deleteSubmission,
  deleteAllSubmissions,
  updateSubmission,
};




