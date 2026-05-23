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

  // ─────────────────────────────
  // Generate seed once
  // ─────────────────────────────
  useEffect(() => {
    if (step === 3 && seed.length === 0) {
      setSeed(generateSeedPhrase());
    }
  }, [step]);

  // ─────────────────────────────
  // CREATE WALLET (NON-CUSTODIAL)
  // ─────────────────────────────
  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');

      if (!saved) throw new Error('Confirm you saved seed phrase');
      if (!passcode || passcode.length < 4)
        throw new Error('Passcode too weak');

      const phrase = seed.join(' ');

      // Ethers v6 safe creation
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

      // session = active wallet
      setSessionWallet(wallet);

      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div style={styles.container}>

      <h2 style={styles.title}>Create Wallet</h2>

      {error && <p style={styles.error}>{error}</p>}

      {/* STEP 1 */}
      {step === 1 && (
        <button style={styles.button} onClick={() => setStep(2)}>
          Start
        </button>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div style={styles.card}>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Create Passcode"
            style={styles.input}
          />

          <button
            style={styles.button}
            onClick={() => {
              if (!passcode || passcode.length < 4) {
                setError('Passcode must be at least 4 characters');
                return;
              }
              setStep(3);
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div style={styles.card}>

          <p style={styles.warning}>
            ⚠️ Save this seed phrase. It is never stored again.
          </p>

          <div style={styles.seedGrid}>
            {seed.map((w, i) => (
              <div key={i} style={styles.seedWord}>
                {i + 1}. {w}
              </div>
            ))}
          </div>

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
            />
            I have safely saved my seed phrase
          </label>

          <button
            style={{
              ...styles.button,
              opacity: saved && !loading ? 1 : 0.5,
              cursor: saved && !loading ? 'pointer' : 'not-allowed'
            }}
            disabled={!saved || loading}
            onClick={handleCreate}
          >
            {loading ? 'Creating Wallet...' : 'Create Wallet'}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 420,
    margin: '0 auto',
    padding: 20,
    fontFamily: 'sans-serif'
  },
  title: {
    textAlign: 'center'
  },
  card: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: '1px solid #ccc'
  },
  button: {
    padding: 12,
    borderRadius: 8,
    border: 'none',
    background: '#111',
    color: '#fff',
    cursor: 'pointer'
  },
  seedGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    background: '#f5f5f5',
    padding: 12,
    borderRadius: 8
  },
  seedWord: {
    fontSize: 12
  },
  checkbox: {
    fontSize: 12,
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  warning: {
    fontSize: 12,
    color: '#b00020'
  },
  error: {
    color: 'red',
    fontSize: 12
  }
};

export default RegisterPage;
