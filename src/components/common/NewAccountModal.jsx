import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addWallet } from '../../store/wallet/walletSlice';

const NewAccountModal = ({ isOpen, onClose }) => {
  const [walletName, setWalletName] = useState('New Wallet');
  const dispatch = useDispatch();

  const handleCreate = () => {
    const newWallet = {
      id: `wallet-${crypto.randomUUID()}`,
      name: walletName,
      address: `0x${Math.random().toString(16).slice(2, 10)}...`, // Mock address
      createdAt: new Date().toISOString(),
      balances: { ethereum: {}, polygon: {}, bsc: {} }, // Start with empty balances
    };
    dispatch(addWallet(newWallet));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal new-account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Wallet</h3>
          <button className="close-button" onClick={onClose}>X</button>
        </div>
        <div className="modal-body">
          <label>Wallet Name</label>
          <input
            type="text"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            className="full-width-input"
          />
        </div>
        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose}>Cancel</button>
          <button className="button-primary" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
};

export default NewAccountModal;
