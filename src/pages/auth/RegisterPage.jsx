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
    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Identity</div>
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
  const [email, setEmail] = useState('');
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

      // 3. BACKEND AUTHENTICATION (Signature flow)
      // We verify the wallet exists on the backend and link the email if provided
      const nonce = await axios.post(`${API_BASE_URL}/auth/wallet/nonce`, {
        walletAddress: wallet.address
      });

      const messageToSign = nonce.data.messageToSign;
      const signature = await wallet.signMessage(messageToSign);

      const authRes = await axios.post(`${API_BASE_URL}/auth/wallet/verify`, {
        walletAddress: wallet.address,
        signature,
        message: messageToSign,
        email, // Optional: Link email to this wallet
        walletType: 'created'
      });

      // 4. SAVE AUTH STATE
      localStorage.setItem('authToken', authRes.data.token);
      localStorage.setItem('user', JSON.stringify(authRes.data.user));

      // 5. SAVE ENCRYPTED WALLET DATA (Local Only)
      // This allows future login via passcode without re-entering seed
      localStorage.setItem(
        'wallet_encrypted',
        JSON.stringify({
          email,
          address: wallet.address,
          encryptedSeed: encrypted.data,
          iv: encrypted.iv,
          createdAt: new Date().toISOString()
        })
      );

      navigate('/app/dashboard');

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create New Wallet</h2>

        <ProgressBar step={step} />

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <div className="step-content">
            <div className="input-group">
              <label>Email (Optional)</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={nextStep}>
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: SECURITY */}
        {step === 2 && (
          <div className="step-content">
            <div className="input-group">
              <label>Create Passcode (6+ digits)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={12}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\s/g, ''))}
                placeholder="Enter a secure passcode"
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
              <label>Verify Word #{seedPhrase[1]}</label>
              <input
                value={confirm.w1}
                onChange={(e) => setConfirm({ ...confirm, w1: e.target.value })}
                placeholder={`Enter word #${seedPhrase[1]}`}
              />

              <label>Verify Word #{seedPhrase[5]}</label>
              <input
                value={confirm.w2}
                onChange={(e) => setConfirm({ ...confirm, w2: e.target.value })}
                placeholder={`Enter word #${seedPhrase[5]}`}
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
