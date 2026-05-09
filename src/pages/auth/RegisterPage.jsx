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

const BACKEND_URL =
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

  useEffect(() => {
    if (step === 3 && seedPhrase.length === 0) {
      setSeedPhrase(generateSeedPhrase());
    }
  }, [step]);

  const verifySeed = () =>
    seedPhrase[1] === confirm.w1 && seedPhrase[5] === confirm.w2;

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));

  const handleCreateAccount = async () => {
    if (!saved || passcode.length < 6) return;

    if (!verifySeed()) {
      setError('Seed verification failed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const phrase = seedPhrase.join(' ');

      // LOCAL ONLY encryption (NEVER sent to backend)
      const key = await deriveKeyFromPasscode(passcode);
      const encrypted = await encryptData(phrase, key);

      const wallet = ethers.Wallet.fromPhrase(phrase);

      // NON-CUSTODIAL AUTH FLOW ONLY
      const nonce = await axios.post(`${BACKEND_URL}/auth/wallet/nonce`, {
        walletAddress: wallet.address
      });

      const message = nonce.data.messageToSign;
      const signature = await wallet.signMessage(message);

      const res = await axios.post(`${BACKEND_URL}/auth/wallet/verify`, {
        walletAddress: wallet.address,
        signature,
        message,
        email
      });

      localStorage.setItem('authToken', res.data.token);

      // LOCAL STORAGE ONLY (user-owned data)
      localStorage.setItem(
        'wallet_data',
        JSON.stringify({
          email,
          address: wallet.address,
          encryptedSeed: encrypted.data,
          iv: encrypted.iv
        })
      );

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h2>Create Wallet</h2>

        <ProgressBar step={step} />

        {step === 1 && (
          <>
            <input
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={nextStep}>Continue</button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="password"
              placeholder="6+ digit passcode"
              value={passcode}
              onChange={(e) =>
                setPasscode(e.target.value.replace(/\s/g, ''))
              }
            />
            <button disabled={passcode.length < 6} onClick={nextStep}>
              Next
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Save Seed Phrase</h3>

            <SeedPhraseGrid phrase={seedPhrase} />

            <button onClick={() => copyToClipboard(seedPhrase.join(' '))}>
              Copy
            </button>

            <input
              placeholder={`Word #2 (${seedPhrase[1]})`}
              onChange={(e) =>
                setConfirm({ ...confirm, w1: e.target.value })
              }
            />

            <input
              placeholder={`Word #6 (${seedPhrase[5]})`}
              onChange={(e) =>
                setConfirm({ ...confirm, w2: e.target.value })
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

            <button
              disabled={!saved || loading}
              onClick={handleCreateAccount}
            >
              {loading ? 'Creating...' : 'Create Wallet'}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
