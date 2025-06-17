import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Date');
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Check if user is logged in when component mounts
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

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
        break;
    }
  };

  // Mock data for papers - you'll replace this with actual API calls
  const papers = [
    {
      id: 1,
      title: "Advances in Neural Network Architectures for Natural Language Processing",
      journal: "IEEE Transactions on Neural Networks",
      year: "2023",
      doi: "DOI link",
      authors: ["Sarah Chen", "Michael Rodriguez"],
      abstract: "This paper presents novel neural network architectures designed specifically for natural language processing tasks. We introduce a hybrid model that combines transformer mechanisms with recurrent neural networks to achieve state-of-the-art performance on multiple benchmarks while reducing computational requirements.",
      tags: ["neural networks", "NLP", "transformer", "RNN", "deep learning"],
      impact: 4.5,
      clarity: 4.2,
      likes: 147,
      comments: 1
    },
    {
      id: 2,
      title: "Machine Learning Approaches for Early Detection of Neurodegenerative Diseases",
      journal: "Biomedical AI Research",
      year: "2023",
      doi: "DOI link",
      authors: ["James Lee", "Sophia Wang", "Robert Taylor"],
      abstract: "This paper evaluates various machine learning approaches for the early detection of neurodegenerative diseases using multimodal biomarkers. We demonstrate that ensemble methods combining imaging data with genetic markers achieve significantly higher accuracy and earlier detection compared to traditional diagnostic methods.",
      tags: ["machine learning", "healthcare", "neurodegenerative", "early detection"],
      impact: 4.8,
      clarity: 4.6,
      likes: 156,
      comments: 2
    },
    {
      id: 3,
      title: "Quantum Computing Applications in Cryptography: A Systematic Review",
      journal: "Journal of Cryptographic Research",
      year: "2022",
      doi: "DOI link",
      authors: ["Dr. Alice Johnson", "Prof. David Kim"],
      abstract: "This systematic review examines the current state and future prospects of quantum computing applications in cryptography. We analyze various quantum algorithms and their implications for current cryptographic standards.",
      tags: ["quantum computing", "cryptography", "security", "algorithms"],
      impact: 4.3,
      clarity: 4.1,
      likes: 89,
      comments: 0
    }
  ];

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
          </div>

          {/* Search and Filters */}
          <div className="search-section">
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search by title, abstract..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button className="search-btn">Search</button>
              </div>
              <div className="filters">
                <button className="filter-btn">🔽 Filters</button>
              </div>
            </div>
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
          </div>

          {/* Papers List */}
          <div className="papers-list">
            {sortedPapers.map(paper => (
              <div key={paper.id} className="paper-card">
                <div className="paper-content">
                  <h3 className="paper-title">{paper.title}</h3>
                  
                  <div className="paper-meta">
                    <span className="journal">{paper.journal}</span>
                    <span className="year">• {paper.year}</span>
                    <span className="doi">• {paper.doi}</span>
                  </div>

                  <div className="authors">
                    {paper.authors.map((author, index) => (
                      <span key={index} className="author">
                        👤 {author}
                      </span>
                    ))}
                  </div>

                  <p className="abstract">{paper.abstract}</p>

                  <div className="tags">
                    {paper.tags.map((tag, index) => (
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
                        {renderStarRating(paper.impact)}
                      </div>
                      <div className="rating">
                        <span>Clarity: </span>
                        {renderStarRating(paper.clarity)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homepage;
