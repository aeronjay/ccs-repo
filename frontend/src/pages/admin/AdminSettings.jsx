import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { FiSettings, FiClock } from 'react-icons/fi';

const AdminSettings = () => {
  return (
    <AdminLayout>
      <div className="admin-settings">
        <div className="admin-card-header">
          <h1 className="admin-card-title">
            <FiSettings size={24} />
            System Settings
          </h1>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              <FiClock size={20} />
              Coming Soon
            </h2>
          </div>
          <div className="admin-alert admin-alert-info">
            <p>Admin settings panel is under development. This will include:</p>
            <ul>
              <li>System configuration options</li>
              <li>Email notification settings</li>
              <li>User registration settings</li>
              <li>Security and access controls</li>
              <li>Database management tools</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
