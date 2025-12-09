// import React, { useEffect, useState } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import api from '../api';

// function FormFillPage() {
//   const { id } = useParams();
//   const [form, setForm] = useState(null);
//   const [values, setValues] = useState({});
//   const [errors, setErrors] = useState([]);
//   const [status, setStatus] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const res = await api.get(`/api/forms/${id}`);
//         setForm(res.data.data);
//         setStatus('');
//       } catch (err) {
//         setStatus('Failed to load form.');
//         setForm(null);
//       }
//       setLoading(false);
//     };
//     load();
//   }, [id]);

//   const handleChange = (fieldId, value) => {
//     setValues((prev) => ({ ...prev, [fieldId]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setStatus('');
//     setErrors([]);
//     try {
//       const res = await api.post(`/api/submissions/${id}`, { values });
//       setStatus(res.data.message);
//     } catch (err) {
//       if (err.response?.data?.errors) {
//         setErrors(err.response.data.errors);
//         setStatus(err.response.data.message || 'Validation errors occurred.');
//       } else {
//         setStatus('Submission failed.');
//       }
//     }
//   };

//   if (loading) {
//     return <p>Loading form...</p>;
//   }

//   if (!form) {
//     return <p className="status">{status || 'Form not found.'}</p>;
//   }

//   return (
//     <div>
//       <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
//         <Link to="/forms" className="button" style={{ padding: '0.35rem 0.9rem', borderRadius: '999px' }}>
//           ← Back
//         </Link>
//       </div>
//       <h2>{form.title}</h2>
//       <form onSubmit={handleSubmit} className="card">
//         {form.fields.map((field) => (
//           <div key={field.id} className="field-column">
//             <label>
//               {field.label}
//               {field.is_required && <span className="required">*</span>}
//             </label>
//             {field.type === 'textarea' ? (
//               <textarea
//                 value={values[field.id] || ''}
//                 onChange={(e) => handleChange(field.id, e.target.value)}
//               />
//             ) : (
//               <input
//                 type={field.type === 'text' ? 'text' : field.type}
//                 value={values[field.id] || ''}
//                 onChange={(e) => handleChange(field.id, e.target.value)}
//               />
//             )}
//             <ul className="error-list">
//               {errors
//                 .filter((er) => er.fieldId === field.id)
//                 .map((er, idx) => (
//                   <li key={idx}>{er.message}</li>
//                 ))}
//             </ul>
//           </div>
//         ))}
//         <button type="submit">Submit</button>
//         {status && (
//           <div>
//             <p className="status">{status}</p>
//             {status.includes('successfully') && (
//               <Link to="/forms" className="button" style={{ marginTop: '1rem' }}>
//                 View All Forms
//               </Link>
//             )}
//           </div>
//         )}
//       </form> 
//     </div>
//   );
// }

// export default FormFillPage;


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import '../css/FormFillPage.css';

function FormFillPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState([]);
  const [basicErrors, setBasicErrors] = useState([]);
  const [aiErrors, setAiErrors] = useState([]);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [isQuiz, setIsQuiz] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const res = await api.get(`/api/forms/${id}`);
        const formData = res.data.data;
        setForm(formData);
        
        // Check if this is a quiz form
        const hasQuizFields = formData.fields.some(field => {
          try {
            // Check options field first (new method), then expected_entity (old method)
            const quizData = field.options 
              ? JSON.parse(field.options)
              : (field.expected_entity && field.expected_entity !== 'none' && field.expected_entity !== 'quiz'
                  ? JSON.parse(field.expected_entity)
                  : null);
            return quizData && quizData.questionType;
          } catch {
            return false;
          }
        });
        setIsQuiz(hasQuizFields);
        
        // Initialize empty values for each field
        const initialValues = {};
        formData.fields.forEach(field => {
          initialValues[field.id] = '';
        });
        setValues(initialValues);
      } catch (err) {
        setStatus('Failed to load form. Please check the form ID.');
      }
    };
    
    if (id) {
      loadForm();
    }
  }, [id]);

  // Separate errors into basic and AI categories
  useEffect(() => {
    if (errors.length > 0) {
      const basic = [];
      const ai = [];
      
      errors.forEach(error => {
        // Check if error is AI-related (based on message content or structure)
        if (error.message && (
          error.message.includes('tone') || 
          error.message.includes('sentiment') || 
          error.message.includes('entity') ||
          error.message.includes('AI') ||
          error.message.includes('context')
        )) {
          ai.push(error);
        } else {
          basic.push(error);
        }
      });
      
      setBasicErrors(basic);
      setAiErrors(ai);
    } else {
      setBasicErrors([]);
      setAiErrors([]);
    }
  }, [errors]);

  const handleChange = (fieldId, value) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    // Clear errors for this field when user starts typing
    setErrors(prev => prev.filter(error => error.fieldId !== fieldId));
    // Clear status message when user starts typing
    if (status && status.includes('Please fill')) {
      setStatus('');
    }
  };

  const calculateQuizScore = () => {
    if (!isQuiz || !form) return null;
    
    let totalPoints = 0;
    let earnedPoints = 0;
    const results = [];
    
    form.fields.forEach(field => {
      try {
        // Parse quiz data from options field (new method) or expected_entity (old method)
        const quizData = field.options 
          ? JSON.parse(field.options)
          : (field.expected_entity && field.expected_entity !== 'none' && field.expected_entity !== 'quiz'
              ? JSON.parse(field.expected_entity)
              : {});
        if (quizData.questionType) {
          const points = quizData.points || 1;
          totalPoints += points;
          
          const userAnswer = values[field.id] || '';
          const correctAnswer = quizData.correctAnswer || '';
          let isCorrect = false;
          
          if (quizData.questionType === 'multiple_choice') {
            isCorrect = userAnswer.trim() === correctAnswer.trim();
          } else if (quizData.questionType === 'fill_blank') {
            const matchMode = quizData.matchMode || 'case_insensitive';
            if (matchMode === 'exact') {
              isCorrect = userAnswer.trim() === correctAnswer.trim();
            } else {
              // default: case-insensitive
              isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
            }
          } else if (quizData.questionType === 'true_false') {
            isCorrect = userAnswer.trim() === correctAnswer.trim();
          }
          
          if (isCorrect) {
            earnedPoints += points;
          }
          
          results.push({
            question: field.label,
            userAnswer,
            correctAnswer,
            isCorrect,
            points: isCorrect ? points : 0,
            maxPoints: points
          });
        }
      } catch (e) {
        // Not a quiz field, skip
      }
    });
    
    return { totalPoints, earnedPoints, results, percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setErrors([]);
    setIsSubmitting(true);
    setQuizResults(null);
    
    // Client-side validation: Check for required fields and blank/whitespace-only answers
    const validationErrors = [];
    if (form && form.fields) {
      form.fields.forEach(field => {
        const value = values[field.id];
        // Check if field is required and empty or only whitespace
        if (field.is_required) {
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            validationErrors.push({
              fieldId: field.id,
              type: 'basic',
              message: 'This field is required. Please provide an answer.',
            });
          }
        }
        // Also check for any field that has a value but it's only whitespace
        if (value && typeof value === 'string' && value.trim() === '' && value.length > 0) {
          validationErrors.push({
            fieldId: field.id,
            type: 'basic',
            message: 'Please enter a valid answer. Blank spaces are not accepted.',
          });
        }
      });
      
      // Check if ALL fields are empty or whitespace (only show if no individual errors exist)
      // This prevents completely blank submissions
      if (validationErrors.length === 0) {
        const allFieldsEmpty = form.fields.every(field => {
          const value = values[field.id];
          return !value || (typeof value === 'string' && value.trim() === '');
        });
        
        if (allFieldsEmpty && form.fields.length > 0) {
          // Add error to first field
          validationErrors.push({
            fieldId: form.fields[0].id,
            type: 'basic',
            message: 'Please provide at least one answer before submitting. Blank submissions are not accepted.',
          });
        }
      }
    }
    
    // If there are validation errors, stop submission
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setStatus('Please fill in all required fields with valid answers before submitting.');
      setIsSubmitting(false);
      return;
    }
    
    // Calculate quiz score if it's a quiz
    if (isQuiz) {
      const score = calculateQuizScore();
      setQuizResults(score);
    }
    
    try {
      // Backend expects: POST /api/submissions/:formId with body { values: { [fieldId]: value } }
      const payload = {
        values: values
      };
      
      const res = await api.post(`/api/submissions/${id}`, payload);
      
      if (res.data.success) {
        setStatus(isQuiz ? 'Quiz submitted successfully! Check your results below.' : 'Form submitted successfully!');
        // Don't clear form for quiz so user can see results
        if (!isQuiz) {
          const clearedValues = {};
          Object.keys(values).forEach(key => {
            clearedValues[key] = '';
          });
          setValues(clearedValues);
        }
      } else {
        setStatus(res.data.message || 'Submission completed with notes.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        setStatus(err.response.data.message || 'Please correct the errors below.');
      } else if (err.response?.data?.message) {
        setStatus(err.response.data.message);
      } else {
        setStatus('Submission failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldId) => {
    return errors.find(error => error.fieldId === fieldId);
  };

  const getFieldClassName = (fieldId) => {
    const error = getFieldError(fieldId);
    if (error) {
      // Different CSS class for AI errors vs basic errors
      const isAIError = error.message && (
        error.message.includes('tone') || 
        error.message.includes('sentiment') || 
        error.message.includes('entity') ||
        error.message.includes('AI') ||
        error.message.includes('context')
      );
      return isAIError ? 'field-error-ai' : 'field-error-basic';
    }
    return '';
  };

  // AI summary for legend: enabled / disabled / partially enabled
  const aiEnabledCount = form && form.fields ? form.fields.filter(f => f.ai_validation_enabled).length : 0;
  const aiLegendText = (form && form.fields)
    ? (aiEnabledCount === form.fields.length ? 'AI validation enabled'
       : aiEnabledCount === 0 ? 'AI validation disabled'
       : 'AI validation partially enabled')
    : 'AI validation disabled';

  if (!form) {
    return (
      <div className="loading-container">
        <p>Loading form...</p>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Check if form has no fields
  if (!form.fields || form.fields.length === 0) {
    return (
      <div className="form-fill-container">
        <button
          type="button"
          className="button button-secondary"
          style={{ marginBottom: '1.5rem' }}
          onClick={() => navigate('/user/forms')}
        >
          ← Back
        </button>
        <div className="empty-state-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>No Questions Available</h2>
          <p>This form doesn't have any questions yet. Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-fill-container">
      <button
        type="button"
        className="button button-secondary"
        style={{ marginBottom: '1.5rem' }}
        onClick={() => navigate('/user/forms')}
      >
        ← Back
      </button>
      <header className="form-header">
        <h1>{form.title}</h1>
        {form.description && <p className="form-description">{form.description}</p>}
      </header>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {/* Unified Error Display Section (FR-06) */}
          {(basicErrors.length > 0 || aiErrors.length > 0) && (
            <div className="validation-summary">
              <h3 className="validation-title">Please fix the following issues:</h3>
              
              {basicErrors.length > 0 && (
                <div className="error-section basic-errors">
                  <h4>Basic Validation Errors</h4>
                  <ul>
                    {basicErrors.map((error, idx) => {
                      const field = form.fields.find(f => f.id === error.fieldId);
                      const fieldLabel = field ? field.label : `Field ${error.fieldId}`;
                      return (
                        <li key={`basic-${idx}`}>
                          <strong>{fieldLabel}:</strong> {error.message}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              {aiErrors.length > 0 && (
                <div className="error-section ai-errors">
                  <h4>AI-Powered Suggestions</h4>
                  <p className="ai-explanation">
                    Our AI has detected potential issues with context or tone:
                  </p>
                  <ul>
                    {aiErrors.map((error, idx) => (
                      <li key={`ai-${idx}`}>
                        <strong>{error.fieldLabel || `Field ${error.fieldId}`}:</strong> {error.message}
                      </li>
                    ))}
                  </ul>
                  <div className="ai-note">
                    <small>
                      💡 AI suggestions are based on context analysis. You may choose to ignore them if your input is correct.
                    </small>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="fields-container">
            {form.fields.map((field, index) => {
              const fieldError = getFieldError(field.id);
              let quizData = null;
              
              try {
                // Try to parse quiz data from options field first (new method), then fallback to expected_entity
                if (field.options) {
                  quizData = JSON.parse(field.options);
                } else if (field.expected_entity && field.expected_entity !== 'none' && field.expected_entity !== 'quiz') {
                  quizData = JSON.parse(field.expected_entity);
                }
              } catch (e) {
                // Not a quiz field
              }
              
              const isQuizField = quizData && quizData.questionType;
              
              return (
                <div 
                  key={field.id} 
                  className={`field-group ${getFieldClassName(field.id)}`}
                >
                  <div className="field-header">
                    <label className="field-label">
                      {isQuiz ? `Question ${index + 1}: ` : ''}{field.label}
                      {field.is_required && <span className="required-asterisk">*</span>}
                      {isQuizField && quizData.points && (
                        <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          ({quizData.points} point{quizData.points !== 1 ? 's' : ''})
                        </span>
                      )}
                    </label>
                    {field.ai_validation_enabled && (
                      <span className="ai-badge" title="AI-powered validation enabled">
                        🤖 AI Check
                      </span>
                    )}
                  </div>
                  
                  <div className="field-input-container">
                    {isQuizField ? (
                      // Quiz Question Rendering
                      (() => {
                        if (quizData.questionType === 'multiple_choice') {
                          const validOptions = quizData.options && quizData.options.filter(opt => opt.trim());
                          return (
                            <div className="quiz-options-list">
                              {validOptions && validOptions.length > 0 ? (
                                validOptions.map((option, optIndex) => (
                                  <label key={optIndex} className="quiz-option-label">
                                    <input
                                      type="radio"
                                      name={`question-${field.id}`}
                                      value={option}
                                      checked={values[field.id] === option}
                                      onChange={(e) => handleChange(field.id, e.target.value)}
                                      disabled={quizResults !== null}
                                      required={field.is_required}
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))
                              ) : (
                                <p style={{ color: '#dc2626', fontStyle: 'italic', padding: '0.5rem' }}>
                                  No options available for this question.
                                </p>
                              )}
                            </div>
                          );
                        } else if (quizData.questionType === 'fill_blank') {
                          const matchMode = quizData.matchMode || 'case_insensitive';
                          return (
                            <div>
                              <input
                                className="form-input"
                                type="text"
                                value={values[field.id] || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                placeholder="Enter your answer..."
                                disabled={quizResults !== null}
                                required={field.is_required}
                              />
                              <small style={{ color: '#6b7280', display: 'block', marginTop: '0.5rem' }}>
                                {matchMode === 'exact'
                                  ? 'Answers must match exact capitalization.'
                                  : 'Answers compared case-insensitively.'}
                              </small>
                            </div>
                          );
                        } else if (quizData.questionType === 'true_false') {
                          return (
                            <div className="quiz-options-list">
                              <label className="quiz-option-label">
                                <input
                                  type="radio"
                                  name={`question-${field.id}`}
                                  value="True"
                                  checked={values[field.id] === 'True'}
                                  onChange={(e) => handleChange(field.id, e.target.value)}
                                  disabled={quizResults !== null}
                                  required={field.is_required}
                                />
                                <span>True</span>
                              </label>
                              <label className="quiz-option-label">
                                <input
                                  type="radio"
                                  name={`question-${field.id}`}
                                  value="False"
                                  checked={values[field.id] === 'False'}
                                  onChange={(e) => handleChange(field.id, e.target.value)}
                                  disabled={quizResults !== null}
                                  required={field.is_required}
                                />
                                <span>False</span>
                              </label>
                            </div>
                          );
                        }
                        return null;
                      })()
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="form-textarea"
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        rows={4}
                        required={field.is_required}
                      />
                    ) : (
                      <input
                        className="form-input"
                        type={field.type === 'email' ? 'email' : 
                              field.type === 'number' ? 'number' : 'text'}
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        required={field.is_required}
                      />
                    )}
                  </div>
                  
                  {/* Show quiz result for this question */}
                  {quizResults && quizResults.results[index] && (
                    <div className={`quiz-result ${quizResults.results[index].isCorrect ? 'quiz-correct' : 'quiz-incorrect'}`}>
                      {quizResults.results[index].isCorrect ? (
                        <span>✓ Correct! (+{quizResults.results[index].points} point{quizResults.results[index].points !== 1 ? 's' : ''})</span>
                      ) : (
                        <span>✗ Incorrect. Correct answer: {quizResults.results[index].correctAnswer}</span>
                      )}
                    </div>
                  )}
                  
                  {fieldError && (
                    <div className="field-error-message">
                      <span className="error-icon">⚠️</span>
                      {fieldError.message}
                    </div>
                  )}
                  
                  {field.description && (
                    <div className="field-help">
                      <small>{field.description}</small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submission Status (single location for quiz & non-quiz) */}
          {status && status.includes('success') && (
            <div className="status-message success" style={{ marginBottom: '1.5rem' }}>
              {status}
            </div>
          )}
          {/* Quiz Results Summary */}
          {quizResults && (
            <div className="quiz-results-summary">
              <h3>Quiz Results</h3>
              <div className="quiz-score-display">
                <div className="quiz-score-main">
                  <span className="quiz-score-number">{quizResults.earnedPoints}</span>
                  <span className="quiz-score-separator">/</span>
                  <span className="quiz-score-total">{quizResults.totalPoints}</span>
                </div>
                <div className="quiz-score-percentage">
                  {quizResults.percentage}%
                </div>
              </div>
              <p className="quiz-score-message">
                {quizResults.percentage >= 80 ? '🎉 Excellent work!' :
                 quizResults.percentage >= 60 ? '👍 Good job!' :
                 quizResults.percentage >= 40 ? '📚 Keep studying!' :
                 '💪 Keep practicing!'}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting || quizResults !== null || (status && status.includes('success'))}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : quizResults !== null ? (
                'Quiz Submitted'
              ) : (
                isQuiz ? 'Submit Quiz' : 'Submit Form'
              )}
            </button>
            
            <div className="form-legend">
              <div className="legend-item">
                <span className="legend-marker required-marker">*</span>
                <small>Required field</small>
              </div>
              <div className="legend-item">
                <span className="legend-marker ai-marker">🤖</span>
                <small>{aiLegendText}</small>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {status && !status.includes('success') && errors.length > 0 && (
            <div className="validation-warning-banner">
              Some answers need review based on validation and AI checking.
            </div>
          )}
          {/* Remove duplicate success message below scoreboard */}
        </form>
      </div>
      
      {/* Footer Information */}
      <footer className="form-footer">
        <div className="footer-info">
          <p>
            <strong>Smart Form Validator</strong>
            <span style={{ fontWeight: 'normal', color: '#6b7280' }}> with AI Integration</span>
          </p>
          <p className="footer-note">
            This form uses Google Cloud Natural Language API to provide context-aware validation.
            Your data is processed securely and stored in compliance with data privacy regulations.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default FormFillPage;