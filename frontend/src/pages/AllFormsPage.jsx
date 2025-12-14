import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import '../css/FormListPage.css';
import '../css/UserFormSelectionPage.css';
import '../css/components.css';

function AllFormsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadForms = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/forms');
        const formsData = res.data.data || [];
        
        // Fetch fields and creator info for each form
        const formsWithDetails = await Promise.all(
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
        
        setForms(formsWithDetails);
        setStatus('');
      } catch (err) {
        console.error('Failed to load forms:', err);
        setStatus('Failed to load forms.');
      } finally {
        setLoading(false);
      }
    };

    loadForms();
  }, []);

  if (loading) {
    return (
      <div className="page-heading">
        <div className="page-header">
          <h2 className="page-title">All Forms</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#64748b' }}>Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-heading">
      <div className="page-header">
        {user?.role === 'admin' && (
          <button
            type="button"
            className="button button-secondary"
            style={{ marginBottom: '0.75rem' }}
            onClick={() => navigate('/admin')}
          >
            ← Back to Dashboard
          </button>
        )}
        <h2 className="page-title" style={{ color: '#1e293b', fontWeight: 600 }}>
          All Available Forms
        </h2>
        <p className="page-subtitle" style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Select a form below to fill it out. All forms use AI-powered validation for accurate results.
        </p>
      </div>

      {status && (
        <div className="status" style={{ 
          padding: '1rem', 
          background: status.includes('Failed') ? '#fee2e2' : '#d1fae5',
          color: status.includes('Failed') ? '#991b1b' : '#065f46',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          {status}
        </div>
      )}

      {forms.length === 0 ? (
        <div className="card empty-state" style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: 'white',
          border: '2px dashed #cbd5e1',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No forms available</h3>
          <p style={{ margin: 0, color: '#64748b' }}>
            There are no forms available at the moment. Please check back later.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="card" style={{ 
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.25rem' }}>
                  📊 Forms Overview
                </h3>
                <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9375rem' }}>
                  {forms.length} form{forms.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{forms.length}</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Forms</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {forms.reduce((acc, f) => acc + (f.fields?.length || 0), 0)}
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Fields</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {forms.reduce((acc, f) => acc + (f.aiFieldsCount || 0), 0)}
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>AI Validated</div>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Grid */}
          <div className="forms-grid">
            {forms.map((form) => (
              <div key={form.id} className="form-selection-card">
                <div className="form-card-content">
                  <div className="form-card-header">
                    <h3 className="form-card-title">{form.title}</h3>
                    <span className="form-id-badge">ID: #{form.id}</span>
                  </div>
                  
                  {/* AI Badge */}
                  {form.aiFieldsCount > 0 && (
                    <div style={{
                      marginBottom: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      borderRadius: '8px',
                      border: '1px solid #fcd34d',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: 'fit-content'
                    }}>
                      <span style={{ fontSize: '1rem' }}>🤖</span>
                      <span style={{ 
                        fontSize: '0.8125rem', 
                        color: '#92400e',
                        fontWeight: 600
                      }}>
                        {form.aiFieldsCount} AI Validated
                      </span>
                    </div>
                  )}
                  
                  <p className="form-card-description">
                    Click below to fill out this form. All fields are validated using AI-powered technology.
                  </p>
                  
                  {/* Form Stats */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginTop: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: '#f0fdf4',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: '#166534',
                      fontWeight: 500
                    }}>
                      📝 {form.fields?.length || 0} Fields
                    </span>
                    {form.created_at && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#475569',
                        fontWeight: 500
                      }}>
                        📅 {new Date(form.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {form.creator && (
                    <p className="form-card-creator" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                      Created by: {form.creator.email}
                    </p>
                  )}
                </div>
                <Link to={`/forms/${form.id}`} className="form-fill-button">
                  Fill Out Form →
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AllFormsPage;

