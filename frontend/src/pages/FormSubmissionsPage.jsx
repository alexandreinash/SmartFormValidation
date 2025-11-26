import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

function FormSubmissionsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [formInfo, setFormInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setStatus('You must be logged in as an administrator to view submissions.');
        return;
      }
      try {
        const res = await api.get(`/api/submissions/form/${id}`);
        setFormInfo(res.data.data.form);
        setSubmissions(res.data.data.submissions || []);
      } catch (err) {
        setStatus('Failed to load submissions.');
      }
    };
    load();
  }, [id]);

  return (
    <div>
      <h2>Submissions for Form #{formInfo?.id}</h2>
      <p>{formInfo?.title}</p>
      {status && <p className="status">{status}</p>}
      {submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <div className="card">
          {submissions.map((sub) => (
            <div key={sub.id} className="submission-block">
              <h4>
                Submission #{sub.id}{' '}
                <span className="meta">
                  {new Date(sub.submitted_at).toLocaleString()}
                </span>
              </h4>
              <ul>
                {(sub.answers || []).map((ans) => (
                  <li key={ans.id}>
                    <strong>{ans.field?.label}:</strong> {ans.value}{' '}
                    {(ans.ai_sentiment_flag || ans.ai_entity_flag) && (
                      <span className="flag">AI flagged for review</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormSubmissionsPage;



