// src/components/nft/NftDetailsModal.jsx
import React from 'react';

const NftDetailsModal = ({ nft, onClose, onPurchaseClick }) => {
  if (!nft) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal nft-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>X</button>
        <div className="modal-body">
          <div className="nft-media-large">
            <img src={nft.imageUrl} alt={nft.name} />
          </div>
          <div className="nft-info">
            <h1>{nft.name}</h1>
            <p className="collection-name">{nft.collectionName}</p>
            <p className="description">{nft.description}</p>
            <div className="properties">
              {nft.properties.map(prop => (
                <div className="property" key={prop.trait_type}>
                  <span className="trait-type">{prop.trait_type}</span>
                  <span className="trait-value">{prop.value}</span>
                </div>
              ))}
            </div>
            <div className="purchase-section">
              <div className="price-info">
                <span className="price-label">{nft.status === 'auction' ? 'Current Bid' : 'Price'}</span>
                <span className="price-value">{nft.price} {nft.currency}</span>
              </div>
              <button className="button-primary button-large" onClick={onPurchaseClick}>
                {nft.status === 'auction' ? 'Place Bid' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NftDetailsModal;
