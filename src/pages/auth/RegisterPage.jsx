import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

import {
  generateSeedPhrase,
  copyToClipboard,
  deriveKeyFromPasscode,
  encryptData,
  isBiometricAvailable
} from '../../utils/wallet';

import { setSessionWallet } from '../../utils/session';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';
const STORAGE_KEY = 'wallet_encrypted';

// ─────────────────────────────────────────────
// Device-bound Salt (Singleton pattern)
// ─────────────────────────────────────────────
const getDeviceSalt = () => {
  let salt = localStorage.getItem('device_salt');
  if (!salt) {
    // Generate a UUID v4 salt
    salt = crypto.randomUUID();
    localStorage.setItem('device_salt', salt);
  }
  return salt;
};

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
  const [enableBiometric, setEnableBiometric] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 3 && seedPhrase.length === 0) {
      setSeedPhrase(generateSeedPhrase());
    }
  }, [step]);

  const verifySeed = () => {
    // Flexible verification: check indices 1 and 5 (0-indexed)
    return (
      seedPhrase[1]?.toLowerCase() === confirm.w1.toLowerCase() &&
      seedPhrase[5]?.toLowerCase() === confirm.w2.toLowerCase()
    );
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreateAccount = async () => {
    if (!saved) return setError('Please confirm you have saved your seed phrase.');
    if (passcode.length < 6) return setError('Passcode must be at least 6 digits.');
    if (!verifySeed()) return setError('Seed verification failed. Words do not match.');

    setLoading(true);
    setError('');

    try {
      const phraseString = seedPhrase.join(' ');

      // 1. Get Device Salt (Crucial for decryption later)
      const deviceSalt = getDeviceSalt();

      // 2. Derive Encryption Key (Passcode + Salt)
      const key = await deriveKeyFromPasscode(passcode + deviceSalt);

      // 3. Encrypt the Seed Phrase
      const encrypted = await encryptData(phraseString, key);

      // 4. Create Wallet Instance
      const wallet = ethers.Wallet.fromPhrase(phraseString);

      // 5. Backend Auth (Stateless)
      // Step A: Get Nonce
      const nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, {
        walletAddress: wallet.address
      });

      const messageToSign = nonceRes.data.messageToSign;

      // Step B: Sign Message
      const signature = await wallet.signMessage(messageToSign);

      // Step C: Verify & Get JWT
      const authRes = await axios.post(`${API_BASE_URL}/auth/verify`, {
        walletAddress: wallet.address,
        signature,
        message: messageToSign
      });

      // 6. Store Encrypted Vault (Local)
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          address: wallet.address,
          encryptedSeed: encrypted.data,
          iv: encrypted.iv,
          biometricEnabled: enableBiometric, // Save preference
          createdAt: new Date().toISOString()
        })
      );

      // 7. Set Session & Navigate
      setSessionWallet(wallet); // In-memory session
      localStorage.setItem('authToken', authRes.data.token);
      
      // Cleanup sensitive state
      setSeedPhrase([]);
      setPasscode('');

      navigate('/app/dashboard');

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Wallet</h2>
        <ProgressBar step={step} />

        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="step-content">
            <p>Your keys, your crypto. We never store your private key on our servers.</p>
            <button onClick={nextStep}>Get Started</button>
          </div>
        )}

        {/* STEP 2: Security Setup */}
        {step === 2 && (
          <div className="step-content">
            <input
              type="password"
              inputMode="numeric"
              maxLength={12}
              value={passcode}
              onChange={(e) =>
                setPasscode(e.target.value.replace(/\D/g, '').slice(0, 12))
              }
              placeholder="Create 6–12 digit passcode"
            />

            {isBiometricAvailable() && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enableBiometric}
                  onChange={(e) => setEnableBiometric(e.target.checked)}
                />
                Enable FaceID / Fingerprint
              </label>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={prevStep}>Back</button>
              <button
                disabled={passcode.length < 6}
                onClick={nextStep}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Seed Phrase */}
        {step === 3 && (
          <div className="step-content">
            <p className="warning-text">Write these down. Never share them.</p>
            <SeedPhraseGrid phrase={seedPhrase} />

            <button onClick={() => copyToClipboard(seedPhrase.join(' '))}>
              Copy to Clipboard
            </button>

            <div className="confirm-seed">
              <input
                placeholder="Confirm Word #2"
                onChange={(e) => setConfirm({ ...confirm, w1: e.target.value.trim() })}
              />
              <input
                placeholder="Confirm Word #6"
                onChange={(e) => setConfirm({ ...confirm, w2: e.target.value.trim() })}
              />
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
              />
              I have saved my seed phrase securely
            </label>

            {error && <div className="error-message">{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button onClick={prevStep}>Back</button>
              <button
                disabled={!saved || !verifySeed() || loading}
                onClick={handleCreateAccount}
              >
                {loading ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
