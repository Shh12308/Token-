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

// --- MODAL COMPONENTS (Nested) ---

const AddNetworkModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '', rpcUrl: '', chainId: '', symbol: '', explorerUrl: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(addCustomNetwork(formData));
    onClose();
    setFormData({ name: '', rpcUrl: '', chainId: '', symbol: '', explorerUrl: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-network-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>Add Custom Network</h3></div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <input placeholder="Network Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <input placeholder="New RPC URL" value={formData.rpcUrl} onChange={(e) => setFormData({...formData, rpcUrl: e.target.value})} required />
          <input placeholder="Chain ID" value={formData.chainId} onChange={(e) => setFormData({...formData, chainId: e.target.value})} required />
          <input placeholder="Currency Symbol" value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value})} />
          <input placeholder="Block Explorer URL (Optional)" value={formData.explorerUrl} onChange={(e) => setFormData({...formData, explorerUrl: e.target.value})} />
        </form>
        <div className="modal-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="add-network-form" className="button-primary">Add</button>
        </div>
      </div>
    </div>
  );
};

const RevealSeedPhraseModal = ({ isOpen, onClose }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const mockSeedPhrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal reveal-seed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚠️ Your Secret Recovery Phrase</h3>
        </div>
        <div className="modal-body">
          <p className="warning-text">
            This phrase is the ONLY way to recover your wallet. Do not share it with anyone!
          </p>
          <div className="seed-phrase-display">
            {isRevealed ? mockSeedPhrase : '........................................'}
          </div>
          {!isRevealed && (
            <div className="confirmation-group">
              <input type="checkbox" id="confirm" onChange={(e) => setConfirmed(e.target.checked)} />
              <label htmlFor="confirm">I understand the risks</label>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="button-secondary" onClick={onClose}>Close</button>
          {!isRevealed && (
            <button className="button-danger" disabled={!confirmed} onClick={() => setIsRevealed(true)}>Reveal</button>
          )}
        </div>
      </div>
    </div>
  );
};


// --- SECTION COMPONENTS (Nested) ---

const ProfileSettings = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector(selectUserProfile);
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
        <div className="form-group">
          <label htmlFor="name">Display Name</label>
          <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </div>
        <button type="submit" className="button-primary">Save Changes</button>
      </form>
    </div>
  );
};

const NetworksSettings = () => {
  const dispatch = useDispatch();
  const customNetworks = useSelector(selectCustomNetworks);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = (chainId) => {
    if (window.confirm('Are you sure you want to delete this network?')) {
      dispatch(deleteCustomNetwork(chainId));
    }
  };

  return (
    <div className="settings-section">
      <h2>Networks</h2>
      <div className="network-list-settings">
        {customNetworks.map(net => (
          <div key={net.chainId} className="network-item-settings">
            <div className="network-info">
              <h3>{net.name}</h3>
              <p>Chain ID: {net.chainId}</p>
              <p>RPC URL: {net.rpcUrl}</p>
            </div>
            <button className="button-small button-danger" onClick={() => handleDelete(net.chainId)}>Delete</button>
          </div>
        ))}
      </div>
      <button className="button-secondary" onClick={() => setIsModalOpen(true)}>+ Add Custom Network</button>
      <AddNetworkModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

const SecuritySettings = () => {
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  return (
    <div className="settings-section">
      <h2>Security</h2>
      <div className="security-actions">
        <button className="button-secondary">Change Password</button>
        <button className="button-secondary" onClick={() => setIsSeedModalOpen(true)}>Reveal Seed Phrase</button>
      </div>
      <RevealSeedPhraseModal isOpen={isSeedModalOpen} onClose={() => setIsSeedModalOpen(false)} />
    </div>
  );
};

const AppearanceSettings = () => {
  return (
    <div className="settings-section">
      <h2>Appearance</h2>
      <p>Manage theme and display preferences.</p>
      {/* Add theme toggle here later */}
    </div>
  );
};

const AboutSettings = () => {
  return (
    <div className="settings-section">
      <h2>About</h2>
      <p>Wallet Version 1.0.0</p>
      <p><a href="#" target="_blank" rel="noopener noreferrer">Support</a></p>
    </div>
  );
};


// --- MAIN SETTINGS PAGE ---

const SettingsPage = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main settings-main">
        <h1>Settings</h1>
        
        <ProfileSettings />
        <NetworksSettings />
        <SecuritySettings />
        <AppearanceSettings />
        <AboutSettings />
      </main>
    </div>
  );
};

export default SettingsPage;
