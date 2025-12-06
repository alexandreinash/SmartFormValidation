// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import api from '../api';

// function FormListPage() {
//   const [forms, setForms] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [status, setStatus] = useState('');

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const res = await api.get('/api/forms');
//         setForms(res.data.data || []);
//         setStatus('');
//       } catch (err) {
//         setStatus('Failed to load forms.');
//       }
//       setLoading(false);
//     };
//     load();
//   }, []);

//   if (loading) {
//     return <p>Loading forms...</p>;
//   }

//   return (
//     <div className="page-heading">
//       <div className="page-header">
//         <div>
//           <h2 className="page-title">Available Forms</h2>
//           <p className="page-subtitle">
//             Select a form below to fill out and submit.
//           </p>
//         </div>
//       </div>

//       {status && <p className="status">{status}</p>}

//       {forms.length === 0 ? (
//         <div className="card empty-state">
//           <h3>No forms available</h3>
//           <p>There are no forms available at the moment. Please check back later.</p>
//         </div>
//       ) : (
//         <div className="card">
//           <div className="forms-list">
//             {forms.map((form) => (
//               <div key={form.id} className="form-card">
//                 <h3>{form.title}</h3>
//                 <p className="form-meta">Form ID: #{form.id}</p>
//                 <Link to={`/forms/${form.id}`} className="button">
//                   Fill Out Form
//                 </Link>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default FormListPage;

// FormListPage.jsx - ENHANCED WITH STYLES
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import './FormListPage.css';

function FormListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterByAI, setFilterByAI] = useState('all');

  useEffect(() => {
    const loadForms = async () => {
      try {
        const res = await api.get('/api/forms');
        const formsData = res.data.data || [];
        
        // Add additional metadata for display
        const enhancedForms = formsData.map(form => ({
          ...form,
          ai_fields_count: form.fields?.filter(f => f.ai_validation_enabled).length || 0,
          required_fields_count: form.fields?.filter(f => f.is_required).length || 0,
          total_fields: form.fields?.length || 0,
          created_date: form.created_at ? new Date(form.created_at).toLocaleDateString() : 'N/A',
          submission_count: form.submission_count || 0
        }));
        
        setForms(enhancedForms);
        setStatus('');
      } catch (err) {
        console.error('Error loading forms:', err);
        setStatus('Failed to load forms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadForms();
  }, []);

  // Filter and sort forms
  const filteredAndSortedForms = React.useMemo(() => {
    let result = [...forms];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(form =>
        form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply AI filter
    if (filterByAI === 'ai') {
      result = result.filter(form => form.ai_fields_count > 0);
    } else if (filterByAI === 'no-ai') {
      result = result.filter(form => form.ai_fields_count === 0);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'fields-asc':
          return a.total_fields - b.total_fields;
        case 'fields-desc':
          return b.total_fields - a.total_fields;
        default:
          return 0;
      }
    });
    
    return result;
  }, [forms, searchTerm, sortBy, filterByAI]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/forms');
      setForms(res.data.data || []);
      setStatus('Forms refreshed successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus('Failed to refresh forms.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="form-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading available forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-list-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            📋 Available Forms
            <span className="forms-count">
              ({filteredAndSortedForms.length} {filteredAndSortedForms.length === 1 ? 'form' : 'forms'})
            </span>
          </h1>
          <p className="page-subtitle">
            Select a form below to fill out and submit. Forms with 🤖 badge use AI-powered validation.
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={handleRefresh}
            className="refresh-button"
            title="Refresh forms list"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {status && (
        <div className={`status-message ${status.includes('successfully') ? 'success' : 'error'}`}>
          {status}
        </div>
      )}

      {/* Controls Section */}
      <div className="controls-section card">
        <div className="controls-grid">
          <div className="control-group">
            <label htmlFor="search">Search Forms</label>
            <input
              id="search"
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="control-group">
            <label htmlFor="sort">Sort By</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="fields-asc">Fewest Fields</option>
              <option value="fields-desc">Most Fields</option>
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="filter">AI Filter</label>
            <select
              id="filter"
              value={filterByAI}
              onChange={(e) => setFilterByAI(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Forms</option>
              <option value="ai">AI-Enabled Only</option>
              <option value="no-ai">Without AI</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      {filteredAndSortedForms.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-content">
            <div className="empty-state-icon">📄</div>
            <h3>No forms found</h3>
            <p>
              {searchTerm 
                ? `No forms match your search for "${searchTerm}"`
                : 'There are no forms available at the moment.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clear-search-button"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="forms-grid">
          {filteredAndSortedForms.map((form) => (
            <div key={form.id} className="form-card">
              <div className="form-card-header">
                <h3 className="form-title">{form.title}</h3>
                {form.ai_fields_count > 0 && (
                  <span className="ai-badge">
                    <span className="ai-icon">🤖</span>
                    AI Enabled
                  </span>
                )}
              </div>
              
              {form.description && (
                <p className="form-description">{form.description}</p>
              )}
              
              <div className="form-stats">
                <div className="stat-item">
                  <span className="stat-label">Fields:</span>
                  <span className="stat-value">{form.total_fields || 0}</span>
                </div>
                
                <div className="stat-item">
                  <span className="stat-label">Required:</span>
                  <span className="stat-value required-stat">
                    {form.required_fields_count || 0}
                  </span>
                </div>
                
                <div className="stat-item">
                  <span className="stat-label">AI:</span>
                  <span className="stat-value ai-stat">
                    {form.ai_fields_count || 0}
                  </span>
                </div>
                
                {form.submission_count > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">Submissions:</span>
                    <span className="stat-value submission-stat">
                      {form.submission_count}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="form-meta">
                <span className="meta-item">
                  <span className="meta-icon">🆔</span>
                  ID: {form.id}
                </span>
                <span className="meta-item">
                  <span className="meta-icon">📅</span>
                  Created: {form.created_date}
                </span>
              </div>
              
              <div className="form-actions">
                <Link 
                  to={`/forms/${form.id}`} 
                  className="primary-button fill-form-button"
                >
                  📝 Fill Out Form
                </Link>
                
                <div className="quick-info">
                  <span className="time-estimate">
                    ⏱️ ~{Math.ceil((form.total_fields || 1) * 0.5)} min
                  </span>
                </div>
              </div>
              
              {/* Preview of field types */}
              {form.fields && form.fields.slice(0, 3).map((field, index) => (
                <div key={index} className="field-preview">
                  <span className="field-preview-label">
                    {field.label}
                    {field.is_required && <span className="preview-required">*</span>}
                  </span>
                  <span className="field-preview-type">
                    {getFieldTypeIcon(field.type)} {getFieldTypeLabel(field.type)}
                  </span>
                </div>
              ))}
              
              {form.fields && form.fields.length > 3 && (
                <div className="more-fields">
                  +{form.fields.length - 3} more fields...
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer Section */}
      <div className="list-footer">
        <div className="footer-info">
          <p className="footer-text">Smart Form Validator - AI-Powered Form Submission System</p>
          <p className="footer-note">
            All form submissions are validated using basic rules and AI-powered context checking.
            Forms marked with 🤖 use Google Cloud Natural Language API for enhanced validation.
          </p>
        </div>
        
        <div className="footer-legend">
          <div className="legend-item">
            <span className="legend-marker required-marker">*</span>
            <span>Required field</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker ai-marker">🤖</span>
            <span>AI-powered validation</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker time-marker">⏱️</span>
            <span>Estimated completion time</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
const getFieldTypeIcon = (type) => {
  const icons = {
    text: '📝',
    textarea: '📄',
    email: '📧',
    number: '🔢',
    date: '📅',
    time: '⏰',
    url: '🔗',
    phone: '📱',
    select: '🔘',
    multiple_choice: '🔘',
    radio_buttons: '⭕',
    checkbox: '☑️',
    checkboxes: '☑️',
    dropdown: '▼',
    linear_scale: '📊'
  };
  return icons[type] || '📝';
};

const getFieldTypeLabel = (type) => {
  const labels = {
    text: 'Text',
    textarea: 'Paragraph',
    email: 'Email',
    number: 'Number',
    date: 'Date',
    time: 'Time',
    url: 'URL',
    phone: 'Phone',
    select: 'Multiple Choice',
    multiple_choice: 'Multiple Choice',
    radio_buttons: 'Radio Buttons',
    checkbox: 'Checkbox',
    checkboxes: 'Checkboxes',
    dropdown: 'Dropdown',
    linear_scale: 'Scale'
  };
  return labels[type] || 'Text';
};

export default FormListPage;