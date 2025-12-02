import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function FormFillPage() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/forms/${id}`);
        setForm(res.data.data);
        setStatus('');
      } catch (err) {
        setStatus('Failed to load form.');
        setForm(null);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleChange = (fieldId, value) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setErrors([]);
    try {
      const res = await api.post(`/api/submissions/${id}`, { values });
      setStatus(res.data.message);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        setStatus(err.response.data.message || 'Validation errors occurred.');
      } else {
        setStatus('Submission failed.');
      }
    }
  };

  if (loading) {
    return <p>Loading form...</p>;
  }

  if (!form) {
    return <p className="status">{status || 'Form not found.'}</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
        <Link to="/forms" className="button" style={{ padding: '0.35rem 0.9rem', borderRadius: '999px' }}>
          ← Back
        </Link>
      </div>
      <h2>{form.title}</h2>
      <form onSubmit={handleSubmit} className="card">
        {form.fields.map((field) => (
          <div key={field.id} className="field-column">
            <label>
              {field.label}
              {field.is_required && <span className="required">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
              />
            ) : (
              <input
                type={field.type === 'text' ? 'text' : field.type}
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
              />
            )}
            <ul className="error-list">
              {errors
                .filter((er) => er.fieldId === field.id)
                .map((er, idx) => (
                  <li key={idx}>{er.message}</li>
                ))}
            </ul>
          </div>
        ))}
        <button type="submit">Submit</button>
        {status && (
          <div>
            <p className="status">{status}</p>
            {status.includes('successfully') && (
              <Link to="/forms" className="button" style={{ marginTop: '1rem' }}>
                View All Forms
              </Link>
            )}
          </div>
        )}
      </form> 
    </div>
  );
}

export default FormFillPage;


