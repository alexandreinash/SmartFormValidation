import React, { useMemo, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import TeacherWorkspaceSidebar from '../components/TeacherWorkspaceSidebar';
import SendToModal from '../components/SendToModal';
import '../css/CreateFormPage.css';
import '../css/components.css';

const QUIZ_TYPES = new Set(['multiple_choice', 'fill_blank', 'true_false']);

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Short Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Long Answer' },
  { value: 'multiple_choice', label: 'Quiz: Multiple Choice' },
  { value: 'fill_blank', label: 'Quiz: Fill in the Blank' },
  { value: 'true_false', label: 'Quiz: True / False' },
];

const FIELD_TYPE_GROUPS = [
  {
    label: 'Standard Fields',
    values: ['text', 'email', 'number', 'textarea'],
  },
  {
    label: 'Quiz Fields',
    values: ['multiple_choice', 'fill_blank', 'true_false'],
  },
];

const FIELD_TYPE_DESCRIPTIONS = {
  text: 'Best for short written responses such as names, titles, or brief answers.',
  email: 'Captures a validated email address for follow-up or identity checks.',
  number: 'Collects numeric data such as student IDs, scores, or quantities.',
  textarea: 'Gives students room for detailed explanations, reflections, or essays.',
  multiple_choice: 'Creates an auto-graded choice question with prepared answer options.',
  fill_blank: 'Creates an auto-graded written response with case-sensitive matching rules.',
  true_false: 'Creates an auto-graded binary response for quick concept checks.',
};

function getFieldTypeLabel(type) {
  return FIELD_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Custom Field';
}

function createEmptyField(type = 'text') {
  const baseField = {
    label: '',
    type,
    is_required: false,
    ai_validation_enabled: false,
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
    match_mode: 'case_insensitive',
  };

  if (type === 'true_false') {
    return {
      ...baseField,
      options: ['True', 'False'],
      correct_answer: 'True',
      ai_validation_enabled: true,
      is_required: true,
    };
  }

  if (type === 'fill_blank') {
    return {
      ...baseField,
      options: [],
      ai_validation_enabled: true,
      is_required: true,
    };
  }

  if (type === 'multiple_choice') {
    return {
      ...baseField,
      ai_validation_enabled: true,
      is_required: true,
    };
  }

  return {
    ...baseField,
    options: [],
    correct_answer: '',
    points: 1,
    match_mode: 'case_insensitive',
  };
}

function createTemplateFields(templateKey) {
  if (templateKey === 'contact') {
    return [
      { ...createEmptyField('text'), label: 'Student Name', is_required: true },
      { ...createEmptyField('email'), label: 'Email Address', is_required: true },
      { ...createEmptyField('number'), label: 'Student ID', is_required: true },
    ];
  }

  if (templateKey === 'feedback') {
    return [
      { ...createEmptyField('text'), label: 'Topic', is_required: true },
      { ...createEmptyField('textarea'), label: 'Feedback', is_required: true, ai_validation_enabled: true },
    ];
  }

  return [createEmptyField('text')];
}

function applyFieldType(previousField, nextType) {
  const nextField = createEmptyField(nextType);
  return {
    ...nextField,
    label: previousField.label,
    is_required: QUIZ_TYPES.has(nextType) ? true : previousField.is_required,
    ai_validation_enabled: QUIZ_TYPES.has(nextType) ? true : previousField.ai_validation_enabled,
  };
}

function buildApiField(field) {
  if (QUIZ_TYPES.has(field.type)) {
    const validOptions = field.type === 'multiple_choice'
      ? field.options.filter((option) => option.trim() !== '')
      : (field.type === 'true_false' ? ['True', 'False'] : []);

    const quizData = JSON.stringify({
      questionType: field.type,
      options: validOptions,
      correctAnswer: field.correct_answer.trim(),
      points: Number(field.points) > 0 ? Number(field.points) : 1,
      matchMode: field.match_mode || 'case_insensitive',
    });

    return {
      label: field.label.trim(),
      type: 'textarea',
      is_required: true,
      ai_validation_enabled: true,
      expected_entity: 'quiz',
      expected_sentiment: 'any',
      options: quizData,
    };
  }

  return {
    label: field.label.trim(),
    type: field.type,
    is_required: !!field.is_required,
    ai_validation_enabled: !!field.ai_validation_enabled,
    expected_entity: 'none',
    expected_sentiment: 'any',
    options: null,
  };
}

function getFilledOptions(field) {
  return Array.isArray(field?.options)
    ? field.options.filter((option) => option.trim() !== '')
    : [];
}

function CreateFormPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([createEmptyField('text')]);
  const [message, setMessage] = useState('');
  const [sendToFormId, setSendToFormId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const quizQuestionCount = useMemo(
    () => fields.filter((field) => QUIZ_TYPES.has(field.type)).length,
    [fields]
  );

  const updateField = (index, key, value) => {
    setFields((current) => current.map((field, fieldIndex) => {
      if (fieldIndex !== index) {
        return field;
      }

      if (key === 'type') {
        return applyFieldType(field, value);
      }

      return {
        ...field,
        [key]: value,
      };
    }));

    setFieldErrors((current) => {
      if (!current[index]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[index];
      return nextErrors;
    });
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    setFields((current) => current.map((field, index) => {
      if (index !== fieldIndex) {
        return field;
      }

      const nextOptions = [...field.options];
      nextOptions[optionIndex] = value;
      return {
        ...field,
        options: nextOptions,
      };
    }));
  };

  const addOption = (fieldIndex) => {
    setFields((current) => current.map((field, index) => {
      if (index !== fieldIndex) {
        return field;
      }

      return {
        ...field,
        options: [...field.options, ''],
      };
    }));
  };

  const removeOption = (fieldIndex, optionIndex) => {
    setFields((current) => current.map((field, index) => {
      if (index !== fieldIndex) {
        return field;
      }

      return {
        ...field,
        options: field.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex),
      };
    }));
  };

  const addField = (type = 'text') => {
    setFields((current) => [...current, createEmptyField(type)]);
  };

  const applyTemplate = (templateKey) => {
    setFields(createTemplateFields(templateKey));
    setFieldErrors({});
    setMessage('');
  };

  const removeField = (index) => {
    setFields((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setFieldErrors((current) => {
      const nextErrors = {};
      Object.entries(current).forEach(([key, value]) => {
        const numericKey = Number(key);
        if (numericKey < index) {
          nextErrors[numericKey] = value;
        }
        if (numericKey > index) {
          nextErrors[numericKey - 1] = value;
        }
      });
      return nextErrors;
    });
  };

  const validateFields = () => {
    const nextErrors = {};

    fields.forEach((field, index) => {
      if (!field.label.trim()) {
        nextErrors[index] = 'Field label is required.';
        return;
      }

      if (field.type === 'multiple_choice') {
        const validOptions = field.options.filter((option) => option.trim() !== '');
        if (validOptions.length < 2) {
          nextErrors[index] = 'Multiple choice questions need at least two answer options.';
          return;
        }
        if (!field.correct_answer.trim()) {
          nextErrors[index] = 'Select the correct answer for this question.';
          return;
        }
      }

      if (field.type === 'fill_blank' && !field.correct_answer.trim()) {
        nextErrors[index] = 'Provide the correct answer for this fill in the blank question.';
        return;
      }

      if (field.type === 'true_false' && !field.correct_answer.trim()) {
        nextErrors[index] = 'Select the correct true/false answer.';
      }
    });

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!user || user.role !== 'admin') {
      setMessage('You must be logged in as an administrator to create forms.');
      return;
    }

    const nextErrors = validateFields();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setMessage('Please fix the field errors before saving the form.');
      return null;
    }

    try {
      const formattedFields = fields.map(buildApiField);
      const res = await api.post('/api/forms', { title, fields: formattedFields });
      setMessage(`Form created successfully with ID ${res.data.data.form.id}`);
      setTitle('');
      setFields([createEmptyField('text')]);
      setFieldErrors({});
      return res.data.data.form.id;
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create form.');
      return null;
    }
  };

  const handleSaveAndSend = async (e) => {
    e.preventDefault();
    const formId = await handleSubmit(e);
    if (formId) {
      setSendToFormId(formId);
    }
  };

  return (
    <div className="create-form-container">
      <TeacherWorkspaceSidebar activeItem="builder" />

      <div className="create-form-main">
        <div className="create-form-header">
          <div>
            <h1 className="create-form-title">Create Flexible Form</h1>
            <p className="create-form-subtitle">
              Build one form with the field mix you actually need: short text, long answer, email, number, and quiz questions in the same workspace.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <button type="button" className="button button-secondary" onClick={() => applyTemplate('blank')}>
                Blank Form
              </button>
              <button type="button" className="button button-secondary" onClick={() => applyTemplate('contact')}>
                Contact Template
              </button>
              <button type="button" className="button button-secondary" onClick={() => applyTemplate('feedback')}>
                Feedback Template
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-form-form">
          <div className="form-section">
            <label className="form-label">Form Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title"
              required
              className="form-input"
            />
          </div>

          <div className="create-form-summary-panel">
            <div className="create-form-summary-head">
              <div>
                <div className="create-form-summary-kicker">Builder Snapshot</div>
                <h3 className="create-form-summary-title">Track your form structure as you build.</h3>
              </div>
              <p className="create-form-summary-text">
                Keep an eye on how many fields are active, how many quiz items you are grading, and how much AI review is enabled.
              </p>
            </div>
            <div className="create-form-summary-grid">
              <div className="create-form-summary-card">
                <div className="create-form-summary-label">Total Fields</div>
                <div className="create-form-summary-value">{fields.length}</div>
              </div>
              <div className="create-form-summary-card">
                <div className="create-form-summary-label">Quiz Questions</div>
                <div className="create-form-summary-value">{quizQuestionCount}</div>
              </div>
              <div className="create-form-summary-card">
                <div className="create-form-summary-label">AI Enabled Fields</div>
                <div className="create-form-summary-value">{fields.filter((field) => field.ai_validation_enabled).length}</div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-fields-toolbar">
              <h3 className="form-section-title" style={{ marginBottom: 0 }}>Form Fields</h3>
              <div className="form-fields-actions">
                <button
                  type="button"
                  className="create-form-add-field-button"
                  onClick={() => addField('text')}
                >
                  + Add Field
                </button>
              </div>
            </div>
            
            {fields.map((field, index) => {
              const isQuizField = QUIZ_TYPES.has(field.type);
              const fieldTypeLabel = getFieldTypeLabel(field.type);
              const fieldTypeDescription = FIELD_TYPE_DESCRIPTIONS[field.type] ?? 'Student-facing response field.';

              return (
              <div key={index} className={`field-card ${isQuizField ? 'field-card-quiz' : ''}`}>
                <div className="field-card-header">
                  <div className="field-card-heading">
                    <div className="field-card-step">Field {String(index + 1).padStart(2, '0')}</div>
                    <div className="field-card-title-group">
                      <h4 className="field-card-title">{fieldTypeLabel}</h4>
                      <p className="field-card-description">{fieldTypeDescription}</p>
                    </div>
                  </div>
                  <div className="field-card-header-actions">
                    <div className="field-card-type-group">
                      <label className="field-card-control-label">Response Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, 'type', e.target.value)}
                        className="field-type-select"
                      >
                        {FIELD_TYPE_GROUPS.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.values.map((value) => {
                              const option = FIELD_TYPE_OPTIONS.find((item) => item.value === value);
                              return option ? (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ) : null;
                            })}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="remove-field-button field-card-remove-button"
                        title="Remove this field"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <div className="field-card-body">
                  <div className="field-card-main">
                    <div className="field-label-row">
                      <label className="field-label-text">Field Label</label>
                      <div className="field-input-row field-input-row-single">
                        <div className="field-label-input-group">
                          <input
                            type="text"
                            placeholder="Enter field label"
                            value={field.label}
                            onChange={(e) => updateField(index, 'label', e.target.value)}
                            required
                            className={`field-input field-input-yellow ${fieldErrors[index] ? 'field-input-error' : ''}`}
                          />
                          {fieldErrors[index] && (
                            <div className="field-error-message">{fieldErrors[index]}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="field-card-settings">
                    <div className="field-card-control-label">Field Settings</div>
                    <div className="field-options-row field-options-row-card">
                      <label className="field-checkbox">
                        <input
                          type="checkbox"
                          checked={field.is_required}
                          onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                          disabled={isQuizField}
                        />
                        <span>Required</span>
                      </label>
                      <label className="field-checkbox">
                        <input
                          type="checkbox"
                          checked={field.ai_validation_enabled}
                          onChange={(e) => updateField(index, 'ai_validation_enabled', e.target.checked)}
                          disabled={isQuizField}
                        />
                        <span>AI Validation</span>
                      </label>
                    </div>
                    {isQuizField && (
                      <div className="field-card-note">Quiz questions are always required and AI graded automatically.</div>
                    )}
                  </div>
                </div>

                {field.type === 'multiple_choice' && (
                  <div className="quiz-options-section">
                    {(() => {
                      const filledOptions = getFilledOptions(field);
                      const canSelectCorrectAnswer = filledOptions.length > 1;

                      return (
                        <>
                    <label className="field-label-text" style={{ marginBottom: '0.75rem', display: 'block' }}>
                      Answer Options
                    </label>
                    {field.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="quiz-option-row">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="field-input field-input-yellow"
                        />
                        {field.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index, optionIndex)}
                            className="remove-field-button"
                            title="Remove option"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="quiz-controls-row">
                      <div className="quiz-controls-stack">
                        <select
                          value={field.correct_answer}
                          onChange={(e) => updateField(index, 'correct_answer', e.target.value)}
                          className="field-input field-input-yellow quiz-answer-select"
                          disabled={!canSelectCorrectAnswer}
                        >
                          <option value="">
                            {canSelectCorrectAnswer ? 'Select correct answer' : 'Add at least two choices'}
                          </option>
                          {filledOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <div className="quiz-controls-actions">
                          <button type="button" className="button button-secondary quiz-add-option-button" onClick={() => addOption(index)}>
                            Add Option
                          </button>
                          <div className="quiz-points-group">
                            <div className="quiz-points-label">Points per question</div>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={field.points}
                              onChange={(e) => updateField(index, 'points', e.target.value)}
                              className="field-input field-input-yellow"
                              placeholder="Points"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {field.type === 'fill_blank' && (
                  <div className="quiz-options-section">
                    <div className="quiz-fill-blank-layout">
                      <input
                        type="text"
                        value={field.correct_answer}
                        onChange={(e) => updateField(index, 'correct_answer', e.target.value)}
                        placeholder="Correct answer"
                        className="field-input field-input-yellow quiz-inline-primary quiz-fill-blank-answer"
                      />
                      <div className="quiz-fill-blank-meta">
                        <select
                          value={field.match_mode}
                          onChange={(e) => updateField(index, 'match_mode', e.target.value)}
                          className="field-input field-input-yellow quiz-inline-select quiz-match-select"
                        >
                          <option value="case_insensitive">Case-insensitive match</option>
                          <option value="case_sensitive">Case-sensitive match</option>
                        </select>
                        <div className="quiz-points-group">
                          <div className="quiz-points-label">Points per question</div>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={field.points}
                            onChange={(e) => updateField(index, 'points', e.target.value)}
                            className="field-input field-input-yellow"
                            placeholder="Points"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {field.type === 'true_false' && (
                  <div className="quiz-options-section">
                    <div className="quiz-inline-row quiz-inline-row-compact">
                      <select
                        value={field.correct_answer}
                        onChange={(e) => updateField(index, 'correct_answer', e.target.value)}
                        className="field-input field-input-yellow quiz-inline-select quiz-binary-select"
                      >
                        <option value="True">True</option>
                        <option value="False">False</option>
                      </select>
                      <div className="quiz-points-group">
                        <div className="quiz-points-label">Points per question</div>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={field.points}
                          onChange={(e) => updateField(index, 'points', e.target.value)}
                          className="field-input field-input-yellow"
                          placeholder="Points"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>

          <div className="create-form-action-panel">
            <div className="create-form-action-copy">
              <div className="create-form-summary-kicker">Publish Options</div>
              <h3 className="create-form-action-title">Choose how you want to finish this form.</h3>
              <p className="create-form-action-text">
                Save it as a draft if you are still editing, or save and send when the structure is ready for students.
              </p>
            </div>
            <div className="create-form-actions">
              <button
                type="submit"
                className="save-form-button save-form-button-primary"
              >
                Save Form
              </button>
              <button
                type="button"
                onClick={handleSaveAndSend}
                className="save-form-button save-form-button-secondary"
              >
                Save and Send
              </button>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('successfully') ? 'message-success' : 'message-error'}`}>
              {message}
            </div>
          )}
        </form>
      </div>

      {/* Send To Modal */}
      {sendToFormId && (
        <SendToModal
          formId={sendToFormId}
          onClose={() => setSendToFormId(null)}
          onSuccess={() => {
            setMessage('Form sent successfully');
            setSendToFormId(null);
          }}
        />
      )}
    </div>
  );
}

export default CreateFormPage;

