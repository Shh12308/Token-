import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { faArrowLeft, faPaperPlane, faGasPump, faExclamationTriangle, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';
import { getSessionWallet } from '../utils/session'; // Import the session manager

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const SendPage = () => {
  const navigate = useNavigate();

  // ── Form state ─────────────────────────────────────────
  const [wallet, setWallet] = useState(null);
  const [blockchain, setBlockchain] = useState('ethereum');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('ETH');

  // ── Flow state ─────────────────────────────────────────
  const [step, setStep] = useState('form'); // form -> confirm -> signing -> success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Transaction state ──────────────────────────────────
  const [unsignedTx, setUnsignedTx] = useState(null);
  const [txHash, setTxHash] = useState('');

  // ── Blockchain config ──────────────────────────────────
  const CHAINS = {
    ethereum:  { symbol: 'ETH',  chainId: 1,     name: 'Ethereum', explorer: 'https://etherscan.io' },
    polygon:   { symbol: 'MATIC',chainId: 137,   name: 'Polygon', explorer: 'https://polygonscan.com' },
    bsc:       { symbol: 'BNB',  chainId: 56,    name: 'BNB Smart Chain', explorer: 'https://bscscan.com' },
    arbitrum:  { symbol: 'ETH',  chainId: 42161, name: 'Arbitrum One', explorer: 'https://arbiscan.io' },
    base:      { symbol: 'ETH',  chainId: 8453,  name: 'Base', explorer: 'https://basescan.org' },
  };

  // ── Load active wallet on mount ─────────────────────────
  useEffect(() => {
    const activeWallet = getSessionWallet();
    if (activeWallet) {
      setWallet(activeWallet);
    }
  }, []);

  // ── Step 1: Prepare transaction via backend ────────────
  const handlePrepareSend = async () => {
    if (!wallet) return setError('Wallet not loaded.');
    if (!toAddress || !amount) return setError('Please fill in all fields.');
    
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // 1. Ask Backend to build the safe transaction payload
      // Backend calculates Nonce, Gas Price, and estimates Gas Limit
      const res = await axios.post(`${API_BASE}/tx/build`, {
        fromAddress: wallet.address,
        toAddress: toAddress,
        amount: amount,
        chainId: CHAINS[blockchain].chainId,
        assetSymbol: asset
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnsignedTx(res.data.unsignedTransaction);
      setStep('confirm');

    } catch (err) {
      console.error('Prepare error:', err);
      setError(err.response?.data?.error || 'Failed to prepare transaction.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Sign Locally & Broadcast ───────────────────
  const handleConfirmSend = async () => {
    if (!wallet || !unsignedTx) return;

    setLoading(true);
    setStep('signing');
    setError('');

    try {
      // 1. Sign the transaction locally (Client-Side Security)
      // The private key never leaves the browser
      const signedTx = await wallet.signTransaction(unsignedTx);

      // 2. Broadcast via Backend (Stateless)
      const token = localStorage.getItem('authToken');
      const broadcastRes = await axios.post(`${API_BASE}/tx/broadcast`, {
        signedTransaction: signedTx,
        chainId: unsignedTx.chainId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTxHash(broadcastRes.data.txHash);
      setStep('success');

    } catch (err) {
      console.error('Sign/Broadcast error:', err);
      setError('Transaction failed: ' + (err.reason || err.message));
      setStep('confirm'); // Go back to confirm to retry
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────
  const resetForm = () => {
    setToAddress('');
    setAmount('');
    setStep('form');
    setUnsignedTx(null);
    setTxHash('');
    setError('');
  };

  // ── Helpers ────────────────────────────────────────────
  const truncateAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
      </header>

      <main className="main-scroll-area-gold">
        {error && (
          <div className="error-msg">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
          </div>
        )}

        {/* ── WALLET LOCKED WARNING ─────────────────────── */}
        {!wallet && step === 'form' && (
          <div className="card" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <FontAwesomeIcon icon={faLock} style={{ color: '#f59e0b', fontSize: 20 }} />
              <div>
                <div style={{ color: '#fbbf24', fontWeight: 600 }}>Wallet Locked</div>
                <div style={{ color: '#aaa', fontSize: 12 }}>Please unlock your vault to send funds.</div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: FORM ─────────────────────────────────── */}
        {step === 'form' && (
          <div className="card send-card-gold">
            <div className="send-header-gold">
              <h2><FontAwesomeIcon icon={faPaperPlane} /> Send Crypto</h2>
            </div>

            {wallet && (
              <div className="input-group">
                <label className="label-gold">From Wallet</label>
                <input
                  type="text"
                  className="input-gold"
                  value={wallet.address}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>
            )}

            <div className="input-group">
              <label className="label-gold">Blockchain</label>
              <select 
                className="input-gold" 
                value={blockchain} 
                onChange={(e) => setBlockchain(e.target.value)}
              >
                {Object.keys(CHAINS).map(key => (
                  <option key={key} value={key}>{CHAINS[key].name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="label-gold">Asset</label>
              <select className="input-gold" value={asset} onChange={(e) => setAsset(e.target.value)}>
                <option value={CHAINS[blockchain].symbol}>{CHAINS[blockchain].symbol} (Native)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="label-gold">Recipient Address</label>
              <input
                type="text"
                className="input-gold"
                placeholder="0x..."
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value.trim())}
              />
            </div>

            <div className="input-group">
              <label className="label-gold">Amount ({asset})</label>
              <input
                type="number"
                className="input-gold"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <button
              className="btn-primary"
              onClick={handlePrepareSend}
              disabled={loading || !wallet}
            >
              {loading ? 'Preparing...' : 'Continue'}
            </button>
          </div>
        )}

        {/* ── STEP: CONFIRM ──────────────────────────────── */}
        {step === 'confirm' && unsignedTx && (
          <div className="card confirm-card-gold">
            <h3>Confirm Transaction</h3>

            <div className="confirm-row-gold">
              <span>To:</span>
              <span>{truncateAddr(toAddress)}</span>
            </div>

            <div className="confirm-row-gold">
              <span>Amount:</span>
              <span style={{ color: '#c9a84c', fontWeight: 'bold' }}>{amount} {asset}</span>
            </div>

            <div className="confirm-row-gold">
              <span>Network:</span>
              <span>{CHAINS[blockchain].name}</span>
            </div>

            <div className="confirm-row-gold">
              <span>
                <FontAwesomeIcon icon={faGasPump} style={{ marginRight: 4 }} /> Est. Gas:
              </span>
              <span>{ethers.formatUnits(unsignedTx.gasLimit || 21000, "gwei")} Gwei</span>
            </div>

            <button className="btn-primary" onClick={handleConfirmSend} disabled={loading}>
              {loading ? 'Signing...' : 'Confirm & Send'}
            </button>
            <button className="btn-secondary" onClick={() => setStep('form')} disabled={loading}>
              Cancel
            </button>
          </div>
        )}

        {/* ── STEP: SIGNING ──────────────────────────────── */}
        {step === 'signing' && (
          <div className="card confirm-card-gold" style={{ textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <h3 style={{ marginTop: 16 }}>Broadcasting</h3>
            <p style={{ color: '#888', fontSize: 14 }}>Securing transaction on the blockchain...</p>
          </div>
        )}

        {/* ── STEP: SUCCESS ──────────────────────────────── */}
        {step === 'success' && (
          <div className="card confirm-card-gold" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3>Transaction Sent!</h3>
            
            <div style={{ margin: '20px 0' }}>
              <p style={{ fontSize: 12, color: '#888', wordBreak: 'break-all' }}>
                Tx Hash: {txHash}
              </p>
              <a 
                href={`${CHAINS[blockchain].explorer}/tx/${txHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="link-gold"
              >
                View on Explorer →
              </a>
            </div>

            <button className="btn-primary" onClick={resetForm}>Send Another</button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default SendPage;
