import React from 'react';
import { useAuth } from '../AuthContext';
import '../css/TeacherWorkspaceUserBadge.css';

function getDisplayName(user) {
  if (user?.username && user.username.trim()) {
    return user.username.trim();
  }

  if (user?.name && user.name.trim()) {
    return user.name.trim();
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  return 'Teacher';
}

function getInitials(displayName) {
  return String(displayName || 'Teacher')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'T';
}

export default function TeacherWorkspaceUserBadge({ className = '' }) {
  const { user } = useAuth();
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  return (
    <div className={`teacher-topbar-user-badge ${className}`.trim()}>
      <div className="teacher-topbar-user-avatar" aria-hidden="true">{initials}</div>
      <span className="teacher-topbar-user-name">{displayName}</span>
    </div>
  );
}