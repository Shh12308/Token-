import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

import {
  generateSeedPhrase,
  encryptData,
  deriveKeyFromPasscode
} from '../../utils/wallet';

import { setSessionWallet } from '../../utils/session';

const STORAGE_KEY = 'wallet_encrypted';

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
  const [seed, setSeed] = useState([]);
  const [passcode, setPasscode] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 3 && seed.length === 0) {
      setSeed(generateSeedPhrase());
    }
  }, [step]);

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');

      if (!saved) throw new Error('Confirm seed backup');
      if (!passcode || passcode.length < 4) throw new Error('Weak passcode');

      const phrase = seed.join(' ');
      const wallet = ethers.Wallet.fromPhrase(phrase);

      const salt = getDeviceSalt();
      const key = await deriveKeyFromPasscode(passcode + salt);

      const encrypted = await encryptData(phrase, key);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          address: wallet.address,
          encryptedSeed: encrypted.data,
          iv: encrypted.iv
        })
      );

      setSessionWallet(wallet);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h2>Create Wallet</h2>
        <p>Secure non-custodial setup</p>

        {error && <div className="error-msg">{error}</div>}

        {/* PROGRESS */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>Setup</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>Passcode</div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>Backup</div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <button className="btn-primary" onClick={() => setStep(2)}>
            Start Wallet Creation
          </button>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <input
              type="password"
              placeholder="Create Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />

            <button className="btn-primary" onClick={() => setStep(3)}>
              Continue
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <p className="text-muted">Write down your seed phrase</p>

            <div className="seed-phrase-grid">
              {seed.map((w, i) => (
                <div key={i} className="seed-word">
                  {i + 1}. {w}
                </div>
              ))}
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={saved}
                  onChange={(e) => setSaved(e.target.checked)}
                />
                I have safely saved my seed phrase
              </label>
            </div>

            <button
              className="btn-primary btn-full"
              disabled={!saved || loading}
              onClick={handleCreate}
            >
              {loading ? 'Creating...' : 'Create Wallet'}
            </button>

            <button
              className="btn-text"
              onClick={() => setStep(2)}
            >
              Back
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default RegisterPage;
