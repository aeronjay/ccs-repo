import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/service';

const AdminManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  // Check if user is admin
  const checkAdminAccess = () => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/signin');
      return false;
    }
    
    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'admin') {
        navigate('/');
        return false;
      }
      return true;
    } catch (error) {
      navigate('/signin');
      return false;
    }
  };

  // Load all users and statistics
  const loadData = async () => {
    if (!checkAdminAccess()) return;
    
    setLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        userService.getAllUsers(),
        userService.getUserStats()
      ]);
      
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      setMessage('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      await userService.updateUserRole(userId, newRole);
      setMessage('User role updated successfully');
      loadData(); // Reload data
    } catch (error) {
      setMessage('Error updating user role: ' + error.message);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId, userEmail) => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Prevent admin from deleting themselves
    if (currentUser.id === userId) {
      setMessage('Error: You cannot delete your own account');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      setMessage('User deleted successfully');
      loadData(); // Reload data
    } catch (error) {
      setMessage('Error deleting user: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ marginBottom: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ← Back to Homepage
        </button>
        <h1>Admin - Manage Users</h1>
        
        {/* Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Total Users</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{stats.totalUsers || 0}</p>
          </div>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Admin Users</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{stats.adminUsers || 0}</p>
          </div>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Regular Users</h3>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.regularUsers || 0}</p>
          </div>
        </div>

        {/* Recent Users */}
        {stats.recentUsers && stats.recentUsers.length > 0 && (
          <div style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Recent Registrations</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {stats.recentUsers.map(user => (
                <div key={user._id} style={{ backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '14px' }}>
                  {user.email} ({user.role}) - {formatDate(user.createdAt)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search users by email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`} style={{ padding: '10px', marginBottom: '20px', borderRadius: '4px', backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda', color: message.includes('Error') ? '#721c24' : '#155724' }}>
            {message}
          </div>
        )}
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Email</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Role</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Created</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Last Updated</th>
              <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const currentUser = JSON.parse(localStorage.getItem('user'));
              const isCurrentUser = currentUser.id === user._id;
              
              return (
                <tr key={user._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '15px' }}>
                    {user.email}
                    {isCurrentUser && <span style={{ marginLeft: '8px', backgroundColor: '#007bff', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>You</span>}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={isCurrentUser}
                      style={{ 
                        padding: '5px 10px', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        backgroundColor: user.role === 'admin' ? '#dc3545' : '#28a745',
                        color: 'white',
                        cursor: isCurrentUser ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '15px', color: '#666' }}>{formatDate(user.createdAt)}</td>
                  <td style={{ padding: '15px', color: '#666' }}>{formatDate(user.updatedAt)}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteUser(user._id, user.email)}
                      disabled={isCurrentUser}
                      style={{ 
                        padding: '6px 12px', 
                        backgroundColor: isCurrentUser ? '#6c757d' : '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                      title={isCurrentUser ? 'Cannot delete your own account' : 'Delete user'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {searchTerm ? 'No users found matching your search.' : 'No users found in the system.'}
        </div>
      )}

      {/* Help Information */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>User Management Help</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
          <li><strong>Admin Role:</strong> Can manage all papers and users, has full system access</li>
          <li><strong>User Role:</strong> Can upload and manage their own papers, view public papers</li>
          <li><strong>Role Changes:</strong> Take effect immediately, users may need to log in again</li>
          <li><strong>Delete Users:</strong> Permanently removes user account and their associated data</li>
          <li><strong>Security:</strong> You cannot delete your own admin account or change your own role</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminManageUsers;
