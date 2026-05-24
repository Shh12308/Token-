import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import api from '../../utils/api';
import { setSessionWallet } from '../../utils/session';

const login = () => {
  const navigate = useNavigate();

  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── LOGIN FLOW ─────────────────────────────
  const handleLogin = async () => {
    setError('');

    if (!privateKey) {
      return setError('Enter your private key');
    }

    try {
      setLoading(true);

      // 1. Create wallet locally
      const wallet = new ethers.Wallet(privateKey);

      // 2. Save wallet to session
      saveSessionWallet(privateKey);

      // 3. Get message to sign from backend
      const nonceRes = await api.post('/auth/nonce');

      const message = nonceRes.data.messageToSign;

      // 4. Sign message
      const signature = await wallet.signMessage(message);

      // 5. Verify with backend
      const verifyRes = await api.post('/auth/verify', {
        walletAddress: wallet.address,
        signature,
        message
      });

      // 6. Save JWT token
      localStorage.setItem('authToken', verifyRes.data.token);

      // 7. Redirect to app
      navigate('/app');

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── GENERATE NEW WALLET (OPTIONAL) ─────────
  const generateWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    setPrivateKey(wallet.privateKey);
  };

  return (
    <div style={styles.container}>

      <div style={styles.card}>
        <h2 style={{ marginBottom: 10 }}>🔐 BlockVault Login</h2>
        <p style={styles.sub}>
          Import or generate a wallet to continue
        </p>

        {/* PRIVATE KEY INPUT */}
        <input
          type="password"
          placeholder="Enter Private Key (0x...)"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value.trim())}
          style={styles.input}
        />

        {/* ACTIONS */}
        <button style={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <button style={styles.secondary} onClick={generateWallet}>
          Generate New Wallet
        </button>

        {/* ERROR */}
        {error && <p style={styles.error}>{error}</p>}
      </div>

    </div>
  );
};

// ── STYLES ─────────────────────────────
const styles = {
  container: {
    minHeight: '100vh',
    background: '#0c0c0c',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontFamily: 'sans-serif'
  },
  card: {
    background: '#1a1a1a',
    padding: 30,
    borderRadius: 12,
    width: 320,
    textAlign: 'center'
  },
  sub: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 20
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #333',
    background: '#0c0c0c',
    color: 'white',
    marginBottom: 15
  },
  button: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: 'none',
    background: '#c9a84c',
    color: '#000',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: 10
  },
  secondary: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #444',
    background: 'transparent',
    color: '#aaa',
    cursor: 'pointer'
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 10
  }
};

export default login;
