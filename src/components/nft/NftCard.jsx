// src/components/nft/NftCard.jsx
import React from 'react';

const NftCard = ({ nft, onClick, onBuyClick }) => {
  const isAuction = nft.status === 'auction';
  
  return (
    <div className="nft-card" onClick={onClick}>
      <div className="card-media">
        <img src={nft.imageUrl} alt={nft.name} />
        {isAuction && <div className="auction-badge">Auction</div>}
      </div>
      <div className="card-content">
        <h3 className="nft-name">{nft.name}</h3>
        <p className="nft-collection">{nft.collectionName}</p>
        <div className="card-footer">
          <div className="price-info">
            <span className="price-label">{isAuction ? 'Current Bid' : 'Price'}</span>
            <span className="price-value">{nft.price} {nft.currency}</span>
          </div>
          <button
            className="button-primary button-small"
            onClick={(e) => {
              e.stopPropagation(); // Prevents card click
              onBuyClick();
            }}
          >
            {isAuction ? 'Place Bid' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NftCard;
