import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/CreateFormPage.css';

function QuizFormPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([{
    label: '',
    type: 'multiple_choice',
    is_required: true,
    ai_validation_enabled: true, // AI validation enabled by default for quiz forms
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1
  }]);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const updateField = (index, key, value) => {
    const next = [...fields];
    next[index] = { ...next[index], [key]: value };
    
    // Reset options when changing question type
    if (key === 'type') {
      if (value === 'multiple_choice') {
        next[index].options = ['', '', '', ''];
        next[index].correct_answer = '';
      } else if (value === 'fill_blank') {
        next[index].options = [];
        next[index].correct_answer = '';
      } else if (value === 'true_false') {
        next[index].options = ['True', 'False'];
        next[index].correct_answer = 'True';
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
      ai_validation_enabled: true, // AI validation enabled by default for quiz forms
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    }]);
  };

  const removeField = (index) => {
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
      setMessage('You must be logged in as an administrator to create forms.');
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
      // Format fields for API - store quiz data in options field (TEXT type) since expected_entity is only VARCHAR(50)
      const formattedFields = fields.map(field => {
        // Filter out empty options for multiple choice
        const validOptions = field.type === 'multiple_choice' 
          ? field.options.filter(opt => opt.trim() !== '')
          : (field.type === 'true_false' ? ['True', 'False'] : []);
        
        // Store quiz data as JSON in options field (TEXT type can handle large JSON)
        const quizData = JSON.stringify({
          questionType: field.type,
          options: validOptions,
          correctAnswer: field.correct_answer,
          points: field.points || 1
        });
        
        return {
          label: field.label,
          type: 'textarea', // Use textarea as base type, we'll handle quiz logic in frontend
          is_required: field.is_required,
          ai_validation_enabled: true, // Enable AI validation for quiz forms
          expected_entity: 'quiz', // Mark as quiz type
          expected_sentiment: 'any', // Required field
          options: quizData // Store quiz data in options field (TEXT type)
        };
      });

      console.log('Submitting quiz with fields:', formattedFields);
      const res = await api.post('/api/forms', { title, fields: formattedFields });
      setMessage(`Quiz created successfully with ID ${res.data.data.form.id}`);
      setTitle('');
      setFields([{
        label: '',
        type: 'multiple_choice',
        is_required: true,
        ai_validation_enabled: true, // AI validation enabled by default for quiz forms
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1
      }]);
      setFieldErrors({});
    } catch (err) {
      console.error('Quiz creation error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to create quiz. Please check the console for details.';
      setMessage(errorMessage);
    }
  };

  return (
    <div className="create-form-container">
      {/* Left Sidebar */}
      <div className="create-form-sidebar">
        <h2 className="sidebar-title">Forms</h2>
        <div className="sidebar-nav-container">
          <nav className="sidebar-nav sidebar-nav-box">
            <Link to="/" className="sidebar-nav-item">
              <span className="sidebar-icon">🏠</span>
              <span>Home</span>
            </Link>
            <Link to="/text-form" className="sidebar-nav-item">
              <span className="sidebar-icon">💬</span>
              <span>Text Form</span>
            </Link>
            <Link to="/email-form" className="sidebar-nav-item">
              <span className="sidebar-icon">✉️</span>
              <span>Email</span>
            </Link>
            <Link to="/number-form" className="sidebar-nav-item">
              <span className="sidebar-icon">#</span>
              <span>Number</span>
            </Link>
            <Link to="/quiz-form" className="sidebar-nav-item sidebar-nav-item-active">
              <span className="sidebar-icon">📝</span>
              <span>Quiz Form</span>
            </Link>
            <Link to="/admin" className="sidebar-nav-item">
              <span className="sidebar-icon">⚙️</span>
              <span>Settings</span>
            </Link>
          </nav>
          <nav className="sidebar-nav sidebar-nav-box">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
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
            <h1 className="create-form-title">Create Quiz Form</h1>
            <p className="create-form-subtitle">
              Create a quiz with multiple choice, fill in the blank, or true/false questions. Set correct answers and points for automatic scoring.
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
                      className="field-type-button"
                      style={{ padding: '0.625rem 1.25rem', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '8px' }}
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
                        className="add-field-button"
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
                    <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                      Note: Answers will be compared case-insensitively
                    </small>
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

                {/* Points */}
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
                  <button
                    type="button"
                    onClick={addField}
                    className="add-field-button"
                  >
                    + Add Question
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="save-form-button save-form-button-yellow"
          >
            Save Quiz
          </button>

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

export default QuizFormPage;

