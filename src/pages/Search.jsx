// src/pages/Search.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiTrendingUp, FiClock, FiExternalLink, FiX, FiFilter, FiLock, FiUnlock, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    chain: 'all',
    time: 'all'
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      setSearchHistory(saved);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      return;
    }
    setLoading(true);
    setError('');
    setResults([]); // Clear previous results immediately

    try {
      // Add to history
      const newHistory = [query, ...searchHistory.filter((q) => q !== query)].slice(0, 10)];
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      // Simulate Search (Using CoinGecko for demo reliability)
      const response = await fetch('https://api.coingecko.com/api/v3/search?query=' + query);
      const data = await response.json();

      if (data.coins && data.coins.length > 0) {
        const formattedResults = data.coins.map((coin) => {
          return {
            id: coin.id,
            title: coin.name,
            symbol: coin.symbol.toUpperCase(),
            url: 'https://www.coingecko.com/en/coins/' + coin.id,
            description: 'Market cap: $' + (coin.market_cap_rank ? coin.market_cap_rank.toLocaleString() : 'N/A') + '. Price: $' + (coin.current_price ? coin.current_price.toFixed(2) : 'N/A'),
            type: 'market',
            timestamp: new Date().toISOString()
          };
        });
        setResults(formattedResults);
      } else {
        setError('No results found.');
      }
    } catch (err) {
      console.error("Search Error:", err);
      setError('Failed to fetch search results. Please check connection.');
      setResults([]); // Ensure results are cleared on error
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

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
          <h1 className="page-title">
            <FiSearch />
            Search
          </h1>
          <button 
            className={`icon-btn ${showFilters ? 'active' : ''}`} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            Filters
          </button>
          {searchHistory.length > 0 && (
            <button 
              className="icon-btn" 
              onClick={clearHistory}
            >
              <FiX />
              Clear History
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
            placeholder="Search tokens, NFTs, or DApps..."
            className="search-input"
            disabled={loading}
          />
          <button 
            onClick={handleSearch}
            className="search-submit"
            disabled={!query.trim() || loading}
          >
            {loading ? <FiRefreshCw className="spin" /> : <FiTrendingUp />}
          </button>
        </div>

        {/* Filters Panel */}
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
                  className="filter-select"
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
                  className="filter-select"
                >
                  <option value="all">Any Time</option>
                  <option value="day">Past 24 Hours</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>
              
              <button 
                onClick={() => setShowFilters(false)}
                className="apply-btn"
              >
                Apply Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results */}
        {error && (
          <div className="error-message">
            <FiLock />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {results.length > 0 && !loading && (
            <div className="results-list">
              <div className="results-header">
                <h3>Results ({results.length})</h3>
              </div>
              {results.map((result, index) => (
                <motion.a
                  key={result.id}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="result-item"
                >
                  <div className="result-header">
                    <h4 className="result-title">
                      <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        {result.title}
                      </a>
                    </h4>
                    <span className="result-type">{result.type}</span>
                  </div>
                  
                  <div className="result-url">
                    <FiExternalLink size={12} />
                    <span className="result-url-text">{result.url.replace(/^https?:\/\//, '')}</span>
                  </div>
                  
                  <p className="result-description">{result.description}</p>
                  
                  <div className="result-footer">
                    <span className="result-time">
                      <FiClock size={12} />
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Search;
