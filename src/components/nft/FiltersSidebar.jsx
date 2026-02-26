// src/components/nft/FiltersSidebar.jsx
import React from 'react';

const FiltersSidebar = ({ filters, onChange }) => {
  const handleChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="filters-sidebar">
      <h3>Filters</h3>
      
      {/* Status Filter */}
      <div className="filter-group">
        <label>Status</label>
        <select value={filters.status} onChange={(e) => handleChange('status', e.target.value)}>
          <option value="all">All</option>
          <option value="buy_now">Buy Now</option>
          <option value="auction">On Auction</option>
        </select>
      </div>

      {/* Chain Filter */}
      <div className="filter-group">
        <label>Blockchain</label>
        <select value={filters.chain} onChange={(e) => handleChange('chain', e.target.value)}>
          <option value="all">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="solana">Solana</option>
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="filter-group">
        <label>Price Range</label>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => handleChange('priceMin', e.target.value)}
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => handleChange('priceMax', e.target.value)}
          />
        </div>
      </div>
      
      {/* Clear Filters Button */}
      <button className="button-secondary" onClick={() => onChange({
        status: 'all', chain: 'all', category: 'all', priceMin: '', priceMax: ''
      })}>
        Clear All Filters
      </button>
    </div>
  );
};
