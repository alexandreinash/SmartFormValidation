import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function SidebarGlyph({ className, children }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

function renderSidebarIcon(iconName, className = 'ufs-nav-icon') {
  switch (iconName) {
    case 'brand':
      return (
        <SidebarGlyph className={className}>
          <path d="M3.5 7.5L9 12L3.5 16.5V7.5Z" fill="currentColor" stroke="none" />
          <path d="M20.5 7.5L15 12L20.5 16.5V7.5Z" fill="currentColor" stroke="none" />
          <path d="M9 12L12 9.5L15 12L12 14.5L9 12Z" fill="currentColor" stroke="none" />
          <path d="M6.5 8H17.5" opacity="0.35" />
          <path d="M6.5 16H17.5" opacity="0.35" />
        </SidebarGlyph>
      );
    case 'home':
      return (
        <SidebarGlyph className={className}>
          <path d="M4 10.5L12 4L20 10.5" />
          <path d="M6.5 9.5V20H17.5V9.5" />
          <path d="M9.5 20V13H14.5V20" />
        </SidebarGlyph>
      );
    case 'text':
      return (
        <SidebarGlyph className={className}>
          <path d="M6 18L4 20V6.5C4 5.67 4.67 5 5.5 5H18.5C19.33 5 20 5.67 20 6.5V15.5C20 16.33 19.33 17 18.5 17H8" />
          <path d="M8 9H16" />
          <path d="M8 13H14" />
        </SidebarGlyph>
      );
    case 'builder':
      return (
        <SidebarGlyph className={className}>
          <path d="M5 6.5H19" />
          <path d="M5 12H19" />
          <path d="M5 17.5H13" />
          <path d="M17 15V20" />
          <path d="M14.5 17.5H19.5" />
        </SidebarGlyph>
      );
    case 'email':
      return (
        <SidebarGlyph className={className}>
          <path d="M4 7.5H20V16.5H4Z" />
          <path d="M4 8L12 13L20 8" />
        </SidebarGlyph>
      );
    case 'number':
      return (
        <SidebarGlyph className={className}>
          <path d="M9 4L7 20" />
          <path d="M17 4L15 20" />
          <path d="M4 9H19" />
          <path d="M3 15H18" />
        </SidebarGlyph>
      );
    case 'quiz':
      return (
        <SidebarGlyph className={className}>
          <path d="M7 5H17" />
          <path d="M7 5C5.34 5 4 6.34 4 8V16C4 17.66 5.34 19 7 19H17C18.66 19 20 17.66 20 16V8C20 6.34 18.66 5 17 5" />
          <path d="M9.25 11.5C9.25 10.12 10.37 9 11.75 9C13.13 9 14.25 10.12 14.25 11.5C14.25 12.43 13.73 13.07 12.94 13.61C12.22 14.1 11.75 14.56 11.75 15.5" />
          <path d="M11.75 18.25H11.76" />
        </SidebarGlyph>
      );
    case 'review':
      return (
        <SidebarGlyph className={className}>
          <path d="M7 4.5H17" />
          <path d="M7 4.5C5.34 4.5 4 5.84 4 7.5V16.5C4 18.16 5.34 19.5 7 19.5H17C18.66 19.5 20 18.16 20 16.5V7.5C20 5.84 18.66 4.5 17 4.5" />
          <path d="M8 9.5H16" />
          <path d="M8 13H13" />
          <path d="M14 15.5L15.5 17L18 13.5" />
        </SidebarGlyph>
      );
    case 'forms':
      return (
        <SidebarGlyph className={className}>
          <path d="M6 5.5H18" />
          <path d="M6 10.5H18" />
          <path d="M6 15.5H18" />
          <path d="M4 5.5H4.01" />
          <path d="M4 10.5H4.01" />
          <path d="M4 15.5H4.01" />
        </SidebarGlyph>
      );
    case 'logout':
      return (
        <SidebarGlyph className={className}>
          <path d="M10 7V5.5C10 4.67 10.67 4 11.5 4H18.5C19.33 4 20 4.67 20 5.5V18.5C20 19.33 19.33 20 18.5 20H11.5C10.67 20 10 19.33 10 18.5V17" />
          <path d="M4 12H15" />
          <path d="M11 8L15 12L11 16" />
        </SidebarGlyph>
      );
    default:
      return null;
  }
}

const teacherMenuItems = [
  { key: 'builder', label: 'Create Form', href: '/admin/create-form', icon: 'builder' },
  { key: 'review', label: 'Review Queue', href: '/admin/submissions/all', icon: 'review' },
  { key: 'forms', label: 'Manage Forms', href: '/admin/forms/all', icon: 'forms' },
];

export default function TeacherWorkspaceSidebar({ activeItem = 'home', onHomeClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    localStorage.setItem('sfv_just_logged_out', 'true');
    logout();
    window.setTimeout(() => {
      navigate('/login');
    }, 800);
  };

  return (
    <>
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
      <div className="user-form-selection-sidebar teacher-workspace-sidebar">
        <div className="ufs-sidebar-header">
          <div className="ufs-sidebar-logo">
            {renderSidebarIcon('brand', 'ufs-logo-icon')}
            <div className="ufs-logo-copy">
              <span className="ufs-logo-text">Smart Form Validator</span>
              <span className="ufs-logo-subtitle">Teacher Workspace</span>
            </div>
          </div>
        </div>

        <nav className="ufs-sidebar-nav" aria-label="Teacher navigation">
          <div className="ufs-primary-nav">
            {onHomeClick ? (
              <button
                type="button"
                className={`ufs-nav-item ${activeItem === 'home' ? 'ufs-nav-item-active' : ''}`}
                aria-current={activeItem === 'home' ? 'page' : undefined}
                onClick={onHomeClick}
              >
                {renderSidebarIcon('home')}
                <span className="ufs-nav-label">Home</span>
              </button>
            ) : (
              <Link
                to="/admin"
                className={`ufs-nav-item ${activeItem === 'home' ? 'ufs-nav-item-active' : ''}`}
                aria-current={activeItem === 'home' ? 'page' : undefined}
              >
                {renderSidebarIcon('home')}
                <span className="ufs-nav-label">Home</span>
              </Link>
            )}

            {teacherMenuItems.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className={`ufs-nav-item ${activeItem === item.key ? 'ufs-nav-item-active' : ''}`}
                aria-current={activeItem === item.key ? 'page' : undefined}
              >
                {renderSidebarIcon(item.icon)}
                <span className="ufs-nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="ufs-sidebar-footer">
          <div className="ufs-footer-actions">
            <button type="button" onClick={handleLogout} className="ufs-footer-button ufs-footer-button-primary">
              {renderSidebarIcon('logout', 'ufs-footer-icon')}
              <span className="ufs-nav-label">Logout</span>
            </button>
          </div>

          <div className="ufs-sidebar-version">Smart Form Validator V1.0</div>
          <div className="ufs-sidebar-cit">CIT University</div>
        </div>
      </div>
    </>
  );
}