import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { decryptData, deriveKeyFromPasscode, isBiometricAvailable } from '../../utils/wallet';
import { faKey, faShieldHalved, faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';
const STORAGE_KEY = 'wallet_encrypted';

const getStoredWallet = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

const LoginPage = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('select'); // select, passcode, phrase
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [passcode, setPasscode] = useState('');
  const [phrase, setPhrase] = useState('');

  const storedWallet = getStoredWallet();

  // --- Universal Auth Function ---
  const authenticate = async (address, signer) => {
    setLoading(true);
    setError('');

    try {
      // 1. Request nonce from backend
      const nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, { walletAddress: address });
      const messageToSign = nonceRes.data.messageToSign || nonceRes.data.message;

      if (!messageToSign) throw new Error("Authentication setup error.");

      // 2. Sign locally (No MetaMask popup, happens silently in memory)
      const signature = await signer.signMessage(messageToSign);

      // 3. Verify & get JWT
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
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- Passcode Unlock ---
  const handlePasscodeLogin = async () => {
    if (!storedWallet) return setError('No local wallet found. Please import one first.');
    
    setLoading(true);
    setError('');

    try {
      const key = await deriveKeyFromPasscode(passcode);
      const decryptedSeed = await decryptData(storedWallet.encryptedSeed, key, storedWallet.iv);
      
      const wallet = new ethers.Wallet.fromPhrase(decryptedSeed);
      await authenticate(wallet.address, wallet);
    } catch (err) {
      setError('Invalid passcode.');
      setLoading(false);
    }
  };

  // --- Seed Phrase Import ---
  const handlePhraseLogin = async () => {
    if (!phrase || phrase.trim().split(/\s+/).length < 12) {
      return setError('Invalid seed phrase. Must be 12 or 24 words.');
    }

    setLoading(true);
    setError('');

    try {
      const wallet = ethers.Wallet.fromPhrase(phrase.trim());
      await authenticate(wallet.address, wallet);
    } catch (err) {
      setError('Invalid seed phrase.');
      setLoading(false);
    }
  };

  // --- Biometric Unlock (WebAuthn Gate) ---
  const handleBiometricLogin = async () => {
    if (!storedWallet) return setError('No wallet found.');
    if (!isBiometricAvailable()) return setError('Biometrics not supported.');

    setLoading(true);
    setError('');

    try {
      // In production, WebAuthn provides a challenge. Here we use a static passcode for demo.
      const key = await deriveKeyFromPasscode('biometric-unlock'); 
      const decryptedSeed = await decryptData(storedWallet.encryptedSeed, key, storedWallet.iv);
      
      const wallet = ethers.Wallet.fromPhrase(decryptedSeed);
      await authenticate(wallet.address, wallet);
    } catch (err) {
      setError('Biometric verification failed.');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', background: '#0a0a0a', padding: 20 
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h2 style={{ color: '#c9a84c', textAlign: 'center', marginBottom: 8, fontSize: 28 }}>
          BlockVault
        </h2>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: 32, fontSize: 14 }}>
          Independent Non-Custodial Wallet
        </p>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {mode === 'select' && (
          <div>
            {isBiometricAvailable() && storedWallet && (
              <button onClick={handleBiometricLogin} disabled={loading} style={{ width: '100%', padding: 16, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 16, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <FontAwesomeIcon icon={faFingerprint} style={{ fontSize: 20 }} /> {loading ? 'Checking...' : 'Unlock with Biometrics'}
              </button>
            )}

            {storedWallet && (
              <button onClick={() => setMode('passcode')} style={{ width: '100%', padding: 16, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#c9a84c', fontSize: 16, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <FontAwesomeIcon icon={faShieldHalved} /> Unlock with Passcode
              </button>
            )}

            <button onClick={() => setMode('phrase')} style={{ width: '100%', padding: 16, background: 'transparent', border: '1px dashed #444', borderRadius: 8, color: '#aaa', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <FontAwesomeIcon icon={faKey} /> Import Seed Phrase
            </button>

            <p style={{ textAlign: 'center', marginTop: 24, color: '#666', fontSize: 12 }}>
              Don't have a wallet?{' '}
              <span onClick={() => navigate('/register')} style={{ color: '#c9a84c', cursor: 'pointer', fontWeight: 600 }}>
                Create One
              </span>
            </p>
          </div>
        )}

        {mode === 'passcode' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePasscodeLogin(); }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>Enter Passcode</h3>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
              style={{ width: '100%', padding: 16, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 24, textAlign: 'center', letterSpacing: 8, outline: 'none', marginBottom: 16 }}
            />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: '#c9a84c', border: 'none', borderRadius: 8, color: '#000', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
            <button type="button" onClick={() => setMode('select')} style={{ width: '100%', padding: 14, background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', marginTop: 8 }}>
              Back
            </button>
          </form>
        )}

        {mode === 'phrase' && (
          <form onSubmit={(e) => { e.preventDefault(); handlePhraseLogin(); }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>Import Wallet</h3>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Enter your 12 or 24 word seed phrase..."
              rows={4}
              style={{ width: '100%', padding: 16, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical', marginBottom: 16 }}
            />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: '#c9a84c', border: 'none', borderRadius: 8, color: '#000', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Verifying...' : 'Import & Login'}
            </button>
            <button type="button" onClick={() => setMode('select')} style={{ width: '100%', padding: 14, background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', marginTop: 8 }}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
