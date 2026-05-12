import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { decryptData, deriveKeyFromPasscode, isBiometricAvailable } from '../../utils/wallet';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const STORAGE_KEY = 'wallet_encrypted';

const getStoredWallet = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

const LoginPage = () => {
  const navigate = useNavigate();

  // UI State
  const [mode, setMode] = useState('select'); // select, local-options, passcode, phrase
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [passcode, setPasscode] = useState('');
  const [phrase, setPhrase] = useState('');

  const storedWallet = getStoredWallet();

  // --- 1. CORE NON-CUSTODIAL AUTH FUNCTION ---

  /**
   * Universal Authentication Function
   * Accepts an address and a signer (either from ethers.Wallet or Browser Extension Provider)
   */
  const authenticate = async (address, signer) => {
    setLoading(true);
    setError('');

    try {
      // 1. Request Nonce from Backend
      const nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, {
        walletAddress: address
      });

      // NOTE: Ensure your backend returns the exact string to be signed.
      // Standard Web3 auth flows return a message like: "BlockVault Login\nNonce: 123abc"
      const messageToSign = nonceRes.data.messageToSign || nonceRes.data.message;

      if (!messageToSign) {
        throw new Error("Backend did not return a message to sign.");
      }

      // 2. Sign Message (MetaMask prompts the user here, or local wallet signs in memory)
      const signature = await signer.signMessage(messageToSign);

      // 3. Verify Signature & Get JWT Token
      const verifyRes = await axios.post(`${API_BASE_URL}/auth/verify`, {
        walletAddress: address,
        signature,
        message: messageToSign
      });

      if (verifyRes.data.token) {
        localStorage.setItem('authToken', verifyRes.data.token);
        localStorage.setItem('user', JSON.stringify(verifyRes.data.user));
        navigate('/app/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Wallet authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LOGIN METHOD HANDLERS ---

  // A. Browser Extension Login (MetaMask, Coinbase, Brave Wallet, etc.)
  const handleBrowserWalletLogin = async () => {
    if (!window.ethereum) {
      return setError('No Web3 wallet detected. Please install MetaMask.');
    }

    setLoading(true);
    setError('');

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // Prompts user to connect
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      await authenticate(address, signer);
    } catch (err) {
      console.error(err);
      setError('Wallet connection rejected or failed.');
      setLoading(false);
    }
  };

  // B. Passcode Unlock (Decrypts local storage, signs in memory)
  const handlePasscodeLogin = async () => {
    if (!storedWallet) return setError('No local wallet found. Please import one first.');
    
    setLoading(true);
    setError('');

    try {
      const key = await deriveKeyFromPasscode(passcode);
      const decryptedSeed = await decryptData(storedWallet.encryptedSeed, key, storedWallet.iv);
      
      // Create a temporary wallet instance in memory
      const wallet = new ethers.Wallet.fromPhrase(decryptedSeed);
      await authenticate(wallet.address, wallet);
    } catch (err) {
      setError('Invalid passcode.');
      setLoading(false);
    }
  };

  // C. Seed Phrase Import
  const handlePhraseLogin = async () => {
    if (!phrase || phrase.trim().split(/\s+/).length < 12) {
      return setError('Invalid seed phrase. Must be 12 or 24 words.');
    }

    setLoading(true);
    setError('');

    try {
      // Create a temporary wallet instance in memory
      const wallet = ethers.Wallet.fromPhrase(phrase.trim());
      await authenticate(wallet.address, wallet);
    } catch (err) {
      console.error(err);
      setError('Invalid seed phrase.');
      setLoading(false);
    }
  };

  // D. Biometric Login
  const handleBiometricLogin = async () => {
    if (!storedWallet) return setError('No wallet found to unlock.');
    if (!isBiometricAvailable()) return setError('Biometrics not supported on this device.');

    setLoading(true);
    setError('');

    try {
      // In a production app, you'd use WebAuthn to gate access to the decryption key.
      // For this flow, we derive the key via the biometric-unlock string.
      const key = await deriveKeyFromPasscode('biometric-unlock'); 
      const decryptedSeed = await decryptData(storedWallet.encryptedSeed, key, storedWallet.iv);
      
      const wallet = ethers.Wallet.fromPhrase(decryptedSeed);
      await authenticate(wallet.address, wallet);
    } catch (err) {
      console.error(err);
      setError('Biometric verification failed or wallet not bound to biometrics.');
      setLoading(false);
    }
  };

  // --- 3. RENDERERS ---

  if (mode === 'select') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Welcome to BlockVault</h2>
          <p className="text-muted">Non-Custodial Web3 Login</p>
          
          <div className="auth-options">
            <button className="btn-primary" onClick={handleBrowserWalletLogin} disabled={loading}>
              <i className="fa-solid fa-puzzle-piece"></i> 
              {loading ? 'Connecting...' : 'Connect Browser Wallet'}
            </button>
            
            <div className="divider">OR</div>

            <button className="btn-secondary" onClick={() => setMode('local-options')}>
              <i className="fa-solid fa-key"></i> Use Local Wallet / Seed Phrase
            </button>
          </div>
          
          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    );
  }

  if (mode === 'local-options') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Unlock Local Wallet</h2>
          
          {isBiometricAvailable() && storedWallet && (
            <button className="btn-primary" onClick={handleBiometricLogin} disabled={loading}>
              🔓 Biometric Unlock
            </button>
          )}

          {storedWallet && (
            <button className="btn-secondary" onClick={() => setMode('passcode')} disabled={loading}>
              🔐 Passcode
            </button>
          )}

          <button className="btn-secondary" onClick={() => setMode('phrase')} disabled={loading}>
            🔑 Seed Phrase / Import
          </button>

          <button className="btn-text" onClick={() => setMode('select')}>Back</button>
          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    );
  }

  if (mode === 'passcode') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Enter Passcode</h2>
          <div className="input-group">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button onClick={handlePasscodeLogin} disabled={loading} className="btn-primary">
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
          <button className="btn-text" onClick={() => setMode('local-options')}>Back</button>
        </div>
      </div>
    );
  }

  if (mode === 'phrase') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Import Wallet</h2>
          <div className="input-group">
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Enter your 12 or 24 word seed phrase..."
              rows={4}
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button onClick={handlePhraseLogin} disabled={loading} className="btn-primary">
            {loading ? 'Verifying...' : 'Import & Login'}
          </button>
          <button className="btn-text" onClick={() => setMode('local-options')}>Back</button>
        </div>
      </div>
    );
  }

  return null;
};

export default LoginPage;
