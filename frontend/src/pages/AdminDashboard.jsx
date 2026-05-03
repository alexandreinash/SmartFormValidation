import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import TeacherWorkspaceUserBadge from '../components/TeacherWorkspaceUserBadge';
import '../css/AdminDashboard.css';
import '../css/components.css';

function DashboardIcon({ name }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  };

  switch (name) {
    case 'create-form':
      return (
        <svg {...commonProps}>
          <path d="M14 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V8L14 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 3V8H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 13H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 17H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'quiz-template':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <path d="M15.5 8.5L20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.5 4H20V5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'submissions':
      return (
        <svg {...commonProps}>
          <path d="M7 19V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 19V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 19V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 19.5H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'manage-forms':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L19.79 16.88A2 2 0 1 1 16.96 19.71L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14 20.85V21A2 2 0 1 1 10 21V20.91A1.65 1.65 0 0 0 8.92 19.39A1.65 1.65 0 0 0 7.1 19.72L7.04 19.78A2 2 0 1 1 4.21 16.95L4.27 16.89A1.65 1.65 0 0 0 4.6 15.07A1.65 1.65 0 0 0 3.07 14H3A2 2 0 1 1 3 10H3.09A1.65 1.65 0 0 0 4.61 8.92A1.65 1.65 0 0 0 4.28 7.1L4.22 7.04A2 2 0 1 1 7.05 4.21L7.11 4.27A1.65 1.65 0 0 0 8.93 4.6H9A1.65 1.65 0 0 0 10 3.07V3A2 2 0 1 1 14 3V3.09A1.65 1.65 0 0 0 15.08 4.61A1.65 1.65 0 0 0 16.9 4.28L16.96 4.22A2 2 0 1 1 19.79 7.05L19.73 7.11A1.65 1.65 0 0 0 19.4 8.93V9A1.65 1.65 0 0 0 20.93 10H21A2 2 0 1 1 21 14H20.91A1.65 1.65 0 0 0 19.39 15Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...commonProps}>
          <path d="M6 17V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 17V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18 17V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 17L9.5 12.5L12.5 14.5L19 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'groups':
      return (
        <svg {...commonProps}>
          <path d="M16 21V19C16 17.9 15.1 17 14 17H8C6.9 17 6 17.9 6 19V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M18 21V19.5C18 18.57 17.36 17.77 16.5 17.55" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.5 7.55C16.37 7.77 17 8.57 17 9.5C17 10.43 16.37 11.23 15.5 11.45" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'users':
      return (
        <svg {...commonProps}>
          <path d="M17 21V19C17 17.9 16.1 17 15 17H9C7.9 17 7 17.9 7 19V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...commonProps}>
          <path d="M15 3H18C19.1 3 20 3.9 20 5V19C20 20.1 19.1 21 18 21H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 12H4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    localStorage.setItem('sfv_just_logged_out', 'true');
    logout();
    setTimeout(() => {
      navigate('/login');
    }, 800);
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

      <TeacherWorkspaceUserBadge className="teacher-topbar-user-badge-dashboard" />

      {/* Main Content */}
      <div className="admin-dashboard-content">
        <div className="admin-dashboard-header">
          <div className="admin-dashboard-title-group">
            <h1 className="admin-dashboard-title">Teacher Workspace</h1>
            <p className="admin-dashboard-subtitle">Choose an option below to get started.</p>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="admin-cards-grid">
          {/* Create Form Card */}
          <div className="admin-card">
            <div className="admin-card-icon"><DashboardIcon name="create-form" /></div>
            <h3 className="admin-card-title">Create Form</h3>
            <p className="admin-card-description">
              Build flexible forms with text, email, number, long answer, and assessment fields in one workspace.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={() => navigate('/text-form')}
            >
              Create New Form
            </button>
          </div>

          {/* View Submissions Card */}
          <div className="admin-card">
            <div className="admin-card-icon"><DashboardIcon name="submissions" /></div>
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
            <div className="admin-card-icon"><DashboardIcon name="manage-forms" /></div>
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
            <div className="admin-card-icon"><DashboardIcon name="analytics" /></div>
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
            <div className="admin-card-icon"><DashboardIcon name="groups" /></div>
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
            <div className="admin-card-icon"><DashboardIcon name="users" /></div>
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

          <div className="admin-card">
            <div className="admin-card-icon"><DashboardIcon name="logout" /></div>
            <h3 className="admin-card-title">Log Out</h3>
            <p className="admin-card-description">
              End the current session and return to the Google sign-in screen.
            </p>
            <button
              type="button"
              className="admin-card-button"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
