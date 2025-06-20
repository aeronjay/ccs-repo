import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import ManagePapers from './pages/ManagePapers';
import Settings from './pages/Settings';
import AdminManagePapers from './pages/admin/AdminManagePapers';
import AdminManageUsers from './pages/admin/AdminManageUsers';
import AdminMessages from './pages/admin/AdminMessages';
import AdminSettings from './pages/admin/AdminSettings';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Routes */}
          <Route path="/manage-papers" element={<ManagePapers />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Admin Routes */}
          <Route path="/admin/manage-papers" element={<AdminManagePapers />} />
          <Route path="/admin/manage-users" element={<AdminManageUsers />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
