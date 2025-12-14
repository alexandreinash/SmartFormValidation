import React, { useState } from 'react';
import '../css/DeleteUsersModal.css';

function DeleteUsersModal({ users, onConfirm, onCancel, isDeleting }) {
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (confirmText === 'DELETE') {
      onConfirm();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && confirmText === 'DELETE') {
      handleConfirm();
    }
  };

  return (
    <div className="delete-users-modal-overlay" onClick={onCancel}>
      <div className="delete-users-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="delete-users-modal-header">
          <div className="delete-users-modal-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="delete-users-modal-title">Confirm Deletion</h2>
          <button className="delete-users-modal-close" onClick={onCancel} disabled={isDeleting}>
            ×
          </button>
        </div>

        <div className="delete-users-modal-body">
          <p className="delete-users-warning">
            Are you sure you want to delete <strong>{users.length} user(s)</strong>?
          </p>
          
          <p className="delete-users-permanent">
            ⚠️ This action cannot be undone.
          </p>

          <div className="delete-users-list-container">
            <div className="delete-users-list-label">Users to be deleted:</div>
            <div className="delete-users-list">
              {users.map((user, index) => (
                <div key={user.id || index} className="delete-users-list-item">
                  <span className="delete-users-list-email">{user.email}</span>
                  {user.username && (
                    <span className="delete-users-list-username">({user.username})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="delete-users-confirm-section">
            <label className="delete-users-confirm-label">
              Type <strong>"DELETE"</strong> to confirm:
            </label>
            <input
              type="text"
              className="delete-users-confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="DELETE"
              disabled={isDeleting}
              autoFocus
            />
          </div>
        </div>

        <div className="delete-users-modal-actions">
          <button
            className="delete-users-btn-cancel"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="delete-users-btn-delete"
            onClick={handleConfirm}
            disabled={confirmText !== 'DELETE' || isDeleting}
          >
            {isDeleting ? 'Deleting...' : `Delete ${users.length} User${users.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteUsersModal;

