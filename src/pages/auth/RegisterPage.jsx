import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

import {
  generateSeedPhrase,
  copyToClipboard,
  deriveKeyFromPasscode,
  encryptData,
  unlockLocalVault,
  isBiometricAvailable
} from '../../utils/wallet';

import { setSessionWallet } from '../../utils/session';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const STORAGE_KEY = 'wallet_encrypted';

// ─────────────────────────────────────────────
// Device-bound key
// ─────────────────────────────────────────────
const getDeviceSalt = () => {
  let salt = localStorage.getItem('device_salt');
  if (!salt) {
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

  const verifySeed = () =>
    seedPhrase[1] === confirm.w1 && seedPhrase[5] === confirm.w2;

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreateAccount = async () => {
    if (!saved) return setError('Please confirm seed phrase saved.');
    if (passcode.length < 6) return setError('Passcode must be at least 6 digits.');
    if (!verifySeed()) return setError('Seed verification failed.');

    setLoading(true);
    setError('');

    try {
      const phraseString = seedPhrase.join(' ');

      const deviceSalt = getDeviceSalt();
      const key = await deriveKeyFromPasscode(passcode + deviceSalt);

      const encrypted = await encryptData(phraseString, key);

      if (enableBiometric && isBiometricAvailable()) {
        await unlockLocalVault();
      }

      const wallet = ethers.Wallet.fromPhrase(phraseString);

      const nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, {
        walletAddress: wallet.address
      });

      const messageToSign = nonceRes.data.messageToSign;

      const signature = await wallet.signMessage(messageToSign);

      const authRes = await axios.post(`${API_BASE_URL}/auth/verify`, {
        walletAddress: wallet.address,
        signature,
        message: messageToSign
      });

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          address: wallet.address,
          encryptedSeed: encrypted.data,
          iv: encrypted.iv,
          biometricEnabled: enableBiometric,
          createdAt: new Date().toISOString()
        })
      );

      setSessionWallet(wallet);

      localStorage.setItem('authToken', authRes.data.token);
      localStorage.setItem('walletAddress', wallet.address);

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

        {/* STEP 1 */}
        {step === 1 && (
          <div className="step-content">
            <p>Fully non-custodial. You control everything.</p>
            <button onClick={nextStep}>Continue</button>
          </div>
        )}

        {/* STEP 2 */}
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
              <label>
                <input
                  type="checkbox"
                  checked={enableBiometric}
                  onChange={(e) => setEnableBiometric(e.target.checked)}
                />
                Enable Biometrics
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

        {/* STEP 3 */}
        {step === 3 && (
          <div className="step-content">
            <SeedPhraseGrid phrase={seedPhrase} />

            <button onClick={() => copyToClipboard(seedPhrase.join(' '))}>
              Copy
            </button>

            <input
              placeholder="Word #2"
              onChange={(e) =>
                setConfirm({
                  ...confirm,
                  w1: e.target.value.trim().toLowerCase()
                })
              }
            />

            <input
              placeholder="Word #6"
              onChange={(e) =>
                setConfirm({
                  ...confirm,
                  w2: e.target.value.trim().toLowerCase()
                })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
              />
              I saved my seed
            </label>

            {error && <div>{error}</div>}

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
