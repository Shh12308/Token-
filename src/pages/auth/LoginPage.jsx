import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { decryptWallet } from '../../wallet/decryptWallet';
import { isBiometricAvailable } from '../../utils/device';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const STORAGE_KEY = 'wallet_encrypted';

const getStoredWallet = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

const requestNonce = async (walletAddress) => {
  const res = await axios.post(`${API_BASE_URL}/auth/wallet/nonce`, {
    walletAddress
  });
  return res.data.messageToSign;
};

const verifySignature = async (walletAddress, signature, message) => {
  const res = await axios.post(`${API_BASE_URL}/auth/wallet/verify`, {
    walletAddress,
    signature,
    message
  });
  return res.data;
};

const LoginPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState('select');
  const [passcode, setPasscode] = useState('');
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const storedWallet = getStoredWallet();

  // -----------------------------
  // CORE LOGIN (NON-CUSTODIAL SAFE)
  // -----------------------------
  const loginWithWallet = async (privateKey) => {
    try {
      const wallet = new ethers.Wallet(privateKey);

      const message = await requestNonce(wallet.address);
      const signature = await wallet.signMessage(message);

      const result = await verifySignature(wallet.address, signature, message);

      if (result.token) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        navigate('/app/dashboard');
      } else {
        throw new Error('No token returned');
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Try again.');
    }
  };

  // -----------------------------
  // PASSCODE LOGIN
  // -----------------------------
  const handlePasscodeLogin = async () => {
    if (!storedWallet) {
      setError('No wallet found.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const decrypted = await decryptWallet(
        storedWallet.encrypted,
        passcode,
        storedWallet.iv
      );

      await loginWithWallet(decrypted.privateKey);
    } catch {
      setError('Invalid passcode.');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // SEED PHRASE LOGIN
  // -----------------------------
  const handlePhraseLogin = async () => {
    if (!phrase || phrase.trim().split(/\s+/).length < 12) {
      setError('Invalid seed phrase');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const wallet = ethers.Wallet.fromPhrase(phrase.trim());
      await loginWithWallet(wallet.privateKey);
    } catch {
      setError('Invalid seed phrase');
      setLoading(false);
    }
  };

  // -----------------------------
  // BIOMETRIC LOGIN
  // -----------------------------
  const handleBiometricLogin = async () => {
    if (!storedWallet) return setError('No wallet found');
    if (!isBiometricAvailable()) return setError('Biometric not available');

    setLoading(true);

    try {
      const decrypted = await decryptWallet(
        storedWallet.encrypted,
        'biometric-unlock',
        storedWallet.iv
      );

      await loginWithWallet(decrypted.privateKey);
    } catch {
      setError('Biometric failed');
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (step === 'select') {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Unlock Wallet</h2>

          {isBiometricAvailable() && (
            <button onClick={handleBiometricLogin}>
              🔓 Biometric Unlock
            </button>
          )}

          <button onClick={() => setStep('passcode')}>🔐 Passcode</button>
          <button onClick={() => setStep('phrase')}>🔑 Seed Phrase</button>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (step === 'passcode') {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Enter Passcode</h2>

          <input
            type="password"
            maxLength={12}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value.replace(/\s/g, ''))}
            placeholder="Passcode"
          />

          <button onClick={handlePasscodeLogin} disabled={loading}>
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>

          <button onClick={() => setStep('select')}>Back</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (step === 'phrase') {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Import Wallet</h2>

          <textarea
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="12 or 24 word seed phrase"
            rows={4}
          />

          <button onClick={handlePhraseLogin} disabled={loading}>
            {loading ? 'Verifying...' : 'Login'}
          </button>

          <button onClick={() => setStep('select')}>Back</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

  return null;
};

export default LoginPage;
