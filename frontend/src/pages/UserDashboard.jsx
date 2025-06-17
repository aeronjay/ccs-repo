import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>CCS Research</h1>
          </div>
          <div className="header-actions">
            <span className="nav-link">My Papers</span>
            <span className="nav-link">Browse</span>
            <span className="nav-link">Favorites</span>
            <div className="user-menu">
              <span className="user-email">{userEmail}</span>
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
          <div className="welcome-section">
            <h2>Welcome to your Dashboard</h2>
            <p>Manage your research papers and explore the latest publications.</p>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>📄 My Papers</h3>
              <p>View and manage your submitted papers</p>
              <span className="card-count">0 papers</span>
            </div>

            <div className="dashboard-card">
              <h3>⭐ Favorites</h3>
              <p>Papers you've bookmarked for later</p>
              <span className="card-count">0 favorites</span>
            </div>

            <div className="dashboard-card">
              <h3>📊 Reading History</h3>
              <p>Papers you've recently viewed</p>
              <span className="card-count">0 viewed</span>
            </div>

            <div className="dashboard-card">
              <h3>🔔 Notifications</h3>
              <p>Updates on papers and reviews</p>
              <span className="card-count">0 new</span>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn primary">Submit New Paper</button>
              <button className="action-btn secondary" onClick={() => navigate('/')}>
                Browse Repository
              </button>
              <button className="action-btn secondary">Update Profile</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
