// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isBiometricAvailable } from '../../utils/device.js';
import { copyToClipboard } from '../../utils/helpers';
import { decryptData } from '../../utils/crypto';

const STORAGE_KEY = 'cryptoBeanAccount';
const getLocalAccount = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loginMethod, setLoginMethod] = useState(null);
  const [passcode, setPasscode] = useState('');
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const acc = getLocalAccount();
    if (acc) setAccount(acc);
  }, []);

  const handlePasscodeLogin = async () => {
    if (!account) return setError('No account found. Please register.');
    if (passcode.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      // 🔐 Decrypt local encrypted seed using passcode
      const decryptedSeed = await decryptData(account.encryptedSeed, passcode);
      setSeed(decryptedSeed); // use only in memory

      navigate('/app/dashboard'); // proceed to app
    } catch (err) {
      setError('Invalid passcode');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!account) return setError('No account found. Please register.');
    if (!isBiometricAvailable()) return setError('Biometrics not supported.');

    setLoading(true);
    setError('');

    try {
      // 🔐 Unlock seed locally via biometrics (placeholder)
      // You need real WebAuthn / platform biometric integration here
      const decryptedSeed = await decryptData(account.encryptedSeed, 'biometricKey'); 
      setSeed(decryptedSeed);

      navigate('/app/dashboard');
    } catch (err) {
      setError('Biometric login failed');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setLoginMethod(null);
    setPasscode('');
    setError('');
    setSeed('');
  };

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
              <button className="option-card" onClick={handleBiometricLogin} disabled={loading}>
                👆<span>Biometrics</span>
              </button>
            )}
            <button className="option-card" onClick={() => setLoginMethod('passcode')} disabled={loading}>
              🔢<span>Passcode</span>
            </button>
            <button className="option-card" onClick={() => setLoginMethod('passphrase')} disabled={loading}>
              🔑<span>Secret Phrase</span>
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <button className="back-button" onClick={resetState}>← Back</button>
          <h2>Log In with {loginMethod.charAt(0).toUpperCase() + loginMethod.slice(1)}</h2>
        </div>

        <div className="card-body">
          {error && <div className="error-message">{error}</div>}

          {loginMethod === 'passcode' && (
            <div className="input-group">
              <input
                type="password"
                className="input-primary input-passcode"
                placeholder="Enter 6-digit passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                autoFocus
              />
              <button
                className="button-primary button-large"
                onClick={handlePasscodeLogin}
                disabled={passcode.length !== 6 || loading}
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </div>
          )}

          {loginMethod === 'passphrase' && (
            <div className="input-group">
              <textarea
                className="input-primary"
                value={seed}
                readOnly
                rows={3}
                onClick={() => copyToClipboard(seed)}
              />
              <button className="button-secondary" onClick={() => copyToClipboard(seed)}>
                Copy Secret Phrase
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
