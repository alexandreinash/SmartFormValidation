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
import { useParams } from 'react-router-dom';
import api from '../api';
import '../css/FormFillPage.css';

function FormFillPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState([]);
  const [basicErrors, setBasicErrors] = useState([]);
  const [aiErrors, setAiErrors] = useState([]);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const res = await api.get(`/api/forms/${id}`);
        setForm(res.data.data);
        
        // Initialize empty values for each field
        const initialValues = {};
        res.data.data.fields.forEach(field => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setErrors([]);
    setIsSubmitting(true);
    
    try {
      // Backend expects: POST /api/submissions/:formId with body { values: { [fieldId]: value } }
      const payload = {
        values: values
      };
      
      const res = await api.post(`/api/submissions/${id}`, payload);
      
      if (res.data.success) {
        setStatus('Form submitted successfully!');
        // Clear form
        const clearedValues = {};
        Object.keys(values).forEach(key => {
          clearedValues[key] = '';
        });
        setValues(clearedValues);
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

  if (!form) {
    return (
      <div className="loading-container">
        <p>Loading form...</p>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="form-fill-container">
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
                    {basicErrors.map((error, idx) => (
                      <li key={`basic-${idx}`}>
                        <strong>{error.fieldLabel || `Field ${error.fieldId}`}:</strong> {error.message}
                      </li>
                    ))}
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
            {form.fields.map((field) => {
              const fieldError = getFieldError(field.id);
              
              return (
                <div 
                  key={field.id} 
                  className={`field-group ${getFieldClassName(field.id)}`}
                >
                  <div className="field-header">
                    <label className="field-label">
                      {field.label}
                      {field.is_required && <span className="required-asterisk">*</span>}
                    </label>
                    {field.ai_validation_enabled && (
                      <span className="ai-badge" title="AI-powered validation enabled">
                        🤖 AI Check
                      </span>
                    )}
                  </div>
                  
                  <div className="field-input-container">
                    {field.type === 'textarea' ? (
                      <textarea
                        className="form-textarea"
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        rows={4}
                      />
                    ) : (
                      <input
                        className="form-input"
                        type={field.type === 'email' ? 'email' : 
                              field.type === 'number' ? 'number' : 'text'}
                        value={values[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                  
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

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Submit Form'
              )}
            </button>
            
            <div className="form-legend">
              <div className="legend-item">
                <span className="legend-marker required-marker">*</span>
                <small>Required field</small>
              </div>
              <div className="legend-item">
                <span className="legend-marker ai-marker">🤖</span>
                <small>AI validation enabled</small>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {status && (
            <div className={`status-message ${status.includes('success') ? 'success' : 'error'}`}>
              {status}
            </div>
          )}
        </form>
      </div>
      
      {/* Footer Information */}
      <footer className="form-footer">
        <div className="footer-info">
          <p>
            <strong>Smart Form Validator</strong> with AI Integration
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