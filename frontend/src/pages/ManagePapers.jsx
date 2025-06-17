import React, { useState, useEffect } from 'react';
import { paperService } from '../services/service';

const ManagePapers = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  // Get user ID from localStorage (you might want to use a proper auth context)
  const userId = localStorage.getItem('userId') || 'demo-user-id';

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const userPapers = await paperService.getUserPapers(userId);
      setPapers(userPapers);
    } catch (error) {
      setMessage('Error loading papers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setMessage('Only PDF and DOCX files are allowed');
        return;
      }
      
      // Check file size (16MB limit)
      if (file.size > 16 * 1024 * 1024) {
        setMessage('File size must be less than 16MB');
        return;
      }
      
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for default title
      setMessage('');
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    try {
      await paperService.upload(selectedFile, userId, title, description);
      setMessage('Paper uploaded successfully!');
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      document.getElementById('fileInput').value = '';
      loadPapers(); // Refresh the list
    } catch (error) {
      setMessage('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (paper) => {
    try {
      const response = await paperService.downloadPaper(paper.id, userId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: paper.contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = paper.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage('Download failed: ' + error.message);
    }
  };

  const handleDelete = async (paper) => {
    if (window.confirm(`Are you sure you want to delete "${paper.title}"?`)) {
      try {
        await paperService.deletePaper(paper.id, userId);
        setMessage('Paper deleted successfully');
        loadPapers(); // Refresh the list
      } catch (error) {
        setMessage('Delete failed: ' + error.message);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Manage My Papers</h1>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          backgroundColor: message.includes('Error') || message.includes('failed') ? '#ffebee' : '#e8f5e8',
          color: message.includes('Error') || message.includes('failed') ? '#c62828' : '#2e7d32',
          borderRadius: '4px',
          border: `1px solid ${message.includes('Error') || message.includes('failed') ? '#ffcdd2' : '#c8e6c9'}`
        }}>
          {message}
        </div>
      )}

      {/* Upload Section */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '30px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2>Upload New Paper</h2>
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Select File (PDF or DOCX, max 16MB):
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileSelect}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="Enter paper title"
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description (optional):
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '60px' }}
              placeholder="Enter paper description"
            />
          </div>
          
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            style={{
              backgroundColor: uploading || !selectedFile ? '#ccc' : '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Paper'}
          </button>
        </form>
      </div>

      {/* Papers List */}
      <div>
        <h2>My Papers ({papers.length})</h2>
        {loading ? (
          <p>Loading papers...</p>
        ) : papers.length === 0 ? (
          <p>No papers uploaded yet. Upload your first paper above!</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {papers.map((paper) => (
              <div key={paper.id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: 'white'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{paper.title}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#666' }}>{paper.description}</p>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                  <strong>Filename:</strong> {paper.filename} | 
                  <strong> Size:</strong> {formatFileSize(paper.size)} | 
                  <strong> Uploaded:</strong> {new Date(paper.uploadDate).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleDownload(paper)}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(paper)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePapers;
