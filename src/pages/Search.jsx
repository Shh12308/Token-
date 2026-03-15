// Search.js - Advanced Search Page with Google/Tor Integration
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiGlobe, FiShield, FiTrendingUp, FiClock, FiExternalLink,
  FiFilter, FiX, FiChevronDown, FiLock, FiUnlock, FiRefreshCw
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchEngine, setSearchEngine] = useState('google');
  const [isTorEnabled, setIsTorEnabled] = useState(false);
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    time: 'all',
    safe: 'moderate'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Load search history
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
    
    // Load trending searches
    setTrending([
      'Ethereum Merge',
      'DeFi Yield Farming',
      'NFT Marketplace',
      'Web3 Browser',
      'Crypto Staking',
      'DAO Governance',
      'Layer 2 Solutions',
      'Smart Contracts'
    ]);

    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Add to search history
    const newHistory = [searchQuery, ...searchHistory.filter(q => q !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    
    // Simulate search
    setTimeout(() => {
      const mockResults = [
        {
          id: 1,
          title: `${searchQuery} - Wikipedia`,
          url: 'https://en.wikipedia.org/wiki/' + searchQuery,
          description: `Comprehensive information about ${searchQuery} including history, technical details, and current developments.`,
          type: 'wiki',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          title: `Understanding ${searchQuery} - Crypto Academy`,
          url: 'https://crypto.academy/learn/' + searchQuery,
          description: `In-depth guide to ${searchQuery} with expert insights, tutorials, and best practices for cryptocurrency enthusiasts.`,
          type: 'educational',
          timestamp: new Date().toISOString()
        },
        {
          id: 3,
          title: `${searchQuery} Price & Charts - CoinGecko`,
          url: 'https://coingecko.com/en/coins/' + searchQuery,
          description: `Real-time price tracking, market cap, charts, and trading data for ${searchQuery}. Historical performance and predictions.`,
          type: 'market',
          timestamp: new Date().toISOString()
        },
        {
          id: 4,
          title: `${searchQuery} News & Updates - CryptoNews`,
          url: 'https://cryptonews.com/tags/' + searchQuery,
          description: `Latest news, updates, and analysis about ${searchQuery}. Expert opinions and market insights.`,
          type: 'news',
          timestamp: new Date().toISOString()
        },
        {
          id: 5,
          title: `${searchQuery} Community - Reddit`,
          url: 'https://reddit.com/r/' + searchQuery,
          description: `Join the discussion about ${searchQuery}. Community insights, discussions, and user experiences.`,
          type: 'community',
          timestamp: new Date().toISOString()
        }
      ];
      
      setResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const searchEngines = [
    { id: 'google', name: 'Google', icon: '🔍' },
    { id: 'duckduckgo', name: 'DuckDuckGo', icon: '🦆' },
    { id: 'brave', name: 'Brave', icon: '🦁' },
    { id: 'bing', name: 'Bing', icon: '🔷' }
  ];

  return (
    <div className="search-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="search-container"
      >
        {/* Search Header */}
        <div className="search-header">
          <div className="search-controls">
            <div className="engine-selector">
              <select 
                value={searchEngine} 
                onChange={(e) => setSearchEngine(e.target.value)}
                className="engine-select"
              >
                {searchEngines.map(engine => (
                  <option key={engine.id} value={engine.id}>
                    {engine.icon} {engine.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="tor-toggle">
              <button 
                className={`tor-btn ${isTorEnabled ? 'active' : ''}`}
                onClick={() => setIsTorEnabled(!isTorEnabled)}
              >
                {isTorEnabled ? <FiUnlock /> : <FiLock />}
                {isTorEnabled ? 'Tor Active' : 'Enable Tor'}
              </button>
            </div>
            
            <button 
              className={`filter-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter />
              Filters
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search the web, DApps, or blockchain data..."
              className="search-input"
            />
            {isSearching ? (
              <FiRefreshCw className="searching-icon animate-spin" />
            ) : (
              <button 
                onClick={() => handleSearch()}
                className="search-submit"
                disabled={!query.trim()}
              >
                Search
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="filters-panel"
              >
                <div className="filter-group">
                  <label>Content Type</label>
                  <select 
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                  >
                    <option value="all">All Content</option>
                    <option value="web">Web Pages</option>
                    <option value="dapp">DApps</option>
                    <option value="nft">NFTs</option>
                    <option value="defi">DeFi</option>
                    <option value="news">News</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Time Range</label>
                  <select 
                    value={filters.time}
                    onChange={(e) => setFilters({...filters, time: e.target.value})}
                  >
                    <option value="all">Any Time</option>
                    <option value="day">Past 24 Hours</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="year">Past Year</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Safe Search</label>
                  <select 
                    value={filters.safe}
                    onChange={(e) => setFilters({...filters, safe: e.target.value})}
                  >
                    <option value="off">Off</option>
                    <option value="moderate">Moderate</option>
                    <option value="strict">Strict</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="search-results"
          >
            <div className="results-header">
              <h3>Results ({results.length})</h3>
              <span className="search-info">
                {searchEngine} {isTorEnabled && 'via Tor'} • {filters.type} • {filters.time}
              </span>
            </div>
            
            <div className="results-list">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="result-item"
                >
                  <div className="result-header">
                    <h4 className="result-title">
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        {result.title}
                      </a>
                    </h4>
                    <span className="result-type">{result.type}</span>
                  </div>
                  
                  <div className="result-url">
                    <FiExternalLink size={12} />
                    {result.url}
                  </div>
                  
                  <p className="result-description">{result.description}</p>
                  
                  <div className="result-footer">
                    <span className="result-time">
                      <FiClock size={12} />
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                    <button className="result-action">Save</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search History & Trending */}
        {!results.length && (
          <div className="search-suggestions">
            {searchHistory.length > 0 && (
              <div className="history-section">
                <div className="section-header">
                  <h3>Recent Searches</h3>
                  <button onClick={clearHistory} className="clear-btn">
                    <FiX size={14} />
                    Clear
                  </button>
                </div>
                <div className="history-list">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(item);
                        handleSearch(item);
                      }}
                      className="history-item"
                    >
                      <FiClock size={14} />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="trending-section">
              <div className="section-header">
                <h3>
                  <FiTrendingUp />
                  Trending Searches
                </h3>
              </div>
              <div className="trending-list">
                {trending.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                    className="trending-item"
                  >
                    <span className="trending-number">#{index + 1}</span>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Search;
