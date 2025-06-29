import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { paperService } from '../../services/service';

const AdminManagePapers = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    journal: '',
    year: '',
    publisher: '',
    authors: [],
    tags: [],
    doi: ''
  });
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

  // Load all papers and statistics
  const loadData = async () => {
    if (!checkAdminAccess()) return;
    
    setLoading(true);
    try {
      const [papersData, statsData] = await Promise.all([
        paperService.getAllPapers(),
        paperService.adminGetPaperStats()
      ]);
      
      setPapers(papersData);
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

  // Filter papers based on search term
  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    paper.journal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete paper
  const handleDelete = async (paperId) => {
    if (!window.confirm('Are you sure you want to delete this paper? This action cannot be undone.')) {
      return;
    }

    try {
      await paperService.adminDeletePaper(paperId);
      setMessage('Paper deleted successfully');
      loadData(); // Reload data
    } catch (error) {
      setMessage('Error deleting paper: ' + error.message);
    }
  };

  // Handle edit paper
  const handleEdit = (paperId) => {
    const paper = papers.find(p => p.id === paperId);
    if (paper) {
      setSelectedPaper(paper);
      setEditForm({
        title: paper.title,
        description: paper.description,
        journal: paper.journal,
        year: paper.year,
        publisher: paper.publisher,
        authors: paper.authors,
        tags: paper.tags,
        doi: paper.doi
      });
      setShowEditModal(true);
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    try {
      await paperService.adminUpdatePaper(selectedPaper.id, editForm);
      setMessage('Paper updated successfully');
      setShowEditModal(false);
      loadData(); // Reload data
    } catch (error) {
      setMessage('Error updating paper: ' + error.message);
    }
  };

  // Handle download paper
  const handleDownload = async (paperId, filename) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await paperService.downloadPaper(paperId, user.id);
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage('Error downloading paper: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Content to render inside the AdminLayout
  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading">Loading papers...</div>
      );
    }

    return (
      <>
        <div style={{ marginBottom: '20px' }}>
          <h1>Manage Papers</h1>
          
          {/* Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Total Papers</h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{stats.totalPapers || 0}</p>
            </div>
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Total Size</h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{formatFileSize(stats.totalSize || 0)}</p>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search papers by title, description, authors, or journal..."
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

        {/* Papers List */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {filteredPapers.map(paper => (
            <div key={paper.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{paper.title}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#666' }}>{paper.description}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px', color: '#555' }}>
                    <div><strong>Journal:</strong> {paper.journal}</div>
                    <div><strong>Year:</strong> {paper.year}</div>
                    <div><strong>Publisher:</strong> {paper.publisher}</div>
                    <div><strong>DOI:</strong> {paper.doi}</div>
                    <div><strong>Size:</strong> {formatFileSize(paper.size)}</div>
                    <div><strong>Upload Date:</strong> {formatDate(paper.uploadDate)}</div>
                  </div>

                  {paper.authors && paper.authors.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Authors:</strong> {paper.authors.join(', ')}
                    </div>
                  )}

                  {paper.tags && paper.tags.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Tags:</strong> {paper.tags.map(tag => (
                        <span key={tag} style={{ display: 'inline-block', backgroundColor: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', marginRight: '5px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '10px', display: 'flex', gap: '15px', fontSize: '14px' }}>
                    <span>👍 {paper.likes || 0}</span>
                    <span>👎 {paper.dislikes || 0}</span>
                    <span>💬 {paper.comments || 0}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
                  <button
                    onClick={() => handleDownload(paper.id, paper.filename)}
                    style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleEdit(paper.id)}
                    style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(paper.id)}
                    style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPapers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            {searchTerm ? 'No papers found matching your search.' : 'No papers found in the system.'}
          </div>
        )}
      </>
    );
  };

  // Render edit modal separately
  const renderEditModal = () => {
    if (!showEditModal) return null;
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Edit Paper</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title:</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description:</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              rows="3"
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Journal:</label>
              <input
                type="text"
                value={editForm.journal}
                onChange={(e) => setEditForm({...editForm, journal: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Year:</label>
              <input
                type="text"
                value={editForm.year}
                onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Publisher:</label>
            <input
              type="text"
              value={editForm.publisher}
              onChange={(e) => setEditForm({...editForm, publisher: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>DOI:</label>
            <input
              type="text"
              value={editForm.doi}
              onChange={(e) => setEditForm({...editForm, doi: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowEditModal(false)}
              style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render the component within AdminLayout
  return (
    <AdminLayout>
      {renderContent()}
      {renderEditModal()}
    </AdminLayout>
  );
};

export default AdminManagePapers;
