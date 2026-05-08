import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiTrendingUp, FiClock, FiExternalLink, FiX, FiFilter, FiLock, FiUnlock, FiRefreshCw } from 'react-icons/fi';

// Use the same Backend URL configuration
const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    type: 'all',
    chain: 'all',
    time: 'all'
  });

  // Load history on mount
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
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Add to history (deduplicated)
      const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10)];
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      // Search Backend (if you have a search endpoint) OR External APIs
      // For this demo, we simulate a real search by fetching Market Data
      
      // 1. Try Backend Search (Mock endpoint for example)
      // const searchRes = await axios.get(`${BACKEND_URL}/search?q=${query}`);
      
      // 2. Fallback to CoinGecko for "Coins"
      const coinRes = await axios.get(`https://api.coingecko.com/api/v3/search?query=${query}`);
      const coins = coinRes.data.coins || [];

      // 3. Map to result format
      const formattedResults = coins.map(coin => ({
        id: coin.id,
        title: coin.name,
        symbol: coin.symbol.toUpperCase(),
        url: `https://www.coingecko.com/en/coins/${coin.id}`,
        description: `Market cap: $${coin.market_cap_rank ? coin.market_cap_rank.toLocaleString() : 'N/A'}. Price: $${coin.current_price ? coin.current_price.toFixed(2) : 'N/A'}.`,
        type: 'market',
        timestamp: new Date().toISOString()
      }));

      setResults(formattedResults);

    } catch (err) {
      console.error("Search Error:", err);
      setError("Failed to fetch search results. Please check connection.");
      
      // Fallback to mock results if API fails
      setResults([
        {
          id: 'fallback-1',
          title: `${query} - Wikipedia`,
          url: `https://en.wikipedia.org/wiki/${query}`,
          description: `Information about ${query}.`,
          type: 'wiki',
          timestamp: new Date().toISOString()
        },
        {
          id: 'fallback-2',
          title: `${query} - Google`,
          url: `https://www.google.com/search?q=${query}`,
          description: `Google search for ${query}.`,
          type: 'web',
          timestamp: new Date().toISOString()
        }
      ]);
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
            className="icon-btn"
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
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search tokens, NFTs, or DApps..."
            className="search-input"
            disabled={loading}
          />
          <button 
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="search-submit"
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
                <label>Category</label>
                <select 
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Assets</option>
                  <option value="token">Tokens</option>
                  <option value="nft">NFTs</option>
                  <option value="dapp">DApps</option>
                  <option value="news">News</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Network</label>
                <select 
                  value={filters.chain}
                  onChange={(e) => setFilters({...filters, chain: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Chains</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="bsc">BSC</option>
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

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <FiLock />
            {error}
          </div>
        )}

        {/* Search Results */}
        <AnimatePresence mode="wait">
          {results.length > 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="results-list"
            >
              <div className="results-header">
                <h3>Results ({results.length})</h3>
                <span className="search-meta">
                  {filters.type !== 'all' ? filters.type : 'Global'} • {filters.chain !== 'all' ? filters.chain : 'All Networks'}
                </span>
              </div>
              
              {results.map((result, index) => (
                <motion.a
                  key={result.id}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="result-item"
                >
                  <div className="result-header">
                    <h4 className="result-title">
                      {result.title}
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
                      {new Date(result.timestamp).toLocaleDateString()}
                    </span>
                    <button className="save-btn">Save</button>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Search;
