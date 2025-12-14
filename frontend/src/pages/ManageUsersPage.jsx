import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import DeleteUsersModal from '../components/DeleteUsersModal';
import '../css/components.css';

function ManageUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'user'
  const [message, setMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadUsers();
  }, [user, navigate, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setMessage('');
      const params = {};
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      const res = await api.get('/api/auth/users', { params });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all filtered users except the current user
      const selectableIds = filteredUsers
        .filter(u => u.id !== user?.id)
        .map(u => u.id);
      setSelectedUsers(selectableIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedUsers.length === 0) {
      setMessage('Please select at least one user to delete.');
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      setMessage('');
      setShowDeleteModal(false);
      
      const res = await api.delete('/api/auth/users', {
        data: { user_ids: selectedUsers }
      });

      if (res.data && res.data.success) {
        setMessage(`Successfully deleted ${res.data.data.deleted} user(s).`);
        setSelectedUsers([]);
        // Reload users
        await loadUsers();
      } else {
        setMessage(res.data?.message || 'Failed to delete users.');
      }
    } catch (err) {
      console.error('Delete users error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete users.';
      setMessage(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const isAllSelected = filteredUsers.length > 0 && 
    filteredUsers.filter(u => u.id !== user?.id).every(u => selectedUsers.includes(u.id)) &&
    selectedUsers.length > 0;
  
  const isIndeterminate = selectedUsers.length > 0 && !isAllSelected;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="page-heading">
        <div className="card">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-heading">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="button button-secondary"
            style={{ marginBottom: '0.75rem' }}
            onClick={() => navigate('/admin')}
          >
            ← Back to Dashboard
          </button>
          <div className="page-kicker">User Management</div>
          <h2 className="page-title">Manage Users</h2>
        </div>
      </div>

      {message && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <p className="status" style={{ color: message.includes('Failed') ? '#ef4444' : '#16a34a' }}>
            {message}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="user">End Users</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={loadUsers}
              style={{ marginTop: '1.5rem' }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Users ({filteredUsers.length})</h3>
          {selectedUsers.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              style={{
                backgroundColor: '#ef4444',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.6 : 1,
                fontWeight: 500,
                boxShadow: '0 10px 30px rgba(220, 38, 38, 0.35)',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease'
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.target.style.boxShadow = '0 12px 38px rgba(220, 38, 38, 0.45)';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.target.style.boxShadow = '0 10px 30px rgba(220, 38, 38, 0.35)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedUsers.length})`}
            </button>
          )}
        </div>

        {filteredUsers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={handleSelectAll}
                      disabled={filteredUsers.filter(u => u.id !== user?.id).length === 0}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Username</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Role</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Account Owner</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrentUser = u.id === user?.id;
                  const isSelected = selectedUsers.includes(u.id);
                  
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid #f5f5f5',
                        transition: 'background-color 0.2s',
                        backgroundColor: isSelected ? '#fef3c7' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#fafafa';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectUser(u.id)}
                          disabled={isCurrentUser}
                          style={{ cursor: isCurrentUser ? 'not-allowed' : 'pointer' }}
                          title={isCurrentUser ? 'You cannot delete your own account' : 'Select user'}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>{u.id}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {u.username || <span style={{ color: '#999', fontStyle: 'italic' }}>N/A</span>}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          backgroundColor: u.role === 'admin' ? '#fef3c7' : '#dbeafe',
                          color: u.role === 'admin' ? '#92400e' : '#1e40af'
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {u.is_account_owner ? (
                        <span style={{ color: '#16a34a', fontWeight: '600' }}>✓ Yes</span>
                      ) : (
                        <span style={{ color: '#999' }}>No</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                      {formatDate(u.created_at)}
                      {isCurrentUser && (
                        <span style={{ marginLeft: '0.5rem', color: '#999', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          (You)
                        </span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
            {searchTerm || roleFilter !== 'all' 
              ? 'No users found matching your filters.' 
              : 'No users found.'}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Summary</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Users</div>
            <div className="summary-value">{users.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Administrators</div>
            <div className="summary-value">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">End Users</div>
            <div className="summary-value">
              {users.filter(u => u.role === 'user').length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Account Owners</div>
            <div className="summary-value">
              {users.filter(u => u.is_account_owner).length}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteUsersModal
          users={filteredUsers.filter(u => selectedUsers.includes(u.id))}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

export default ManageUsersPage;

