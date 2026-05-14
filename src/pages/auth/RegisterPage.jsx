import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

import {
  generateSeedPhrase,
  copyToClipboard,
  deriveKeyFromPasscode,
  encryptData
} from '../../utils/wallet';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const ProgressBar = ({ step }) => (
  <div className="progress-bar">
    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Get Started</div>
    <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Security</div>
    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Secret Key</div>
  </div>
);

const SeedPhraseGrid = ({ phrase }) => (
  <div className="seed-phrase-grid">
    {phrase.map((word, i) => (
      <div key={i} className="seed-word" onClick={() => copyToClipboard(word)}>
        {i + 1}. {word}
      </div>
    ))}
  </div>
);

const RegisterPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [passcode, setPasscode] = useState('');
  const [seedPhrase, setSeedPhrase] = useState([]);
  const [confirm, setConfirm] = useState({ w1: '', w2: '' });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate seed only when we reach step 3
  useEffect(() => {
    if (step === 3 && seedPhrase.length === 0) {
      setSeedPhrase(generateSeedPhrase());
    }
  }, [step]);

  // Validation helper
  const verifySeed = () =>
    seedPhrase[1] === confirm.w1 && seedPhrase[5] === confirm.w2;

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));

  const handleCreateAccount = async () => {
    // Validation
    if (!saved) return setError('Please confirm you have saved your seed phrase.');
    if (passcode.length < 6) return setError('Passcode must be at least 6 characters.');
    if (!verifySeed()) return setError('Seed verification words do not match.');

    setLoading(true);
    setError('');

    try {
      const phraseString = seedPhrase.join(' ');

      // 1. ENCRYPT LOCALLY (Custody stays with user)
      const key = await deriveKeyFromPasscode(passcode);
      const encrypted = await encryptData(phraseString, key);

      // 2. DERIVE WALLET
      const wallet = ethers.Wallet.fromPhrase(phraseString);

      // 3. BACKEND AUTHENTICATION (Nonce -> Sign -> Verify)
      // Includes 503 retry logic for Railway cold starts
      let nonceRes;
      let retries = 5;
      
      while (retries > 0) {
        try {
          nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, {
            walletAddress: wallet.address
          });
          break; // Success — exit retry loop
        } catch (err) {
          if (err.response?.status === 503 && retries > 1) {
            console.log('Server is initializing, retrying in 1s...');
            await new Promise(res => setTimeout(res, 1000));
            retries--;
          } else {
            throw err; // Not a 503, or out of retries — throw
          }
        }
      }

      // CRITICAL FIX: Expect the backend to return the actual message containing the nonce.
      const messageToSign = nonceRes.data.messageToSign || nonceRes.data.message;
      
      if (!messageToSign || messageToSign === 'ok') {
        throw new Error("Authentication setup error: Backend did not return a valid message to sign.");
      }

      const signature = await wallet.signMessage(messageToSign);

      const authRes = await axios.post(`${API_BASE_URL}/auth/verify`, {
        walletAddress: wallet.address,
        signature,
        message: messageToSign,
        walletType: 'created' // Removed email, DB is wallet-only
      });

      // 4. SAVE AUTH STATE
      localStorage.setItem('authToken', authRes.data.token);
      localStorage.setItem('user', JSON.stringify(authRes.data.user));

      // 5. SAVE ENCRYPTED WALLET DATA (Local Only)
      localStorage.setItem(
        'wallet_encrypted',
        JSON.stringify({
          address: wallet.address,
          encryptedSeed: encrypted.data,
          iv: encrypted.iv,
          createdAt: new Date().toISOString()
        })
      );

      navigate('/home');

    } catch (err) {
      console.error(err);
      
      if (err.response?.status === 503) {
        setError('Server is still starting up. Please wait a moment and try again.');
      } else if (err.message === 'Network Error') {
        setError('Network error — check your connection or CORS settings.');
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create New Wallet</h2>

        <ProgressBar step={step} />

        {/* STEP 1: INFO (Replaced Email) */}
        {step === 1 && (
          <div className="step-content">
            <div className="info-box" style={{ textAlign: 'center', padding: '1rem', background: '#1a1a2e', borderRadius: '8px', marginBottom: '1rem' }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#6c63ff' }}></i>
              <h3 style={{ margin: '0.5rem 0' }}>Non-Custodial Security</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                BlockVault never stores your private keys or seed phrases. You are the sole owner of your wallet.
              </p>
            </div>
            <button className="btn-primary" onClick={nextStep}>
              Create Wallet
            </button>
          </div>
        )}

        {/* STEP 2: SECURITY */}
        {step === 2 && (
          <div className="step-content">
            <div className="input-group">
              <label>Create Passcode (6+ characters)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={12}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\s/g, ''))}
                placeholder="Encrypts your wallet locally"
                autoFocus
              />
            </div>
            <button 
              className="btn-primary" 
              disabled={passcode.length < 6} 
              onClick={nextStep}
            >
              Set Passcode
            </button>
          </div>
        )}

        {/* STEP 3: SECRET KEY */}
        {step === 3 && (
          <div className="step-content">
            <h3>Backup Seed Phrase</h3>
            <p className="text-muted">
              Never share this phrase with anyone. We cannot recover it for you.
            </p>

            <SeedPhraseGrid phrase={seedPhrase} />

            <button className="btn-secondary" onClick={() => copyToClipboard(seedPhrase.join(' '))}>
              <i className="fa-regular fa-copy"></i> Copy to Clipboard
            </button>

            <div className="verification-section">
              <label>Verify Word #{2}</label>
              <input
                value={confirm.w1}
                onChange={(e) => setConfirm({ ...confirm, w1: e.target.value.trim().toLowerCase() })}
                placeholder={`Enter word #2`}
              />

              <label>Verify Word #{6}</label>
              <input
                value={confirm.w2}
                onChange={(e) => setConfirm({ ...confirm, w2: e.target.value.trim().toLowerCase() })}
                placeholder={`Enter word #6`}
              />
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={saved}
                  onChange={(e) => setSaved(e.target.checked)}
                />
                <span>I have safely stored my seed phrase</span>
              </label>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button
              className="btn-primary"
              disabled={!saved || loading}
              onClick={handleCreateAccount}
              style={{ marginTop: '1rem' }}
            >
              {loading ? 'Creating Account...' : 'Create Wallet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
