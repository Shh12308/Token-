import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

// ==========================================
// FIXED IMPORTS: Pointing to the consolidated utils
// ==========================================
import { 
  generateSeedPhrase, 
  copyToClipboard, 
  deriveKeyFromPasscode, 
  encryptData 
} from '../../utils/wallet';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [seedPhrase, setSeedPhrase] = useState([]);
  const [confirmWords, setConfirmWords] = useState({ w1: '', w2: '' });
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  // Generate seed once
  useEffect(() => {
    if (step === 3 && seedPhrase.length === 0) {
      try {
        setSeedPhrase(generateSeedPhrase());
      } catch (e) {
        console.error("Seed generation error:", e);
        setError("Failed to generate seed. Ensure you are on a secure connection (HTTPS).");
      }
    }
  }, [step, seedPhrase.length]);

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));

  const verifySeed = () => {
    return seedPhrase[1] === confirmWords.w1 && seedPhrase[5] === confirmWords.w2;
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
  const phraseString = seedPhrase.join(' ');

  // Create wallet (ethers v5 / v6 safe)
  let wallet;
  if (ethers.Wallet.fromPhrase) {
    wallet = ethers.Wallet.fromPhrase(phraseString);
  } else {
    wallet = ethers.Wallet.fromMnemonic(phraseString);
  }

  // Derive encryption key from passcode
  const key = await deriveKeyFromPasscode(passcode);

  // Encrypt seed locally
  const encryptedSeed = await encryptData(phraseString, key);

  // ==========================================
  // BACKEND INTEGRATION
  // ==========================================

  const nonceRes = await axios.post(`${BACKEND_URL}/auth/wallet/nonce`, {
    walletAddress: wallet.address
  });

  const { messageToSign } = nonceRes.data;

  const signature = await wallet.signMessage(messageToSign);

  const verifyRes = await axios.post(`${BACKEND_URL}/auth/wallet/verify`, {
    walletAddress: wallet.address,
    signature,
    message: messageToSign,
    walletType: 'created'
  });

  const { token, user } = verifyRes.data;
  localStorage.setItem('authToken', token);

  localStorage.setItem('wallet_data', JSON.stringify({
    email,
    address: wallet.address,
    encryptedSeed,
    iv: encryptedSeed.iv
  }));

  localStorage.setItem('onboarded', 'true');

  navigate('/');

} catch (err) {
  console.error(err);
  setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
              placeholder="Email (Optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={nextStep}>Continue</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <input
              type="password"
              placeholder="6+ digit passcode (Used to unlock locally)"
              value={passcode}
              maxLength={12}
              onChange={(e) => setPasscode(e.target.value.replace(/\s/g, ''))}
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
            <p style={{ fontSize: '0.8rem', color: '#666' }}>
              Never share this with anyone. We cannot recover it for you.
            </p>

            <SeedPhraseGrid phrase={seedPhrase} />

            <button onClick={() => copyToClipboard(seedPhrase.join(' '))}>
              Copy Phrase
            </button>

            <p>Verify your phrase:</p>

            <input
              placeholder={`Word #2 (${seedPhrase[1]})`}
              onChange={(e) =>
                setConfirmWords({ ...confirmWords, w1: e.target.value })
              }
            />

            <input
              placeholder={`Word #6 (${seedPhrase[5]})`}
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
