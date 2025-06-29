import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paperService } from '../services/service';
import '../styles/ManagePapers.css';

const ManagePapers = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [publisher, setPublisher] = useState('');
  const [authorsList, setAuthorsList] = useState([]);
  const [keywordsList, setKeywordsList] = useState([]);
  const [selectedSDGs, setSelectedSDGs] = useState([]);
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [doi, setDoi] = useState('');
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  // SDG options
  const sdgOptions = [
    { id: 1, name: "No Poverty" },
    { id: 2, name: "Zero Hunger" },
    { id: 3, name: "Good Health and Well-being" },
    { id: 4, name: "Quality Education" },
    { id: 5, name: "Gender Equality" },
    { id: 6, name: "Clean Water and Sanitation" },
    { id: 7, name: "Affordable and Clean Energy" },
    { id: 8, name: "Decent Work and Economic Growth" },
    { id: 9, name: "Industry, Innovation and Infrastructure" },
    { id: 10, name: "Reduced Inequalities" },
    { id: 11, name: "Sustainable Cities and Communities" },
    { id: 12, name: "Responsible Consumption and Production" },
    { id: 13, name: "Climate Action" },
    { id: 14, name: "Life Below Water" },
    { id: 15, name: "Life on Land" },
    { id: 16, name: "Peace, Justice and Strong Institutions" },
    { id: 17, name: "Partnerships for the Goals" }
  ];

  // Get user ID from localStorage - extract from stored user object
  const getUserId = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.id;
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
      }
    }
    return null;
  };
  const userId = getUserId();

  // Check if user is authenticated
  useEffect(() => {
    if (!userId) {
      setMessage('Please log in to access your papers.');
      navigate('/signin');
      return;
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (userId) {
      loadPapers();
    }
  }, [userId]);

  const loadPapers = async () => {
    if (!userId) {
      return;
    }
    
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

  const handleFileSelect = (file) => {
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
      
      // Check file size (10MB limit as shown in the image)
      if (file.size > 10 * 1024 * 1024) {
        setMessage('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for default title
      setMessage('');
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setTitle('');
  };

  const addAuthor = () => {
    if (currentAuthor.trim() && !authorsList.includes(currentAuthor.trim())) {
      setAuthorsList([...authorsList, currentAuthor.trim()]);
      setCurrentAuthor('');
    }
  };

  const removeAuthor = (index) => {
    setAuthorsList(authorsList.filter((_, i) => i !== index));
  };

  const addKeyword = () => {
    if (currentKeyword.trim() && !keywordsList.includes(currentKeyword.trim())) {
      setKeywordsList([...keywordsList, currentKeyword.trim()]);
      setCurrentKeyword('');
    }
  };

  const removeKeyword = (index) => {
    setKeywordsList(keywordsList.filter((_, i) => i !== index));
  };

  const handleSDGChange = (sdgId) => {
    setSelectedSDGs(prev => 
      prev.includes(sdgId) 
        ? prev.filter(id => id !== sdgId)
        : [...prev, sdgId]
    );
  };

  const openUploadModal = () => {
    resetForm();
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    resetForm();
  };

  const openEditModal = (paper) => {
    setSelectedPaper(paper);
    setTitle(paper.title);
    setDescription(paper.description || '');
    setJournal(paper.journal || '');
    setYear(paper.year || new Date().getFullYear().toString());
    setPublisher(paper.publisher || '');
    setAuthorsList(paper.authors || []);
    setKeywordsList(paper.tags || []);
    setSelectedSDGs(paper.sdgs || []);
    setDoi(paper.doi || '');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setJournal('');
    setPublisher('');
    setYear(new Date().getFullYear().toString());
    setAuthorsList([]);
    setKeywordsList([]);
    setSelectedSDGs([]);
    setCurrentAuthor('');
    setCurrentKeyword('');
    setDoi('');
    setSelectedPaper(null);
  };
  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setMessage('Please select a file');
      return;
    }

    if (authorsList.length === 0) {
      setMessage('Please add at least one author');
      return;
    }    
    
    if (keywordsList.length === 0) {
      setMessage('Please add at least one keyword');
      return;
    }

    if (!journal.trim()) {
      setMessage('Please enter a journal name');
      return;
    }

    if (selectedSDGs.length === 0) {
      setMessage('Please select at least one SDG');
      return;
    }

    setUploading(true);
    try {
      // Prepare additional data
      const additionalData = {
        journal,
        year,
        publisher,
        authors: authorsList,
        tags: keywordsList,
        sdgs: selectedSDGs,
        doi: doi || `DOI-${Date.now()}` // Generate a simple DOI if not provided
      };

      await paperService.upload(selectedFile, userId, title, description, additionalData);
      setMessage('Paper uploaded successfully!');
      closeUploadModal();
      loadPapers(); // Refresh the list
    } catch (error) {
      setMessage('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    
    if (authorsList.length === 0) {
      setMessage('Please add at least one author');
      return;
    }    
    
    if (keywordsList.length === 0) {
      setMessage('Please add at least one keyword');
      return;
    }

    if (!journal.trim()) {
      setMessage('Please enter a journal name');
      return;
    }

    if (selectedSDGs.length === 0) {
      setMessage('Please select at least one SDG');
      return;
    }

    setUploading(true);
    try {
      // Prepare updated data
      const updatedData = {
        title,
        description,
        journal,
        year,
        publisher,
        authors: authorsList,
        tags: keywordsList,
        sdgs: selectedSDGs,
        doi
      };

      await paperService.updatePaper(selectedPaper.id, userId, updatedData);
      setMessage('Paper updated successfully!');
      closeEditModal();
      loadPapers(); // Refresh the list
    } catch (error) {
      setMessage('Update failed: ' + error.message);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSDGName = (sdgId) => {
    const sdg = sdgOptions.find(s => s.id === sdgId);
    return sdg ? sdg.name : `SDG ${sdgId}`;
  };

  return (
    <div className="manage-papers-container">
      <div className="page-header">
        <button
          onClick={() => navigate(-1)}
          className="back-button"
        >
          ← Back
        </button>
        <h1 className="page-title">Manage My Papers</h1>
      </div>
      
      {!userId ? (
        <div className="alert alert-warning">
          <p>Please log in to access your papers.</p>
          <button
            onClick={() => navigate('/signin')}
            className="upload-button"
          >
            Go to Sign In
          </button>
        </div>
      ) : (
        <>
          {message && (
            <div className={`alert ${message.includes('Error') || message.includes('failed') ? 'alert-error' : 'alert-success'}`}>
              {message}
            </div>
          )}

          {/* Table Section */}
          <div className="papers-table-section">
            <div className="section-header">
              <h2 className="section-title">My Research Papers</h2>
              <button
                onClick={openUploadModal}
                className="upload-button"
              >
                <i className="fas fa-plus"></i> Upload New Paper
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Loading papers...</div>
            ) : papers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No papers uploaded yet</div>
                <div className="empty-state-text">Upload your first paper using the button above!</div>
              </div>
            ) : (
              <div className="papers-table-container">
                <table className="papers-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Journal / Year</th>
                      <th>Authors</th>
                      <th>File Details</th>
                      <th>Upload Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map((paper) => (
                      <tr key={paper.id} className="paper-row">
                        <td className="paper-title-cell">
                          <div className="paper-title">{paper.title}</div>
                          {paper.tags && paper.tags.length > 0 && (
                            <div className="paper-tags">
                              {paper.tags.map((tag, index) => (
                                <span key={index} className="paper-tag">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          {paper.journal || 'N/A'}
                          <br />
                          {paper.year || 'N/A'}
                        </td>
                        <td>
                          {paper.authors ? paper.authors.join(', ') : 'No authors listed'}
                        </td>
                        <td>
                          <div>{paper.filename}</div>
                          <div className="file-size">{formatFileSize(paper.size)}</div>
                        </td>
                        <td>
                          {formatDate(paper.uploadDate)}
                        </td>
                        <td className="actions-cell">
                          <button
                            onClick={() => handleDownload(paper)}
                            className="action-button download-button"
                            title="Download Paper"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          <button
                            onClick={() => openEditModal(paper)}
                            className="action-button edit-button"
                            title="Edit Paper"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(paper)}
                            className="action-button delete-button"
                            title="Delete Paper"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h2>Upload New Research Paper</h2>
                  <button className="close-button" onClick={closeUploadModal}>×</button>
                </div>
                
                <form onSubmit={handleUpload} className="upload-form">
                  {/* File Upload */}
                  <div className="file-upload-section">
                    <label className="form-label">
                      Paper File (PDF/DOCX) <span className="required">*</span>
                    </label>
                    <div 
                      className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('fileInput').click()}
                    >
                      <div className="upload-icon">
                        <i className="fas fa-cloud-upload-alt"></i>
                      </div>
                      <div className="upload-text">Upload a file</div>
                      <div className="upload-subtext">or drag and drop</div>
                      <div className="file-types">PDF or DOCX up to 10MB</div>
                    </div>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileInputChange}
                      className="hidden-file-input"
                    />
                    
                    {selectedFile && (
                      <div className="selected-file">
                        <div className="file-icon">
                          <i className="fas fa-file-alt"></i>
                        </div>
                        <div className="file-info">
                          <div className="file-name">{selectedFile.name}</div>
                          <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="remove-file"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label">
                      Title <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                      placeholder="Enter paper title"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="form-textarea"
                      placeholder="Enter paper description or abstract"
                      rows={4}
                    />
                  </div>

                  {/* SDG Selection */}
                  <div className="sdg-section">
                    <label className="form-label">
                      Sustainable Development Goals (SDGs) <span className="required">*</span>
                    </label>
                    <div className="form-label" style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                      Hold Ctrl (Windows) or Command (Mac) to select multiple SDGs
                    </div>
                    <div className="sdg-grid">
                      {sdgOptions.map((sdg) => (
                        <div
                          key={sdg.id}
                          className={`sdg-item ${selectedSDGs.includes(sdg.id) ? 'selected' : ''}`}
                          onClick={() => handleSDGChange(sdg.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSDGs.includes(sdg.id)}
                            onChange={() => {}} // Handled by onClick
                            className="sdg-checkbox"
                          />
                          <span className="sdg-text">{sdg.id}: {sdg.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Authors and Keywords */}
                  <div className="multi-input-section">
                    <div className="dynamic-input-group">
                      <label className="form-label">
                        Authors <span className="required">*</span>
                      </label>
                      <div className="input-with-button">
                        <input
                          type="text"
                          value={currentAuthor}
                          onChange={(e) => setCurrentAuthor(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                          className="form-input"
                          placeholder="Author name"
                        />
                        <button
                          type="button"
                          onClick={addAuthor}
                          className="add-button"
                        >
                          + Add Author
                        </button>
                      </div>
                      <div className="tag-list">
                        {authorsList.map((author, index) => (
                          <div key={index} className="tag-item">
                            {author}
                            <button
                              type="button"
                              onClick={() => removeAuthor(index)}
                              className="remove-tag"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="dynamic-input-group">
                      <label className="form-label">
                        Keywords <span className="required">*</span>
                      </label>
                      <div className="input-with-button">
                        <input
                          type="text"
                          value={currentKeyword}
                          onChange={(e) => setCurrentKeyword(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                          className="form-input"
                          placeholder="Keyword"
                        />
                        <button
                          type="button"
                          onClick={addKeyword}
                          className="add-button"
                        >
                          + Add Keyword
                        </button>
                      </div>
                      <div className="tag-list">
                        {keywordsList.map((keyword, index) => (
                          <div key={index} className="tag-item">
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeKeyword(index)}
                              className="remove-tag"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Journal, Publisher, Year, and DOI */}
                  <div className="multi-input-section">
                    <div className="form-group">
                      <label className="form-label">
                        Journal <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={journal}
                        onChange={(e) => setJournal(e.target.value)}
                        className="form-input"
                        placeholder="e.g., IEEE Transactions on Neural Networks"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Publisher</label>
                      <input
                        type="text"
                        value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                        className="form-input"
                        placeholder="e.g., IEEE, ACM, Springer"
                      />
                    </div>
                  </div>

                  <div className="multi-input-section">
                    <div className="form-group">
                      <label className="form-label">
                        Year <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="form-input"
                        placeholder="2025"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">DOI</label>
                      <input
                        type="text"
                        value={doi}
                        onChange={(e) => setDoi(e.target.value)}
                        className="form-input"
                        placeholder="e.g., 10.1000/182 (leave blank to auto-generate)"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={closeUploadModal}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !selectedFile || !title || !journal || authorsList.length === 0 || keywordsList.length === 0 || selectedSDGs.length === 0}
                      className="upload-button"
                    >
                      {uploading ? 'Uploading...' : 'Upload Paper'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && selectedPaper && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h2>Edit Research Paper</h2>
                  <button className="close-button" onClick={closeEditModal}>×</button>
                </div>
                
                <form onSubmit={handleUpdate} className="upload-form">
                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label">
                      Title <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                      placeholder="Enter paper title"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="form-textarea"
                      placeholder="Enter paper description or abstract"
                      rows={4}
                    />
                  </div>

                  {/* SDG Selection */}
                  <div className="sdg-section">
                    <label className="form-label">
                      Sustainable Development Goals (SDGs) <span className="required">*</span>
                    </label>
                    <div className="form-label" style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                      Hold Ctrl (Windows) or Command (Mac) to select multiple SDGs
                    </div>
                    <div className="sdg-grid">
                      {sdgOptions.map((sdg) => (
                        <div
                          key={sdg.id}
                          className={`sdg-item ${selectedSDGs.includes(sdg.id) ? 'selected' : ''}`}
                          onClick={() => handleSDGChange(sdg.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSDGs.includes(sdg.id)}
                            onChange={() => {}} // Handled by onClick
                            className="sdg-checkbox"
                          />
                          <span className="sdg-text">{sdg.id}: {sdg.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Authors and Keywords */}
                  <div className="multi-input-section">
                    <div className="dynamic-input-group">
                      <label className="form-label">
                        Authors <span className="required">*</span>
                      </label>
                      <div className="input-with-button">
                        <input
                          type="text"
                          value={currentAuthor}
                          onChange={(e) => setCurrentAuthor(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                          className="form-input"
                          placeholder="Author name"
                        />
                        <button
                          type="button"
                          onClick={addAuthor}
                          className="add-button"
                        >
                          + Add Author
                        </button>
                      </div>
                      <div className="tag-list">
                        {authorsList.map((author, index) => (
                          <div key={index} className="tag-item">
                            {author}
                            <button
                              type="button"
                              onClick={() => removeAuthor(index)}
                              className="remove-tag"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="dynamic-input-group">
                      <label className="form-label">
                        Keywords <span className="required">*</span>
                      </label>
                      <div className="input-with-button">
                        <input
                          type="text"
                          value={currentKeyword}
                          onChange={(e) => setCurrentKeyword(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                          className="form-input"
                          placeholder="Keyword"
                        />
                        <button
                          type="button"
                          onClick={addKeyword}
                          className="add-button"
                        >
                          + Add Keyword
                        </button>
                      </div>
                      <div className="tag-list">
                        {keywordsList.map((keyword, index) => (
                          <div key={index} className="tag-item">
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeKeyword(index)}
                              className="remove-tag"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Journal, Publisher, Year, and DOI */}
                  <div className="multi-input-section">
                    <div className="form-group">
                      <label className="form-label">
                        Journal <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={journal}
                        onChange={(e) => setJournal(e.target.value)}
                        className="form-input"
                        placeholder="e.g., IEEE Transactions on Neural Networks"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Publisher</label>
                      <input
                        type="text"
                        value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                        className="form-input"
                        placeholder="e.g., IEEE, ACM, Springer"
                      />
                    </div>
                  </div>

                  <div className="multi-input-section">
                    <div className="form-group">
                      <label className="form-label">
                        Year <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="form-input"
                        placeholder="2025"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">DOI</label>
                      <input
                        type="text"
                        value={doi}
                        onChange={(e) => setDoi(e.target.value)}
                        className="form-input"
                        placeholder="e.g., 10.1000/182"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !title || !journal || authorsList.length === 0 || keywordsList.length === 0 || selectedSDGs.length === 0}
                      className="upload-button"
                    >
                      {uploading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagePapers;
