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

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://blockvault-backend-production.up.railway.app/api';

const STORAGE_KEY = 'wallet_encrypted';

// ─────────────────────────────────────────────
// Device Salt
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
  const hasWallet = !!storedWallet;

  // ─────────────────────────────────────────────
  // Auto-login
  // ─────────────────────────────────────────────
  useEffect(() => {
    const session = getSessionWallet();
    if (session) {
      navigate('/app/dashboard');
    }
  }, [navigate]);

  // ─────────────────────────────────────────────
  // Auth (stateless)
  // ─────────────────────────────────────────────
  const authenticate = async (address, signer) => {
    setLoading(true);
    setError('');

    try {
      const nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, {
        walletAddress: address
      });

      const messageToSign =
        nonceRes.data.messageToSign || nonceRes.data.message;

      if (!messageToSign) throw new Error('Auth failed');

      const signature = await signer.signMessage(messageToSign);

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
  // PASSCODE LOGIN
  // ─────────────────────────────────────────────
  const handlePasscodeLogin = async () => {
    if (!storedWallet) return setError('No wallet found.');

    setLoading(true);
    setError('');

    try {
      const deviceSalt = getDeviceSalt();
      if (!deviceSalt) throw new Error('Salt missing');

      const key = await deriveKeyFromPasscode(passcode + deviceSalt);

      const decryptedSeed = await decryptData(
        storedWallet.encryptedSeed,
        key,
        storedWallet.iv
      );

      const wallet = ethers.Wallet.fromPhrase(decryptedSeed);

      setSessionWallet(wallet);

      await authenticate(wallet.address, wallet);
    } catch (err) {
      console.error(err);
      setError('Invalid passcode.');
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // BIOMETRIC LOGIN
  // ─────────────────────────────────────────────
  const handleBiometricLogin = async () => {
    if (!storedWallet) return setError('No wallet found.');
    if (!isBiometricAvailable())
      return setError('Biometrics not supported.');

    setLoading(true);
    setError('');

    try {
      const success = await unlockLocalVault();

      if (!success) throw new Error('Biometric failed');

      if (!storedWallet.biometricEnabled) {
        throw new Error('Biometric not enabled.');
      }

      setError('Biometric unlocked (needs secure key integration).');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // SEED PHRASE LOGIN
  // ─────────────────────────────────────────────
  const handlePhraseLogin = async () => {
    const clean = phrase.trim();

    if (!clean || clean.split(/\s+/).length < 12) {
      return setError('Invalid seed phrase.');
    }

    setLoading(true);
    setError('');

    try {
      const wallet = ethers.Wallet.fromPhrase(clean);

      setSessionWallet(wallet);

      await authenticate(wallet.address, wallet);
    } catch (err) {
      setError('Invalid seed phrase.');
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">

        <h2>BlockVault</h2>
        <p>Non-Custodial Access</p>

        {error && <div className="error-msg">{error}</div>}

        {/* ============================= */}
        {/* SELECT MODE */}
        {/* ============================= */}
        {mode === 'select' && (
          <>
            {!hasWallet ? (
              <>
                <p>No wallet found on this device</p>

                <button
                  className="btn-primary"
                  onClick={() => navigate('/register')}
                >
                  Create Wallet
                </button>

                <button
                  className="btn-gold-outline"
                  onClick={() => setMode('phrase')}
                >
                  Import Existing Wallet
                </button>
              </>
            ) : (
              <>
                {isBiometricAvailable() &&
                  storedWallet?.biometricEnabled && (
                    <button
                      className="btn-primary"
                      onClick={handleBiometricLogin}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faFingerprint} /> Biometrics
                    </button>
                  )}

                <button
                  className="btn-primary"
                  onClick={() => setMode('passcode')}
                >
                  <FontAwesomeIcon icon={faShieldHalved} /> Passcode
                </button>

                <button
                  className="btn-gold-outline"
                  onClick={() => setMode('phrase')}
                >
                  <FontAwesomeIcon icon={faKey} /> Import Wallet
                </button>

                <button
                  className="btn-text"
                  onClick={() => navigate('/register')}
                >
                  New user? Create Wallet
                </button>
              </>
            )}
          </>
        )}

        {/* ============================= */}
        {/* PASSCODE */}
        {/* ============================= */}
        {mode === 'passcode' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePasscodeLogin();
            }}
          >
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              autoFocus
            />

            <button className="btn-primary" disabled={loading}>
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>

            <button
              type="button"
              className="btn-text"
              onClick={() => setMode('select')}
            >
              Back
            </button>
          </form>
        )}

        {/* ============================= */}
        {/* PHRASE */}
        {/* ============================= */}
        {mode === 'phrase' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePhraseLogin();
            }}
          >
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Enter 12/24 word seed phrase"
              rows={4}
            />

            <button className="btn-primary" disabled={loading}>
              {loading ? 'Importing...' : 'Import & Login'}
            </button>

            <button
              type="button"
              className="btn-text"
              onClick={() => setMode('select')}
            >
              Back
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
