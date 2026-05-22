import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

import { decryptData, deriveKeyFromPasscode, isBiometricAvailable } from '../../utils/wallet';
import { setSessionWallet, getSessionWallet } from '../../utils/session';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://blockvault-backend-production.up.railway.app/api';

const STORAGE_KEY = 'wallet_encrypted';

const getStoredWallet = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

const getDeviceSalt = () => {
  return localStorage.getItem('device_salt');
};

const LoginPage = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('select');
  const [passcode, setPasscode] = useState('');
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const storedWallet = getStoredWallet();

  useEffect(() => {
    if (getSessionWallet()) {
      navigate('/app/dashboard');
    }
  }, []);

  // ─────────────────────────────
  // AUTH SIGN-IN (SIWE)
  // ─────────────────────────────
  const authenticate = async (wallet) => {
    const nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, {
      walletAddress: wallet.address
    });

    const message = nonceRes.data.messageToSign;
    const signature = await wallet.signMessage(message);

    const res = await axios.post(`${API_BASE_URL}/auth/verify`, {
      walletAddress: wallet.address,
      signature,
      message
    });

    if (res.data.token) {
      localStorage.setItem('authToken', res.data.token);
      navigate('/app/dashboard');
    }
  };

  // ─────────────────────────────
  // PASSCODE LOGIN
  // ─────────────────────────────
  const handlePasscodeLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const salt = getDeviceSalt();
      if (!salt) throw new Error('Missing device salt');

      const key = await deriveKeyFromPasscode(passcode + salt);

      const decrypted = await decryptData(
        storedWallet.encryptedSeed,
        key,
        storedWallet.iv
      );

      const wallet = ethers.Wallet.fromPhrase(decrypted);

      setSessionWallet(wallet);
      await authenticate(wallet);
    } catch (e) {
      setError('Invalid passcode');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // SEED LOGIN
  // ─────────────────────────────
  const handlePhraseLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const wallet = ethers.Wallet.fromPhrase(phrase.trim());

      setSessionWallet(wallet);
      await authenticate(wallet);
    } catch (e) {
      setError('Invalid seed phrase');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // UI (simplified)
  // ─────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">

        <h2>BlockVault</h2>

        {error && <div className="error-msg">{error}</div>}

        {mode === 'select' && (
          <>
            {!storedWallet ? (
              <button onClick={() => navigate('/register')}>
                Create Wallet
              </button>
            ) : (
              <>
                <button onClick={() => setMode('passcode')}>
                  Unlock with Passcode
                </button>

                <button onClick={() => setMode('phrase')}>
                  Import Seed
                </button>
              </>
            )}
          </>
        )}

        {mode === 'passcode' && (
          <>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
            />

            <button onClick={handlePasscodeLogin}>
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
          </>
        )}

        {mode === 'phrase' && (
          <>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Seed phrase"
            />

            <button onClick={handlePhraseLogin}>
              Import
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
