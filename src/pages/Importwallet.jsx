import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { faArrowLeft, faKey, faSeedling, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';
import { saveWalletToVault } from '../utils/Keymanager';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const ImportWalletPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('phrase'); // phrase | key
  const [phrase, setPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Password must be at least 8 characters');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      let walletInstance;

      // 1. Derive wallet locally
      if (tab === 'phrase') {
        if (!phrase.trim()) return setError('Please enter a seed phrase');
        walletInstance = ethers.Wallet.fromMnemonic(phrase.trim());
      } else {
        if (!privateKey.trim()) return setError('Please enter a private key');
        // Ensure 0x prefix
        let formattedKey = privateKey.trim();
        if (!formattedKey.startsWith('0x')) formattedKey = `0x${formattedKey}`;
        walletInstance = new ethers.Wallet(formattedKey);
      }

      const address = walletInstance.address;

      // 2. Encrypt and save to local vault (MetaMask style)
      await saveWalletToVault(walletInstance.privateKey, password);

      // 3. Register public address with backend
      const token = localStorage.getItem('authToken');
      await axios.post(`${API_BASE}/wallets/import`, {
        address,
        blockchain: 'ethereum',
        label: 'Imported Wallet',
        walletType: 'created', // It's locally managed now
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate('/app');

    } catch (err) {
      console.error('Import error:', err);
      if (err.message.includes('invalid mnemonic')) {
        setError('Invalid seed phrase. Check for typos.');
      } else if (err.message.includes('invalid private key')) {
        setError('Invalid private key format.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to import wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
        <div className="header-title">Import Wallet</div>
        <div style={{ width: 60 }}></div>
      </header>

      <main className="main-scroll-area-gold" style={{ padding: 20 }}>
        <div style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8, padding: 16, marginBottom: 24,
        }}>
          <p style={{ color: '#fbbf24', fontSize: 13, margin: 0 }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 8 }} />
            Your secret recovery phrase and private keys <strong>never</strong> leave this device. They are encrypted locally.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'phrase', label: 'Seed Phrase', icon: faSeedling },
            { id: 'key', label: 'Private Key', icon: faKey },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(''); }}
              style={{
                flex: 1, padding: 12, borderRadius: 8, border: 'none',
                background: tab === t.id ? 'rgba(201,168,76,0.2)' : '#1a1a1a',
                color: tab === t.id ? '#c9a84c' : '#888',
                cursor: 'pointer', fontSize: 14,
                border: tab === t.id ? '1px solid #c9a84c' : '1px solid #333',
              }}
            >
              <FontAwesomeIcon icon={t.icon} style={{ marginRight: 6 }} />
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
            color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleImport}>
          {tab === 'phrase' ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>
                Secret Recovery Phrase (12 or 24 words)
              </label>
              <textarea
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="Enter your secret recovery phrase here..."
                rows={4}
                required
                style={{
                  width: '100%', padding: 14, background: '#1a1a1a',
                  border: '1px solid #333', borderRadius: 8, color: '#fff',
                  fontSize: 14, outline: 'none', resize: 'vertical',
                }}
              />
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>
                Private Key
              </label>
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x..."
                required
                style={{
                  width: '100%', padding: 14, background: '#1a1a1a',
                  border: '1px solid #333', borderRadius: 8, color: '#fff',
                  fontSize: 14, outline: 'none',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>
              Local Encryption Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password to encrypt this wallet locally"
              required
              style={{
                width: '100%', padding: 14, background: '#1a1a1a',
                border: '1px solid #333', borderRadius: 8, color: '#fff',
                fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your encryption password"
              required
              style={{
                width: '100%', padding: 14, background: '#1a1a1a',
                border: '1px solid #333', borderRadius: 8, color: '#fff',
                fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 14, background: '#c9a84c',
              border: 'none', borderRadius: 8, color: '#000',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {loading ? 'Importing & Encrypting...' : 'Import Wallet'}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default ImportWalletPage;
