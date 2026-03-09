// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation, useBiometricLoginMutation } from '../../services/authApi';
import { isBiometricAvailable } from '../../utils/device';

// Mock Icon Components - replace with your icon library
const IconFingerprint = () => <span className="icon">👆</span>;
const IconPasscode = () => <span className="icon">🔢</span>;
const IconKey = () => <span className="icon">🔑</span>;

const LoginPage = () => {
  const navigate = useNavigate();
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [biometricLogin, { isLoading: isBiometricLoading }] = useBiometricLoginMutation();

  const [loginMethod, setLoginMethod] = useState(null);
  const [passcode, setPasscode] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');

  const isLoading = isLoginLoading || isBiometricLoading;

  const handleLogin = async (type, credentials) => {
    setError('');
    try {
      await login({ type, credentials }).unwrap();
      navigate('/app/dashboard');
    } catch (err) {
      if (err.status === 401) {
        setError(`Incorrect ${type}. Please try again.`);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (passcode.length === 6) {
      handleLogin('passcode', passcode);
    }
  };

  const handlePassphraseSubmit = (e) => {
    e.preventDefault();
    const words = passphrase.trim().split(/\s+/);
    if (words.length === 12) {
      handleLogin('passphrase', passphrase.trim());
    } else {
      setError('A valid passphrase must contain exactly 12 words.');
    }
  };
  
  const handleBiometricClick = async () => {
    setError('');
    try {
      await biometricLogin().unwrap();
      navigate('/app/dashboard');
    } catch (err) {
      setError('Biometric authentication failed. Please use another method.');
    }
  };

  const resetState = () => {
    setLoginMethod(null);
    setPasscode('');
    setPassphrase('');
    setError('');
  };

  // --- Initial View: Choose Login Method ---
  if (!loginMethod) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="card-header">
            <div className="logo">CryptoBean</div>
            <h2>Log In</h2>
            <p>Choose your preferred login method.</p>
          </div>
          <div className="card-body login-options-grid">
            {isBiometricAvailable() && (
              <button className="option-card" onClick={handleBiometricClick} disabled={isLoading}>
                <IconFingerprint />
                <span>Biometrics</span>
              </button>
            )}
            <button className="option-card" onClick={() => setLoginMethod('passcode')} disabled={isLoading}>
              <IconPasscode />
              <span>Passcode</span>
            </button>
            <button className="option-card" onClick={() => setLoginMethod('passphrase')} disabled={isLoading}>
              <IconKey />
              <span>Secret Phrase</span>
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  // --- Specific Login Method View ---
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <button className="back-button" onClick={resetState}>← Back</button>
          <h2>Log In with {loginMethod.charAt(0).toUpperCase() + loginMethod.slice(1)}</h2>
        </div>
        
        <form className="card-body" onSubmit={loginMethod === 'passcode' ? handlePasscodeSubmit : handlePassphraseSubmit}>
          {error && <div className="error-message">{error}</div>}

          {loginMethod === 'passcode' && (
            <div className="input-group">
              <input
                type="password"
                className="input-primary input-passcode"
                placeholder="Enter 6-digit passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                maxLength="6"
                autoFocus
                required
              />
            </div>
          )}

          {loginMethod === 'passphrase' && (
            <div className="input-group">
              <textarea
                className="input-primary"
                placeholder="Enter your 12-word secret phrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                rows={3}
                autoFocus
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="button-primary button-large"
            disabled={isLoading || (loginMethod === 'passcode' && passcode.length !== 6) || (loginMethod === 'passphrase' && !passphrase)}
          >
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
