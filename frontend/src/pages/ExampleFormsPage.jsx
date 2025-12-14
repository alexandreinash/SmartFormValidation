import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/FormListPage.css';

function ExampleFormsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForms, setSelectedForms] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadForms = async () => {
      if (!user || user.role !== 'admin') {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/api/forms');
        const formsData = res.data.data || [];
        
        // Show all forms (no filter) - users can see all available forms
        // If you want to filter, you can add it here, but for now show all
        
        // Fetch fields for each form
        const formsWithFields = await Promise.all(
          formsData.map(async (form) => {
            try {
              const formRes = await api.get(`/api/forms/${form.id}`);
              return { 
                ...form, 
                fields: formRes.data.data?.fields || [],
                aiFieldsCount: (formRes.data.data?.fields || []).filter(f => f.ai_validation_enabled).length
              };
            } catch {
              return { ...form, fields: [], aiFieldsCount: 0 };
            }
          })
        );
        
        setForms(formsWithFields);
      } catch (err) {
        console.error('Failed to load forms:', err);
      } finally {
        setLoading(false);
      }
    };

    loadForms();
  }, [user]);

  const handleSelectForm = (formId) => {
    setSelectedForms((prev) =>
      prev.includes(formId)
        ? prev.filter((id) => id !== formId)
        : [...prev, formId]
    );
  };

  const handleSelectAll = () => {
    if (selectedForms.length === forms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(forms.map((form) => form.id));
    }
  };

  const deleteForm = async (formId, event) => {
    if (event) {
      event.stopPropagation();
    }
    if (!window.confirm('Are you sure you want to delete this form? This will also delete all associated submissions.')) {
      return;
    }
    try {
      setIsDeleting(true);
      await api.delete(`/api/forms/${formId}`);
      setForms((prev) => prev.filter((form) => form.id !== formId));
      setSelectedForms((prev) => prev.filter((id) => id !== formId));
      alert('Form deleted successfully. Forms have been renumbered sequentially.');
    } catch (err) {
      console.error('Failed to delete form:', err);
      alert('Failed to delete form. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteSelectedForms = async () => {
    if (selectedForms.length === 0) {
      alert('Please select at least one form to delete.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedForms.length} selected form(s)? This will also delete all associated submissions.`)) {
      return;
    }
    try {
      setIsDeleting(true);
      await api.delete('/api/forms/multiple', { data: { formIds: selectedForms } });
      setForms((prev) => prev.filter((form) => !selectedForms.includes(form.id)));
      setSelectedForms([]);
      alert(`${selectedForms.length} form(s) deleted successfully. Forms have been renumbered sequentially.`);
    } catch (err) {
      console.error('Failed to delete forms:', err);
      alert('Failed to delete forms. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="page-heading">
        <div className="page-header">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => navigate('/admin')}
          >
            ← Back
          </button>
          <h2 className="page-title">Access Denied</h2>
        </div>
        <p>You must be logged in as an administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="page-heading">
      <div className="page-header">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => navigate('/admin')}
        >
          ← Back to Dashboard
        </button>
        <h2 className="page-title" style={{ color: '#94a3b8', fontWeight: 400 }}>
          Example Forms - Test Google NLP API
        </h2>
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        marginBottom: '1.5rem', 
        padding: '1.25rem', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px', 
        border: 'none',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.25rem', fontWeight: 600 }}>
              📋 All Forms ({forms.length})
            </h3>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9375rem' }}>
              Click on any form below to test it. Forms with AI validation enabled demonstrate Google Cloud Natural Language API features including sentiment analysis, entity recognition, and content filtering.
            </p>
          </div>
          {forms.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                <input
                  type="checkbox"
                  checked={selectedForms.length === forms.length && forms.length > 0}
                  onChange={handleSelectAll}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    cursor: 'pointer',
                    accentColor: '#fff'
                  }}
                />
                <span>Select All</span>
              </label>
              {selectedForms.length > 0 && (
                <button
                  type="button"
                  onClick={deleteSelectedForms}
                  disabled={isDeleting}
                  style={{
                    padding: '0.5rem 1rem',
                    background: isDeleting ? '#94a3b8' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🗑️ Delete Selected ({selectedForms.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', background: 'white' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading forms...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="card empty-state" style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: 'white',
          border: '2px dashed #cbd5e1',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No forms found</h3>
          <p style={{ margin: '0 0 1.5rem 0', color: '#64748b' }}>
            Create your first form to get started, or run the seed script to create example forms.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/text-form')}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Create Form
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {forms.map((form) => (
            <div key={form.id} className="card" style={{ 
              padding: '1.75rem',
              border: selectedForms.includes(form.id) ? '2px solid #3b82f6' : '2px solid #e2e8f0',
              borderRadius: '12px',
              background: selectedForms.includes(form.id) ? '#eff6ff' : 'white',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!selectedForms.includes(form.id)) {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedForms.includes(form.id)) {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onClick={() => window.open(`/forms/${form.id}`, '_blank')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={selectedForms.includes(form.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectForm(form.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      cursor: 'pointer',
                      marginTop: '0.25rem',
                      accentColor: '#3b82f6',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.375rem', fontWeight: 600 }}>
                      {form.title}
                    </h3>
                    {form.aiFieldsCount > 0 && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: 'white',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        🤖 AI Enabled
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    <span style={{ 
                      padding: '0.375rem 0.875rem', 
                      background: '#f1f5f9', 
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      color: '#475569',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span>#</span> {form.id}
                    </span>
                    <span style={{ 
                      padding: '0.375rem 0.875rem', 
                      background: '#f0fdf4', 
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      color: '#166534',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span>📝</span> {form.fields?.length || 0} Field{form.fields?.length !== 1 ? 's' : ''}
                    </span>
                    {form.aiFieldsCount > 0 && (
                      <span style={{ 
                        padding: '0.375rem 0.875rem', 
                        background: '#fef3c7', 
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        color: '#92400e',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        border: '1px solid #fcd34d'
                      }}>
                        <span>🤖</span> {form.aiFieldsCount} AI Field{form.aiFieldsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {form.fields && form.fields.length > 0 && (
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Form Fields:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {form.fields.map((field, idx) => (
                          <span key={idx} style={{
                            padding: '0.5rem 0.75rem',
                            background: field.ai_validation_enabled 
                              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' 
                              : '#f8fafc',
                            borderRadius: '6px',
                            fontSize: '0.8125rem',
                            color: field.ai_validation_enabled ? '#92400e' : '#475569',
                            border: field.ai_validation_enabled ? '1px solid #fcd34d' : '1px solid #e2e8f0',
                            fontWeight: field.ai_validation_enabled ? 600 : 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}>
                            {field.ai_validation_enabled && <span>🤖</span>}
                            <span>{field.label}</span>
                            {field.is_required && <span style={{ color: '#ef4444' }}>*</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end', minWidth: '140px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/forms/${form.id}`, '_blank');
                    }}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                    }}
                  >
                    🧪 Test Form →
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/forms/${form.id}/submissions`);
                    }}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    📊 Submissions
                  </button>
                  <button
                    type="button"
                    onClick={(e) => deleteForm(form.id, e)}
                    disabled={isDeleting}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: isDeleting ? '#94a3b8' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      boxShadow: isDeleting ? 'none' : '0 2px 4px rgba(239, 68, 68, 0.3)',
                      transition: 'all 0.2s',
                      width: '100%',
                      opacity: isDeleting ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                      }
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {forms.length > 0 && (
        <div style={{ 
          marginTop: '2.5rem', 
          padding: '1.5rem', 
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '12px', 
          border: '2px solid #fcd34d',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💡</span>
            <h4 style={{ margin: 0, color: '#92400e', fontSize: '1.125rem', fontWeight: 600 }}>
              Quick Test Guide
            </h4>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{ 
              padding: '0.75rem', 
              background: 'white', 
              borderRadius: '8px',
              border: '1px solid #fcd34d'
            }}>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>Sentiment Analysis:</strong>
              <span style={{ color: '#78350f', fontSize: '0.875rem' }}>
                "I hate this product! It's terrible!" → ❌ Flagged
              </span>
            </div>
            <div style={{ 
              padding: '0.75rem', 
              background: 'white', 
              borderRadius: '8px',
              border: '1px solid #fcd34d'
            }}>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>Entity - Name:</strong>
              <span style={{ color: '#78350f', fontSize: '0.875rem' }}>
                "John Smith" ✅ | "hello123" ❌
              </span>
            </div>
            <div style={{ 
              padding: '0.75rem', 
              background: 'white', 
              borderRadius: '8px',
              border: '1px solid #fcd34d'
            }}>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>Entity - Company:</strong>
              <span style={{ color: '#78350f', fontSize: '0.875rem' }}>
                "Acme Corporation" ✅ | "my company" ❌
              </span>
            </div>
            <div style={{ 
              padding: '0.75rem', 
              background: 'white', 
              borderRadius: '8px',
              border: '1px solid #fcd34d'
            }}>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>Profanity Detection:</strong>
              <span style={{ color: '#78350f', fontSize: '0.875rem' }}>
                "This is shit!" → ❌ Flagged
              </span>
            </div>
            <div style={{ 
              padding: '0.75rem', 
              background: 'white', 
              borderRadius: '8px',
              border: '1px solid #fcd34d'
            }}>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>Grammar Check:</strong>
              <span style={{ color: '#78350f', fontSize: '0.875rem' }}>
                "bad" (too short) → ⚠️ Warning
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExampleFormsPage;

