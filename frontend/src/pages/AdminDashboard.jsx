// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '../api';
// import { useAuth } from '../AuthContext';
// import './AdminDashboard.css'; //new

// const fieldTemplate = { 
//   label: '', 
//   type: 'text', 
//   is_required: false, 
//   ai_validation_enabled: false,
//   placeholder: '', //new
//   description: '' //new
// };

// function AdminDashboard() {
//   const { user } = useAuth();
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState(''); //new
//   const [fields, setFields] = useState([{ ...fieldTemplate }]);
//   const [message, setMessage] = useState('');
//   const [messageType, setMessageType] = useState('info'); //new
//   const [viewFormId, setViewFormId] = useState('');
//   const [createdForms, setCreatedForms] = useState([]); //new
//   const [isLoading, setIsLoading] = useState(false); //new
//   const [activeTab, setActiveTab] = useState('create'); //new
//   const [aiSettings, setAiSettings] = useState({ //new
//     sentimentThreshold: 0.3, //new
//     entityConfidence: 0.7, //new
//     fallbackValidation: true //new
//   }); //new
//   const navigate = useNavigate();

//   //may cause issues
//   // useEffect(() => { //new
//   //   fetchUserForms(); //new
//   // }, [user]); //new
//   //may cause issues

//   const fetchUserForms = async () => { //new
//     if (!user || user.role !== 'admin') return; //new
    
//     try { //new
//       const response = await api.get('/api/forms/my-forms'); //new
//       setCreatedForms(response.data.data || []); //new
//     } catch (error) { //new
//       console.error('Error fetching forms:', error); //new
//     } //new
//   }; //new

//   const updateField = (index, key, value) => {
//     const next = [...fields];
//     next[index] = { ...next[index], [key]: value };
//     setFields(next);
//   };

//   const addField = () => setFields([...fields, { ...fieldTemplate }]);

//   const removeField = (index) => { //new
//     if (fields.length <= 1) { //new
//       setMessage('Form must have at least one field'); //new
//       setMessageType('error'); //new
//       return; //new
//     } //new
//     setFields(fields.filter((_, i) => i !== index)); //new
//   }; //new

//   const moveField = (index, direction) => { //new
//     if (direction === 'up' && index === 0) return; //new
//     if (direction === 'down' && index === fields.length - 1) return; //new
    
//     const newFields = [...fields]; //new
//     const targetIndex = direction === 'up' ? index - 1 : index + 1; //new
//     [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]; //new
//     setFields(newFields); //new
//   }; //new

//   // const handleSubmit = async (e) => {
//   //   e.preventDefault();
//   //   setMessage('');
//   //   if (!user || user.role !== 'admin') {
//   //     setMessage('You must be logged in as an administrator to create forms.');
//   //     return;
//   //   }
//   //   try {
//   //     const res = await api.post('/api/forms', { title, fields });
//   //     setMessage(`Form created with ID ${res.data.data.form.id}`);
//   //   } catch (err) {
//   //     setMessage(
//   //       err.response?.data?.message || 'Failed to create form. Check backend configuration.'
//   //     );
//   //   }
//   // }; //old

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setMessageType('info');
    
//     if (!user || user.role !== 'admin') {
//       setMessage('You must be logged in as an administrator to create forms.');
//       setMessageType('error');
//       return;
//     }

//     if (fields.some(field => !field.label.trim())) {
//       setMessage('All fields must have a label.');
//       setMessageType('error');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const formData = {
//         title,
//         description,
//         fields,
//         ai_settings: aiSettings
//       };
      
//       const res = await api.post('/api/forms', formData);
      
//       setMessage(`✅ Form "${title}" created successfully! Form ID: ${res.data.data.form.id}`);
//       setMessageType('success');
      
//       // Reset form
//       setTitle('');
//       setDescription('');
//       setFields([{ ...fieldTemplate }]);
      
//       // Refresh forms list
//       fetchUserForms();
      
//       // Auto-switch to forms list
//       setTimeout(() => setActiveTab('my-forms'), 2000);
      
//     } catch (err) {
//       const errorMsg = err.response?.data?.message || 'Failed to create form. Check backend configuration.';
//       setMessage(`❌ ${errorMsg}`);
//       setMessageType('error');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const duplicateForm = async (formId) => {
//     try {
//       const res = await api.post(`/api/forms/${formId}/duplicate`);
//       setMessage(`✅ Form duplicated successfully! New ID: ${res.data.data.form.id}`);
//       setMessageType('success');
//       fetchUserForms();
//     } catch (error) {
//       setMessage(`❌ Failed to duplicate form: ${error.response?.data?.message || 'Unknown error'}`);
//       setMessageType('error');
//     }
//   };

//   const deleteForm = async (formId) => {
//     if (!window.confirm('Are you sure you want to delete this form? All submissions will be lost.')) {
//       return;
//     }
    
//     try {
//       await api.delete(`/api/forms/${formId}`);
//       setMessage(`✅ Form deleted successfully!`);
//       setMessageType('success');
//       fetchUserForms();
//     } catch (error) {
//       setMessage(`❌ Failed to delete form: ${error.response?.data?.message || 'Unknown error'}`);
//       setMessageType('error');
//     }
//   };

//   const getFormPreviewLink = (formId) => {
//     return `${window.location.origin}/forms/${formId}`;
//   };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text).then(() => {
//       setMessage('✅ Link copied to clipboard!');
//       setMessageType('success');
//       setTimeout(() => setMessage(''), 3000);
//     });
//   };

// //   return (
// //     <div>
// //       <h2>Administrator – Create Form</h2>
// //       <form onSubmit={handleSubmit} className="card">
// //         <label>
// //           Form Title
// //           <input value={title} onChange={(e) => setTitle(e.target.value)} required />
// //         </label>
// //         <h3>Fields</h3>
// //         {fields.map((field, index) => (
// //           <div key={index} className="field-row">
// //             <input
// //               placeholder="Label"
// //               value={field.label}
// //               onChange={(e) => updateField(index, 'label', e.target.value)}
// //               required
// //             />
// //             <select
// //               value={field.type}
// //               onChange={(e) => updateField(index, 'type', e.target.value)}
// //             >
// //               <option value="text">Text</option>
// //               <option value="textarea">Textarea</option>
// //               <option value="email">Email</option>
// //               <option value="number">Number</option>
// //             </select>
// //             <label className="checkbox">
// //               <input
// //                 type="checkbox"
// //                 checked={field.is_required}
// //                 onChange={(e) => updateField(index, 'is_required', e.target.checked)}
// //               />
// //               Required
// //             </label>
// //             <label className="checkbox">
// //               <input
// //                 type="checkbox"
// //                 checked={field.ai_validation_enabled}
// //                 onChange={(e) =>
// //                   updateField(index, 'ai_validation_enabled', e.target.checked)
// //                 }
// //               />
// //               AI Validation
// //             </label>
// //           </div>
// //         ))}
// //         <button type="button" onClick={addField}>
// //           + Add Field
// //         </button>
// //         <button type="submit">Save Form</button>
// //         {message && <p className="status">{message}</p>}
// //       </form>

// //       <div className="card">
// //         <h3>View Submissions</h3>
// //         <p>
// //           Enter a form ID to view all submissions and AI validation flags for that
// //           form.
// //         </p>
// //         <div className="field-row">
// //           <input
// //             type="number"
// //             placeholder="Form ID"
// //             value={viewFormId}
// //             onChange={(e) => setViewFormId(e.target.value)}
// //           />
// //           <button
// //             type="button"
// //             onClick={() => viewFormId && navigate(`/admin/forms/${viewFormId}/submissions`)}
// //           >
// //             Open Submissions
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // } //old

// export default AdminDashboard;


// AdminDashboard.jsx - Enhanced with Google Forms-like features
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import './AdminDashboard.css';

// Enhanced field template
const fieldTemplate = { 
  id: Date.now(),
  label: '', 
  type: 'text', 
  is_required: false, 
  ai_validation_enabled: false,
  placeholder: '',
  description: '',
  options: [],
  min: '',
  max: '',
  rows: 4
};

// Form settings
const formSettingsTemplate = {
  showProgress: true,
  allowMultipleSubmissions: false,
  collectEmail: false,
  confirmationMessage: 'Thank you for your submission!',
  requiresLogin: false
};

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([{ ...fieldTemplate, id: Date.now() }]);
  const [formSettings, setFormSettings] = useState(formSettingsTemplate);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [viewFormId, setViewFormId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);
  const navigate = useNavigate();

  // Field types with icons
  const fieldTypes = [
    { value: 'text', label: 'Short Text', icon: '📝' },
    { value: 'textarea', label: 'Paragraph', icon: '📄' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'date', label: 'Date', icon: '📅 date' },
    { value: 'time', label: 'Time', icon: '⏰' },
    { value: 'url', label: 'URL', icon: '🔗' },
    { value: 'phone', label: 'Phone', icon: '📱' },
    { value: 'select', label: 'Multiple Choice', icon: '🔘' },
    { value: 'radio', label: 'Radio Buttons', icon: '⭕' },
    { value: 'checkbox', label: 'Checkboxes', icon: '☑️' },
    { value: 'dropdown', label: 'Dropdown', icon: '▼' },
    { value: 'scale', label: 'Linear Scale', icon: '📊' }
  ];

  const updateField = (index, key, value) => {
    const next = [...fields];
    next[index] = { ...next[index], [key]: value };
    
    // Reset options when switching to non-option types
    if (key === 'type' && !['select', 'radio', 'checkbox', 'dropdown', 'scale'].includes(value)) {
      next[index].options = [];
    }
    
    setFields(next);
  };

  const addField = () => {
    const newField = { ...fieldTemplate, id: Date.now() };
    setFields([...fields, newField]);
  };

  const removeField = (index) => {
    if (fields.length <= 1) {
      setMessage('Form must have at least one field');
      setMessageType('error');
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const duplicateField = (index) => {
    const fieldToDuplicate = { 
      ...fields[index], 
      id: Date.now(), 
      label: `${fields[index].label} (Copy)` 
    };
    setFields([...fields, fieldToDuplicate]);
  };

  const moveField = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) {
      return;
    }
    
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const addOption = (fieldIndex) => {
    const newFields = [...fields];
    newFields[fieldIndex].options = [
      ...(newFields[fieldIndex].options || []),
      `Option ${(newFields[fieldIndex].options?.length || 0) + 1}`
    ];
    setFields(newFields);
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    const newFields = [...fields];
    newFields[fieldIndex].options[optionIndex] = value;
    setFields(newFields);
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const newFields = [...fields];
    newFields[fieldIndex].options = newFields[fieldIndex].options.filter((_, i) => i !== optionIndex);
    setFields(newFields);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('info');
    setIsSubmitting(true);
    
    if (!user || user.role !== 'admin') {
      setMessage('You must be logged in as an administrator to create forms.');
      setMessageType('error');
      setIsSubmitting(false);
      return;
    }
    
    if (fields.some(f => !f.label.trim())) {
      setMessage('All fields must have a label.');
      setMessageType('error');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const formData = { 
        title, 
        description,
        fields,
        settings: formSettings
      };
      
      const res = await api.post('/api/forms', formData);
      
      setMessage(`✅ Form "${title}" created successfully! Form ID: ${res.data?.data?.form?.id || 'N/A'}`);
      setMessageType('success');
      
    } catch (err) {
      console.error('Form creation error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create form.';
      setMessage(`❌ Error: ${errorMsg}`);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFields([{ ...fieldTemplate, id: Date.now() }]);
    setFormSettings(formSettingsTemplate);
    setMessage('');
    setMessageType('info');
  };

  const renderFieldPreview = (field) => {
    switch(field.type) {
      case 'textarea':
        return (
          <textarea 
            placeholder={field.placeholder || 'Your answer'} 
            rows={field.rows || 4}
            disabled
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        );
      
      case 'email':
        return <input type="email" placeholder={field.placeholder || 'email@example.com'} disabled style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />;
      
      case 'number':
        return <input type="number" placeholder={field.placeholder || 'Enter a number'} disabled style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />;
      
      case 'date':
        return <input type="date" disabled style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />;
      
      case 'time':
        return <input type="time" disabled style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />;
      
      case 'url':
        return <input type="url" placeholder={field.placeholder || 'https://example.com'} disabled style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />;
      
      case 'phone':
        return <input type="tel" placeholder={field.placeholder || '(123) 456-7890'} disabled style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />;
      
      case 'select':
      case 'radio':
        return (
          <div>
            {(field.options || []).map((option, optIndex) => (
              <div key={optIndex} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {field.type === 'radio' ? (
                  <input type="radio" name={`field-${field.id}`} disabled />
                ) : (
                  <div style={{ width: '16px', height: '16px', border: '2px solid #ddd', borderRadius: '3px' }}></div>
                )}
                <span>{option || `Option ${optIndex + 1}`}</span>
              </div>
            ))}
          </div>
        );
      
      case 'dropdown':
        return (
          <select disabled style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <option value="">Select an option</option>
            {(field.options || []).map((option, optIndex) => (
              <option key={optIndex} value={optIndex}>{option || `Option ${optIndex + 1}`}</option>
            ))}
          </select>
        );
      
      case 'scale':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>{field.min || 1}</span>
              <span>{field.max || 5}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Array.from({ length: (field.max || 5) - (field.min || 1) + 1 }).map((_, i) => (
                <button 
                  key={i} 
                  type="button" 
                  disabled
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    background: '#f8f9fa'
                  }}
                >
                  {i + (parseInt(field.min) || 1)}
                </button>
              ))}
            </div>
          </div>
        );
      
      default: // text
        return <input type="text" placeholder={field.placeholder || 'Your answer'} disabled style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>🤖 Smart Form Validator - Administrator Dashboard</h1>
        <div className="user-info">
          <span className="user-role-badge">👑 Administrator</span>
          <span className="user-email">{user?.email}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
          <button className="close-btn" onClick={() => setMessage('')}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          🛠️ Create Form
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Form Settings
        </button>
        <button 
          className={activeTab === 'preview' ? 'active' : ''} 
          onClick={() => setActiveTab('preview')}
        >
          👁️ Preview
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="card">
          <h2>Create New Form</h2>
          
          <div className="form-builder-grid">
            {/* Left Column - Form Settings */}
            <div className="form-settings">
              <div className="form-group">
                <label>Form Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Form Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this form..."
                  rows={3}
                />
              </div>

              <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Add New Field</h3>
              <div className="field-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {fieldTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      const newField = { 
                        ...fieldTemplate, 
                        id: Date.now(),
                        type: type.value,
                        label: `New ${type.label} Field`
                      };
                      setFields([...fields, newField]);
                      setMessage(`✅ Added a new ${type.label} field`);
                      setMessageType('success');
                    }}
                    style={{
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#667eea'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  >
                    <span style={{ fontSize: '20px' }}>{type.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{type.label}</span>
                  </button>
                ))}
              </div>

              <div className="form-actions" style={{ marginTop: '40px' }}>
                <button 
                  type="button" 
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Clear Form
                </button>
                <button 
                  type="submit" 
                  className="primary-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim()}
                >
                  {isSubmitting ? 'Creating...' : '📋 Save Form'}
                </button>
              </div>
            </div>

            {/* Right Column - Fields List */}
            <div className="fields-builder">
              <h3>Form Fields ({fields.length})</h3>
              <div className="field-list" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                {fields.map((field, index) => (
                  <div key={field.id} className="field-builder">
                    <div className="field-header">
                      <span className="field-number">#{index + 1}</span>
                      <h3 style={{ flexGrow: 1, fontSize: '16px', margin: 0 }}>
                        {field.label || 'Untitled Field'}
                        {field.ai_validation_enabled && <span className="ai-badge">🤖 AI</span>}
                      </h3>
                      <div className="field-actions">
                        <button 
                          className="icon-btn" 
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={() => moveField(index, 'down')}
                          disabled={index === fields.length - 1}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={() => duplicateField(index)}
                          title="Duplicate"
                        >
                          ⎘
                        </button>
                        <button 
                          className="icon-btn danger" 
                          onClick={() => removeField(index)}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="field-config">
                      <div className="config-group">
                        <label>Field Label *</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(index, 'label', e.target.value)}
                          placeholder="e.g., What is your name?"
                          required
                        />
                      </div>

                      <div className="config-group">
                        <label>Field Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, 'type', e.target.value)}
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="config-group">
                        <label>Placeholder / Hint</label>
                        <input
                          type="text"
                          value={field.placeholder}
                          onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                          placeholder="e.g., Enter your answer"
                        />
                      </div>

                      <div className="config-group">
                        <label>Description</label>
                        <textarea
                          value={field.description}
                          onChange={(e) => updateField(index, 'description', e.target.value)}
                          placeholder="Help text for users"
                          rows={2}
                        />
                      </div>

                      {/* Options for select/radio/checkbox/dropdown */}
                      {['select', 'radio', 'checkbox', 'dropdown'].includes(field.type) && (
                        <div className="config-group">
                          <label>Options</label>
                          <div style={{ marginBottom: '10px' }}>
                            {(field.options || []).map((option, optIndex) => (
                              <div key={optIndex} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                  placeholder={`Option ${optIndex + 1}`}
                                  style={{ flex: 1 }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeOption(index, optIndex)}
                                  style={{
                                    padding: '8px 12px',
                                    background: '#ffebee',
                                    color: '#c62828',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addOption(index)}
                              style={{
                                padding: '8px 16px',
                                background: '#e8f5e9',
                                color: '#2e7d32',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              + Add Option
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Scale settings */}
                      {field.type === 'scale' && (
                        <div className="config-group">
                          <label>Scale Range</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="number"
                              placeholder="Min"
                              value={field.min}
                              onChange={(e) => updateField(index, 'min', e.target.value)}
                              style={{ width: '80px' }}
                            />
                            <span>to</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={field.max}
                              onChange={(e) => updateField(index, 'max', e.target.value)}
                              style={{ width: '80px' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Textarea rows */}
                      {field.type === 'textarea' && (
                        <div className="config-group">
                          <label>Rows</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={field.rows}
                            onChange={(e) => updateField(index, 'rows', e.target.value)}
                          />
                        </div>
                      )}

                      <div className="field-options">
                        <label className="option-checkbox">
                          <input
                            type="checkbox"
                            checked={field.is_required}
                            onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                          />
                          <span>Required Field</span>
                        </label>

                        {['text', 'textarea', 'email', 'url', 'phone'].includes(field.type) && (
                          <label className="option-checkbox">
                            <input
                              type="checkbox"
                              checked={field.ai_validation_enabled}
                              onChange={(e) => updateField(index, 'ai_validation_enabled', e.target.checked)}
                            />
                            <span className="ai-option">Enable AI Validation</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={addField}
                className="add-field-btn"
              >
                + Add Custom Field
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card">
          <h2>Form Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">
                Submission Settings
                <span className="setting-desc">Configure how users can submit the form</span>
              </label>
              <div style={{ marginTop: '15px' }}>
                <label className="option-checkbox" style={{ display: 'block', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formSettings.showProgress}
                    onChange={(e) => setFormSettings({...formSettings, showProgress: e.target.checked})}
                  />
                  <span>Show progress bar</span>
                </label>
                
                <label className="option-checkbox" style={{ display: 'block', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formSettings.collectEmail}
                    onChange={(e) => setFormSettings({...formSettings, collectEmail: e.target.checked})}
                  />
                  <span>Collect email addresses</span>
                </label>
                
                <label className="option-checkbox" style={{ display: 'block', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formSettings.allowMultipleSubmissions}
                    onChange={(e) => setFormSettings({...formSettings, allowMultipleSubmissions: e.target.checked})}
                  />
                  <span>Allow multiple submissions per user</span>
                </label>
                
                <label className="option-checkbox" style={{ display: 'block', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formSettings.requiresLogin}
                    onChange={(e) => setFormSettings({...formSettings, requiresLogin: e.target.checked})}
                  />
                  <span>Require login to submit</span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                Confirmation Message
                <span className="setting-desc">What users see after submitting</span>
              </label>
              <textarea
                value={formSettings.confirmationMessage}
                onChange={(e) => setFormSettings({...formSettings, confirmationMessage: e.target.value})}
                rows={4}
                style={{ width: '100%', marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div className="setting-item">
              <label className="setting-label">
                Form Statistics
                <span className="setting-desc">Overview of your form</span>
              </label>
              <div className="usage-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Fields</span>
                  <span className="stat-value">{fields.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">AI-Enabled Fields</span>
                  <span className="stat-value">{fields.filter(f => f.ai_validation_enabled).length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Required Fields</span>
                  <span className="stat-value">{fields.filter(f => f.is_required).length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Choice Fields</span>
                  <span className="stat-value">{fields.filter(f => ['select', 'radio', 'checkbox', 'dropdown'].includes(f.type)).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="card">
          <h2>Form Preview</h2>
          <p className="section-desc">This is how your form will appear to users</p>
          
          <div style={{ 
            background: '#f8f9fa', 
            padding: '30px', 
            borderRadius: '8px',
            marginTop: '20px',
            border: '1px solid #eaeaea'
          }}>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>{title || 'Untitled Form'}</h2>
            {description && <p style={{ color: '#666', marginBottom: '30px' }}>{description}</p>}
            
            {fields.map((field, index) => (
              <div key={field.id} style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #eaeaea'
              }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#444' }}>
                  {field.label || 'Untitled Field'}
                  {field.is_required && <span style={{ color: '#dc3545' }}> *</span>}
                  {field.ai_validation_enabled && (
                    <span style={{
                      background: '#e3f2fd',
                      color: '#1565c0',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      marginLeft: '8px'
                    }}>
                      🤖 AI Validation
                    </span>
                  )}
                </label>
                
                {field.description && (
                  <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px', fontStyle: 'italic' }}>
                    {field.description}
                  </p>
                )}
                
                {renderFieldPreview(field)}
              </div>
            ))}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #eaeaea'
            }}>
              <button
                type="button"
                disabled
                style={{
                  padding: '12px 30px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'not-allowed'
                }}
              >
                Submit
              </button>
              
              {formSettings.showProgress && (
                <span style={{ color: '#666', fontSize: '14px' }}>
                  Page 1 of 1
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Submissions Panel */}
      <div className="card">
        <h3>Form Management</h3>
        <div className="dashboard-footer">
          <div className="footer-actions">
            <button 
              className="view-submissions-btn"
              onClick={() => {
                if (viewFormId) {
                  navigate(`/admin/forms/${viewFormId}/submissions`);
                } else {
                  setMessage('Please enter a form ID first');
                  setMessageType('error');
                }
              }}
            >
              📊 View Submissions
            </button>
            <div className="form-id-input">
              <input
                type="number"
                placeholder="Enter Form ID"
                value={viewFormId}
                onChange={(e) => setViewFormId(e.target.value)}
              />
            </div>
          </div>
          <div className="system-info">
            <span>Total Fields: {fields.length}</span>
            <span>AI Fields: {fields.filter(f => f.ai_validation_enabled).length}</span>
            <span>Form Status: Draft</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;