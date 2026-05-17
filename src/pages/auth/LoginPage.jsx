import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

import {
  decryptData,
  deriveKeyFromPasscode,
  isBiometricAvailable,
  unlockLocalVault
} from '../../utils/wallet';

import {
  setSessionWallet,
  getSessionWallet
} from '../../utils/session';

import { faKey, faShieldHalved, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';
const STORAGE_KEY = 'wallet_encrypted';

// ─────────────────────────────────────────────────────
// Load stored vault
// ─────────────────────────────────────────────────────
const getStoredWallet = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

const LoginPage = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [passcode, setPasscode] = useState('');
  const [phrase, setPhrase] = useState('');

  const storedWallet = getStoredWallet();

  // ─────────────────────────────────────────────────────
  // Auto-login if session exists (MetaMask behavior)
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    const session = getSessionWallet();
    if (session) {
      authenticate(session.address, session);
    }
  }, []);

  // ─────────────────────────────────────────────────────
  // AUTH (stateless, wallet-based)
  // ─────────────────────────────────────────────────────
  const authenticate = async (address, signer) => {
    setLoading(true);
    setError('');

    try {
      const nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, {
        walletAddress: address
      });

      const messageToSign = nonceRes.data.messageToSign || nonceRes.data.message;
      if (!messageToSign) throw new Error('Auth setup failed');

      const signature = await signer.signMessage(messageToSign);

      const verifyRes = await axios.post(`${API_BASE_URL}/auth/verify`, {
        walletAddress: address,
        signature,
        message: messageToSign
      });

      if (verifyRes.data.token) {
        localStorage.setItem('authToken', verifyRes.data.token);

        // ⚠️ no custodial "user account"
        localStorage.setItem('walletAddress', address);

        navigate('/app/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // PASSCODE LOGIN
  // ─────────────────────────────────────────────────────
  const handlePasscodeLogin = async () => {
    if (!storedWallet) return setError('No local wallet found.');

    setLoading(true);
    setError('');

    try {
      const key = await deriveKeyFromPasscode(passcode);

      const decryptedSeed = await decryptData(
        storedWallet.encryptedSeed,
        key,
        storedWallet.iv
      );

      const wallet = ethers.Wallet.fromPhrase(decryptedSeed);

      // ✅ store session (IMPORTANT)
      setSessionWallet(wallet);

      // wipe sensitive memory
      setPhrase('');

      await authenticate(wallet.address, wallet);

    } catch (err) {
      setError('Invalid passcode.');
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // BIOMETRIC LOGIN (REAL)
  // ─────────────────────────────────────────────────────
  const handleBiometricLogin = async () => {
    if (!storedWallet) return setError('No wallet found.');
    if (!isBiometricAvailable()) return setError('Biometrics not supported.');

    setLoading(true);
    setError('');

    try {
      // Trigger FaceID / Fingerprint
      await unlockLocalVault();

      // derive key (same derivation as setup phase)
      const key = await deriveKeyFromPasscode(passcode || 'device-key');

      const decryptedSeed = await decryptData(
        storedWallet.encryptedSeed,
        key,
        storedWallet.iv
      );

      const wallet = ethers.Wallet.fromPhrase(decryptedSeed);

      // store session
      setSessionWallet(wallet);

      await authenticate(wallet.address, wallet);

    } catch (err) {
      setError('Biometric verification failed.');
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // SEED PHRASE IMPORT
  // ─────────────────────────────────────────────────────
  const handlePhraseLogin = async () => {
    if (!phrase || phrase.trim().split(/\s+/).length < 12) {
      return setError('Invalid seed phrase.');
    }

    setLoading(true);
    setError('');

    try {
      const wallet = ethers.Wallet.fromPhrase(phrase.trim());

      // session only (do NOT store seed again here)
      setSessionWallet(wallet);

      await authenticate(wallet.address, wallet);

    } catch (err) {
      setError('Invalid seed phrase.');
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <h2 style={{ color: '#c9a84c', textAlign: 'center' }}>BlockVault</h2>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: 30 }}>
          Non-Custodial Wallet
        </p>

        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

        {mode === 'select' && (
          <>
            {isBiometricAvailable() && storedWallet && (
              <button onClick={handleBiometricLogin} disabled={loading}>
                <FontAwesomeIcon icon={faFingerprint} /> Unlock with Biometrics
              </button>
            )}

            {storedWallet && (
              <button onClick={() => setMode('passcode')}>
                <FontAwesomeIcon icon={faShieldHalved} /> Unlock with Passcode
              </button>
            )}

            <button onClick={() => setMode('phrase')}>
              <FontAwesomeIcon icon={faKey} /> Import Seed Phrase
            </button>
          </>
        )}

        {mode === 'passcode' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePasscodeLogin(); }}>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
            />
            <button type="submit">{loading ? 'Unlocking...' : 'Unlock'}</button>
          </form>
        )}

        {mode === 'phrase' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePhraseLogin(); }}>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Enter seed phrase"
            />
            <button type="submit">{loading ? 'Importing...' : 'Import'}</button>
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
