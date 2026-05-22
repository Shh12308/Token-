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
} from '../utils/wallet';

import { setSessionWallet } from '../utils/session';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://blockvault-backend-production.up.railway.app/api';

const STORAGE_KEY = 'wallet_encrypted';

// ─────────────────────────────────────────────
// Device Salt
// ─────────────────────────────────────────────
const getDeviceSalt = () => {
  let salt = localStorage.getItem('device_salt');
  if (!salt) {
    salt = crypto.randomUUID();
    localStorage.setItem('device_salt', salt);
  }
  return salt;
};

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
    return (
      seedPhrase[1]?.toLowerCase() === confirm.w1.toLowerCase() &&
      seedPhrase[5]?.toLowerCase() === confirm.w2.toLowerCase()
    );
  };

  // ─────────────────────────────────────────────
  // OPTIONAL AUTH (Non-custodial safe)
  // ─────────────────────────────────────────────
  const optionalBackendAuth = async (wallet) => {
    try {
      const nonceRes = await axios.post(`${API_BASE_URL}/auth/nonce`, {
        walletAddress: wallet.address
      });

      const message = nonceRes.data.messageToSign;
      const signature = await wallet.signMessage(message);

      const verifyRes = await axios.post(`${API_BASE_URL}/auth/verify`, {
        walletAddress: wallet.address,
        signature,
        message
      });

      if (verifyRes.data.token) {
        localStorage.setItem('authToken', verifyRes.data.token);
      }
    } catch (err) {
      console.warn('Backend auth skipped:', err.message);
      // ❗ DO NOT BLOCK USER — stay non-custodial
    }
  };

  // ─────────────────────────────────────────────
  // CREATE WALLET
  // ─────────────────────────────────────────────
  const handleCreateAccount = async () => {
    if (!saved) return setError('Save your seed phrase first.');
    if (passcode.length < 6) return setError('Passcode must be at least 6 digits.');
    if (!verifySeed()) return setError('Seed verification failed.');

    setLoading(true);
    setError('');

    try {
      const phrase = seedPhrase.join(' ');

      // 1. Create Wallet (PURE LOCAL)
      const wallet = ethers.Wallet.fromPhrase(phrase);

      // 2. Derive Key (Passcode + Device Salt)
      const salt = getDeviceSalt();
      const key = await deriveKeyFromPasscode(passcode + salt);

      // 3. Encrypt Seed
      const encrypted = await encryptData(phrase, key);

      // 4. Store LOCALLY ONLY (non-custodial)
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

      // 5. In-memory session
      setSessionWallet(wallet);

      // 6. OPTIONAL backend auth (non-blocking)
      optionalBackendAuth(wallet);

      // 7. Clean memory
      setSeedPhrase([]);
      setPasscode('');

      navigate('/app/dashboard');

    } catch (err) {
      console.error(err);
      setError('Wallet creation failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Wallet</h2>

        {step === 1 && (
          <>
            <p>Your keys, your crypto. Fully non-custodial.</p>
            <button onClick={() => setStep(2)}>Start</button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="password"
              value={passcode}
              onChange={(e) =>
                setPasscode(e.target.value.replace(/\D/g, '').slice(0, 12))
              }
              placeholder="Create passcode"
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

            <button onClick={() => setStep(1)}>Back</button>
            <button disabled={passcode.length < 6} onClick={() => setStep(3)}>
              Continue
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <p>Write this down. Never share it.</p>

            <div className="seed-grid">
              {seedPhrase.map((w, i) => (
                <div key={i} onClick={() => copyToClipboard(w)}>
                  {i + 1}. {w}
                </div>
              ))}
            </div>

            <button onClick={() => copyToClipboard(seedPhrase.join(' '))}>
              Copy
            </button>

            <input
              placeholder="Word #2"
              onChange={(e) =>
                setConfirm({ ...confirm, w1: e.target.value })
              }
            />
            <input
              placeholder="Word #6"
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
              I saved my seed phrase
            </label>

            {error && <div className="error">{error}</div>}

            <button onClick={() => setStep(2)}>Back</button>
            <button
              disabled={!saved || !verifySeed() || loading}
              onClick={handleCreateAccount}
            >
              {loading ? 'Creating...' : 'Create Wallet'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
