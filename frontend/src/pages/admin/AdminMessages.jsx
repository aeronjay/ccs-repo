import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { FiMessageSquare, FiClock } from 'react-icons/fi';

const AdminMessages = () => {
  return (
    <AdminLayout>
      <div className="admin-messages">
        <div className="admin-card-header">
          <h1 className="admin-card-title">
            <FiMessageSquare size={24} />
            Messages & Communication
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
            <p>Messages and communication panel is under development. This will include:</p>
            <ul>
              <li>User support messages and tickets</li>
              <li>System announcements</li>
              <li>Email campaign management</li>
              <li>User feedback and reports</li>
              <li>Communication logs and history</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
