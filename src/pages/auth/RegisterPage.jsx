// src/pages/auth/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSeedPhrase } from '../../utils/wallet';
import { copyToClipboard } from '../../utils/helpers';

// LocalStorage helpers
const STORAGE_KEY = 'cryptoBeanAccount';
const saveAccount = (account) => localStorage.setItem(STORAGE_KEY, JSON.stringify(account));

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

  // Generate seed phrase when reaching step 3
  useEffect(() => {
    if (currentStep === 3 && seedPhrase.length === 0) {
      setSeedPhrase(generateSeedPhrase());
    }
  }, [currentStep, seedPhrase.length]);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleCreateAccount = () => {
    if (!isConfirmedSaved || passcode.length !== 6) return;

    // Save account to localStorage
    saveAccount({ email, passcode, seedPhrase });

    // Redirect to login (or dashboard)
    navigate('/auth/login');
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="card-header">
          <h2>Create Your CryptoBean Account</h2>
          <ProgressBar step={currentStep} />
        </div>

        <div className="card-body">
          {/* STEP 1: Identity */}
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

          {/* STEP 2: Passcode */}
          {currentStep === 2 && (
            <div className="auth-step">
              <p>Create a 6-digit passcode. You'll use this to log in quickly.</p>
              <input
                type="password"
                className="input-primary input-passcode"
                placeholder="Enter 6-digit passcode"
                maxLength="6"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
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

          {/* STEP 3: Secret Phrase */}
          {currentStep === 3 && (
            <div className="auth-step seed-phrase-step">
              <div className="warning-box">
                <strong>⚠️ This is your master key.</strong>
                <p>Save it somewhere safe and private. We cannot recover it for you.</p>
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
                    onChange={(e) => setIsConfirmedSaved(e.target.checked)}
                  />
                  I have securely saved my secret phrase.
                </label>
              </div>

              <button
                className="button-primary button-large"
                onClick={handleCreateAccount}
                disabled={!isConfirmedSaved || passcode.length !== 6}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
