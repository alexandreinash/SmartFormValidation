import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function FormListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/forms');
        setForms(res.data.data || []);
        setStatus('');
      } catch (err) {
        setStatus('Failed to load forms.');
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <p>Loading forms...</p>;
  }

  return (
    <div className="page-heading">
      <div className="page-header">
        <div>
          <h2 className="page-title">Available Forms</h2>
          <p className="page-subtitle">
            Select a form below to fill out and submit.
          </p>
        </div>
      </div>

      {status && <p className="status">{status}</p>}

      {forms.length === 0 ? (
        <div className="card empty-state">
          <h3>No forms available</h3>
          <p>There are no forms available at the moment. Please check back later.</p>
        </div>
      ) : (
        <div className="card">
          <div className="forms-list">
            {forms.map((form) => (
              <div key={form.id} className="form-card">
                <h3>{form.title}</h3>
                <p className="form-meta">Form ID: #{form.id}</p>
                <Link to={`/forms/${form.id}`} className="button">
                  Fill Out Form
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FormListPage;

