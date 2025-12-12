import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import '../css/AdminDashboard.css';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const ok = window.confirm('Are you sure you want to log out?');
    if (!ok) return;
    logout();
    navigate('/login');
  };

  const handleRemoveAccount = async () => {
    const input = window.prompt("Type 'confirm' to remove this account (this cannot be undone)");
    if (input !== 'confirm') {
      window.alert('Account removal cancelled or confirmation text incorrect.');
      return;
    }

    try {
      const res = await api.delete('/api/accounts/remove', { data: { confirm: 'confirm' } });
      if (res.data && res.data.success) {
        window.alert(res.data.message || 'Account removed');
        // logout and navigate to login
        logout();
        navigate('/login');
      } else {
        window.alert('Failed to remove account');
      }
    } catch (err) {
      console.error(err);
      window.alert('Error removing account');
    }
  };

  return (
    <div className="admin-dashboard-container">
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
        onClick={handleRemoveAccount}
      >
        Remove Account
      </button>

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
              onClick={() => navigate('/admin/create-form')}
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
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
