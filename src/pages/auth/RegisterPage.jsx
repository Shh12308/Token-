import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 1. Import Axios
import { ethers } from 'ethers'; // 2. Import Ethers to derive address
import { generateSeedPhrase } from '../../utils/wallet';
import { copyToClipboard } from '../../utils/helpers';
import { deriveKeyFromPasscode, encryptData } from '../../utils/crypto';

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
        title="Click to copy"
      >
        <span className="word-index">{index + 1}.</span>
        <span className="word-text">{word}</span>
      </div>
    ))}
  </div>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [seedPhrase, setSeedPhrase] = useState([]);
  const [isConfirmedSaved, setIsConfirmedSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only generate the seed phrase once when entering step 3
    if (currentStep === 3 && seedPhrase.length === 0) {
      setSeedPhrase(generateSeedPhrase());
    }
  }, [currentStep, seedPhrase.length]);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleCreateAccount = async () => {
    if (!isConfirmedSaved || passcode.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      // 1️⃣ Derive encryption key from passcode
      const key = await deriveKeyFromPasscode(passcode);

      // 2️⃣ Encrypt seed phrase locally
      const encryptedSeed = await encryptData(seedPhrase.join(' '), key);

      // 3️⃣ Register User on Backend
      // We use the passcode as the 'password' for the backend account
      const response = await axios.post(`${BACKEND_URL}/auth/register`, {
        email,
        password: passcode,
      });

      const { token, user } = response.data;

      // 4️⃣ Store Backend Session
      if (token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userInfo', JSON.stringify(user));
      }

      // 5️⃣ Store Encrypted Wallet Locally
      // Note: The wallet address derived here is local. 
      // To fully sync with backend features (like wallet history), 
      // you would typically send the walletAddress to the backend 
      // via a 'linkWallet' or 'updateProfile' call later.
      const wallet = ethers.Wallet.fromPhrase(seedPhrase.join(' '));
      
      localStorage.setItem(
        'cryptoBeanAccount',
        JSON.stringify({
          email,
          walletAddress: wallet.address, // Useful to store locally
          encryptedSeed
        })
      );

      // 6️⃣ Mark auth + onboarding complete
      localStorage.setItem('cryptoBean_auth', 'true');
      localStorage.setItem('cryptoBean_onboarded', 'true');

      // 7️⃣ Navigate to Dashboard
      navigate('/app/dashboard');

    } catch (err) {
      console.error(err);
      // Handle specific backend errors (e.g., email already exists)
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="card-header">
          <h2>Create Your CryptoBean Account</h2>
          <ProgressBar step={currentStep} />
        </div>

        <div className="card-body">
          {currentStep === 1 && (
            <div className="auth-step">
              <p>Enter your email or phone number.</p>
              <input
                type="email"
                className="input-primary"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="button-primary"
                onClick={handleNext}
                disabled={!email.includes('@')}
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="auth-step">
              <p>Create a 6-digit passcode. You'll use this to log in quickly and decrypt your wallet.</p>
              <input
                type="password"
                className="input-primary input-passcode"
                placeholder="Enter 6-digit passcode"
                maxLength={6}
                value={passcode}
                onChange={(e) =>
                  setPasscode(e.target.value.replace(/\D/g, ''))
                }
              />
              <button
                className="button-primary"
                onClick={handleNext}
                disabled={passcode.length !== 6}
              >
                Next
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="auth-step seed-phrase-step">
              <div className="warning-box">
                <strong>⚠️ This is your master key.</strong>
                <p>
                  Save it somewhere safe and private. We cannot recover it for you.
                </p>
              </div>

              <SeedPhraseGrid phrase={seedPhrase} />

              <button
                className="button-secondary"
                onClick={() => copyToClipboard(seedPhrase.join(' '))}
              >
                Copy Entire Phrase
              </button>

              <div className="confirmations">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isConfirmedSaved}
                    onChange={(e) =>
                      setIsConfirmedSaved(e.target.checked)
                    }
                  />
                  I have securely saved my secret phrase.
                </label>
              </div>

              <button
                className="button-primary button-large"
                onClick={handleCreateAccount}
                disabled={!isConfirmedSaved || loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              {error && <div className="error-message">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
