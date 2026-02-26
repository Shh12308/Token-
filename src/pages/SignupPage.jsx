// src/pages/auth/SignupPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateAccountMutation } from '../../services/authApi'; // Mock API hook
import { generateSeedPhrase } from '../../utils/wallet'; // Mock utility function
import { copyToClipboard } from '../../utils/helpers'; // Mock utility function

// Sub-component for the progress bar
const ProgressBar = ({ step }) => (
  <div className="progress-bar">
    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Identity</div>
    <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Security</div>
    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Secret Key</div>
  </div>
);

// Sub-component for displaying the seed phrase grid
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


const SignupPage = () => {
  const navigate = useNavigate();
  const [createAccount, { isLoading, isSuccess }] = useCreateAccountMutation();

  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [seedPhrase, setSeedPhrase] = useState([]);
  const [isConfirmedSaved, setIsConfirmedSaved] = useState(false);

  // Generate seed phrase when we reach step 3
  useEffect(() => {
    if (currentStep === 3 && seedPhrase.length === 0) {
      setSeedPhrase(generateSeedPhrase()); // e.g., ["abandon", "ability", ...]
    }
  }, [currentStep, seedPhrase.length]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleCreateAccount = async () => {
    if (!isConfirmedSaved) return;

    try {
      await createAccount({ email, passcode, seedPhrase }).unwrap();
      // On success, the Redux store will be updated and the user will be logged in
      // The main layout will handle redirecting to the dashboard
    } catch (error) {
      console.error("Failed to create account:", error);
      // Handle error display to the user
    }
  };

  // Redirect to dashboard on successful signup
  useEffect(() => {
    if (isSuccess) {
      navigate('/app/dashboard');
    }
  }, [isSuccess, navigate]);

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="card-header">
          <h2>Create Your CryptoBean Account</h2>
          <ProgressBar step={currentStep} />
        </div>

        <div className="card-body">
          {/* --- STEP 1: IDENTITY --- */}
          {currentStep === 1 && (
            <div className="auth-step">
              <p>Let's start with your email or phone number.</p>
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
                disabled={!email.includes('@')} // Simple validation
              >
                Continue
              </button>
            </div>
          )}

          {/* --- STEP 2: SECURITY --- */}
          {currentStep === 2 && (
            <div className="auth-step">
              <p>Create a 6-digit passcode. You'll use this to log in quickly.</p>
              <input
                type="password"
                className="input-primary input-passcode"
                placeholder="Enter 6-digit passcode"
                maxLength="6"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))} // Only numbers
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

          {/* --- STEP 3: SECRET KEY --- */}
          {currentStep === 3 && (
            <div className="auth-step seed-phrase-step">
              <div className="warning-box">
                <strong>⚠️ This is your master key.</strong>
                <p>Save it somewhere safe and private. We cannot recover it for you.</p>
              </div>
              
              <SeedPhraseGrid phrase={seedPhrase} />

              <button className="button-secondary" onClick={() => copyToClipboard(seedPhrase.join(' '))}>
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
                disabled={!isConfirmedSaved || isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
