// src/components/nft/PurchaseModal.jsx
import React, { useState } from 'react';

const PurchaseModal = ({ nft, onClose }) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = () => {
    setIsApproving(true);
    // Simulate approval transaction
    setTimeout(() => {
      setIsApproving(false);
      setIsApproved(true);
    }, 2000);
  };

  const handleConfirm = () => {
    setIsConfirming(true);
    // Simulate purchase transaction
    setTimeout(() => {
      setIsConfirming(false);
      alert('Purchase Successful!');
      onClose();
    }, 3000);
  };

  if (!nft) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal purchase-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Complete Purchase</h2>
        <div className="modal-body">
          <div className="item-summary">
            <img src={nft.imageUrl} alt={nft.name} />
            <div>
              <h3>{nft.name}</h3>
              <p>{nft.collectionName}</p>
            </div>
          </div>
          <div className="price-breakdown">
            <div className="row">
              <span>Price</span>
              <span>{nft.price} {nft.currency}</span>
            </div>
            <div className="row">
              <span>Estimated Gas Fee</span>
              <span>~0.005 ETH</span>
            </div>
            <div className="row total">
              <span>Total</span>
              <span>{nft.price} {nft.currency}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {!isApproved ? (
            <button className="button-primary" onClick={handleApprove} disabled={isApproving}>
              {isApproving ? 'Approving...' : 'Approve'}
            </button>
          ) : (
            <button className="button-primary" onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? 'Confirming...' : 'Confirm Purchase'}
            </button>
          )}
          <button className="button-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
