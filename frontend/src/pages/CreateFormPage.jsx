import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import SendToModal from '../components/SendToModal';
import '../css/CreateFormPage.css';
import '../css/components.css';

function CreateFormPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Automatically redirect to text form page
  useEffect(() => {
    navigate('/text-form', { replace: true });
  }, [navigate]);
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([{ label: '', type: 'number', is_required: false, ai_validation_enabled: false }]);
  const [message, setMessage] = useState('');
  const [sendToFormId, setSendToFormId] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const updateField = (index, key, value) => {
    const next = [...fields];
    next[index] = { ...next[index], [key]: value };
    setFields(next);
  };

  const addField = () => {
    setFields([...fields, { label: '', type: 'number', is_required: false, ai_validation_enabled: false }]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!user || user.role !== 'admin') {
      setMessage('You must be logged in as an administrator to create forms.');
      return;
    }

    try {
      const res = await api.post('/api/forms', { title, fields });
      setMessage(`Form created successfully with ID ${res.data.data.form.id}`);
      setTitle('');
      setFields([{ label: '', type: 'number', is_required: false, ai_validation_enabled: false }]);
      return res.data.data.form.id;
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create form.');
      return null;
    }
  };

  const handleSaveAndSend = async (e) => {
    e.preventDefault();
    const formId = await handleSubmit(e);
    if (formId) {
      setSendToFormId(formId);
    }
  };

  return (
    <div className="create-form-container">
      {/* Logout confirmation text in top right corner */}
      {showLogoutConfirm && (
        <div className="logout-confirmation-text">
          <div className="logout-confirmation-content">
            <div className="logout-confirmation-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="logout-confirmation-text-content">
              You have successfully been logged out.
            </div>
          </div>
        </div>
      )}
      {/* Left Sidebar */}
      <div className="create-form-sidebar">
        <h2 className="sidebar-title">Forms</h2>
        <div className="sidebar-nav-container">
          <nav className="sidebar-nav sidebar-nav-box">
            <Link to="/" className="sidebar-nav-item">
              <span className="sidebar-icon">🏠</span>
              <span>Home</span>
            </Link>
            <Link to="/text-form" className="sidebar-nav-item">
              <span className="sidebar-icon">💬</span>
              <span>Text Form</span>
            </Link>
            <Link to="/email-form" className="sidebar-nav-item">
              <span className="sidebar-icon">✉️</span>
              <span>Email</span>
            </Link>
            <Link to="/number-form" className="sidebar-nav-item sidebar-nav-item-active">
              <span className="sidebar-icon">#</span>
              <span>Number</span>
            </Link>
            <Link to="/admin" className="sidebar-nav-item">
              <span className="sidebar-icon">⚙️</span>
              <span>Settings</span>
            </Link>
          </nav>
          <nav className="sidebar-nav sidebar-nav-box">
            <button
              type="button"
              onClick={() => {
                setShowLogoutConfirm(true);
                localStorage.setItem('sfv_just_logged_out', 'true');
                logout();
                setTimeout(() => {
                  navigate('/login');
                }, 800);
              }}
              className="sidebar-nav-item sidebar-logout-button"
            >
              <span className="sidebar-icon">↗️</span>
              <span>Log Out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="create-form-main">
      </div>

      {/* Send To Modal */}
      {sendToFormId && (
        <SendToModal
          formId={sendToFormId}
          onClose={() => setSendToFormId(null)}
          onSuccess={() => {
            setMessage('Form sent successfully');
            setSendToFormId(null);
          }}
        />
      )}
    </div>
  );
}

export default CreateFormPage;

