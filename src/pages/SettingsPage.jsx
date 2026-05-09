import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectUserProfile,
  selectCustomNetworks,
  updateUserProfile,
  addCustomNetwork,
  deleteCustomNetwork,
} from '../store/slices/walletSlice';
import Sidebar from '../components/common/Sidebar';

// src/api/config.js
export const API_BASE_URL = "https://blockvault-backend-production.up.railway.app/api";

// --- MODALS ---

const AddNetworkModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    rpcUrl: '',
    chainId: '',
    symbol: '',
    explorerUrl: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(addCustomNetwork(formData));
    onClose();
    setFormData({
      name: '',
      rpcUrl: '',
      chainId: '',
      symbol: '',
      explorerUrl: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-network-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>Add Custom Network</h3></div>

        <form id="add-network-form" className="modal-body" onSubmit={handleSubmit}>
          <input required placeholder="Network Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input required placeholder="RPC URL"
            value={formData.rpcUrl}
            onChange={(e) => setFormData({ ...formData, rpcUrl: e.target.value })}
          />
          <input required placeholder="Chain ID"
            value={formData.chainId}
            onChange={(e) => setFormData({ ...formData, chainId: e.target.value })}
          />
          <input placeholder="Symbol"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
          />
          <input placeholder="Explorer URL"
            value={formData.explorerUrl}
            onChange={(e) => setFormData({ ...formData, explorerUrl: e.target.value })}
          />
        </form>

        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="add-network-form" className="button-primary">
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const RevealSeedPhraseModal = ({ isOpen, onClose }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // ⚠️ NEVER replace this with real seed in UI
  const mockSeedPhrase =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal reveal-seed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚠️ Your Secret Recovery Phrase</h3>
        </div>

        <div className="modal-body">
          <p className="warning-text">
            This phrase is the ONLY way to recover your wallet. Do not share it.
          </p>

          <div className="seed-phrase-display">
            {isRevealed ? mockSeedPhrase : '••••••••••••••••••••••••••••••••'}
          </div>

          {!isRevealed && (
            <div className="confirmation-group">
              <input
                type="checkbox"
                id="confirm"
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <label htmlFor="confirm">I understand the risks</label>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose}>Close</button>
          {!isRevealed && (
            <button
              className="button-danger"
              disabled={!confirmed}
              onClick={() => setIsRevealed(true)}
            >
              Reveal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- SECTIONS ---

const ProfileSettings = () => {
  const dispatch = useDispatch();

  // ✅ SAFE DEFAULT
  const userProfile = useSelector(selectUserProfile) || {
    name: '',
    email: ''
  };

  const [formData, setFormData] = useState(userProfile);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile(formData));
    alert('Profile Updated!');
  };

  return (
    <div className="settings-section">
      <h2>Profile Information</h2>

      <form className="settings-form" onSubmit={handleSubmit}>
        <input
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Name"
        />
        <input
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
        />
        <button className="button-primary">Save</button>
      </form>
    </div>
  );
};

const NetworksSettings = () => {
  const dispatch = useDispatch();

  // ✅ CRITICAL FIX
  const customNetworks = useSelector(selectCustomNetworks) || [];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = (chainId) => {
    if (window.confirm('Delete this network?')) {
      dispatch(deleteCustomNetwork(chainId));
    }
  };

  return (
    <div className="settings-section">
      <h2>Networks</h2>

      {customNetworks.length === 0 ? (
        <p>No custom networks added.</p>
      ) : (
        <div className="network-list-settings">
          {customNetworks.map((net) => (
            <div key={net.chainId} className="network-item-settings">
              <div>
                <h3>{net.name}</h3>
                <p>{net.rpcUrl}</p>
              </div>
              <button
                className="button-danger"
                onClick={() => handleDelete(net.chainId)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setIsModalOpen(true)}>+ Add Network</button>

      <AddNetworkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

const SecuritySettings = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="settings-section">
      <h2>Security</h2>

      <button onClick={() => setOpen(true)}>
        Reveal Seed Phrase
      </button>

      <RevealSeedPhraseModal
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main settings-main">
        <h1>Settings</h1>

        <ProfileSettings />
        <NetworksSettings />
        <SecuritySettings />
      </main>
    </div>
  );
};

export default SettingsPage;
