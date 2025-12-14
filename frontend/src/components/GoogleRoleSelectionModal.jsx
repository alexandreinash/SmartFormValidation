import React, { useState } from 'react';
import '../css/GoogleRoleSelectionModal.css';

function GoogleRoleSelectionModal({ email, onSelectRole, onClose }) {
  const [selectedRole, setSelectedRole] = useState('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSelectRole(selectedRole);
    setIsSubmitting(false);
  };

  return (
    <div className="role-selection-overlay" onClick={onClose}>
      <div className="role-selection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="role-selection-header">
          <h2>Select Your Role</h2>
          <p className="role-selection-subtitle">
            Choose your role for <strong>{email}</strong>
          </p>
          <p className="role-selection-note">
            This selection will be saved and used for all future sign-ins with this Google account.
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="role-selection-options">
            <label className={`role-option ${selectedRole === 'admin' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="admin"
                checked={selectedRole === 'admin'}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="role-option-content">
                <div className="role-option-title">Administrator</div>
                <div className="role-option-description">
                  Full access to create forms, manage users, view analytics, and manage groups
                </div>
              </div>
            </label>
            
            <label className={`role-option ${selectedRole === 'user' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="user"
                checked={selectedRole === 'user'}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="role-option-content">
                <div className="role-option-title">User</div>
                <div className="role-option-description">
                  Access to fill out forms and view your submissions
                </div>
              </div>
            </label>
          </div>
          
          <div className="role-selection-actions">
            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Completing...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GoogleRoleSelectionModal;

