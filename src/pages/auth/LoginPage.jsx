import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import api from '../utils/api';

import {
  decryptData,
  deriveKeyFromPasscode,
  isBiometricAvailable,
  unlockLocalVault
} from '../utils/wallet';

import {
  faKey,
  faShieldHalved,
  faFingerprint
} from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const STORAGE_KEY = 'wallet_encrypted';

// ─────────────────────────────────────────────
// NON-CUSTODIAL MEMORY WALLET (CRITICAL FIX)
// ─────────────────────────────────────────────
const setRuntimeWallet = (wallet) => {
  window.__WALLET__ = wallet;
};

const getRuntimeWallet = () => window.__WALLET__;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getDeviceSalt = () => localStorage.getItem('device_salt');

const getStoredWallet = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

// ─────────────────────────────────────────────
// LOGIN COMPONENT
// ─────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [passcode, setPasscode] = useState('');
  const [phrase, setPhrase] = useState('');

  const storedWallet = getStoredWallet();

  useEffect(() => {
    if (getRuntimeWallet()) {
      navigate('/app/dashboard');
    }
  }, [navigate]);

  // ─────────────────────────────
  // AUTH (backend verification only)
  // ─────────────────────────────
  const authenticate = async (address, signer) => {
    setLoading(true);
    setError('');

    try {
      const nonceRes = await api.post('/auth/nonce', {
        walletAddress: address
      });

      const message = nonceRes.data.messageToSign;

      const signature = await signer.signMessage(message);

      const verifyRes = await api.post('/auth/verify', {
        walletAddress: address,
        signature,
        message
      });

      const token = verifyRes.data.token;

      if (!token) throw new Error('Auth failed');

      localStorage.setItem('authToken', token);

      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // PASSCODE LOGIN (local decrypt only)
  // ─────────────────────────────
  const handlePasscodeLogin = async () => {
    if (!storedWallet) return setError('No wallet found');

    setLoading(true);
    setError('');

    try {
      const salt = getDeviceSalt();
      if (!salt) throw new Error('Device not initialized');

      const key = await deriveKeyFromPasscode(passcode + salt);

      const decryptedSeed = await decryptData(
        storedWallet.encryptedSeed,
        key,
        storedWallet.iv
      );

      const wallet = ethers.Wallet.fromPhrase(decryptedSeed);

      // 🔐 NON-CUSTODIAL RULE: memory only
      setRuntimeWallet(wallet);

      await authenticate(wallet.address, wallet);
    } catch {
      setError('Invalid passcode');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // BIOMETRIC LOGIN (safe placeholder)
  // ─────────────────────────────
  const handleBiometricLogin = async () => {
    if (!storedWallet) return setError('No wallet');
    if (!isBiometricAvailable()) return setError('Not supported');

    setLoading(true);

    try {
      const ok = await unlockLocalVault();
      if (!ok) throw new Error('Biometric failed');

      setError('Biometric unlocked (requires secure key integration)');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // SEED PHRASE LOGIN (FULL NON-CUSTODIAL)
  // ─────────────────────────────
  const handlePhraseLogin = async () => {
    const clean = phrase.trim();

    if (clean.split(/\s+/).length < 12) {
      return setError('Invalid seed phrase');
    }

    setLoading(true);
    setError('');

    try {
      const wallet = ethers.Wallet.fromPhrase(clean);

      // 🔐 STRICT RULE: never persist private key anywhere
      setRuntimeWallet(wallet);

      await authenticate(wallet.address, wallet);
    } catch {
      setError('Invalid phrase');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.title}>BlockVault</h2>
        <p style={styles.subtitle}>Non-Custodial Wallet</p>

        {error && <div style={styles.error}>{error}</div>}

        {mode === 'select' && (
          <>
            {isBiometricAvailable() && storedWallet?.biometricEnabled && (
              <button onClick={handleBiometricLogin} style={styles.btn}>
                <FontAwesomeIcon icon={faFingerprint} /> Biometrics
              </button>
            )}

            {storedWallet && (
              <button onClick={() => setMode('passcode')} style={styles.btn}>
                <FontAwesomeIcon icon={faShieldHalved} /> Passcode
              </button>
            )}

            <button onClick={() => setMode('phrase')} style={styles.outline}>
              <FontAwesomeIcon icon={faKey} /> Seed Phrase
            </button>
          </>
        )}

        {mode === 'passcode' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePasscodeLogin(); }}>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
            />
            <button disabled={loading}>
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
            <button type="button" onClick={() => setMode('select')}>
              Back
            </button>
          </form>
        )}

        {mode === 'phrase' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePhraseLogin(); }}>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="12 / 24 word phrase"
            />
            <button disabled={loading}>
              {loading ? 'Importing...' : 'Login'}
            </button>
            <button type="button" onClick={() => setMode('select')}>
              Back
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    padding: 20
  },
  card: { width: '100%', maxWidth: 420 },
  title: { color: '#c9a84c', textAlign: 'center' },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 30 },
  error: { color: 'red', textAlign: 'center', marginBottom: 15 },
  btn: { width: '100%', marginBottom: 10 },
  outline: { width: '100%' }
};

export default LoginPage;
