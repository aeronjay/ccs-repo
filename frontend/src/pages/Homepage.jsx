import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { paperService } from '../services/service';
import PaperDetailModal from '../components/PaperDetailModal';
import { 
  FiBarChart2, 
  FiUsers, 
  FiClock, 
  FiFileText, 
  FiMessageSquare, 
  FiSettings,
  FiLogOut,
  FiUser,
  FiThumbsUp,
  FiMessageCircle,
  FiActivity,
  FiX
} from 'react-icons/fi';
import '../../styles/Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Date');
  const [user, setUser] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sdgs: [],
    yearRange: { min: '', max: '' },
    publisher: '',
    journal: '',
    minImpact: '',
    minClarity: ''
  });
  const filtersRef = useRef(null);

  // Check if user is logged in when component mounts
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const parsedUser = JSON.parse(loggedInUser);
      setUser(parsedUser);
      
      // Redirect admin users to admin dashboard
      if (parsedUser.role === 'admin') {
        navigate('/admin/dashboard');
        return;
      }
    }
    loadPapers();
  }, [navigate]);

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
  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFilters(false);
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
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSDGToggle = (sdg) => {
    setFilters(prev => ({
      ...prev,
      sdgs: prev.sdgs.includes(sdg) 
        ? prev.sdgs.filter(s => s !== sdg)
        : [...prev.sdgs, sdg]
    }));
  };

  const clearFilters = () => {
    setFilters({
      sdgs: [],
      yearRange: { min: '', max: '' },
      publisher: '',
      journal: '',
      minImpact: '',
      minClarity: ''
    });
  };
  const getAvailableSDGs = () => {
    const allSDGs = new Set();
    papers.forEach(paper => {
      if (paper.sdgs) {
        paper.sdgs.forEach(sdg => allSDGs.add(sdg));
      }
    });
    
    // Add common SDGs even if not in papers yet
    const commonSDGs = [
      'SDG 1: No Poverty',
      'SDG 2: Zero Hunger',
      'SDG 3: Good Health and Well-being',
      'SDG 4: Quality Education',
      'SDG 5: Gender Equality',
      'SDG 6: Clean Water and Sanitation',
      'SDG 7: Affordable and Clean Energy',
      'SDG 8: Decent Work and Economic Growth',
      'SDG 9: Industry, Innovation and Infrastructure',
      'SDG 10: Reduced Inequality',
      'SDG 11: Sustainable Cities and Communities',
      'SDG 12: Responsible Consumption and Production',
      'SDG 13: Climate Action',
      'SDG 14: Life Below Water',
      'SDG 15: Life on Land',
      'SDG 16: Peace and Justice Strong Institutions',
      'SDG 17: Partnerships to achieve the Goal'
    ];
    
    commonSDGs.forEach(sdg => allSDGs.add(sdg));
    return Array.from(allSDGs).sort();
  };

  const getAvailablePublishers = () => {
    const publishers = new Set();
    papers.forEach(paper => {
      if (paper.publisher) {
        publishers.add(paper.publisher);
      }
    });
    return Array.from(publishers).sort();
  };

  const getAvailableJournals = () => {
    const journals = new Set();
    papers.forEach(paper => {
      if (paper.journal) {
        journals.add(paper.journal);
      }
    });
    return Array.from(journals).sort();
  };

  const handlePaperTitleClick = (paperId) => {
    setSelectedPaperId(paperId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPaperId(null);
  };
  const filteredPapers = papers.filter(paper => {
    // Text search
    const matchesSearch = searchQuery === '' || 
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      paper.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // SDG filter
    if (filters.sdgs.length > 0) {
      const paperSDGs = paper.sdgs || [];
      const hasMatchingSDG = filters.sdgs.some(sdg => paperSDGs.includes(sdg));
      if (!hasMatchingSDG) return false;
    }

    // Year range filter
    if (filters.yearRange.min && parseInt(paper.year) < parseInt(filters.yearRange.min)) {
      return false;
    }
    if (filters.yearRange.max && parseInt(paper.year) > parseInt(filters.yearRange.max)) {
      return false;
    }

    // Publisher filter
    if (filters.publisher && paper.publisher !== filters.publisher) {
      return false;
    }

    // Journal filter
    if (filters.journal && paper.journal !== filters.journal) {
      return false;
    }

    // Impact rating filter
    if (filters.minImpact && parseFloat(paper.impact) < parseFloat(filters.minImpact)) {
      return false;
    }

    // Clarity rating filter
    if (filters.minClarity && parseFloat(paper.clarity) < parseFloat(filters.minClarity)) {
      return false;
    }

    return true;
  });

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
    const hasHalfStar = rating % 1 >= 0.5; // Use >= 0.5 to show half star
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled" aria-hidden="true">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half" aria-hidden="true">★</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty" aria-hidden="true">☆</span>);
    }
    
    // Add a visually hidden span for screen readers
    stars.push(
      <span key="screen-reader" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: '0' }}>
        {rating} out of 5 stars
      </span>
    );
    
    return stars;
  };

  return (
    <div className="homepage">      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <h1>CCS Research</h1>
          </div>
          <div className="header-actions">
            {user ? (
              <div className="nav-links">
                {user.role === 'user' ? (
                  <>
                    <button 
                      className="nav-link" 
                      onClick={() => navigate('/manage-papers')}
                    >
                      <FiFileText size={16} /> My Papers
                    </button>
                    <button 
                      className="nav-link" 
                      onClick={() => navigate('/settings')}
                    >
                      <FiSettings size={16} /> Settings
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="nav-link" 
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      <FiBarChart2 size={16} /> Dashboard
                    </button>
                    <button 
                      className="nav-link" 
                      onClick={() => navigate('/admin/pending-approvals')}
                    >
                      <FiClock size={16} /> Approvals
                    </button>
                    <button 
                      className="nav-link" 
                      onClick={() => navigate('/admin/manage-papers')}
                    >
                      <FiFileText size={16} /> Papers
                    </button>
                    <button 
                      className="nav-link" 
                      onClick={() => navigate('/admin/manage-users')}
                    >
                      <FiUsers size={16} /> Users
                    </button>
                    <button 
                      className="nav-link" 
                      onClick={() => navigate('/admin/messages')}
                    >
                      <FiMessageSquare size={16} /> Messages
                    </button>
                    <button 
                      className="nav-link" 
                      onClick={() => navigate('/admin/settings')}
                    >
                      <FiSettings size={16} /> Settings
                    </button>
                  </>
                )}
                <div className="user-info-nav">
                  <span className="user-email-display"><FiUser size={16} /> {user.email}</span>
                  <button 
                    className="logout-nav-btn" 
                    onClick={handleLogout}
                  >
                    <FiLogOut size={16} /> Logout
                  </button>
                </div>
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
            <h2><FiFileText size={24} /> CCS Research Repository</h2>
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
                <button className="search-btn"><FiFileText size={16} /> Search</button>
              </div>              <div className="filters">
                <div className="filter-dropdown-container" ref={filtersRef}>
                  <button 
                    className={`filter-btn ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FiSettings size={16} /> Filters {(filters.sdgs.length > 0 || filters.publisher || filters.journal || filters.yearRange.min || filters.yearRange.max || filters.minImpact || filters.minClarity) && <span className="filter-count">({filters.sdgs.length + (filters.publisher ? 1 : 0) + (filters.journal ? 1 : 0) + (filters.yearRange.min ? 1 : 0) + (filters.yearRange.max ? 1 : 0) + (filters.minImpact ? 1 : 0) + (filters.minClarity ? 1 : 0)})</span>}
                  </button>
                  
                  {showFilters && (
                    <div className="filter-dropdown">
                      <div className="filter-section">
                        <h4>Sustainable Development Goals (SDGs)</h4>
                        <div className="sdg-filter-grid">
                          {getAvailableSDGs().map(sdg => (
                            <label key={sdg} className="sdg-checkbox">
                              <input
                                type="checkbox"
                                checked={filters.sdgs.includes(sdg)}
                                onChange={() => handleSDGToggle(sdg)}
                              />
                              <span>{sdg}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="filter-section">
                        <h4>Year Range</h4>
                        <div className="year-range-inputs">
                          <input
                            type="number"
                            placeholder="From"
                            value={filters.yearRange.min}
                            onChange={(e) => handleFilterChange('yearRange', { ...filters.yearRange, min: e.target.value })}
                            className="year-input"
                          />
                          <span>to</span>
                          <input
                            type="number"
                            placeholder="To"
                            value={filters.yearRange.max}
                            onChange={(e) => handleFilterChange('yearRange', { ...filters.yearRange, max: e.target.value })}
                            className="year-input"
                          />
                        </div>
                      </div>

                      <div className="filter-section">
                        <h4>Publisher</h4>
                        <select
                          value={filters.publisher}
                          onChange={(e) => handleFilterChange('publisher', e.target.value)}
                          className="filter-select"
                        >
                          <option value="">All Publishers</option>
                          {getAvailablePublishers().map(publisher => (
                            <option key={publisher} value={publisher}>{publisher}</option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-section">
                        <h4>Journal</h4>
                        <select
                          value={filters.journal}
                          onChange={(e) => handleFilterChange('journal', e.target.value)}
                          className="filter-select"
                        >
                          <option value="">All Journals</option>
                          {getAvailableJournals().map(journal => (
                            <option key={journal} value={journal}>{journal}</option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-section">
                        <h4>Minimum Impact Rating</h4>
                        <select
                          value={filters.minImpact}
                          onChange={(e) => handleFilterChange('minImpact', e.target.value)}
                          className="filter-select"
                        >
                          <option value="">Any Rating</option>
                          <option value="1">1+ Stars</option>
                          <option value="2">2+ Stars</option>
                          <option value="3">3+ Stars</option>
                          <option value="4">4+ Stars</option>
                          <option value="5">5 Stars</option>
                        </select>
                      </div>

                      <div className="filter-section">
                        <h4>Minimum Clarity Rating</h4>
                        <select
                          value={filters.minClarity}
                          onChange={(e) => handleFilterChange('minClarity', e.target.value)}
                          className="filter-select"
                        >
                          <option value="">Any Rating</option>
                          <option value="1">1+ Stars</option>
                          <option value="2">2+ Stars</option>
                          <option value="3">3+ Stars</option>
                          <option value="4">4+ Stars</option>
                          <option value="5">5 Stars</option>
                        </select>
                      </div>

                      <div className="filter-actions">
                        <button onClick={clearFilters} className="clear-filters-btn">
                          <FiX size={16} /> Clear All Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  className="filter-btn"
                  onClick={loadPapers}
                  disabled={loading}
                  style={{ marginLeft: '10px' }}
                >
                  {loading ? <FiActivity size={16} /> : <FiActivity size={16} />} Refresh
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

          {/* Active Filters Display */}
          {(filters.sdgs.length > 0 || filters.publisher || filters.journal || filters.yearRange.min || filters.yearRange.max || filters.minImpact || filters.minClarity) && (
            <div className="active-filters">
              <div className="active-filters-header">
                <span>Active Filters:</span>
                <button onClick={clearFilters} className="clear-all-btn"><FiX size={14} /> Clear All</button>
              </div>
              <div className="active-filters-list">
                {filters.sdgs.map(sdg => (
                  <span key={sdg} className="active-filter">
                    {sdg}
                    <button onClick={() => handleSDGToggle(sdg)} className="remove-filter">×</button>
                  </span>
                ))}
                {filters.publisher && (
                  <span className="active-filter">
                    Publisher: {filters.publisher}
                    <button onClick={() => handleFilterChange('publisher', '')} className="remove-filter">×</button>
                  </span>
                )}
                {filters.journal && (
                  <span className="active-filter">
                    Journal: {filters.journal}
                    <button onClick={() => handleFilterChange('journal', '')} className="remove-filter">×</button>
                  </span>
                )}
                {(filters.yearRange.min || filters.yearRange.max) && (
                  <span className="active-filter">
                    Year: {filters.yearRange.min || '*'} - {filters.yearRange.max || '*'}
                    <button onClick={() => handleFilterChange('yearRange', { min: '', max: '' })} className="remove-filter">×</button>
                  </span>
                )}
                {filters.minImpact && (
                  <span className="active-filter">
                    Min Impact: {filters.minImpact}+
                    <button onClick={() => handleFilterChange('minImpact', '')} className="remove-filter">×</button>
                  </span>
                )}
                {filters.minClarity && (
                  <span className="active-filter">
                    Min Clarity: {filters.minClarity}+
                    <button onClick={() => handleFilterChange('minClarity', '')} className="remove-filter">×</button>
                  </span>
                )}
              </div>
            </div>
          )}

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
          </div>
          
          {/* Papers List */}
          <div className="papers-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
                Loading papers...
              </div>
            ) : sortedPapers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
                {papers.length === 0 ? 'No papers available yet.' : 'No papers match your search criteria.'}
              </div>
            ) : sortedPapers.map(paper => (
              <div key={paper.id} className="paper-card">
                <div className="paper-content">
                  <h3 
                    className="paper-title" 
                    onClick={() => handlePaperTitleClick(paper.id)}
                  >
                    {paper.title}
                  </h3>
                  
                  <div className="paper-meta">
                    <span className="journal">{paper.journal}</span>
                    <span className="year">• {paper.year}</span>
                    <span className="doi">• {paper.doi}</span>
                  </div>

                  <div className="authors">
                    {paper.authors && paper.authors.map((author, index) => (
                      <span key={index} className="author">
                        <FiUser size={14} /> {author}
                      </span>
                    ))}
                  </div>

                  <p className="abstract">{paper.abstract}</p>
                  
                  <div className="tags">
                    {paper.tags && paper.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>

                  {paper.sdgs && paper.sdgs.length > 0 && (
                    <div className="sdgs">
                      <span className="sdgs-label">SDGs:</span>
                      {paper.sdgs.map((sdg, index) => (
                        <span key={index} className="sdg-tag">{sdg}</span>
                      ))}
                    </div>
                  )}

                  <div className="paper-stats">
                    <div className="stats-left">
                      <span className="likes"><FiThumbsUp size={16} /> {paper.likes}</span>
                      <span className="comments"><FiMessageCircle size={16} /> {paper.comments}</span>
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
            ))}
          </div>
        </div>
      </main>

      {/* Paper Detail Modal */}
      <PaperDetailModal
        paperId={selectedPaperId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={user}
      />
    </div>
  );
};

export default Homepage;
