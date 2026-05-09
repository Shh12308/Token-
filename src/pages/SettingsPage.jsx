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
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken'); // Adjust if your token key is different
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const apiRequest = async (endpoint, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: getAuthHeaders(),
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }
    
    // For DELETE/PUT requests, we might not get JSON back
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
      const response = await apiRequest('/networks', 'POST', formData);
      
      // 2. Update Redux State
      // Ensure we have the ID if the backend returns it, otherwise use the formData
      const networkData = response.network || response; 
      dispatch(addCustomNetwork(networkData));
      
      // 3. Close and Reset
      onClose();
      setFormData({ name: '', rpcUrl: '', chainId: '', symbol: '', explorerUrl: '' });
    } catch (error) {
      // Error handled in apiRequest
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
      // Fetch seed from backend endpoint
      const data = await apiRequest('/wallet/seed');
      setSeedPhrase(data.seedPhrase || "No seed returned from backend");
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
  
  // Get user profile from Redux (or default)
  const userProfile = useSelector(selectUserProfile) || {
    username: '', // Backend maps 'username' to 'name'
    email: ''
  };

  // Initialize local state. 
  // Note: Mapping 'username' to 'name' for the input field to match the form label.
  const [formData, setFormData] = useState({
    name: userProfile.username || '',
    email: userProfile.email || ''
  });

  // Update local state if Redux state changes (e.g. after login)
  useEffect(() => {
    setFormData({
      name: userProfile.username || '',
      email: userProfile.email || ''
    });
  }, [userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Send update to Backend (Expects { name, email })
      await apiRequest('/user/profile', 'PUT', formData);
      
      // 2. Update Redux
      // We map 'name' back to 'username' for the Redux store structure
      dispatch(updateUserProfile({
        ...userProfile,
        username: formData.name,
        email: formData.email
      }));
      
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
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load networks on component mount
  useEffect(() => {
    const loadNetworks = async () => {
      if (hasLoaded) return; // Prevent double loading
      
      try {
        const data = await apiRequest('/networks');
        if (data && data.networks) {
          // Hydrate Redux store
          data.networks.forEach(net => {
            // Avoid duplicates if Redux already has them
            const exists = customNetworks.find(n => n.chainId === net.chainId);
            if (!exists) {
              dispatch(addCustomNetwork(net));
            }
          });
        }
      } catch (error) {
        console.error("Could not load networks");
      } finally {
        setHasLoaded(true);
      }
    };
    loadNetworks();
  }, [dispatch, hasLoaded, customNetworks]);

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
            <div key={net.chainId || net.id} className="network-item-settings">
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
