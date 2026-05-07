import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { generateSeedPhrase } from '../../utils/wallet';
import { copyToClipboard } from '../../utils/helpers';
import { deriveKeyFromPasscode, encryptData } from '../../utils/crypto';

const BACKEND_URL =
  process.env.REACT_APP_API_URL ||'https://blockvault-backend-production.up.railway.app/api';

const ProgressBar = ({ step }) => (
  <div className="progress-bar">
    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Identity</div>
    <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Security</div>
    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Secret Key</div>
  </div>
);

const SeedPhraseGrid = ({ phrase }) => (
  <div className="seed-phrase-grid">
    {phrase.map((word, index) => (
      <div
        key={index}
        className="seed-word"
        onClick={() => copyToClipboard(word)}
      >
        <span>{index + 1}. {word}</span>
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
  const [confirmWords, setConfirmWords] = useState({ w1: '', w2: '' });

  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate seed once
  useEffect(() => {
    if (step === 3 && seedPhrase.length === 0) {
      setSeedPhrase(generateSeedPhrase());
    }
  }, [step, seedPhrase.length]);

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));

  const verifySeed = () => {
    // pick 2 random words for verification
    return seedPhrase[1] === confirmWords.w1 &&
           seedPhrase[5] === confirmWords.w2;
  };

  const handleCreateAccount = async () => {
    if (!savedConfirmed || passcode.length < 6) return;

    if (!verifySeed()) {
      setError('Seed phrase verification failed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const phrase = seedPhrase.join(' ');

      // derive encryption key from passcode
      const key = await deriveKeyFromPasscode(passcode);

      // encrypt seed locally
      const encryptedSeed = await encryptData(phrase, key);

      // create wallet locally (NON-custodial model)
      const wallet = ethers.Wallet.fromPhrase(phrase);

      // backend ONLY stores identity (NOT wallet control)
      const res = await axios.post(`${BACKEND_URL}/auth/register`, {
        email
      });

      const { token, user } = res.data;

      localStorage.setItem('authToken', token);

      // store encrypted wallet locally ONLY
      localStorage.setItem(
        'wallet_data',
        JSON.stringify({
          email,
          address: wallet.address,
          encryptedSeed
        })
      );

      localStorage.setItem('onboarded', 'true');

      navigate('/app/dashboard');
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
          <div>
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              disabled={!email.includes('@')}
              onClick={nextStep}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <input
              type="password"
              placeholder="6+ digit passcode"
              value={passcode}
              maxLength={12}
              onChange={(e) =>
                setPasscode(e.target.value.replace(/\s/g, ''))
              }
            />

            <button
              disabled={passcode.length < 6}
              onClick={nextStep}
            >
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3>Save Your Seed Phrase</h3>

            <SeedPhraseGrid phrase={seedPhrase} />

            <button onClick={() => copyToClipboard(seedPhrase.join(' '))}>
              Copy Phrase
            </button>

            <p>Verify your phrase:</p>

            <input
              placeholder="Word #2"
              onChange={(e) =>
                setConfirmWords({ ...confirmWords, w1: e.target.value })
              }
            />

            <input
              placeholder="Word #6"
              onChange={(e) =>
                setConfirmWords({ ...confirmWords, w2: e.target.value })
              }
            />

            <label>
              <input
                type="checkbox"
                checked={savedConfirmed}
                onChange={(e) => setSavedConfirmed(e.target.checked)}
              />
              I saved my seed safely
            </label>

            <button
              disabled={!savedConfirmed || loading}
              onClick={handleCreateAccount}
            >
              {loading ? 'Creating...' : 'Create Wallet'}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
