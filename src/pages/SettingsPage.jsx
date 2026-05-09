import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectUserProfile,
  selectCustomNetworks,
  updateUserProfile,
  addCustomNetwork,
  deleteCustomNetwork,
} from '../store/slices/walletSlice';
import Sidebar from '../components/common/Sidebar';

// Backend Configuration
export const API_BASE_URL = "https://blockvault-backend-production.up.railway.app/api";

// --- HELPER FOR API CALLS ---
// Simple wrapper to handle headers and base URL
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header here if you have a token:
        // 'Authorization': `Bearer ${yourToken}`
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    // For DELETE requests, we might not get JSON back
    if (response.status === 204) return null;

    return await response.json();
  } catch (error) {
    console.error("Network request failed:", error);
    alert(`Operation failed: ${error.message}`);
    throw error;
  }
};

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Send to Backend
      await apiRequest('/networks', 'POST', formData);
      
      // 2. Update Redux State (Optimistic or after success)
      dispatch(addCustomNetwork(formData));
      
      // 3. Close and Reset
      onClose();
      setFormData({ name: '', rpcUrl: '', chainId: '', symbol: '', explorerUrl: '' });
    } catch (error) {
      // Error handling is done in apiRequest
    }
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
  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReveal = async () => {
    setLoading(true);
    try {
      // Fetch seed from backend
      const data = await apiRequest('/wallet/seed'); // Adjust endpoint as needed
      setSeedPhrase(data.seedPhrase || data.seed || "No seed returned from backend");
      setIsRevealed(true);
    } catch (error) {
      console.error("Failed to fetch seed");
    } finally {
      setLoading(false);
    }
  };

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
            {loading ? 'Loading...' : (isRevealed ? seedPhrase : '••••••••••••••••••••••••••••••••')}
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
              disabled={!confirmed || loading}
              onClick={handleReveal}
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
  const userProfile = useSelector(selectUserProfile) || {
    name: '',
    email: ''
  };

  // Initialize local state with Redux state
  const [formData, setFormData] = useState(userProfile);

  // Sync local state if Redux state changes externally (optional)
  useEffect(() => {
    setFormData(userProfile);
  }, [userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Send update to Backend
      await apiRequest('/user/profile', 'PUT', formData);
      
      // 2. Update Redux
      dispatch(updateUserProfile(formData));
      
      alert('Profile Updated!');
    } catch (error) {
      // Error handled in apiRequest
    }
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
  const customNetworks = useSelector(selectCustomNetworks) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load networks on component mount
  useEffect(() => {
    const loadNetworks = async () => {
      try {
        const data = await apiRequest('/networks');
        // Assuming your Redux slice has a setCustomNetworks or similar, 
        // otherwise we rely on the user adding them manually for this demo.
        // For now, we just log the fetched data since 'addCustomNetwork' adds one by one.
        console.log("Fetched networks from backend:", data);
        
        // If you want to load them into Redux immediately, you would ideally dispatch a 'setNetworks' action here.
        // If only 'addCustomNetwork' exists, you could map over them:
        // data.forEach(net => dispatch(addCustomNetwork(net)));
      } catch (error) {
        console.error("Could not load networks");
      }
    };
    loadNetworks();
  }, [dispatch]);

  const handleDelete = async (chainId) => {
    if (window.confirm('Delete this network?')) {
      try {
        // 1. Delete from Backend
        await apiRequest(`/networks/${chainId}`, 'DELETE');
        
        // 2. Update Redux
        dispatch(deleteCustomNetwork(chainId));
      } catch (error) {
        // Error handled in apiRequest
      }
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
