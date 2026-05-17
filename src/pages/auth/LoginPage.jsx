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

// ─────────────────────────────────────────────
// CRITICAL: Must match RegisterPage salt logic
// ─────────────────────────────────────────────
const getDeviceSalt = () => {
  return localStorage.getItem('device_salt');
};

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

  // ─────────────────────────────────────────────
  // Auto-login check
  // ─────────────────────────────────────────────
  useEffect(() => {
    const session = getSessionWallet();
    if (session) {
      navigate('/app/dashboard');
    }
  }, [navigate]);

  // ─────────────────────────────────────────────
  // Stateless Auth Helper
  // ─────────────────────────────────────────────
  const authenticate = async (address, signer) => {
    setLoading(true);
    setError('');

    try {
      // 1. Get Nonce
      const nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, {
        walletAddress: address
      });

      const messageToSign = nonceRes.data.messageToSign || nonceRes.data.message;
      if (!messageToSign) throw new Error('Auth setup failed');

      // 2. Sign Message
      const signature = await signer.signMessage(messageToSign);

      // 3. Verify
      const verifyRes = await axios.post(`${API_BASE_URL}/auth/verify`, {
        walletAddress: address,
        signature,
        message: messageToSign
      });

      if (verifyRes.data.token) {
        localStorage.setItem('authToken', verifyRes.data.token);
        localStorage.setItem('walletAddress', address);
        navigate('/app/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // PASSCODE LOGIN (Fix: Added Salt)
  // ─────────────────────────────────────────────
  const handlePasscodeLogin = async () => {
    if (!storedWallet) return setError('No local wallet found.');

    setLoading(true);
    setError('');

    try {
      const deviceSalt = getDeviceSalt();
      if (!deviceSalt) throw new Error('Device configuration error (Salt missing).');

      // CRITICAL: Derive key using Passcode + Salt (same as register)
      const key = await deriveKeyFromPasscode(passcode + deviceSalt);

      const decryptedSeed = await decryptData(
        storedWallet.encryptedSeed,
        key,
        storedWallet.iv
      );

      const wallet = ethers.Wallet.fromPhrase(decryptedSeed);

      // Store in memory only
      setSessionWallet(wallet);

      await authenticate(wallet.address, wallet);

    } catch (err) {
      console.error(err);
      setError('Invalid passcode or corrupted data.');
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // BIOMETRIC LOGIN
  // ─────────────────────────────────────────────
  const handleBiometricLogin = async () => {
    if (!storedWallet) return setError('No wallet found.');
    if (!isBiometricAvailable()) return setError('Biometrics not supported on this device.');

    setLoading(true);
    setError('');

    try {
      // 1. Trigger OS Biometric Prompt
      // Note: unlockLocalVault should ideally return a key or boolean
      const bioSuccess = await unlockLocalVault(); 
      
      if (!bioSuccess) {
        throw new Error('Biometric verification cancelled or failed.');
      }

      // 2. Logic depends on your implementation strategy:
      // If your biometric util returns a stored passcode, use it.
      // If it simply unlocks the storage, we might need a stored "biometric key".
      
      // Here we assume the simplest secure path:
      // The user previously set up biometrics, which stored the encryption key in SecureEnclave.
      // For this demo, we check if biometricEnabled is true.
      
      if (!storedWallet.biometricEnabled) {
         throw new Error('Biometrics not enabled for this wallet.');
      }

      // 3. Perform decryption (Ideally, 'unlockLocalVault' provides the key, but we fallback to a stored secret)
      // For production: You would retrieve the key from the secure enclave here.
      // For this example: We proceed assuming the presence of the salt + a simplified flow.
      
      // Note: Real biometric login usually requires a separate encryption key stored in the keychain.
      // I am skipping the decryption logic here to avoid security flaws in the simplified example.
      
      setError('Biometric authentication successful, but requires SecureEnclave key retrieval implementation.');

    } catch (err) {
      setError(err.message || 'Biometric verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // SEED PHRASE IMPORT (No Storage)
  // ─────────────────────────────────────────────
  const handlePhraseLogin = async () => {
    const cleanPhrase = phrase.trim();
    if (!cleanPhrase || cleanPhrase.split(/\s+/).length < 12) {
      return setError('Invalid seed phrase. Must be at least 12 words.');
    }

    setLoading(true);
    setError('');

    try {
      const wallet = ethers.Wallet.fromPhrase(cleanPhrase);

      // Note: This creates a temporary session without saving to localStorage
      // If the user refreshes, they must import again.
      setSessionWallet(wallet);

      await authenticate(wallet.address, wallet);

    } catch (err) {
      setError('Invalid seed phrase.');
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // UI RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <h2 style={{ color: '#c9a84c', textAlign: 'center' }}>BlockVault</h2>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: 30 }}>
          Non-Custodial Access
        </p>

        {error && <div style={{ color: 'red', marginBottom: 15, textAlign: 'center' }}>{error}</div>}

        {mode === 'select' && (
          <>
            {isBiometricAvailable() && storedWallet?.biometricEnabled && (
              <button 
                className="auth-btn bio" 
                onClick={handleBiometricLogin} 
                disabled={loading}
                style={{ marginBottom: 10 }}
              >
                <FontAwesomeIcon icon={faFingerprint} /> Unlock with Biometrics
              </button>
            )}

            {storedWallet && (
              <button 
                className="auth-btn" 
                onClick={() => setMode('passcode')}
                style={{ marginBottom: 10 }}
              >
                <FontAwesomeIcon icon={faShieldHalved} /> Unlock with Passcode
              </button>
            )}

            <button 
              className="auth-btn outline" 
              onClick={() => setMode('phrase')}
            >
              <FontAwesomeIcon icon={faKey} /> Import Wallet (Seed Phrase)
            </button>
          </>
        )}

        {mode === 'passcode' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePasscodeLogin(); }}>
            <input
              type="password"
              inputMode="numeric"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              autoFocus
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
            <button type="button" className="link-btn" onClick={() => setMode('select')}>
              Back
            </button>
          </form>
        )}

        {mode === 'phrase' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePhraseLogin(); }}>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Enter your 12 or 24 word seed phrase"
              rows={4}
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Importing...' : 'Import & Login'}
            </button>
            <button type="button" className="link-btn" onClick={() => setMode('select')}>
              Back
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
