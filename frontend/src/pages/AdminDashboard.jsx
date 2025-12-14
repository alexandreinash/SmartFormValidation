import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import RemoveAccountModal from '../components/RemoveAccountModal';
import '../css/AdminDashboard.css';
import '../css/components.css';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showRemoveAccountModal, setShowRemoveAccountModal] = useState(false);
  const [isRemovingAccount, setIsRemovingAccount] = useState(false);
  const [complaintFormId, setComplaintFormId] = useState(null);

  // Find Complaint Form ID on mount
  useEffect(() => {
    const findComplaintForm = async () => {
      try {
        const res = await api.get('/api/forms');
        const forms = res.data.data || [];
        const complaintForm = forms.find(form => 
          form.title.toLowerCase().includes('complaint')
        );
        if (complaintForm) {
          setComplaintFormId(complaintForm.id);
        }
      } catch (err) {
        console.error('Failed to load forms:', err);
      }
    };
    findComplaintForm();
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    localStorage.setItem('sfv_just_logged_out', 'true');
    logout();
    setTimeout(() => {
      navigate('/login');
    }, 800);
  };

  const handleRemoveAccountClick = () => {
    setShowRemoveAccountModal(true);
  };

  const handleRemoveAccountConfirm = async () => {
    setIsRemovingAccount(true);
    try {
      const res = await api.delete('/api/accounts/remove', { data: { confirm: 'YES' } });
      if (res.data && res.data.success) {
        setShowRemoveAccountModal(false);
        // logout and navigate to login
        setShowLogoutConfirm(true);
        localStorage.setItem('sfv_just_logged_out', 'true');
        logout();
        setTimeout(() => {
          navigate('/login');
        }, 800);
      } else {
        window.alert('Failed to remove account');
        setIsRemovingAccount(false);
      }
    } catch (err) {
      console.error(err);
      window.alert(err.response?.data?.error?.message || 'Error removing account');
      setIsRemovingAccount(false);
    }
  };

  const handleRemoveAccountCancel = () => {
    if (!isRemovingAccount) {
      setShowRemoveAccountModal(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
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
      {/* Smart Form Validator Banner */}
      <div className="admin-banner">Smart Form Validator</div>

      {/* Logout Button */}
      <button
        type="button"
        className="admin-logout-button"
        onClick={handleLogout}
      >
        Log out
      </button>

      {/* Remove Account Button */}
      <button
        type="button"
        className="admin-remove-account-button"
        onClick={handleRemoveAccountClick}
      >
        Remove Account
      </button>

      {/* Remove Account Modal */}
      {showRemoveAccountModal && (
        <RemoveAccountModal
          user={user}
          onConfirm={handleRemoveAccountConfirm}
          onCancel={handleRemoveAccountCancel}
          isRemoving={isRemovingAccount}
        />
      )}

      {/* Main Content */}
      <div className="admin-dashboard-content">
        <h1 className="admin-welcome-title">Welcome, {user?.email || 'User'}!</h1>
        <p className="admin-instruction-text">Choose an option below to get started.</p>

        {/* Action Cards Grid */}
        <div className="admin-cards-grid">
          {/* Create Form Card */}
          <div className="admin-card">
            <div className="admin-card-icon">📝</div>
            <h3 className="admin-card-title">Create Form</h3>
            <p className="admin-card-description">
              Create a new form with custom fields and AI validation settings.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/text-form')}
            >
              Create New Form
            </button>
          </div>

          {/* Create Quiz Form Card */}
          <div className="admin-card">
            <div className="admin-card-icon">🎯</div>
            <h3 className="admin-card-title">Create Quiz Form</h3>
            <p className="admin-card-description">
              Create interactive quizzes with multiple choice, fill in the blank, or true/false questions with automatic scoring.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/quiz-form')}
            >
              Create Quiz Form
            </button>
          </div>

          {/* View Submissions Card */}
          <div className="admin-card">
            <div className="admin-card-icon">📊</div>
            <h3 className="admin-card-title">View Submissions</h3>
            <p className="admin-card-description">
              View and manage all form submissions across all forms.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/admin/submissions/all')}
            >
              Open Submissions
            </button>
          </div>

          {/* Manage Forms Card */}
          <div className="admin-card">
            <div className="admin-card-icon">⚙️</div>
            <h3 className="admin-card-title">Manage Forms</h3>
            <p className="admin-card-description">
              View, edit, and delete existing forms and their submissions.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/admin/forms/all')}
            >
              Manage Forms
            </button>
          </div>

          {/* Analytics Card */}
          <div className="admin-card">
            <div className="admin-card-icon">📈</div>
            <h3 className="admin-card-title">Analytics</h3>
            <p className="admin-card-description">
              View system-wide analytics, form statistics, and AI validation insights.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/admin/analytics')}
            >
              View Analytics
            </button>
          </div>

          {/* Manage Groups Card */}
          <div className="admin-card">
            <div className="admin-card-icon">👥</div>
            <h3 className="admin-card-title">Manage Groups</h3>
            <p className="admin-card-description">
              Create and manage groups of end-users for efficient form sharing.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/admin/groups')}
            >
              Manage Groups
            </button>
          </div>

          {/* Manage Users Card */}
          <div className="admin-card">
            <div className="admin-card-icon">👤</div>
            <h3 className="admin-card-title">Manage Users</h3>
            <p className="admin-card-description">
              View and manage all registered users, including administrators and end-users.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/admin/users')}
            >
              Manage Users
            </button>
          </div>

          {/* Example Forms Card */}
          <div className="admin-card">
            <div className="admin-card-icon">🧪</div>
            <h3 className="admin-card-title">Example Forms</h3>
            <p className="admin-card-description">
              View and test all example forms with Google NLP AI validation enabled.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/admin/example-forms')}
            >
              View Example Forms
            </button>
          </div>

          {/* All Forms Card */}
          <div className="admin-card">
            <div className="admin-card-icon">📋</div>
            <h3 className="admin-card-title">All Forms</h3>
            <p className="admin-card-description">
              View all available forms in a beautiful grid layout. Each form has its own page.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/all-forms')}
            >
              View All Forms
            </button>
          </div>

          {/* Complaint Form Card */}
          <div className="admin-card">
            <div className="admin-card-icon">📝</div>
            <h3 className="admin-card-title">Complaint Form</h3>
            <p className="admin-card-description">
              Access the dedicated Complaint Form page. Test AI validation with negative sentiment detection.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => {
                if (complaintFormId) {
                  navigate(`/forms/${complaintFormId}`);
                } else {
                  navigate('/admin/complaint-form');
                }
              }}
            >
              {complaintFormId ? `Open Complaint Form` : 'Open Complaint Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
