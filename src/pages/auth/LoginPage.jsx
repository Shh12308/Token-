import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

import {
  decryptData,
  deriveKeyFromPasscode
} from '../../utils/wallet';

import {
  setSessionWallet,
  getSessionWallet
} from '../../utils/session';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://blockvault-backend-production.up.railway.app/api';

const STORAGE_KEY = 'wallet_encrypted';

const getStoredWallet = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
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
    const session = getSessionWallet();
    if (session) {
      navigate('/app/dashboard');
    }
  }, [navigate]);

  // ─────────────────────────────
  // OPTIONAL BACKEND AUTH (SESSION ONLY)
  // ─────────────────────────────
  const authenticate = async (wallet) => {
    try {
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
      }
    } catch (err) {
      console.log('Backend auth failed (non-blocking)');
    }
  };

  // ─────────────────────────────
  // PASSCODE LOGIN (NON-CUSTODIAL)
  // ─────────────────────────────
  const handlePasscodeLogin = async () => {
    try {
      setLoading(true);
      setError('');

      if (!passcode) throw new Error('Enter passcode');

      const salt = getDeviceSalt();
      if (!salt) throw new Error('Missing device salt');

      if (!storedWallet) throw new Error('No wallet found');

      const key = await deriveKeyFromPasscode(passcode + salt);

      const decryptedPhrase = await decryptData(
        storedWallet.encryptedSeed,
        key,
        storedWallet.iv
      );

      const wallet = ethers.Wallet.fromPhrase(decryptedPhrase);

      setSessionWallet(wallet);

      await authenticate(wallet);

      navigate('/app/dashboard');
    } catch (e) {
      setError('Invalid passcode');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // SEED LOGIN (IMPORT WALLET)
  // ─────────────────────────────
  const handlePhraseLogin = async () => {
    try {
      setLoading(true);
      setError('');

      if (!phrase.trim()) throw new Error('Enter seed phrase');

      const wallet = ethers.Wallet.fromPhrase(phrase.trim());

      setSessionWallet(wallet);

      await authenticate(wallet);

      navigate('/app/dashboard');
    } catch (e) {
      setError('Invalid seed phrase');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // UI
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
                  Import Seed Phrase
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
              placeholder="Enter seed phrase"
            />

            <button onClick={handlePhraseLogin}>
              {loading ? 'Importing...' : 'Import'}
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
