import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paperService } from '../services/service';
import './PaperDetailModal.css';

const PaperDetailModal = ({ paperId, isOpen, onClose, user }) => {
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [downloadPermission, setDownloadPermission] = useState(null);

  useEffect(() => {
    if (isOpen && paperId) {
      loadPaperDetails();
      checkDownloadPermission();
    }
  }, [isOpen, paperId]);

  const loadPaperDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await paperService.getPaperDetails(paperId);
      setPaper(data);
    } catch (error) {
      setError('Failed to load paper details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkDownloadPermission = async () => {
    try {
      const permission = await paperService.checkDownloadPermission(paperId, user?.id);
      setDownloadPermission(permission);
    } catch (error) {
      console.error('Failed to check download permission:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    setInteractionLoading(true);
    try {
      const result = await paperService.likePaper(paperId, user.id);
      setPaper(prev => ({
        ...prev,
        likes: result.likes,
        dislikes: result.dislikes,
        userLikes: [...(prev.userLikes || []), user.id],
        userDislikes: (prev.userDislikes || []).filter(id => id !== user.id)
      }));
    } catch (error) {
      alert(error.message);
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    setInteractionLoading(true);
    try {
      const result = await paperService.dislikePaper(paperId, user.id);
      setPaper(prev => ({
        ...prev,
        likes: result.likes,
        dislikes: result.dislikes,
        userDislikes: [...(prev.userDislikes || []), user.id],
        userLikes: (prev.userLikes || []).filter(id => id !== user.id)
      }));
    } catch (error) {
      alert(error.message);
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const result = await paperService.addComment(paperId, user.id, user.email, newComment.trim());
      setPaper(prev => ({
        ...prev,
        comments: [...(prev.comments || []), result.comment]
      }));
      setNewComment('');
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReply = async (parentCommentId) => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!replyContent.trim()) return;

    setSubmittingComment(true);
    try {
      const result = await paperService.addComment(paperId, user.id, user.email, replyContent.trim(), parentCommentId);
      setPaper(prev => ({
        ...prev,
        comments: [...(prev.comments || []), result.comment]
      }));
      setReplyContent('');
      setReplyToComment(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadPermission?.canDownload) {
      if (!user) {
        navigate('/signin');
      } else {
        alert(downloadPermission?.reason || 'You do not have permission to download this paper');
      }
      return;
    }

    try {
      const response = await paperService.downloadPaper(paperId, user.id);
      
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
      alert('Download failed: ' + error.message);
    }
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }
    
    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMainComments = () => {
    return (paper?.comments || []).filter(comment => !comment.parentCommentId);
  };

  const getReplies = (parentCommentId) => {
    return (paper?.comments || []).filter(comment => comment.parentCommentId === parentCommentId);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="back-button" onClick={onClose}>
            ← Back to search results
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">Loading paper details...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : paper ? (
            <>
              <div className="paper-header">
                <h1 className="paper-title">{paper.title}</h1>
                <div className="paper-meta">
                  <span className="paper-year">📅 {paper.year}</span>
                  <span className="paper-journal">📄 {paper.journal}</span>
                  <span className="paper-doi">🔗 {paper.doi}</span>
                </div>
                <div className="paper-authors">
                  {paper.authors && paper.authors.map((author, index) => (
                    <span key={index} className="author-badge">
                      👤 {author}
                    </span>
                  ))}
                </div>
              </div>

              <div className="paper-abstract">
                <h3>Abstract</h3>
                <p>{paper.description || 'No abstract available.'}</p>
              </div>

              <div className="paper-keywords">
                <h3>Keywords</h3>
                <div className="keywords-list">
                  {paper.tags && paper.tags.map((tag, index) => (
                    <span key={index} className="keyword-tag">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="paper-interactions">
                <div className="interaction-buttons">
                  <button 
                    className={`like-btn ${paper.userLikes?.includes(user?.id) ? 'active' : ''}`}
                    onClick={handleLike}
                    disabled={interactionLoading}
                  >
                    👍 {paper.likes || 0} likes
                  </button>
                  <button 
                    className={`dislike-btn ${paper.userDislikes?.includes(user?.id) ? 'active' : ''}`}
                    onClick={handleDislike}
                    disabled={interactionLoading}
                  >
                    👎 {paper.dislikes || 0}
                  </button>
                  <span className="comments-count">💬 {paper.comments?.length || 0} Comments</span>
                </div>

                <div className="rating-display">
                  <div className="rating-item">
                    <span>Clarity: </span>
                    <div className="stars">{renderStarRating(parseFloat(paper.clarity || 0))}</div>
                  </div>
                  <div className="rating-item">
                    <span>Relevance: </span>
                    <div className="stars">{renderStarRating(parseFloat(paper.impact || 0))}</div>
                  </div>
                </div>

                <button 
                  className="download-btn"
                  onClick={handleDownload}
                  disabled={!downloadPermission}
                >
                  📥 Download PDF
                </button>
                {downloadPermission && !downloadPermission.canDownload && (
                  <p className="download-message">{downloadPermission.reason}</p>
                )}
              </div>

              <div className="comments-section">
                <h3>Comments ({paper.comments?.length || 0})</h3>
                  {user ? (
                  <div className="add-comment">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write your comment..."
                      rows={3}
                    />
                    <button 
                      onClick={handleAddComment}
                      disabled={submittingComment || !newComment.trim()}
                      className="submit-comment-btn"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                ) : (
                  <div className="sign-in-prompt">
                    <p>Please sign in to leave a comment</p>
                    <button onClick={() => navigate('/signin')} className="sign-in-btn">
                      Sign In
                    </button>
                  </div>
                )}

                <div className="comments-list">
                  {getMainComments().map(comment => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">👤 {comment.userEmail}</span>
                        <span className="comment-date">{formatDate(comment.timestamp)}</span>
                      </div>
                      <div className="comment-content">{comment.content}</div>
                      
                      {user && (
                        <button 
                          className="reply-btn"
                          onClick={() => setReplyToComment(comment.id)}
                        >
                          ↩️ Reply
                        </button>
                      )}

                      {replyToComment === comment.id && (
                        <div className="reply-form">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write your reply..."
                            rows={2}
                          />
                          <div className="reply-actions">
                            <button 
                              onClick={() => handleReply(comment.id)}
                              disabled={submittingComment || !replyContent.trim()}
                            >
                              {submittingComment ? 'Posting...' : 'Post Reply'}
                            </button>
                            <button onClick={() => {
                              setReplyToComment(null);
                              setReplyContent('');
                            }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Render replies */}
                      <div className="replies">
                        {getReplies(comment.id).map(reply => (
                          <div key={reply.id} className="reply">
                            <div className="comment-header">
                              <span className="comment-author">👤 {reply.userEmail}</span>
                              <span className="comment-date">{formatDate(reply.timestamp)}</span>
                            </div>
                            <div className="comment-content">{reply.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PaperDetailModal;
