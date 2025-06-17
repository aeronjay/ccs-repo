import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>CCS Research - Admin Panel</h1>
          </div>
          <div className="header-actions">
            <span className="nav-link">Manage Papers</span>
            <span className="nav-link">Users</span>
            <span className="nav-link">Analytics</span>
            <span className="nav-link">Settings</span>
            <div className="user-menu">
              <span className="user-email">Admin: {userEmail}</span>
              <button className="sign-out-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="content-container">
          <div className="admin-welcome-section">
            <h2>Admin Dashboard</h2>
            <p>Manage the CCS Research Repository and monitor system activities.</p>
          </div>

          <div className="admin-stats">
            <div className="stat-card">
              <h3>📄 Total Papers</h3>
              <div className="stat-number">1,247</div>
              <div className="stat-change">+12 this week</div>
            </div>

            <div className="stat-card">
              <h3>👥 Total Users</h3>
              <div className="stat-number">156</div>
              <div className="stat-change">+5 this week</div>
            </div>

            <div className="stat-card">
              <h3>⏳ Pending Reviews</h3>
              <div className="stat-number">23</div>
              <div className="stat-change urgent">Needs attention</div>
            </div>

            <div className="stat-card">
              <h3>👁️ Total Views</h3>
              <div className="stat-number">45,892</div>
              <div className="stat-change">+1,234 this week</div>
            </div>
          </div>

          <div className="admin-sections">
            <div className="admin-section">
              <h3>Paper Management</h3>
              <div className="section-content">
                <div className="admin-card">
                  <h4>Review Queue</h4>
                  <p>Papers waiting for approval</p>
                  <div className="card-actions">
                    <button className="action-btn primary">Review Papers (23)</button>
                  </div>
                </div>

                <div className="admin-card">
                  <h4>Published Papers</h4>
                  <p>Manage published research papers</p>
                  <div className="card-actions">
                    <button className="action-btn secondary">Manage Papers</button>
                  </div>
                </div>

                <div className="admin-card">
                  <h4>Categories & Tags</h4>
                  <p>Organize research categories</p>
                  <div className="card-actions">
                    <button className="action-btn secondary">Manage Categories</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-section">
              <h3>User Management</h3>
              <div className="section-content">
                <div className="admin-card">
                  <h4>User Accounts</h4>
                  <p>Manage user registrations and roles</p>
                  <div className="card-actions">
                    <button className="action-btn secondary">Manage Users</button>
                  </div>
                </div>

                <div className="admin-card">
                  <h4>Access Control</h4>
                  <p>Set permissions and roles</p>
                  <div className="card-actions">
                    <button className="action-btn secondary">Manage Permissions</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-section">
              <h3>System Overview</h3>
              <div className="section-content">
                <div className="admin-card">
                  <h4>Analytics</h4>
                  <p>View system usage and statistics</p>
                  <div className="card-actions">
                    <button className="action-btn secondary">View Analytics</button>
                  </div>
                </div>

                <div className="admin-card">
                  <h4>System Settings</h4>
                  <p>Configure repository settings</p>
                  <div className="card-actions">
                    <button className="action-btn secondary">System Settings</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn primary">Add New Paper</button>
              <button className="action-btn primary">Create User Account</button>
              <button className="action-btn secondary" onClick={() => navigate('/')}>
                View Public Repository
              </button>
              <button className="action-btn secondary">Export Data</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
