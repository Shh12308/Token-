import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiTrendingUp, FiClock, FiExternalLink, FiX, FiFilter, FiLock, FiUnlock, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const SearchPage = () => {
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

  const handleSearch = async (e) => {
    if (!query.trim()) {
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Add to history (deduplicated)
      const newHistory = [query, ...searchHistory.filter((q) => q !== query)].slice(0, 10)];
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      // Simulate search with CoinGecko if Backend fails or for demo
      const response = await axios.get('https://api.coingecko.com/api/v3/search?query=' + query);
      const coins = response.data.coins || [];

      const formattedResults = coins.map((coin) => {
        return {
          id: coin.id,
          title: coin.name,
          symbol: coin.symbol.toUpperCase(),
          url: 'https://www.coingecko.com/en/coins/' + coin.id,
          description: 'Price: $' + (coin.current_price ? coin.current_price.toLocaleString() : 'N/A') + '. Market Cap: ' + (coin.market_cap_rank || 'N/A'),
          type: 'market',
          timestamp: new Date().toISOString()
        };
      });

      setResults(formattedResults);
    } catch (err) {
      console.error('Search Error:', err);
      setError('Failed to fetch search results. Please try again.');
      setResults([]); // Clear results on error
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
              Clear
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
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search web, DApps, or blockchain data..."
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
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
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
                  onChange={(e) => setFilters({ ...filters, time: e.target.value })}
                  className="filter-select"
                >
                  <option value="all">Any Time</option>
                  <option value="day">Past 24 Hours</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results */}
        <AnimatePresence mode="wait">
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="search-results"
            >
              <div className="results-header">
                <h3>Results ({results.length})</h3>
                <span className="search-info">
                  {filters.type} • {filters.time}
                </span>
              </div>
              
              <div className="results-list">
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
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
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
                      <button className="result-action">Save</button>
                    </div>
                  </motion.a>
                ))}
              </div>
          </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SearchPage;
