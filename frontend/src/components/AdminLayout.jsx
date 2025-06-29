import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiClock, 
  FiFileText, 
  FiMessageSquare, 
  FiSettings,
  FiMenu,
  FiX,
  FiLogOut,
  FiUser
} from 'react-icons/fi';
import './AdminLayout.css';  const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  // Removed sidebar toggle state - sidebar will always be open

  useEffect(() => {
    // Check if user is admin
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/signin');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        navigate('/');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      navigate('/signin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const navigationItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: FiHome
    },
    {
      path: '/admin/manage-users',
      name: 'Manage Users',
      icon: FiUsers
    },
    {
      path: '/admin/pending-approvals',
      name: 'Pending Approvals',
      icon: FiClock
    },
    {
      path: '/admin/manage-papers',
      name: 'Manage Papers',
      icon: FiFileText
    },
    {
      path: '/admin/messages',
      name: 'Messages',
      icon: FiMessageSquare
    },
    {
      path: '/admin/settings',
      name: 'Settings',
      icon: FiSettings
    }
  ];

  if (!user) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar open">
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <h2>CCS Admin</h2>
          </div>
          {/* Toggle button removed */}
        </div>

        <nav className="admin-nav">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">
                  <IconComponent size={20} />
                </span>
                <span className="nav-label">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="user-avatar">
              <FiUser size={20} />
            </div>
            <div className="user-details">
              <p className="user-email">{user.email}</p>
              <p className="user-role">Administrator</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main sidebar-open">
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
