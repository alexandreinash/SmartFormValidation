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
  { value: 'textarea', label: 'Long Answer' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'multiple_choice', label: 'Quiz: Multiple Choice' },
  { value: 'fill_blank', label: 'Quiz: Fill in the Blank' },
  { value: 'true_false', label: 'Quiz: True / False' },
];

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

  if (templateKey === 'quiz') {
    return [
      { ...createEmptyField('multiple_choice'), label: 'Question 1' },
      { ...createEmptyField('fill_blank'), label: 'Question 2' },
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
              <button type="button" className="button button-secondary" onClick={() => applyTemplate('quiz')}>
                Quiz Starter
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

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="summary-grid summary-grid-wide">
              <div className="summary-card">
                <div className="summary-label">Total Fields</div>
                <div className="summary-value">{fields.length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Quiz Questions</div>
                <div className="summary-value">{quizQuestionCount}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">AI Enabled Fields</div>
                <div className="summary-value">{fields.filter((field) => field.ai_validation_enabled).length}</div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h3 className="form-section-title" style={{ marginBottom: 0 }}>Form Fields</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="button button-secondary" onClick={() => addField('text')}>+ Text</button>
                <button type="button" className="button button-secondary" onClick={() => addField('email')}>+ Email</button>
                <button type="button" className="button button-secondary" onClick={() => addField('number')}>+ Number</button>
                <button type="button" className="button button-secondary" onClick={() => addField('textarea')}>+ Long Answer</button>
                <button type="button" className="button button-secondary" onClick={() => addField('multiple_choice')}>+ Quiz</button>
              </div>
            </div>
            
            {fields.map((field, index) => (
              <div key={index} className="field-card">
                <div className="field-label-row">
                  <label className="field-label-text">Field Label</label>
                  <div className="field-input-row">
                    <div style={{ flex: 1, minWidth: '250px' }}>
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
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, 'type', e.target.value)}
                      className="field-type-button field-type-button-yellow"
                    >
                      {FIELD_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="remove-field-button"
                        title="Remove this field"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                <div className="field-options-row">
                  <label className="field-checkbox">
                    <input
                      type="checkbox"
                      checked={field.is_required}
                      onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                      disabled={QUIZ_TYPES.has(field.type)}
                    />
                    <span>Required</span>
                  </label>
                  <label className="field-checkbox">
                    <input
                      type="checkbox"
                      checked={field.ai_validation_enabled}
                      onChange={(e) => updateField(index, 'ai_validation_enabled', e.target.checked)}
                      disabled={QUIZ_TYPES.has(field.type)}
                    />
                    <span>AI Validation</span>
                  </label>
                  {QUIZ_TYPES.has(field.type) && (
                    <span className="flag secondary">Quiz questions are always required and AI graded.</span>
                  )}
                </div>

                {field.type === 'multiple_choice' && (
                  <div className="quiz-options-section">
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
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      <button type="button" className="button button-secondary" onClick={() => addOption(index)}>
                        Add Option
                      </button>
                      <select
                        value={field.correct_answer}
                        onChange={(e) => updateField(index, 'correct_answer', e.target.value)}
                        className="field-input field-input-yellow"
                        style={{ maxWidth: '240px' }}
                      >
                        <option value="">Select correct answer</option>
                        {field.options.filter((option) => option.trim() !== '').map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={field.points}
                        onChange={(e) => updateField(index, 'points', e.target.value)}
                        className="field-input field-input-yellow"
                        style={{ maxWidth: '120px' }}
                        placeholder="Points"
                      />
                    </div>
                  </div>
                )}

                {field.type === 'fill_blank' && (
                  <div className="quiz-options-section">
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={field.correct_answer}
                        onChange={(e) => updateField(index, 'correct_answer', e.target.value)}
                        placeholder="Correct answer"
                        className="field-input field-input-yellow"
                        style={{ flex: '1 1 240px' }}
                      />
                      <select
                        value={field.match_mode}
                        onChange={(e) => updateField(index, 'match_mode', e.target.value)}
                        className="field-input field-input-yellow"
                        style={{ maxWidth: '220px' }}
                      >
                        <option value="case_insensitive">Case-insensitive match</option>
                        <option value="case_sensitive">Case-sensitive match</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={field.points}
                        onChange={(e) => updateField(index, 'points', e.target.value)}
                        className="field-input field-input-yellow"
                        style={{ maxWidth: '120px' }}
                        placeholder="Points"
                      />
                    </div>
                  </div>
                )}

                {field.type === 'true_false' && (
                  <div className="quiz-options-section">
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <select
                        value={field.correct_answer}
                        onChange={(e) => updateField(index, 'correct_answer', e.target.value)}
                        className="field-input field-input-yellow"
                        style={{ maxWidth: '220px' }}
                      >
                        <option value="True">True</option>
                        <option value="False">False</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={field.points}
                        onChange={(e) => updateField(index, 'points', e.target.value)}
                        className="field-input field-input-yellow"
                        style={{ maxWidth: '120px' }}
                        placeholder="Points"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="save-form-button save-form-button-yellow"
            >
              Save Form
            </button>
            <button
              type="button"
              onClick={handleSaveAndSend}
              className="save-form-button save-form-button-blue"
            >
              Save and Send
            </button>
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

