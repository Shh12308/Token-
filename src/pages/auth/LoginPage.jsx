import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

import {
  decryptData,
  deriveKeyFromPasscode
} from '../../utils/wallet';

import { setSessionWallet, getSessionWallet } from '../../utils/session';

const STORAGE_KEY = 'wallet_encrypted';

const getStoredWallet = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const getDeviceSalt = () => localStorage.getItem('device_salt');

const LoginPage = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('select');
  const [passcode, setPasscode] = useState('');
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const storedWallet = getStoredWallet();

  useEffect(() => {
    if (getSessionWallet()) navigate('/app/dashboard');
  }, []);

  const handlePasscodeLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const salt = getDeviceSalt();
      if (!salt) throw new Error('Missing device salt');
      if (!storedWallet) throw new Error('No wallet found');

      const key = await deriveKeyFromPasscode(passcode + salt);

      const decrypted = await decryptData(
        storedWallet.encryptedSeed,
        key,
        storedWallet.iv
      );

      const wallet = ethers.Wallet.fromPhrase(decrypted);

      setSessionWallet(wallet);
      navigate('/app/dashboard');
    } catch {
      setError('Invalid passcode');
    } finally {
      setLoading(false);
    }
  };

  const handlePhraseLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const wallet = ethers.Wallet.fromPhrase(phrase.trim());

      setSessionWallet(wallet);
      navigate('/app/dashboard');
    } catch {
      setError('Invalid seed phrase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h2>BlockVault</h2>
        <p>Secure Web3 Wallet</p>

        {error && <div className="error-msg">{error}</div>}

        {mode === 'select' && (
          <div className="auth-options">

            {!storedWallet ? (
              <button className="btn-primary" onClick={() => navigate('/register')}>
                Create Wallet
              </button>
            ) : (
              <>
                <button className="btn-primary" onClick={() => setMode('passcode')}>
                  Unlock with Passcode
                </button>

                <button className="btn-secondary" onClick={() => setMode('phrase')}>
                  Import Seed Phrase
                </button>
              </>
            )}

          </div>
        )}

        {mode === 'passcode' && (
          <>
            <input
              type="password"
              placeholder="Enter Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />

            <button
              className="btn-primary"
              onClick={handlePasscodeLogin}
              disabled={loading}
            >
              {loading ? 'Unlocking...' : 'Unlock Wallet'}
            </button>

            <button className="btn-text" onClick={() => setMode('select')}>
              Back
            </button>
          </>
        )}

        {mode === 'phrase' && (
          <>
            <textarea
              placeholder="Enter Seed Phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
            />

            <button
              className="btn-primary"
              onClick={handlePhraseLogin}
              disabled={loading}
            >
              {loading ? 'Importing...' : 'Import Wallet'}
            </button>

            <button className="btn-text" onClick={() => setMode('select')}>
              Back
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
