import React, { useState, useEffect } from 'react';
import api from '../api';
import '../css/DeleteUsersModal.css';

function RemoveAccountModal({ user, onConfirm, onCancel, isRemoving }) {
  const [confirmText, setConfirmText] = useState('');
  const [accountMembers, setAccountMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    // If user is account owner, fetch account members
    if (user?.is_account_owner) {
      setLoadingMembers(true);
      api.get('/api/accounts/members')
        .then(res => {
          if (res.data && res.data.success && res.data.data) {
            setAccountMembers(res.data.data);
          }
        })
        .catch(err => {
          console.error('Failed to load account members:', err);
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    }
  }, [user]);

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

  const isAccountOwner = user?.is_account_owner;
  const affectedUsers = isAccountOwner ? accountMembers : (user ? [user] : []);
  const userCount = affectedUsers.length;

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
          <button className="delete-users-modal-close" onClick={onCancel} disabled={isRemoving}>
            ×
          </button>
        </div>

        <div className="delete-users-modal-body">
          <p className="delete-users-warning">
            Are you sure you want to {isAccountOwner ? 'disband this account' : 'remove your account association'}?
            {isAccountOwner && userCount > 0 && (
              <> This will affect <strong>{userCount} user{userCount !== 1 ? 's' : ''}</strong>.</>
            )}
          </p>
          
          <div className="delete-users-permanent">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M8 4V8M8 12H8.01M15 8C15 11.3137 12.3137 14 9 14C5.68629 14 3 11.3137 3 8C3 4.68629 5.68629 2 9 2C12.3137 2 15 4.68629 15 8Z" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            This action cannot be undone.
          </div>

          {isAccountOwner && userCount > 0 && (
            <div className="delete-users-list-container">
              <div className="delete-users-list-label">USERS TO BE AFFECTED:</div>
              {loadingMembers ? (
                <div className="delete-users-list" style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                  Loading users...
                </div>
              ) : (
                <div className="delete-users-list">
                  {affectedUsers.map((member, index) => (
                    <div key={member.id || index} className="delete-users-list-item">
                      <span className="delete-users-list-email">{member.email}</span>
                      {member.username && (
                        <span className="delete-users-list-username">({member.username})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
              disabled={isRemoving}
              autoFocus
            />
          </div>
        </div>

        <div className="delete-users-modal-actions">
          <button
            className="delete-users-btn-cancel"
            onClick={onCancel}
            disabled={isRemoving}
          >
            Cancel
          </button>
          <button
            className="delete-users-btn-delete"
            onClick={handleConfirm}
            disabled={confirmText !== 'DELETE' || isRemoving}
          >
            {isRemoving ? 'Removing...' : (isAccountOwner ? 'Disband Account' : 'Remove Account')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RemoveAccountModal;

