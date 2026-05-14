import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { faArrowLeft, faCheck, faCopy, faExclamationTriangle, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';
import { saveWalletToVault } from '../utils/Keymanager';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const CreateWalletPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Generate, 2: Verify, 3: Encrypt, 4: Done
  const [mnemonic, setMnemonic] = useState('');
  const [verifyIndices, setVerifyIndices] = useState([]); // e.g. [2, 5, 9]
  const [verifyAnswers, setVerifyAnswers] = useState(['', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate wallet immediately on mount
    const wallet = ethers.Wallet.createRandom();
    setMnemonic(wallet.mnemonic.phrase);
    
    // Pick 3 random words to verify
    const words = wallet.mnemonic.phrase.split(' ');
    const indices = [];
    while (indices.length < 3) {
      const rand = Math.floor(Math.random() * words.length);
      if (!indices.includes(rand)) indices.push(rand);
    }
    setVerifyIndices(indices);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    setError('');
    const words = mnemonic.split(' ');
    
    for (let i = 0; i < 3; i++) {
      if (verifyAnswers[i].trim().toLowerCase() !== words[verifyIndices[i]].toLowerCase()) {
        return setError('Incorrect word. Please check your backup.');
      }
    }
    setStep(3);
  };

  const handleCreate = async () => {
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    setError('');

    try {
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);

      // 1. Encrypt and save locally
      await saveWalletToVault(wallet.privateKey, password);

      // 2. Register public address with backend
      const token = localStorage.getItem('authToken');
      await axios.post(`${API_BASE}/wallets/import`, {
        address: wallet.address,
        blockchain: 'ethereum',
        label: 'My Wallet',
        walletType: 'created',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div>
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, padding: 16, marginBottom: 20,
          }}>
            <p style={{ color: '#fbbf24', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 8 }} />
              Write down your secret recovery phrase and store it safely. It is the <strong>ONLY</strong> way to recover your wallet. BlockVault cannot recover it.
            </p>
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16,
            background: '#1a1a1a', padding: 16, borderRadius: 8, border: '1px solid #333',
          }}>
            {mnemonic.split(' ').map((word, i) => (
              <div key={i} style={{
                background: '#222', padding: '8px 12px', borderRadius: 6,
                fontSize: 14, color: '#fff', border: '1px solid #333',
              }}>
                <span style={{ color: '#888', fontSize: 10, marginRight: 6 }}>{i + 1}</span>
                {word}
              </div>
            ))}
          </div>

          <button onClick={handleCopy} style={{
            width: '100%', padding: 12, background: 'transparent', border: '1px solid #444',
            borderRadius: 8, color: copied ? '#4ade80' : '#aaa', cursor: 'pointer', marginBottom: 16,
          }}>
            <FontAwesomeIcon icon={faCopy} style={{ marginRight: 8 }} />
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>

          <button onClick={() => setStep(2)} style={{
            width: '100%', padding: 14, background: '#c9a84c', border: 'none',
            borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            I've Saved It — Continue
          </button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div>
          <p style={{ color: '#aaa', marginBottom: 20, fontSize: 14 }}>
            Verify your backup by entering the correct word for each position.
          </p>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
              color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {verifyIndices.map((idx, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <label style={{ color: '#fff', fontSize: 14, marginBottom: 6, display: 'block' }}>
                Word #{idx + 1}
              </label>
              <input
                value={verifyAnswers[i]}
                onChange={(e) => {
                  const newAnswers = [...verifyAnswers];
                  newAnswers[i] = e.target.value;
                  setVerifyAnswers(newAnswers);
                }}
                placeholder={`Enter word #${idx + 1}`}
                required
                style={{
                  width: '100%', padding: 14, background: '#1a1a1a',
                  border: '1px solid #333', borderRadius: 8, color: '#fff',
                  fontSize: 14, outline: 'none',
                }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(1)} style={{
              flex: 1, padding: 14, background: 'transparent', border: '1px solid #444',
              borderRadius: 8, color: '#aaa', cursor: 'pointer', fontSize: 14,
            }}>
              Back
            </button>
            <button onClick={handleVerify} style={{
              flex: 1, padding: 14, background: '#c9a84c', border: 'none',
              borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Verify
            </button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div>
          <div style={{
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 8, padding: 16, marginBottom: 20,
          }}>
            <p style={{ color: '#60a5fa', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 8 }} />
              Create a password to encrypt this wallet on your device. This is required to sign transactions.
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
              color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters" required
              style={{
                width: '100%', padding: 14, background: '#1a1a1a', border: '1px solid #333',
                borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#aaa', fontSize: 12, marginBottom: 4, display: 'block' }}>Confirm Password</label>
            <input
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password" required
              style={{
                width: '100%', padding: 14, background: '#1a1a1a', border: '1px solid #333',
                borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <button onClick={handleCreate} disabled={loading} style={{
            width: '100%', padding: 14, background: '#c9a84c', border: 'none',
            borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            {loading ? 'Encrypting & Creating...' : 'Create Wallet'}
          </button>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 32, color: '#4ade80',
          }}>
            <FontAwesomeIcon icon={faCheck} />
          </div>
          <h2 style={{ color: '#fff', marginBottom: 8 }}>Wallet Created!</h2>
          <p style={{ color: '#aaa', fontSize: 14, marginBottom: 32 }}>
            Your wallet has been securely encrypted and saved to your device.
          </p>
          <button onClick={() => navigate('/app')} style={{
            padding: '14px 32px', background: '#c9a84c', border: 'none',
            borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Go to Dashboard
          </button>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
        <div className="header-title">
          {step === 1 && 'Backup Phrase'}
          {step === 2 && 'Verify Backup'}
          {step === 3 && 'Secure Wallet'}
          {step === 4 && 'Complete'}
        </div>
        <div style={{ width: 60 }}></div>
      </header>

      <main className="main-scroll-area-gold" style={{ padding: 20 }}>
        {renderStep()}
      </main>
      <BottomNav />
    </div>
  );
};

export default CreateWalletPage;
