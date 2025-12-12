import React, { useState, useEffect } from 'react';
import api from '../api';
import '../css/SendToModal.css';

function SendToModal({ formId, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('groups'); // 'groups', 'users', 'admins'
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  const [groupSearch, setGroupSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadGroups();
    loadUsers();
    loadAdmins();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await api.get('/api/groups');
      setGroups(res.data.data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/api/auth/users?role=user');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadAdmins = async () => {
    try {
      const res = await api.get('/api/forms/admins/list');
      setAdmins(res.data.data || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (selectedGroups.length === 0 && selectedUsers.length === 0 && !selectedAdmin) {
      setMessage('Please select at least one recipient');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const payload = {
        groupIds: selectedGroups,
        userIds: selectedUsers,
        adminUserId: selectedAdmin,
      };

      const res = await api.post(`/api/forms/${formId}/send`, payload);
      
      setMessage(res.data.message || 'Form sent successfully');
      
      if (onSuccess) {
        onSuccess(res.data.data);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send form');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <div className="send-to-modal-overlay" onClick={onClose}>
      <div className="send-to-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="send-to-modal-header">
          <h2>Send Form To</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="send-to-tabs">
          <button
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups ({selectedGroups.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            End-Users ({selectedUsers.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Replicate to Admin {selectedAdmin ? '(1)' : ''}
          </button>
        </div>

        {/* Tab Content */}
        <div className="send-to-tab-content">
          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <div className="send-to-section">
              <input
                type="text"
                placeholder="Search groups..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="send-to-search"
              />
              <div className="send-to-list">
                {filteredGroups.length === 0 ? (
                  <p className="empty-message">No groups found</p>
                ) : (
                  filteredGroups.map(group => (
                    <label key={group.id} className="send-to-item">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => toggleGroupSelection(group.id)}
                      />
                      <div className="item-info">
                        <span className="item-name">{group.name}</span>
                        <span className="item-detail">
                          {group.member_count || 0} member{group.member_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="send-to-section">
              <input
                type="text"
                placeholder="Search end-users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="send-to-search"
              />
              <div className="send-to-list">
                {filteredUsers.length === 0 ? (
                  <p className="empty-message">No end-users found</p>
                ) : (
                  filteredUsers.map(user => (
                    <label key={user.id} className="send-to-item">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                      <div className="item-info">
                        <span className="item-name">{user.email}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <div className="send-to-section">
              <p className="admin-info">
                Replicate this form to another admin. They will receive an editable copy.
              </p>
              <input
                type="text"
                placeholder="Search admins..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="send-to-search"
              />
              <div className="send-to-list">
                {filteredAdmins.length === 0 ? (
                  <p className="empty-message">No other admins found</p>
                ) : (
                  filteredAdmins.map(admin => (
                    <label key={admin.id} className="send-to-item">
                      <input
                        type="radio"
                        name="admin"
                        checked={selectedAdmin === admin.id}
                        onChange={() => setSelectedAdmin(admin.id)}
                      />
                      <div className="item-info">
                        <span className="item-name">{admin.email}</span>
                        <span className="item-detail">
                          {admin.is_account_owner ? 'Account Owner' : 'Admin'}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`send-to-message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="send-to-actions">
          <button onClick={onClose} className="btn-cancel" disabled={loading}>
            Cancel
          </button>
          <button 
            onClick={handleSend} 
            className="btn-send" 
            disabled={loading || (selectedGroups.length === 0 && selectedUsers.length === 0 && !selectedAdmin)}
          >
            {loading ? 'Sending...' : 'Send Form'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SendToModal;
