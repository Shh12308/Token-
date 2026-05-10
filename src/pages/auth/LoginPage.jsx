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
  const [mode, setMode] = useState('select'); // select, email, wallet-options, passcode, phrase
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [phrase, setPhrase] = useState('');

  const storedWallet = getStoredWallet();

  // --- 1. CORE AUTH FUNCTIONS ---

  // A. Traditional Email Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // B. Wallet Signature Login (Non-Custodial)
  const loginWithWallet = async (privateKey) => {
    try {
      const wallet = new ethers.Wallet(privateKey);

      // 1. Request Nonce
      const nonceRes = await axios.post(`${API_BASE_URL}/auth/wallet/nonce`, {
        walletAddress: wallet.address
      });
      const messageToSign = nonceRes.data.messageToSign;

      // 2. Sign Message
      const signature = await wallet.signMessage(messageToSign);

      // 3. Verify & Get Token
      const verifyRes = await axios.post(`${API_BASE_URL}/auth/wallet/verify`, {
        walletAddress: wallet.address,
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
      setError('Wallet login failed.');
    }
  };

  // C. Passcode Unlock (Decrypt Local Storage)
  const handlePasscodeLogin = async () => {
    if (!storedWallet) return setError('No local wallet found. Please register first.');
    
    setLoading(true);
    setError('');

    try {
      const key = await deriveKeyFromPasscode(passcode);
      const decryptedSeed = await decryptData(storedWallet.encryptedSeed, key, storedWallet.iv);
      
      // Derive private key from decrypted seed
      const wallet = ethers.Wallet.fromPhrase(decryptedSeed);
      await loginWithWallet(wallet.privateKey);
    } catch (err) {
      setError('Invalid passcode.');
    } finally {
      setLoading(false);
    }
  };

  // D. Seed Phrase Import
  const handlePhraseLogin = async () => {
    if (!phrase || phrase.trim().split(/\s+/).length < 12) {
      return setError('Invalid seed phrase');
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

  // E. Biometric Login
  const handleBiometricLogin = async () => {
    if (!storedWallet) return setError('No wallet found to unlock.');
    if (!isBiometricAvailable()) return setError('Biometrics not supported on this device.');

    setLoading(true);
    setError('');

    try {
      // NOTE: This simulates biometrics acting as the 'passcode' for decryption.
      // In a production WebAuthn flow, you would request a credential here.
      // For this logic structure, we use the specific key 'biometric-unlock'.
      
      // If you have a real biometric SDK, replace this block with their logic.
      // Otherwise, we treat the 'biometric-unlock' string as the password.
      const key = await deriveKeyFromPasscode('biometric-unlock'); 
      
      // Attempt to decrypt. If this was encrypted with a passcode, this will fail.
      // This works if the wallet was originally 'registered' using biometrics.
      const decryptedSeed = await decryptData(storedWallet.encryptedSeed, key, storedWallet.iv);
      
      const wallet = ethers.Wallet.fromPhrase(decryptedSeed);
      await loginWithWallet(wallet.privateKey);
      
    } catch (err) {
      console.error(err);
      setError('Biometric verification failed or wallet not bound to biometrics.');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. RENDERERS ---

  if (mode === 'select') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="text-muted">How would you like to sign in?</p>
          
          <div className="auth-options">
            <button className="btn-secondary" onClick={() => setMode('email')}>
              <i className="fa-solid fa-envelope"></i> Email & Password
            </button>
            
            <button className="btn-secondary" onClick={() => setMode('wallet-options')}>
              <i className="fa-solid fa-wallet"></i> Wallet / Seed Phrase
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'email') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Email Login</h2>
          <form onSubmit={handleEmailLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@example.com" 
                required 
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
              />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
          <button className="btn-text" onClick={() => setMode('select')}>Back</button>
        </div>
      </div>
    );
  }

  if (mode === 'wallet-options') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Unlock Wallet</h2>
          
          {isBiometricAvailable() && storedWallet && (
            <button className="btn-primary" onClick={handleBiometricLogin}>
              🔓 Biometric Unlock
            </button>
          )}

          {storedWallet && (
            <button className="btn-secondary" onClick={() => setMode('passcode')}>
              🔐 Passcode
            </button>
          )}

          <button className="btn-secondary" onClick={() => setMode('phrase')}>
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
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            autoFocus
          />
          {error && <div className="error-msg">{error}</div>}
          <button onClick={handlePasscodeLogin} disabled={loading} className="btn-primary">
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
          <button className="btn-text" onClick={() => setMode('wallet-options')}>Back</button>
        </div>
      </div>
    );
  }

  if (mode === 'phrase') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Import Wallet</h2>
          <textarea
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Enter your 12 or 24 word seed phrase..."
            rows={4}
          />
          {error && <div className="error-msg">{error}</div>}
          <button onClick={handlePhraseLogin} disabled={loading} className="btn-primary">
            {loading ? 'Verifying...' : 'Import & Login'}
          </button>
          <button className="btn-text" onClick={() => setMode('wallet-options')}>Back</button>
        </div>
      </div>
    );
  }

  return null;
};

export default LoginPage;
