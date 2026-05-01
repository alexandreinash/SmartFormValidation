const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const FormField = require('../models/FormField');
const Submission = require('../models/Submission');
const SubmissionData = require('../models/SubmissionData');
const User = require('../models/User');
const { Op } = require('sequelize');
const { analyzeSentiment, analyzeEntities, validateComprehensively } = require('../services/googleNlp');
const { logAudit } = require('../services/auditLogger');
const {
  sendSubmissionNotificationEmail,
  sendSubmissionConfirmationEmail,
} = require('../services/emailService');
const {
  buildAiGradeDraft,
  resolveSubmissionGrade,
  toNumberOrNull,
  roundGrade,
} = require('../services/submissionGrading');

const validateSubmitForm = [body('values').isObject()];

function getUserAccountId(user) {
  return user?.is_account_owner ? user.id : user?.account_id;
}

function buildFormFilterForUser(user) {
  const userAccountId = getUserAccountId(user);
  return userAccountId ? { account_id: userAccountId } : { account_id: null };
}

function serializeSubmission(submission) {
  const plain = typeof submission?.toJSON === 'function' ? submission.toJSON() : submission;
  return {
    ...plain,
    grading: resolveSubmissionGrade(plain),
  };
}

async function loadSubmissionWithDetails(submissionId) {
  return Submission.findByPk(submissionId, {
    include: [
      {
        model: Form,
        as: 'form',
        attributes: ['id', 'title', 'account_id'],
      },
      {
        model: SubmissionData,
        as: 'answers',
        include: [{ model: FormField, as: 'field' }],
      },
      {
        model: User,
        as: 'submitter',
        attributes: ['id', 'email', 'username'],
        required: false,
      },
    ],
  });
}

function ensureAdminCanAccessForm(req, form) {
  const userAccountId = getUserAccountId(req.user);
  if (userAccountId && form.account_id !== userAccountId) {
    const error = new Error('Access denied to this form');
    error.status = 403;
    throw error;
  }

  if (!userAccountId && form.account_id !== null) {
    const error = new Error('Access denied to this form');
    error.status = 403;
    throw error;
  }
}

function buildSubmissionHistoryInclude(options = {}) {
  return [
    {
      model: Form,
      as: 'form',
      attributes: ['id', 'title', 'account_id'],
      ...(options.formWhere ? { where: options.formWhere } : {}),
    },
    {
      model: SubmissionData,
      as: 'answers',
      include: [{ model: FormField, as: 'field' }],
      required: false,
    },
    {
      model: User,
      as: 'submitter',
      attributes: ['id', 'email', 'username'],
      required: false,
    },
  ];
}

async function persistAiDraft(submission, options = {}) {
  const draft = buildAiGradeDraft(submission);
  submission.ai_grade_score = draft.aiGradeScore;
  submission.ai_grade_max_score = draft.aiGradeMaxScore;
  submission.ai_feedback = draft.aiFeedback;

  if (options.resetTeacherReview) {
    submission.teacher_grade_score = null;
    submission.teacher_grade_max_score = null;
    submission.teacher_feedback = null;
    submission.graded_by = null;
    submission.graded_at = null;
    submission.published_at = null;
    submission.grade_status = 'pending_review';
  } else if (!submission.grade_status) {
    submission.grade_status = 'pending_review';
  }

  await submission.save();
  return draft;
}

function parseTeacherReviewPayload(body) {
  const teacherGradeScore = toNumberOrNull(body.teacherGradeScore);
  const teacherGradeMaxScore = toNumberOrNull(body.teacherGradeMaxScore);
  const teacherFeedback = typeof body.teacherFeedback === 'string'
    ? body.teacherFeedback.trim()
    : '';

  if (teacherGradeScore !== null && teacherGradeScore < 0) {
    const error = new Error('Teacher grade score must be a non-negative number.');
    error.status = 400;
    throw error;
  }

  if (teacherGradeMaxScore !== null && teacherGradeMaxScore <= 0) {
    const error = new Error('Teacher grade max score must be greater than zero.');
    error.status = 400;
    throw error;
  }

  return {
    teacherGradeScore,
    teacherGradeMaxScore,
    teacherFeedback,
  };
}

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
    // Check if field is required and empty or only whitespace
    if (field.is_required) {
      if (v === undefined || v === '' || (typeof v === 'string' && v.trim() === '')) {
        validationErrors.push({
          fieldId: field.id,
          type: 'basic',
          message: 'This field is required. Please provide an answer.',
        });
      }
    }
    // Also reject any value that is only whitespace (even for non-required fields)
    if (v && typeof v === 'string' && v.trim() === '' && v.length > 0) {
      validationErrors.push({
        fieldId: field.id,
        type: 'basic',
        message: 'Please enter a valid answer. Blank spaces are not accepted.',
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
    if (field.type === 'number' && v) {
      const trimmedValue = v.trim();
      
      // Check if the value is an email address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(trimmedValue)) {
        validationErrors.push({
          fieldId: field.id,
          type: 'basic',
          message: 'Email addresses are not allowed. Please enter numbers only.',
        });
      }
      // Check if the value contains any letters (text)
      else if (/[a-zA-Z]/.test(trimmedValue)) {
        validationErrors.push({
          fieldId: field.id,
          type: 'basic',
          message: 'Text is not allowed. Please enter numbers only.',
        });
      }
      // Check if the value is not a valid number (allows integers, decimals, and negative numbers)
      else if (!/^-?\d*\.?\d+$/.test(trimmedValue) || isNaN(Number(trimmedValue))) {
        validationErrors.push({
          fieldId: field.id,
          type: 'basic',
          message: 'Please enter a valid number. Only numeric values are accepted.',
        });
      }
    }
    if (field.type === 'text' && v) {
      const trimmedValue = v.trim();
      
      // Check if text field is all numbers
      if (/^\d+$/.test(trimmedValue)) {
        validationErrors.push({
          fieldId: field.id,
          type: 'basic',
          message: 'Text fields cannot be all numbers. Please enter text only.',
        });
      }
      
      // Check if text field is an email address (any kind of email format)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(trimmedValue)) {
        validationErrors.push({
          fieldId: field.id,
          type: 'basic',
          message: 'Email addresses are not allowed in text fields. Please enter text only.',
        });
      }
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

    const aiSummaries = {}; // fieldId -> { status: 'correct' | 'needs_review' | 'not_evaluated', details, errors: [] }
    const allAiErrors = {}; // fieldId -> array of all detected errors with corrections

    // Comprehensive AI validation - detects ALL errors and provides corrections
    for (const field of form.fields) {
      const v = values[field.id];
      if (!field.ai_validation_enabled || !v) continue;

      try {
        // Check if this is a quiz field
        let quizData = null;
        try {
          if (field.options) {
            quizData = JSON.parse(field.options);
          } else if (field.expected_entity && field.expected_entity !== 'none' && field.expected_entity !== 'quiz') {
            quizData = JSON.parse(field.expected_entity);
          }
        } catch (e) {
          // Not a quiz field, continue with normal AI validation
        }

        // Use comprehensive validation that detects ALL errors
        const detectedErrors = await validateComprehensively(
          v,
          field.label,
          field.type,
          quizData
        );

        // Store all detected errors
        allAiErrors[field.id] = detectedErrors;

        // Add all errors to validationErrors array for API response
        detectedErrors.forEach((error) => {
          if (error.severity === 'error') {
            validationErrors.push({
              fieldId: field.id,
              type: `ai_${error.type}`,
              message: error.issue,
              correction: error.correction,
            });
          }
        });

        // Build summary with all errors
        const needsReview = detectedErrors.length > 0;
        const errorDetails = detectedErrors.map((err, idx) => {
          return `${idx + 1}. [${err.type.toUpperCase()}] ${err.issue} ${err.correction ? `Correction: ${err.correction}` : ''}`;
        }).join('\n');

        aiSummaries[field.id] = {
          status: needsReview ? 'needs_review' : 'correct',
          details: errorDetails || 'Your answer looks appropriate according to AI analysis.',
          errors: detectedErrors, // Include all errors in the summary
        };

        // Legacy flags will be calculated when creating dataRows

      } catch (e) {
        console.error('AI validation failed, falling back to basic only', e);
        allAiErrors[field.id] = [];
        aiSummaries[field.id] = {
          status: 'not_evaluated',
          details:
            'AI validation is temporarily unavailable. Basic validation was applied only.',
          errors: [],
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
        allAiErrors, // Include all errors with corrections in response
      });
    }

    const submission = await Submission.create({
      form_id: form.id,
      submitted_by: req.user?.id || null,
      grade_status: 'pending_review',
    });

    const dataRows = [];
    for (const field of form.fields) {
      const v = values[field.id] || '';
      const summary = aiSummaries[field.id];
      const errors = allAiErrors[field.id] || [];
      
      // Store all AI errors as JSON (clean array without internal properties)
      const errorsJson = errors.map(err => ({
        type: err.type,
        issue: err.issue,
        correction: err.correction,
        severity: err.severity
      }));
      
      // Calculate legacy flags for backward compatibility
      const hasErrorSeverity = errors.some(e => e.severity === 'error');
      const hasSentimentError = errors.some(e => e.type === 'sentiment');
      const hasEntityError = errors.some(e => e.type === 'entity');
      
      dataRows.push({
        submission_id: submission.id,
        field_id: field.id,
        value: v,
        // Legacy flags for backward compatibility
        ai_sentiment_flag: hasSentimentError || false,
        ai_entity_flag: hasEntityError || false,
        ai_not_evaluated: summary?.status === 'not_evaluated' ? true : false,
        // New: Store all errors with corrections as JSON
        ai_errors: errorsJson.length > 0 ? JSON.stringify(errorsJson) : null,
      });
    }
    await SubmissionData.bulkCreate(dataRows);

    const gradedSubmission = await loadSubmissionWithDetails(submission.id);
    await persistAiDraft(gradedSubmission);

    await logAudit({
      userId: null,
      action: 'form_submitted',
      entityType: 'form',
      entityId: form.id,
      metadata: { submissionId: submission.id },
    });

    // Check if submission has AI flags (errors with severity 'error')
    const hasAiFlags = dataRows.some((row) => {
      try {
        const errors = row.ai_errors ? JSON.parse(row.ai_errors) : [];
        return errors.some(e => e.severity === 'error') || row.ai_sentiment_flag || row.ai_entity_flag;
      } catch {
        return row.ai_sentiment_flag || row.ai_entity_flag;
      }
    });

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

    // Check if admin has access to this form based on account
    ensureAdminCanAccessForm(req, form);

    const submissions = await Submission.findAll({
      where: { form_id: form.id },
      order: [['submitted_at', 'DESC']],
      include: [
        {
          model: SubmissionData,
          as: 'answers',
          include: [{ model: FormField, as: 'field' }],
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'email'],
          required: false
        },
      ],
    });

    res.json({
      success: true,
      data: {
        form: { id: form.id, title: form.title },
        submissions: submissions.map(serializeSubmission),
      },
    });
  } catch (err) {
    console.error('Error in getFormSubmissions:', err);
    // If error is related to missing column, provide helpful message
    if (err.message && (err.message.includes('ai_errors') || err.message.includes('Unknown column'))) {
      return res.status(500).json({
        success: false,
        message: 'Database schema needs update. Restart the backend so startup can apply the submission grading columns, or run: npm run migrate:submission-grading in the backend directory.',
      });
    }
    next(err);
  }
}

// Admin-only: list all submissions from all forms
async function getAllSubmissions(req, res, next) {
  try {
    const formFilter = buildFormFilterForUser(req.user);

    const submissions = await Submission.findAll({
      order: [['submitted_at', 'DESC']],
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'title', 'account_id'],
          where: formFilter,
        },
        {
          model: SubmissionData,
          as: 'answers',
          include: [{ model: FormField, as: 'field' }],
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'email'],
          required: false
        },
      ],
    });

    res.json({
      success: true,
      data: {
        submissions: submissions.map(serializeSubmission),
      },
    });
  } catch (err) {
    console.error('Error in getAllSubmissions:', err);
    // If error is related to missing column, provide helpful message
    if (err.message && (err.message.includes('ai_errors') || err.message.includes('Unknown column'))) {
      return res.status(500).json({
        success: false,
        message: 'Database schema needs update. Restart the backend so startup can apply the submission grading columns, or run: npm run migrate:submission-grading in the backend directory.',
      });
    }
    next(err);
  }
}

// Admin-only: delete a submission and its answers
async function deleteSubmission(req, res, next) {
  try {
    const submission = await loadSubmissionWithDetails(req.params.submissionId);
    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: 'Submission not found' });
    }

    ensureAdminCanAccessForm(req, submission.form);

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
    const submission = await loadSubmissionWithDetails(req.params.submissionId);
    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: 'Submission not found' });
    }

    ensureAdminCanAccessForm(req, submission.form);

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

    // Update values for each existing answer row
    for (const answer of submission.answers || []) {
      if (Object.prototype.hasOwnProperty.call(values, answer.field_id)) {
        answer.value = values[answer.field_id] || '';
        await answer.save();
      }
    }

    const updated = await loadSubmissionWithDetails(submission.id);
    await persistAiDraft(updated, { resetTeacherReview: true });

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
      data: serializeSubmission(updated),
    });
  } catch (err) {
    next(err);
  }
}

async function generateSubmissionGradeDraft(req, res, next) {
  try {
    const submission = await loadSubmissionWithDetails(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    ensureAdminCanAccessForm(req, submission.form);
    await persistAiDraft(submission, { resetTeacherReview: true });

    await logAudit({
      userId: req.user?.id || null,
      action: 'submission_grade_draft_generated',
      entityType: 'submission',
      entityId: submission.id,
      metadata: { formId: submission.form_id },
    });

    res.json({
      success: true,
      message: 'AI grading draft generated successfully.',
      data: serializeSubmission(submission),
    });
  } catch (err) {
    next(err);
  }
}

async function reviewSubmissionGrade(req, res, next) {
  try {
    const submission = await loadSubmissionWithDetails(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    ensureAdminCanAccessForm(req, submission.form);
    await persistAiDraft(submission);

    const { teacherGradeScore, teacherGradeMaxScore, teacherFeedback } = parseTeacherReviewPayload(req.body);

    const resolvedMaxScore = roundGrade(
      teacherGradeMaxScore !== null
        ? teacherGradeMaxScore
        : Number(submission.ai_grade_max_score || 0)
    );

    if (teacherGradeScore !== null && resolvedMaxScore > 0 && teacherGradeScore > resolvedMaxScore) {
      return res.status(400).json({
        success: false,
        message: 'Teacher grade score cannot exceed the maximum grade.',
      });
    }

    submission.teacher_grade_score = teacherGradeScore;
    submission.teacher_grade_max_score = resolvedMaxScore || null;
    submission.teacher_feedback = teacherFeedback || null;
    submission.grade_status = 'reviewed';
    submission.graded_by = req.user?.id || null;
    submission.graded_at = new Date();
    submission.published_at = null;
    await submission.save();

    await logAudit({
      userId: req.user?.id || null,
      action: 'submission_grade_reviewed',
      entityType: 'submission',
      entityId: submission.id,
      metadata: {
        formId: submission.form_id,
        teacherGradeScore,
        teacherGradeMaxScore: resolvedMaxScore || null,
      },
    });

    res.json({
      success: true,
      message: 'Teacher review saved successfully.',
      data: serializeSubmission(submission),
    });
  } catch (err) {
    next(err);
  }
}

async function publishSubmissionGrade(req, res, next) {
  try {
    const submission = await loadSubmissionWithDetails(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    ensureAdminCanAccessForm(req, submission.form);

    if (!submission.submitted_by) {
      return res.status(400).json({
        success: false,
        message: 'This submission was anonymous, so there is no student account to publish the grade to.',
      });
    }

    await persistAiDraft(submission);

    if (submission.grade_status !== 'reviewed') {
      return res.status(400).json({
        success: false,
        message: 'Save the teacher review before publishing this grade to the student account.',
      });
    }

    submission.grade_status = 'published';
    submission.graded_by = submission.graded_by || req.user?.id || null;
    submission.graded_at = submission.graded_at || new Date();
    submission.published_at = new Date();
    await submission.save();

    await logAudit({
      userId: req.user?.id || null,
      action: 'submission_grade_published',
      entityType: 'submission',
      entityId: submission.id,
      metadata: { formId: submission.form_id, submittedBy: submission.submitted_by },
    });

    res.json({
      success: true,
      message: 'Grade published to the student account.',
      data: serializeSubmission(submission),
    });
  } catch (err) {
    next(err);
  }
}

async function getMyPublishedGrades(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const submissions = await Submission.findAll({
      where: {
        submitted_by: req.user.id,
        published_at: { [Op.ne]: null },
      },
      order: [['published_at', 'DESC']],
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'title'],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        submissions: submissions.map(serializeSubmission),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMySubmissionHistory(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const submissions = await Submission.findAll({
      where: {
        submitted_by: req.user.id,
      },
      order: [['submitted_at', 'DESC']],
      include: buildSubmissionHistoryInclude(),
    });

    res.json({
      success: true,
      data: {
        submissions: submissions.map(serializeSubmission),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getStudentSubmissionHistory(req, res, next) {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid student account.' });
    }

    const submissions = await Submission.findAll({
      where: {
        submitted_by: studentId,
      },
      order: [['submitted_at', 'DESC']],
      include: buildSubmissionHistoryInclude({
        formWhere: buildFormFilterForUser(req.user),
      }),
    });

    res.json({
      success: true,
      data: {
        submissions: submissions.map(serializeSubmission),
      },
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
  generateSubmissionGradeDraft,
  reviewSubmissionGrade,
  publishSubmissionGrade,
  getMyPublishedGrades,
  getMySubmissionHistory,
  getStudentSubmissionHistory,
};




