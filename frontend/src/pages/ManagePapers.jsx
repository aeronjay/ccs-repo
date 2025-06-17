import React, { useState, useEffect } from 'react';
import { paperService } from '../services/service';

const ManagePapers = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [authors, setAuthors] = useState('');
  const [tags, setTags] = useState('');
  const [doi, setDoi] = useState('');
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
    }    setUploading(true);
    try {
      // Prepare additional data
      const additionalData = {
        journal,
        year,
        authors: authors.split(',').map(author => author.trim()).filter(author => author),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        doi: doi || `DOI-${Date.now()}` // Generate a simple DOI if not provided
      };

      await paperService.upload(selectedFile, userId, title, description, additionalData);
      setMessage('Paper uploaded successfully!');
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setJournal('');
      setYear(new Date().getFullYear().toString());
      setAuthors('');
      setTags('');
      setDoi('');
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

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Journal <span style={{ color: 'red' }}>*</span>:
            </label>
            <input
              type="text"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="e.g., IEEE Transactions on Neural Networks"
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Publication Year <span style={{ color: 'red' }}>*</span>:
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="e.g., 2023"
              min="1900"
              max={new Date().getFullYear() + 5}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Authors <span style={{ color: 'red' }}>*</span>:
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="e.g., John Doe, Jane Smith, Bob Johnson (comma-separated)"
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tags <span style={{ color: 'red' }}>*</span>:
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="e.g., machine learning, AI, neural networks (comma-separated)"
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              DOI (optional):
            </label>
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="e.g., 10.1000/182 (leave blank to auto-generate)"
            />
          </div>
            <button
            type="submit"
            disabled={uploading || !selectedFile || !title || !journal || !year || !authors || !tags}
            style={{
              backgroundColor: uploading || !selectedFile || !title || !journal || !year || !authors || !tags ? '#ccc' : '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: uploading || !selectedFile || !title || !journal || !year || !authors || !tags ? 'not-allowed' : 'pointer'
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
              }}>                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{paper.title}</h3>
                {paper.journal && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    <strong>Journal:</strong> {paper.journal} {paper.year && `• ${paper.year}`}
                  </div>
                )}
                {paper.authors && paper.authors.length > 0 && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    <strong>Authors:</strong> {paper.authors.join(', ')}
                  </div>
                )}
                {paper.doi && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    <strong>DOI:</strong> {paper.doi}
                  </div>
                )}
                <p style={{ margin: '0 0 10px 0', color: '#666' }}>{paper.description}</p>
                {paper.tags && paper.tags.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    {paper.tags.map((tag, index) => (
                      <span key={index} style={{ 
                        display: 'inline-block', 
                        backgroundColor: '#e3f2fd', 
                        color: '#1976d2', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        marginRight: '5px', 
                        marginBottom: '5px' 
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
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
