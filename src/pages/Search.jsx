import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Simple, Browser-like UI using CSS variables from your GlobalStyles
const Search = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // Stores standard search results
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query || !query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Use DuckDuckGo API (Privacy focused, returns JSON)
      // This is much more reliable than Google Search API which requires proxy setup for JS clients
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1`);
      const data = await response.json();
      
      const formattedResults = (data.RelatedTopics || []).map(item => ({
        id: item.FirstURL || item.Text,
        title: item.Text,
        url: item.FirstURL,
        displayUrl: item.FirstURL,
        description: `Definition: ${item.Text}`,
        favicon: 'https://duckduckgo.com/favicon.ico', // Standard DuckDuckGo icon
      }));

      setResults(formattedResults);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to fetch search results.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>Search</h1>

        {/* Centered Search Bar */}
        <div className="search-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the web..."
            className="search-input"
          />
          <button 
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="search-button"
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Search Results */}
        <div className="results-list">
          {results.map((result, index) => (
            <a 
              key={index}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="result-item"
            >
              <img src={result.favicon} alt="icon" className="result-icon" />
              <div className="result-content">
                <h3 className="result-title">{result.title}</h3>
                <p className="result-url">{result.displayUrl}</p>
                <p className="result-desc">{result.description}</p>
              </div>
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Search;
