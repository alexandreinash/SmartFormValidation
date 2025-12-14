import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../css/ManageGroupsPage.css';

function ManageGroupsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [message, setMessage] = useState('');
  
  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    loadGroups();
    loadAvailableUsers();
  }, []);

  // Check if user can create groups (has account)
  const canCreateGroups = user && (user.role === 'admin');

  const loadGroups = async (search = '') => {
    try {
      const params = search ? { search } : {};
      const res = await api.get('/api/groups', { params });
      setGroups(res.data.data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setMessage('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      // Get all end-users by fetching a fake group's available users
      // We'll need to create an endpoint for this, or we can just get all users with role='user'
      const res = await api.get('/api/auth/users?role=user');
      setAvailableUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    loadGroups(term);
  };

  const handleCreateGroup = async () => {
    try {
      const res = await api.post('/api/groups', {
        name: groupName,
        description: groupDescription,
        member_ids: selectedUsers,
      });
      
      setMessage(`Group "${groupName}" created successfully`);
      setShowCreateModal(false);
      resetForm();
      loadGroups(searchTerm);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleUpdateGroup = async () => {
    try {
      await api.put(`/api/groups/${selectedGroup.id}`, {
        name: groupName,
        description: groupDescription,
      });
      
      setMessage(`Group "${groupName}" updated successfully`);
      setShowEditModal(false);
      resetForm();
      loadGroups(searchTerm);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update group');
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/groups/${groupId}`);
      setMessage(`Group "${groupName}" deleted successfully`);
      loadGroups(searchTerm);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleAddMembers = async (groupId) => {
    if (selectedUsers.length === 0) {
      setMessage('Please select at least one user');
      return;
    }

    try {
      const res = await api.post(`/api/groups/${groupId}/members`, {
        user_ids: selectedUsers,
      });
      setMessage(res.data.message);
      setSelectedUsers([]);
      loadGroups(searchTerm);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to add members');
    }
  };

  const handleRemoveMember = async (groupId, userId, userEmail) => {
    if (!window.confirm(`Remove ${userEmail} from this group?`)) {
      return;
    }

    try {
      await api.delete(`/api/groups/${groupId}/members`, {
        data: { user_ids: [userId] },
      });
      setMessage(`Removed ${userEmail} from group`);
      loadGroups(searchTerm);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedUsers([]);
    setSelectedGroup(null);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (loading) {
    return <div className="loading">Loading groups...</div>;
  }

  return (
    <div className="manage-groups-container">
      {/* Header */}
      <div className="groups-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Back to Dashboard
        </button>
        <div>
          <h1>Manage Groups</h1>
          <p>Create and manage groups of end-users for efficient form sharing</p>
        </div>
      </div>

      {/* Search and Create */}
      <div className="groups-actions">
        <input
          type="text"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn-create"
        >
          + Create Group
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
          <button onClick={() => setMessage('')} className="close-btn">×</button>
        </div>
      )}

      {/* Groups List */}
      <div className="groups-list">
        {groups.length === 0 ? (
          <div className="empty-state">
            <p>No groups found</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-create">
              Create Your First Group
            </button>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="group-card">
              <div className="group-header">
                <div>
                  <h3>{group.name}</h3>
                  {group.description && <p className="group-description">{group.description}</p>}
                  <span className="member-count">
                    {group.member_count || 0} member{group.member_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="group-actions">
                  <button onClick={() => openEditModal(group)} className="btn-edit">
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteGroup(group.id, group.name)} 
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Members */}
              {group.memberships && group.memberships.length > 0 && (
                <div className="group-members">
                  <h4>Members:</h4>
                  <div className="members-list">
                    {group.memberships.map(membership => (
                      <div key={membership.id} className="member-item">
                        <span>{membership.user?.email || 'Unknown'}</span>
                        <button
                          onClick={() => handleRemoveMember(group.id, membership.user_id, membership.user?.email)}
                          className="btn-remove-member"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Members */}
              <div className="add-members-section">
                <h4>Add Members:</h4>
                <div className="user-selection">
                  {availableUsers
                    .filter(u => !group.memberships?.some(m => m.user_id === u.id))
                    .map(user => (
                      <label key={user.id} className="user-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                        <span>{user.email}</span>
                      </label>
                    ))}
                </div>
                {selectedUsers.length > 0 && (
                  <button 
                    onClick={() => handleAddMembers(group.id)} 
                    className="btn-add-members"
                  >
                    Add {selectedUsers.length} Selected User{selectedUsers.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Group</h2>
            <div className="form-group">
              <label>Group Name *</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Optional description"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Select Members</label>
              <div className="user-selection">
                {availableUsers.map(user => (
                  <label key={user.id} className="user-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                    <span>{user.email}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn-cancel">
                Cancel
              </button>
              <button 
                onClick={handleCreateGroup} 
                className="btn-submit"
                disabled={!groupName.trim()}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Group</h2>
            <div className="form-group">
              <label>Group Name *</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Optional description"
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="btn-cancel">
                Cancel
              </button>
              <button 
                onClick={handleUpdateGroup} 
                className="btn-submit"
                disabled={!groupName.trim()}
              >
                Update Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageGroupsPage;
