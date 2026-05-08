import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { decryptWallet } from '../../wallet/decryptWallet';
import { isBiometricAvailable } from '../../utils/device';

// 1. Use Fallback if Env Var is missing for Local Dev
// BUT in Production (Vercel), this MUST be set in Env Vars
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const STORAGE_KEY = 'wallet_encrypted';

const getStoredWallet = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

// Debug: Log to confirm URL
const requestNonce = async (walletAddress) => {
  console.log("Fetching Nonce from:", `${API_BASE_URL}/auth/wallet/nonce`);
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/wallet/nonce`, {
      walletAddress
    });
    return res.data.messageToSign;
  } catch (error) {
    console.error("Nonce Error:", error);
    throw error;
  }
};

const verifySignature = async (walletAddress, signature, message) => {
  console.log("Verifying at:", `${API_BASE_URL}/auth/wallet/verify`);
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/wallet/verify`, {
      walletAddress,
      signature,
      message
    });
    return res.data;
  } catch (error) {
    console.error("Verify Error:", error);
    throw error;
  }
};

const LoginPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState('select'); // select | unlock | phrase
  const [passcode, setPasscode] = useState('');
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const storedWallet = getStoredWallet();

  // -----------------------------
  // WALLET SIGN-IN CORE LOGIC
  // -----------------------------
  const loginWithWallet = async (privateKey) => {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const message = await requestNonce(wallet.address);
      const signature = await wallet.signMessage(message);
      const result = await verifySignature(
        wallet.address,
        signature,
        message
      );

      if (result.token) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        // Ensure this path matches your App.js
        navigate('/app/dashboard'); 
      } else {
        throw new Error("No token returned from backend");
      }
    } catch (err) {
      console.error("Login Failed:", err);
      if (err.code === 'ERR_NETWORK') {
        setError("Cannot connect to Backend. Check API URL in Settings.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  // -----------------------------
  // PASSCODE LOGIN (LOCAL UNLOCK)
  // -----------------------------
  const handlePasscodeLogin = async () => {
    if (!storedWallet) {
      setError('No wallet found. Please create one.');
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
    } catch (err) {
      setError('Invalid passcode or failed to decrypt wallet.');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // SEED PHRASE LOGIN (IMPORT)
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
    } catch (err) {
      setError('Invalid seed phrase');
      setLoading(false);
    }
  };

  // -----------------------------
  // BIOMETRIC LOGIN
  // -----------------------------
  const handleBiometricLogin = async () => {
    if (!storedWallet) {
      setError('No wallet found');
      return;
    }

    if (!isBiometricAvailable()) {
      setError('Biometrics not available');
      return;
    }

    setLoading(true);

    try {
      const decrypted = await decryptWallet(
        storedWallet.encrypted,
        'biometric-unlock',
        storedWallet.iv
      );
      await loginWithWallet(decrypted.privateKey);
    } catch (err) {
      setError('Biometric authentication failed');
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

          <button onClick={() => setStep('passcode')}>
            🔐 Passcode
          </button>

          <button onClick={() => setStep('phrase')}>
            🔑 Seed Phrase
          </button>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // -----------------------------
  // PASSCODE UI
  // -----------------------------
  if (step === 'passcode') {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Enter Passcode</h2>

          <input
            type="password"
            maxLength={12}
            value={passcode}
            onChange={(e) => 
              // FIX: Changed /\D/g to /\s/g to remove spaces, keep digits
              setPasscode(e.target.value.replace(/\s/g, ''))
            }
            placeholder="Passcode"
          />

          <button
            onClick={handlePasscodeLogin}
            disabled={loading}
          >
            {loading ? 'Unlocking...' : 'Unlock Wallet'}
          </button>

          <button onClick={() => setStep('select')}>
            Back
          </button>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // -----------------------------
  // SEED PHRASE UI
  // -----------------------------
  if (step === 'phrase') {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Import Wallet</h2>

          <textarea
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Enter 12 or 24 word seed phrase"
            rows={4}
            style={{width: '100%'}}
          />

          <button
            onClick={handlePhraseLogin}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Login'}
          </button>

          <button onClick={() => setStep('select')}>
            Back
          </button>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

  return null;
};

export default LoginPage;
