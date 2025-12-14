import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function ComplaintFormPage() {
  const navigate = useNavigate();
  const [complaintFormId, setComplaintFormId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const findComplaintForm = async () => {
      try {
        setLoading(true);
        // Get all forms
        const res = await api.get('/api/forms');
        const forms = res.data.data || [];
        
        // Find the Complaint Form
        const complaintForm = forms.find(form => 
          form.title.toLowerCase().includes('complaint')
        );
        
        if (complaintForm) {
          setComplaintFormId(complaintForm.id);
          setError('');
        } else {
          setError('Complaint Form not found. Please create it first.');
        }
      } catch (err) {
        console.error('Failed to load forms:', err);
        setError('Failed to load forms. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    findComplaintForm();
  }, []);

  // If we found the form ID, redirect to the form fill page
  useEffect(() => {
    if (complaintFormId) {
      navigate(`/forms/${complaintFormId}`, { replace: true });
    }
  }, [complaintFormId, navigate]);

  if (loading) {
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
          <h2 className="page-title">Complaint Form</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#64748b' }}>Loading Complaint Form...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <h2 className="page-title">Complaint Form</h2>
        </div>
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: 'white',
          border: '2px dashed #cbd5e1',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Form Not Found</h3>
          <p style={{ margin: '0 0 1.5rem 0', color: '#64748b' }}>{error}</p>
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
              Create Complaint Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // Will redirect
}

export default ComplaintFormPage;

