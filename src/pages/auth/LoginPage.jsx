import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 1. Import Axios for API calls
import { ethers } from 'ethers'; // 2. Import Ethers for signing messages
import { isBiometricAvailable } from '../../utils/device.js';
import { copyToClipboard } from '../../utils/helpers.js';
import { decryptData } from '../../utils/crypto.js';

const STORAGE_KEY = 'cryptoBeanAccount';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getLocalAccount = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

// Helper: Perform the Backend Wallet Auth Flow
const authenticateWithBackend = async (seedPhrase) => {
  try {
    // 1. Derive Wallet Address from Seed
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    const walletAddress = wallet.address;

    // 2. Request a Nonce from Backend
    const nonceRes = await axios.post(`${API_BASE_URL}/auth/wallet/nonce`, {
      walletAddress,
    });

    const { messageToSign } = nonceRes.data;

    // 3. Sign the message locally using the Seed (Private Key)
    const signature = await wallet.signMessage(messageToSign);

    // 4. Verify Signature with Backend
    const verifyRes = await axios.post(`${API_BASE_URL}/auth/wallet/verify`, {
      walletAddress,
      signature,
      message: messageToSign,
    });

    // 5. Store Token and Return
    if (verifyRes.data.token) {
      localStorage.setItem('authToken', verifyRes.data.token);
      localStorage.setItem('userInfo', JSON.stringify(verifyRes.data.user));
      return { success: true, user: verifyRes.data.user };
    }
    return { success: false };
  } catch (error) {
    console.error('Authentication Error:', error.response?.data?.message || error.message);
    throw error;
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loginMethod, setLoginMethod] = useState(null);
  const [passcode, setPasscode] = useState('');
  const [seed, setSeed] = useState(''); // For manual seed input
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const acc = getLocalAccount();
    if (acc) setAccount(acc);
  }, []);

  const handlePasscodeLogin = async () => {
    if (!account) return setError('No account found. Please register.');
    if (passcode.length !== 6) return setError('Passcode must be 6 digits.');

    setLoading(true);
    setError('');

    try {
      // 1. Decrypt local encrypted seed using passcode
      const decryptedSeed = await decryptData(account.encryptedSeed, passcode);

      // 2. Authenticate with Backend using the decrypted seed
      await authenticateWithBackend(decryptedSeed);

      // 3. Navigate to Dashboard
      navigate('/app/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (msg.includes('Invalid signature') || msg.includes('decrypt')) {
        setError('Invalid passcode');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!account) return setError('No account found. Please register.');
    if (!isBiometricAvailable()) return setError('Biometrics not supported.');

    setLoading(true);
    setError('');

    try {
      // 1. Unlock seed locally via biometrics
      // (Assuming decryptData handles platform biometric prompts internally)
      const decryptedSeed = await decryptData(account.encryptedSeed, 'biometricKey');

      // 2. Authenticate with Backend
      await authenticateWithBackend(decryptedSeed);

      navigate('/app/dashboard');
    } catch (err) {
      setError('Biometric login failed or cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedPhraseLogin = async () => {
    // Validates if a seed was pasted into the text area
    if (!seed || seed.trim().split(/\s+/).length < 12) {
      return setError('Please enter a valid 12 or 24-word secret phrase.');
    }

    setLoading(true);
    setError('');

    try {
      // 1. Directly authenticate with the provided seed
      await authenticateWithBackend(seed.trim());
      
      // Optional: If you want to save this new imported device locally, 
      // you would encrypt the seed here and save to localStorage.
      
      navigate('/app/dashboard');
    } catch (err) {
      setError('Invalid secret phrase or login failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setLoginMethod(null);
    setPasscode('');
    setSeed('');
    setError('');
  };

  if (!loginMethod) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="card-header">
            <div className="logo">CryptoBean</div>
            <h2>Log In</h2>
            <p>Choose your preferred login method.</p>
          </div>
          <div className="card-body login-options-grid">
            {isBiometricAvailable() && (
              <button className="option-card" onClick={handleBiometricLogin} disabled={loading}>
                👆<span>Biometrics</span>
              </button>
            )}
            <button className="option-card" onClick={() => setLoginMethod('passcode')} disabled={loading}>
              🔒<span>Passcode</span>
            </button>
            <button className="option-card" onClick={() => setLoginMethod('passphrase')} disabled={loading}>
              🔑<span>Secret Phrase</span>
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <button className="back-button" onClick={resetState}>← Back</button>
          <h2>
            {loginMethod === 'passcode' ? 'Enter Passcode' : 'Enter Secret Phrase'}
          </h2>
        </div>

        <div className="card-body">
          {error && <div className="error-message">{error}</div>}

          {loginMethod === 'passcode' && (
            <div className="input-group">
              <input
                type="password"
                className="input-primary input-passcode"
                placeholder="Enter 6-digit passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                autoFocus
              />
              <button
                className="button-primary button-large"
                onClick={handlePasscodeLogin}
                disabled={passcode.length !== 6 || loading}
              >
                {loading ? 'Verifying...' : 'Unlock & Login'}
              </button>
            </div>
          )}

          {loginMethod === 'passphrase' && (
            <div className="input-group">
              <textarea
                className="input-primary"
                placeholder="Paste your 12 or 24 word secret phrase here..."
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                rows={4}
                autoFocus
              />
              <button
                className="button-primary button-large"
                onClick={handleSeedPhraseLogin}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Login with Phrase'}
              </button>
              <div className="text-sm text-gray-500 mt-2 text-center">
                This phrase never leaves your device unencrypted.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
