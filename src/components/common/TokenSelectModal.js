import React, { useState, useMemo } from 'react';
import { useGetMarketsQuery } from '../../app/services/coingeckoApi';

const TokenSelectModal = ({ isOpen, onClose, onSelect }) => {
  const { data: tokens = [], isLoading } = useGetMarketsQuery();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;
    return tokens.filter(token =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tokens, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal token-select-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select a Token</h3>
          <button className="close-button" onClick={onClose}>X</button>
        </div>
        <input
          type="text"
          className="token-search-input"
          placeholder="Search name or paste address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="token-list">
          {isLoading ? <div>Loading...</div> : (
            filteredTokens.map(token => (
              <div key={token.id} className="token-item" onClick={() => { onSelect(token); onClose(); }}>
                <img src={token.image} alt={token.name} className="token-logo" />
                <div className="token-info">
                  <span className="token-name">{token.name}</span>
                  <span className="token-symbol">{token.symbol.toUpperCase()}</span>
                </div>
                <span className="token-price">${token.current_price}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenSelectModal;
