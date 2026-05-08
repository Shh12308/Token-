// src/pages/SearchPage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiTrendingUp } from 'react-icons/fi';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // MOCK DATA (Instant Fix)
  // Using mock data prevents the network error entirely
  const mockResults = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      price: 65000,
      change: '2.5%',
      image: 'https://assets.coingecko.com/coins/bitcoin/large.jpg'
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      price: 3500,
      change: '1.2%',
      image: 'https://assets.coingecko.com/coins/ethereum/large.jpg'
    },
    {
      id: 'uniswap',
      name: 'Uniswap',
      symbol: 'UNI',
      price: '8.50',
      change: '-0.4%',
      image: 'https://assets.coingecko.com/coins/uniswap/large.jpg'
    },
    {
      id: 'usd-coin',
      name: 'USD Coin',
      symbol: 'USDC',
      price: '1.00',
      change: '0.0%',
      image: 'https://assets.coingecko.com/coins/usdt/large.jpg'
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const searchVal = query.toLowerCase().trim();
    
    if (!searchVal) return;

    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      // Filter mock results based on query
      const filtered = mockResults.filter(item => 
        item.name.toLowerCase().includes(searchVal) || 
        item.symbol.toLowerCase().includes(searchVal)
      );
      setResults(filtered);
      setLoading(false);
    }, 500); // 500ms simulated delay
  };

  return (
    <div className="search-page" style={styles.searchPage}>
      {/* Header */}
      <div className="search-header">
        <h1 className="page-title">Search</h1>
        <div className="search-bar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search CryptoBean..."
            className="search-input"
          />
          <button onClick={() => {}} className="search-btn">
            <FiSearch />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="search-filters">
        <button className={`filter-btn ${query === '' ? 'active' : ''}`}>All</button>
        <button className="filter-btn">Tokens</button>
        <button className="filter-btn">NFTs</button>
        <button className="filter-btn">DApps</button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {/* Results */}
      <div className="results-grid">
        {results.map((coin) => (
          <motion.div
            key={coin.id}
            className="result-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="coin-icon">
              <img src={coin.image} alt={coin.name} />
            </div>
            <div className="coin-info">
              <h3>{coin.name}</h3>
              <p className="price">{coin.price.toLocaleString()}</p>
              <p className="change" style={{ color: coin.change >= 0 ? 'green' : 'red' }}>
                {coin.change >= 0 ? '+' : ''}
                {Math.abs(coin.change)}%
              </p>
              <span className="symbol">{coin.symbol}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {!loading && results.length === 0 && query !== '' && (
        <div className="empty-state">
          <p>No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;

// Simple Inline Styles for the Mock Page (Add to your GlobalStyles or a <style> tag)
const styles = {
  searchPage: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#111',
    color: '#fff'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#222',
    marginBottom: '10px'
  },
  searchHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '30px',
    width: '100%',
    maxWidth: '600px'
  },
  searchInput: {
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #333',
    width: '100%',
    maxWidth: '500px',
    outline: 'none',
    transition: 'all 0.2s'
  },
  searchBtn: {
    background: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: 'insertedStyles.fontSize',
    fontWeight: '600',
    cursor: 'pointer'
  },
  resultCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  coinIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden'
  },
  coinInfo: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  price: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  symbol: {
    padding: '2px 8px',
    background: '#f0f0f0',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  change: {
    fontSize: '14px'
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px',
    width: '100%'
  },
  emptyState: {
    color: '#888',
    padding: '20px'
  }
};
