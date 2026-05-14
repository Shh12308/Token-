import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  faArrowLeft,
  faUser,
  faGlobe,
  faShieldHalved,
  faWallet,
  faLink,
  faTrash,
  faExclamationTriangle,
  faCheck,
  faPlus,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import {
  faTwitter,
  faDiscord,
} from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';
import { ethers } from 'ethers';

const wallet = ethers.Wallet.fromPhrase(mnemonic);

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

// ── API Helper ────────────────────────────────────────────
const apiCall = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('authToken');
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: { Authorization: `Bearer ${token}` },
  };
  if (data) config.data = data;
  const res = await axios(config);
  return res.data;
};

// ── Add Network Modal ─────────────────────────────────────
const AddNetworkModal = ({ isOpen, onClose, onAdded }) => {
  const [form, setForm] = useState({
    name: '', rpcUrl: '', chainId: '', symbol: '', explorerUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiCall('POST', '/networks', form);
      onAdded(res.network);
      setForm({ name: '', rpcUrl: '', chainId: '', symbol: '', explorerUrl: '' });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add network');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a', borderRadius: 16, padding: 24,
          width: '100%', maxWidth: 420, border: '1px solid #333',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: '#fff', marginBottom: 20 }}>
          <FontAwesomeIcon icon={faPlus} style={{ marginRight: 8, color: '#c9a84c' }} />
          Add Custom Network
        </h3>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
            color: '#fca5a5', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { key: 'name', label: 'Network Name *', placeholder: 'Aurora' },
            { key: 'rpcUrl', label: 'RPC URL *', placeholder: 'https://mainnet.aurora.dev' },
            { key: 'chainId', label: 'Chain ID *', placeholder: '1313161554' },
            { key: 'symbol', label: 'Symbol', placeholder: 'ETH' },
            { key: 'explorerUrl', label: 'Explorer URL', placeholder: 'https://aurorascan.dev' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 12 }}>
              <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>
                {field.label}
              </label>
              <input
                required={field.label.includes('*')}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                style={{
                  width: '100%', padding: '10px 12px', background: '#222',
                  border: '1px solid #333', borderRadius: 8, color: '#fff',
                  fontSize: 14, outline: 'none',
                }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: 12, background: 'transparent',
                border: '1px solid #444', borderRadius: 8, color: '#aaa',
                cursor: 'pointer', fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: 12, background: '#c9a84c',
                border: 'none', borderRadius: 8, color: '#000',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              {loading ? 'Adding...' : 'Add Network'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Seed Phrase Modal ─────────────────────────────────────
const SeedPhraseModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [seedInfo, setSeedInfo] = useState(null);

  const handleReveal = async () => {
    setLoading(true);
    try {
      const data = await apiCall('GET', '/wallet/seed');
      setSeedInfo(data);
    } catch (err) {
      setSeedInfo({
        hasSeed: false,
        message: 'Could not retrieve wallet information.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a', borderRadius: 16, padding: 24,
          width: '100%', maxWidth: 440, border: '1px solid #333',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: '#fff', marginBottom: 12 }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 8, color: '#f59e0b' }} />
          Recovery Information
        </h3>

        <div style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8, padding: 16, marginBottom: 16,
        }}>
          <p style={{ color: '#fbbf24', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            BlockVault is a <strong>non-custodial</strong> wallet. Your seed phrase is
            managed by your browser wallet extension and is never stored on our servers.
            We cannot recover it for you.
          </p>
        </div>

        {!seedInfo ? (
          <button
            onClick={handleReveal}
            disabled={loading}
            style={{
              width: '100%', padding: 12, background: '#b91c1c',
              border: 'none', borderRadius: 8, color: '#fff',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            {loading ? 'Checking...' : 'I Understand — Check Wallet Info'}
          </button>
        ) : (
          <div style={{
            background: '#222', borderRadius: 8, padding: 16,
            border: '1px solid #333',
          }}>
            <p style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {seedInfo.message}
            </p>
            <div style={{
              marginTop: 12, padding: '8px 12px', background: '#1a1a1a',
              borderRadius: 6, fontSize: 12, color: '#888',
            }}>
              Wallet type: <span style={{ color: '#c9a84c' }}>{seedInfo.walletType || 'unknown'}</span>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: 12, marginTop: 16,
            background: 'transparent', border: '1px solid #444',
            borderRadius: 8, color: '#aaa', cursor: 'pointer', fontSize: 14,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ── Main Settings Page ────────────────────────────────────
const SettingsPage = () => {
  const navigate = useNavigate();

  // ── Active tab ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState('profile');

  // ── Profile state ────────────────────────────────────
  const [profile, setProfile] = useState({
    username: '', bio: '', twitterHandle: '', discordHandle: '',
    walletAddress: '', walletType: '', profileImage: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // ── Networks state ───────────────────────────────────
  const [customNetworks, setCustomNetworks] = useState([]);
  const [networksLoading, setNetworksLoading] = useState(true);
  const [showAddNetwork, setShowAddNetwork] = useState(false);

  // ── Wallets state ────────────────────────────────────
  const [wallets, setWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(true);

  // ── Security modal ───────────────────────────────────
  const [showSeedModal, setShowSeedModal] = useState(false);

  // ── App settings state ───────────────────────────────
  const [settings, setSettings] = useState({
    currency: 'USD', theme: 'dark', defaultChain: 'ethereum', slippageTolerance: 0.5,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ── Load data on mount ───────────────────────────────
  useEffect(() => {
    fetchProfile();
    fetchNetworks();
    fetchWallets();
  }, []);

  // ── Fetch Profile ────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const data = await apiCall('GET', '/user/profile');
      const u = data.user;
      setProfile({
        username: u.username || '',
        bio: u.bio || '',
        twitterHandle: u.twitterHandle || '',
        discordHandle: u.discordHandle || '',
        walletAddress: u.walletAddress || '',
        walletType: u.walletType || '',
        profileImage: u.profileImage || '',
      });
      setSettings(u.settings || settings);
    } catch (err) {
      console.error('Profile fetch error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth/login');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Save Profile ─────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);

    try {
      await apiCall('PUT', '/user/profile', {
        username: profile.username,
        bio: profile.bio,
        twitterHandle: profile.twitterHandle,
        discordHandle: profile.discordHandle,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Fetch Networks ───────────────────────────────────
  const fetchNetworks = async () => {
    try {
      const data = await apiCall('GET', '/networks');
      setCustomNetworks(data.networks || []);
    } catch (err) {
      console.error('Networks fetch error:', err);
    } finally {
      setNetworksLoading(false);
    }
  };

  // ── Delete Network ───────────────────────────────────
  const deleteNetwork = async (chainId) => {
    if (!window.confirm('Remove this custom network?')) return;
    try {
      await apiCall('DELETE', `/networks/${chainId}`);
      setCustomNetworks(prev => prev.filter(n => n.chainId !== chainId));
    } catch (err) {
      alert('Failed to delete network');
    }
  };

  // ── Fetch Wallets ────────────────────────────────────
  const fetchWallets = async () => {
    try {
      const data = await apiCall('GET', '/wallets/connected');
      setWallets(data.wallets || []);
    } catch (err) {
      // Fallback to existing endpoint
      try {
        const data = await apiCall('GET', '/wallets');
        setWallets(data.wallets || []);
      } catch (err2) {
        console.error('Wallets fetch error:', err2);
      }
    } finally {
      setWalletsLoading(false);
    }
  };

  // ── Disconnect Wallet ────────────────────────────────
  const disconnectWallet = async (walletId, label) => {
    if (!window.confirm(`Disconnect "${label}"? You can reconnect it later.`)) return;
    try {
      await apiCall('DELETE', `/wallets/${walletId}/disconnect`);
      setWallets(prev => prev.filter(w => w.id !== walletId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to disconnect wallet');
    }
  };

  // ── Save App Settings ────────────────────────────────
  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      await apiCall('PUT', '/user/settings', { settings });
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────
  const truncateAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const CHAIN_COLORS = {
    ethereum: '#627eea', polygon: '#8247e5', bsc: '#f3ba2f',
    arbitrum: '#28a0f0', optimism: '#ff0420', avalanche: '#e84142', base: '#0052ff',
  };

  // ── Tab Config ───────────────────────────────────────
  const tabs = [
    { id: 'profile', label: 'Profile', icon: faUser },
    { id: 'wallets', label: 'Wallets', icon: faWallet },
    { id: 'networks', label: 'Networks', icon: faGlobe },
    { id: 'security', label: 'Security', icon: faShieldHalved },
    { id: 'app', label: 'App', icon: faCog },
  ];

  return (
    <div className="dashboard-container-gold">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
        <div className="header-title">Settings</div>
        <div style={{ width: 60 }}></div>
      </header>

      <main className="main-scroll-area-gold" style={{ padding: '16px' }}>

        {/* ── Tab Bar ──────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 4, overflowX: 'auto',
          marginBottom: 20, paddingBottom: 4,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: activeTab === tab.id ? 'rgba(201,168,76,0.2)' : 'transparent',
                color: activeTab === tab.id ? '#c9a84c' : '#888',
                cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
                borderBottom: activeTab === tab.id ? '2px solid #c9a84c' : '2px solid transparent',
              }}
            >
              <FontAwesomeIcon icon={tab.icon} style={{ fontSize: 12 }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            PROFILE TAB
            ══════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div>
            {profileLoading ? (
              <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>Loading...</div>
            ) : (
              <>
                {/* Profile Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  marginBottom: 24,
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: profile.profileImage
                      ? `url(${profile.profileImage}) center/cover`
                      : 'linear-gradient(135deg, #c9a84c, #8b6914)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, color: '#000', fontWeight: 700,
                  }}>
                    {!profile.profileImage && (profile.username?.[0]?.toUpperCase() || '?')}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
                      {profile.username || 'Anonymous'}
                    </div>
                    <div style={{ color: '#c9a84c', fontSize: 13 }}>
                      {truncateAddr(profile.walletAddress)}
                    </div>
                  </div>
                </div>

                {/* Profile Form — matches backend PUT /api/user/profile */}
                <form onSubmit={saveProfile}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>
                      Username
                    </label>
                    <input
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      placeholder="Your display name"
                      style={{
                        width: '100%', padding: '12px 14px', background: '#1a1a1a',
                        border: '1px solid #333', borderRadius: 8, color: '#fff',
                        fontSize: 14, outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>
                      Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell the world about yourself..."
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 14px', background: '#1a1a1a',
                        border: '1px solid #333', borderRadius: 8, color: '#fff',
                        fontSize: 14, outline: 'none', resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>
                      <FontAwesomeIcon icon={faTwitter} style={{ marginRight: 4, color: '#1da1f2' }} />
                      Twitter Handle
                    </label>
                    <input
                      value={profile.twitterHandle}
                      onChange={(e) => setProfile({ ...profile, twitterHandle: e.target.value })}
                      placeholder="@username"
                      style={{
                        width: '100%', padding: '12px 14px', background: '#1a1a1a',
                        border: '1px solid #333', borderRadius: 8, color: '#fff',
                        fontSize: 14, outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>
                      <FontAwesomeIcon icon={faDiscord} style={{ marginRight: 4, color: '#5865f2' }} />
                      Discord Handle
                    </label>
                    <input
                      value={profile.discordHandle}
                      onChange={(e) => setProfile({ ...profile, discordHandle: e.target.value })}
                      placeholder="username#0000"
                      style={{
                        width: '100%', padding: '12px 14px', background: '#1a1a1a',
                        border: '1px solid #333', borderRadius: 8, color: '#fff',
                        fontSize: 14, outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    style={{
                      width: '100%', padding: 14, background: '#c9a84c',
                      border: 'none', borderRadius: 8, color: '#000',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {profileSaving ? 'Saving...' : profileSaved ? (
                      <><FontAwesomeIcon icon={faCheck} style={{ marginRight: 8 }} />Saved!</>
                    ) : 'Save Profile'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            WALLETS TAB
            ══════════════════════════════════════════════════ */}
        {activeTab === 'wallets' && (
          <div>
            <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>
              Connected Wallets
            </h3>

            {walletsLoading ? (
              <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>Loading...</div>
            ) : wallets.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
                No wallets connected
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {wallets.map(w => (
                  <div
                    key={w.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#1a1a1a', border: '1px solid #333',
                      borderRadius: 12, padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `${CHAIN_COLORS[w.blockchain] || '#888'}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FontAwesomeIcon icon={faWallet} style={{
                          color: CHAIN_COLORS[w.blockchain] || '#888', fontSize: 14,
                        }} />
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontSize: 14 }}>
                          {w.label || w.blockchain}
                          {w.isHardware && (
                            <span style={{
                              marginLeft: 6, fontSize: 10, color: '#f59e0b',
                              background: 'rgba(245,158,11,0.15)', padding: '2px 6px',
                              borderRadius: 4,
                            }}>
                              {w.hardwareType}
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#888', fontSize: 12 }}>
                          {truncateAddr(w.address)}
                        </div>
                      </div>
                    </div>

                    {wallets.length > 1 && (
                      <button
                        onClick={() => disconnectWallet(w.id, w.label || w.blockchain)}
                        style={{
                          background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
                          borderRadius: 6, padding: '6px 10px', color: '#f87171',
                          cursor: 'pointer', fontSize: 12,
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/app/wallets/import')}
              style={{
                width: '100%', padding: 14, marginTop: 16,
                background: 'transparent', border: '1px dashed #444',
                borderRadius: 8, color: '#888', cursor: 'pointer', fontSize: 14,
              }}
            >
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: 8 }} />
              Import Wallet
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            NETWORKS TAB
            ══════════════════════════════════════════════════ */}
        {activeTab === 'networks' && (
          <div>
            {/* Built-in Networks */}
            <h3 style={{ color: '#fff', marginBottom: 12, fontSize: 16 }}>
              Supported Networks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {Object.entries({
                ethereum: { name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
                polygon: { name: 'Polygon', symbol: 'MATIC', color: '#8247e5' },
                bsc: { name: 'BNB Smart Chain', symbol: 'BNB', color: '#f3ba2f' },
                arbitrum: { name: 'Arbitrum One', symbol: 'ETH', color: '#28a0f0' },
                optimism: { name: 'Optimism', symbol: 'ETH', color: '#ff0420' },
                avalanche: { name: 'Avalanche C-Chain', symbol: 'AVAX', color: '#e84142' },
                base: { name: 'Base', symbol: 'ETH', color: '#0052ff' },
              }).map(([id, net]) => (
                <div
                  key={id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#1a1a1a', border: '1px solid #333',
                    borderRadius: 10, padding: 12,
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: net.color,
                  }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 14 }}>{net.name}</div>
                    <div style={{ color: '#888', fontSize: 11 }}>{net.symbol} • Built-in</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Networks */}
            <h3 style={{ color: '#fff', marginBottom: 12, fontSize: 16 }}>
              Custom Networks
            </h3>

            {networksLoading ? (
              <div style={{ color: '#888', padding: 20, textAlign: 'center' }}>Loading...</div>
            ) : customNetworks.length === 0 ? (
              <div style={{ color: '#666', padding: 20, textAlign: 'center', fontSize: 13 }}>
                No custom networks added
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {customNetworks.map(net => (
                  <div
                    key={net.id || net.chainId}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#1a1a1a', border: '1px solid #333',
                      borderRadius: 10, padding: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#888',
                      }} />
                      <div>
                        <div style={{ color: '#fff', fontSize: 14 }}>{net.name}</div>
                        <div style={{ color: '#888', fontSize: 11 }}>
                          {net.symbol || '?'} • Chain {net.chainId}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteNetwork(net.chainId)}
                      style={{
                        background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
                        borderRadius: 6, padding: '6px 10px', color: '#f87171',
                        cursor: 'pointer', fontSize: 12,
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowAddNetwork(true)}
              style={{
                width: '100%', padding: 14,
                background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 8, color: '#c9a84c', cursor: 'pointer', fontSize: 14,
              }}
            >
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: 8 }} />
              Add Custom Network
            </button>

            <AddNetworkModal
              isOpen={showAddNetwork}
              onClose={() => setShowAddNetwork(false)}
              onAdded={(network) => setCustomNetworks(prev => [...prev, network])}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            SECURITY TAB
            ══════════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <div>
            {/* Non-custodial notice */}
            <div style={{
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 12, padding: 20, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <FontAwesomeIcon icon={faShieldHalved} style={{ color: '#c9a84c', fontSize: 18 }} />
                <span style={{ color: '#c9a84c', fontWeight: 600 }}>Non-Custodial Security</span>
              </div>
              <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Your private keys and seed phrase are stored locally in your browser wallet.
                BlockVault never has access to them and cannot recover them.
              </p>
            </div>

            {/* Security actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setShowSeedModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#1a1a1a', border: '1px solid #333',
                  borderRadius: 12, padding: 16, color: '#fff',
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14 }}>Recovery Information</div>
                  <div style={{ fontSize: 12, color: '#888' }}>View wallet recovery details</div>
                </div>
              </button>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#1a1a1a', border: '1px solid #333',
                borderRadius: 12, padding: 16,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(34,197,94,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faWallet} style={{ color: '#22c55e' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#fff' }}>Connected Wallet</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {profile.walletType === 'injected' ? 'Browser Extension (MetaMask)' :
                     profile.walletType === 'hardware' ? 'Hardware Wallet' :
                     profile.walletType === 'walletconnect' ? 'WalletConnect' :
                     profile.walletType || 'Unknown'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#1a1a1a', border: '1px solid #333',
                borderRadius: 12, padding: 16,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(59,130,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={faLink} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#fff' }}>Wallet Address</div>
                  <div style={{ fontSize: 12, color: '#c9a84c', fontFamily: 'monospace' }}>
                    {truncateAddr(profile.walletAddress)}
                  </div>
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={() => {
                localStorage.removeItem('authToken');
                navigate('/auth/login');
              }}
              style={{
                width: '100%', padding: 14, marginTop: 24,
                background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 8, color: '#f87171', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
              }}
            >
              Sign Out
            </button>

            <SeedPhraseModal
              isOpen={showSeedModal}
              onClose={() => setShowSeedModal(false)}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            APP SETTINGS TAB
            ══════════════════════════════════════════════════ */}
        {activeTab === 'app' && (
          <div>
            <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>
              App Preferences
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Default Chain */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>
                  Default Blockchain
                </label>
                <select
                  value={settings.defaultChain}
                  onChange={(e) => setSettings({ ...settings, defaultChain: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px', background: '#1a1a1a',
                    border: '1px solid #333', borderRadius: 8, color: '#fff',
                    fontSize: 14,
                  }}
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="bsc">BNB Smart Chain</option>
                  <option value="arbitrum">Arbitrum One</option>
                  <option value="optimism">Optimism</option>
                  <option value="avalanche">Avalanche C-Chain</option>
                  <option value="base">Base</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>
                  Display Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px', background: '#1a1a1a',
                    border: '1px solid #333', borderRadius: 8, color: '#fff',
                    fontSize: 14,
                  }}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>

              {/* Slippage */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>
                  Slippage Tolerance (%)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[0.1, 0.5, 1.0].map(val => (
                    <button
                      key={val}
                      onClick={() => setSettings({ ...settings, slippageTolerance: val })}
                      style={{
                        flex: 1, padding: 10,
                        background: settings.slippageTolerance === val
                          ? 'rgba(201,168,76,0.2)' : '#1a1a1a',
                        border: settings.slippageTolerance === val
                          ? '1px solid #c9a84c' : '1px solid #333',
                        borderRadius: 8, color: settings.slippageTolerance === val
                          ? '#c9a84c' : '#888',
                        cursor: 'pointer', fontSize: 14,
                      }}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                style={{
                  width: '100%', padding: 14, background: '#c9a84c',
                  border: 'none', borderRadius: 8, color: '#000',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {settingsSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
