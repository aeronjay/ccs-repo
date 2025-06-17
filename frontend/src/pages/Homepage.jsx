import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { paperService } from '../services/service';
import '../../styles/Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Date');
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const userMenuRef = useRef(null);

  // Check if user is logged in when component mounts
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    loadPapers();
  }, []);

  // Load papers from database
  const loadPapers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await paperService.getPublicPapers();
      setPapers(data);
    } catch (error) {
      setError('Failed to load papers: ' + error.message);
      console.error('Error loading papers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
  };
  const handleUserMenuClick = (action) => {
    setShowUserMenu(false);
    switch (action) {
      case 'manage-papers':
        navigate('/manage-papers');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'admin-manage-papers':
        navigate('/admin/manage-papers');
        break;
      case 'admin-manage-users':
        navigate('/admin/manage-users');
        break;
      case 'admin-messages':
        navigate('/admin/messages');
        break;
      case 'admin-settings':
        navigate('/admin/settings');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;    }
  };

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
    paper.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortBy) {
      case 'Date':
        return parseInt(b.year) - parseInt(a.year);
      case 'Impact':
        return b.impact - a.impact;
      case 'Clarity':
        return b.clarity - a.clarity;
      default:
        return 0;
    }
  });

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

  return (
    <div className="homepage">      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <h1>CCS Research</h1>
          </div>
          <div className="header-actions">            {user ? (
              <div className="user-menu-container" ref={userMenuRef}>
                <button 
                  className="user-icon"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  👤 {user.email}
                </button>{showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <span className="user-email">{user.email}</span>
                      <span className="user-role">{user.role}</span>
                    </div>
                    <div className="dropdown-divider"></div>
                    {user.role === 'user' ? (
                      <>
                        <button onClick={() => handleUserMenuClick('manage-papers')}>
                          � Manage My Papers
                        </button>
                        <button onClick={() => handleUserMenuClick('settings')}>
                          ⚙️ Settings
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleUserMenuClick('admin-manage-papers')}>
                          📄 Manage Papers
                        </button>
                        <button onClick={() => handleUserMenuClick('admin-manage-users')}>
                          👥 Manage Users
                        </button>
                        <button onClick={() => handleUserMenuClick('admin-messages')}>
                          💬 Messages
                        </button>
                        <button onClick={() => handleUserMenuClick('admin-settings')}>
                          ⚙️ Settings
                        </button>
                      </>
                    )}
                    <div className="dropdown-divider"></div>
                    <button onClick={() => handleUserMenuClick('logout')} className="logout-btn">
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                className="sign-in-btn"
                onClick={() => navigate('/signin')}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          {/* Title and Description */}
          <div className="title-section">
            <h2>CCS Research Repository</h2>
            <p>Discover, explore, and engage with the latest computer and communication sciences research.</p>
          </div>          {/* Search and Filters */}
          <div className="search-section">
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search by title, authors, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button className="search-btn">Search</button>
              </div>
              <div className="filters">
                <button className="filter-btn">🔽 Filters</button>
                <button 
                  className="filter-btn"
                  onClick={loadPapers}
                  disabled={loading}
                  style={{ marginLeft: '10px' }}
                >
                  {loading ? '🔄 Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ 
                color: '#d32f2f', 
                backgroundColor: '#ffebee', 
                padding: '10px', 
                borderRadius: '4px', 
                margin: '10px 0',
                border: '1px solid #ffcdd2'
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Results and Sort */}
          <div className="results-header">
            <span className="results-count">{sortedPapers.length} results</span>
            <div className="sort-section">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="Date">Date</option>
                <option value="Impact">Impact</option>
                <option value="Clarity">Clarity</option>
              </select>
            </div>
          </div>          {/* Papers List */}
          <div className="papers-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
                Loading papers...
              </div>
            ) : sortedPapers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
                {papers.length === 0 ? 'No papers available yet.' : 'No papers match your search criteria.'}
              </div>
            ) : (
              sortedPapers.map(paper => (
                <div key={paper.id} className="paper-card">
                  <div className="paper-content">
                    <h3 className="paper-title">{paper.title}</h3>
                    
                    <div className="paper-meta">
                      <span className="journal">{paper.journal}</span>
                      <span className="year">• {paper.year}</span>
                      <span className="doi">• {paper.doi}</span>
                    </div>

                    <div className="authors">
                      {paper.authors && paper.authors.map((author, index) => (
                        <span key={index} className="author">
                          👤 {author}
                        </span>
                      ))}
                    </div>

                    <p className="abstract">{paper.abstract}</p>

                    <div className="tags">
                      {paper.tags && paper.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>

                    <div className="paper-stats">
                      <div className="stats-left">
                        <span className="likes">👍 {paper.likes}</span>
                        <span className="comments">💬 {paper.comments}</span>
                      </div>
                      <div className="stats-right">
                        <div className="rating">
                          <span>Impact: </span>
                          {renderStarRating(parseFloat(paper.impact))}
                        </div>
                        <div className="rating">
                          <span>Clarity: </span>
                          {renderStarRating(parseFloat(paper.clarity))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homepage;
