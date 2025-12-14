import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/CreateFormPage.css';
import '../css/components.css';

function EditQuizFormPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([]);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasSubmissions, setHasSubmissions] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    try {
      setLoading(true);
      // Load form data
      const formRes = await api.get(`/api/forms/${id}`);
      const formData = formRes.data.data;
      
      setTitle(formData.title);
      
      // Parse quiz fields from options JSON
      const parsedFields = formData.fields.map(field => {
        try {
          const quizData = JSON.parse(field.options);
          return {
            label: field.label,
            type: quizData.questionType || 'multiple_choice',
            is_required: field.is_required,
            ai_validation_enabled: field.ai_validation_enabled,
            options: quizData.options || [],
            correct_answer: quizData.correctAnswer || '',
            points: quizData.points || 1,
            match_mode: quizData.matchMode || 'case_insensitive'
          };
        } catch (e) {
          return {
            label: field.label,
            type: 'multiple_choice',
            is_required: field.is_required,
            ai_validation_enabled: field.ai_validation_enabled,
            options: ['', '', '', ''],
            correct_answer: '',
            points: 1,
            match_mode: 'case_insensitive'
          };
        }
      });
      
      setFields(parsedFields);
      
      // Check if form has submissions
      const submissionsRes = await api.get(`/api/forms/${id}/has-submissions`);
      setHasSubmissions(submissionsRes.data.data.hasSubmissions);
      
      setLoading(false);
    } catch (err) {
      setMessage('Failed to load quiz.');
      setLoading(false);
    }
  };

  const updateField = (index, key, value) => {
    const next = [...fields];
    next[index] = { ...next[index], [key]: value };
    
    // Reset options when changing question type
    if (key === 'type') {
      if (value === 'multiple_choice') {
        next[index].options = ['', '', '', ''];
        next[index].correct_answer = '';
        next[index].match_mode = 'case_insensitive';
      } else if (value === 'fill_blank') {
        next[index].options = [];
        next[index].correct_answer = '';
        next[index].match_mode = 'case_insensitive';
      } else if (value === 'true_false') {
        next[index].options = ['True', 'False'];
        next[index].correct_answer = 'True';
        next[index].match_mode = 'case_insensitive';
      }
    }
    
    setFields(next);
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    const next = [...fields];
    next[fieldIndex].options[optionIndex] = value;
    setFields(next);
  };

  const addOption = (fieldIndex) => {
    const next = [...fields];
    next[fieldIndex].options.push('');
    setFields(next);
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const next = [...fields];
    next[fieldIndex].options.splice(optionIndex, 1);
    setFields(next);
  };

  const addField = () => {
    setFields([...fields, {
      label: '',
      type: 'multiple_choice',
      is_required: true,
      ai_validation_enabled: true,
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
      match_mode: 'case_insensitive'
    }]);
  };

  const removeField = (index) => {
    if (fields.length <= 1) {
      setMessage('Quiz must have at least one question.');
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[index];
      const reindexed = {};
      Object.keys(next).forEach(key => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          reindexed[keyNum - 1] = next[key];
        } else if (keyNum < index) {
          reindexed[keyNum] = next[key];
        }
      });
      return reindexed;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!user || user.role !== 'admin') {
      setMessage('You must be logged in as an administrator to edit quizzes.');
      return;
    }

    // Validate fields
    const errors = {};
    let hasErrors = false;
    
    fields.forEach((field, index) => {
      if (!field.label.trim()) {
        errors[index] = 'Question text is required';
        hasErrors = true;
      }
      
      if (field.type === 'multiple_choice') {
        const validOptions = field.options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
          errors[index] = 'Multiple choice questions need at least 2 options';
          hasErrors = true;
        }
        if (!field.correct_answer.trim()) {
          errors[index] = 'Please select a correct answer';
          hasErrors = true;
        }
      } else if (field.type === 'fill_blank') {
        if (!field.correct_answer.trim()) {
          errors[index] = 'Please provide the correct answer';
          hasErrors = true;
        }
      } else if (field.type === 'true_false') {
        if (!field.correct_answer) {
          errors[index] = 'Please select the correct answer';
          hasErrors = true;
        }
      }
    });
    
    if (hasErrors) {
      setFieldErrors(errors);
      setMessage('Please fix the errors before submitting.');
      return;
    }

    try {
      // Format fields for API
      const formattedFields = fields.map(field => {
        const validOptions = field.type === 'multiple_choice' 
          ? field.options.filter(opt => opt.trim() !== '')
          : (field.type === 'true_false' ? ['True', 'False'] : []);
        
        const quizData = JSON.stringify({
          questionType: field.type,
          options: validOptions,
          correctAnswer: field.correct_answer,
          points: field.points || 1,
          matchMode: field.match_mode || 'case_insensitive'
        });
        
        return {
          label: field.label,
          type: 'textarea',
          is_required: field.is_required,
          ai_validation_enabled: field.ai_validation_enabled, // Use the checkbox value
          expected_entity: 'quiz',
          expected_sentiment: 'any',
          options: quizData
        };
      });

      await api.put(`/api/forms/${id}`, { title, fields: formattedFields });
      setMessage('Quiz updated successfully!');
      setTimeout(() => navigate('/admin/forms/all'), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to update quiz.';
      setMessage(errorMessage);
    }
  };

  const handleCancel = () => {
    const ok = window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.');
    if (ok) {
      navigate('/admin/forms/all');
    }
  };

  if (loading) {
    return (
      <div className="create-form-container">
        <div className="create-form-main">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading quiz...</div>
        </div>
      </div>
    );
  }

  if (hasSubmissions) {
    return (
      <div className="create-form-container">
        <div className="create-form-main">
          <div style={{ padding: '2rem' }}>
            <h2>Cannot Edit Quiz</h2>
            <p>This quiz cannot be edited because it has already been submitted by one or more users.</p>
            <button
              onClick={() => navigate('/admin/forms/all')}
              className="button button-primary"
            >
              Back to Forms
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-form-container">
      {/* Logout confirmation text in top right corner */}
      {showLogoutConfirm && (
        <div className="logout-confirmation-text">
          <div className="logout-confirmation-content">
            <div className="logout-confirmation-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="logout-confirmation-text-content">
              You have successfully been logged out.
            </div>
          </div>
        </div>
      )}
      {/* Left Sidebar */}
      <div className="create-form-sidebar">
        <h2 className="sidebar-title">Forms</h2>
        <div className="sidebar-nav-container">
          <nav className="sidebar-nav sidebar-nav-box">
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.');
                if (ok) {
                  navigate('/admin');
                }
              }}
              className="sidebar-nav-item"
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <span className="sidebar-icon">🏠</span>
              <span>Home</span>
            </button>
          </nav>
          <nav className="sidebar-nav sidebar-nav-box">
            <button
              type="button"
              onClick={() => {
                setShowLogoutConfirm(true);
                localStorage.setItem('sfv_just_logged_out', 'true');
                logout();
                setTimeout(() => {
                  navigate('/login');
                }, 800);
              }}
              className="sidebar-nav-item sidebar-logout-button"
            >
              <span className="sidebar-icon">↗️</span>
              <span>Log Out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="create-form-main">
        <div className="create-form-header">
          <div>
            <h1 className="create-form-title">Modify Quiz Form</h1>
            <p className="create-form-subtitle">
              Edit the quiz title, questions, correct answers, and points.
            </p>
            <div style={{ 
              background: '#fef3c7', 
              border: '1px solid #fbbf24', 
              borderRadius: '8px', 
              padding: '0.75rem 1rem', 
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span>
              <span style={{ fontSize: '0.9rem', color: '#92400e' }}>
                <strong>AI Validation Enabled:</strong> All quiz answers will be validated using AI-powered semantic analysis for better accuracy.
              </span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="create-form-form">
          <div className="form-section">
            <label className="form-label">Quiz Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              required
              className="form-input"
            />
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Quiz Questions</h3>
            
            {fields.map((field, index) => (
              <div key={index} className="field-card">
                <div className="field-label-row">
                  <label className="field-label-text">Question {index + 1}</label>
                  <div className="field-input-row">
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <input
                        type="text"
                        placeholder="Enter question text"
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
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="fill_blank">Fill in the Blank</option>
                      <option value="true_false">True/False</option>
                    </select>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="remove-field-button"
                        title="Remove this question"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Multiple Choice Options */}
                {field.type === 'multiple_choice' && (
                  <div className="quiz-options-section">
                    <label className="field-label-text" style={{ marginBottom: '0.75rem', display: 'block' }}>
                      Answer Options (select the correct one):
                    </label>
                    {field.options.map((option, optIndex) => (
                      <div key={optIndex} className="quiz-option-row">
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={field.correct_answer === option}
                          onChange={() => updateField(index, 'correct_answer', option)}
                          disabled={!option.trim()}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <input
                          type="text"
                          placeholder={`Option ${optIndex + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, optIndex, e.target.value)}
                          className="field-input"
                          style={{ flex: 1, marginRight: '0.5rem' }}
                        />
                        {field.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index, optIndex)}
                            className="remove-field-button"
                            style={{ width: '36px', height: '36px' }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {field.options.length < 6 && (
                      <button
                        type="button"
                        onClick={() => addOption(index)}
                        className="add-field-button add-field-button-yellow"
                        style={{ marginTop: '0.5rem' }}
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                {/* Fill in the Blank */}
                {field.type === 'fill_blank' && (
                  <div className="quiz-options-section">
                    <label className="field-label-text" style={{ marginBottom: '0.5rem', display: 'block' }}>
                      Correct Answer:
                    </label>
                    <input
                      type="text"
                      placeholder="Enter the correct answer"
                      value={field.correct_answer}
                      onChange={(e) => updateField(index, 'correct_answer', e.target.value)}
                      className="field-input"
                      style={{ width: '100%' }}
                    />
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <div style={{ minWidth: '220px' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151' }}>Match Mode</label>
                          <select
                            value={field.match_mode}
                            onChange={(e) => updateField(index, 'match_mode', e.target.value)}
                            className="field-input"
                            style={{ padding: '0.5rem', width: '100%' }}
                          >
                            <option value="case_insensitive">Case-insensitive (default)</option>
                            <option value="exact">Exact (case-sensitive)</option>
                          </select>
                        </div>
                        <small style={{ color: '#6b7280', display: 'block' }}>
                          Controls how user answers are compared to the correct answer when grading.
                        </small>
                      </div>
                  </div>
                )}

                {/* True/False */}
                {field.type === 'true_false' && (
                  <div className="quiz-options-section">
                    <label className="field-label-text" style={{ marginBottom: '0.75rem', display: 'block' }}>
                      Correct Answer:
                    </label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label className="field-checkbox">
                        <input
                          type="radio"
                          name={`tf-${index}`}
                          checked={field.correct_answer === 'True'}
                          onChange={() => updateField(index, 'correct_answer', 'True')}
                        />
                        <span>True</span>
                      </label>
                      <label className="field-checkbox">
                        <input
                          type="radio"
                          name={`tf-${index}`}
                          checked={field.correct_answer === 'False'}
                          onChange={() => updateField(index, 'correct_answer', 'False')}
                        />
                        <span>False</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Points and Options */}
                <div className="field-options-row" style={{ marginTop: '1rem' }}>
                  <label className="field-label-text" style={{ marginRight: '1rem' }}>
                    Points:
                    <input
                      type="number"
                      min="1"
                      value={field.points || 1}
                      onChange={(e) => updateField(index, 'points', parseInt(e.target.value) || 1)}
                      className="field-input"
                      style={{ width: '80px', marginLeft: '0.5rem', padding: '0.5rem' }}
                    />
                  </label>
                  <label className="field-checkbox">
                    <input
                      type="checkbox"
                      checked={field.is_required}
                      onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                    />
                    <span>Required</span>
                  </label>
                  <label className="field-checkbox">
                    <input
                      type="checkbox"
                      checked={field.ai_validation_enabled}
                      onChange={(e) => updateField(index, 'ai_validation_enabled', e.target.checked)}
                    />
                    <span>AI Validation</span>
                  </label>
                  <button
                    type="button"
                    onClick={addField}
                    className="add-field-button add-field-button-yellow"
                  >
                    + Add Question
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="save-form-button save-form-button-yellow"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="save-form-button"
              style={{ 
                background: '#6b7280', 
                color: '#ffffff',
                border: 'none'
              }}
            >
              Cancel
            </button>
          </div>

          {message && (
            <div className={`message ${message.includes('successfully') ? 'message-success' : 'message-error'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default EditQuizFormPage;
