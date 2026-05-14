import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faArrowLeft, faPaperPlane, faGasPump, faExclamationTriangle, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';
import { signAndBroadcast, getActiveWallet } from '../utils/keyManager'; // Our independent vault

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const SendPage = () => {
  const navigate = useNavigate();

  // ── Form state ─────────────────────────────────────────
  const [wallets, setWallets] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [blockchain, setBlockchain] = useState('ethereum');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('ETH');
  const [assetAddress, setAssetAddress] = useState('');

  // ── Flow state ─────────────────────────────────────────
  const [step, setStep] = useState('form'); // form -> confirm -> signing -> success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Transaction state (populated after /send) ──────────
  const [txData, setTxData] = useState(null);
  const [txHash, setTxHash] = useState('');

  // ── Blockchain config ──────────────────────────────────
  const CHAINS = {
    ethereum:  { symbol: 'ETH',  chainId: 1,     name: 'Ethereum', explorer: 'https://etherscan.io' },
    polygon:   { symbol: 'MATIC',chainId: 137,   name: 'Polygon', explorer: 'https://polygonscan.com' },
    bsc:       { symbol: 'BNB',  chainId: 56,    name: 'BNB Smart Chain', explorer: 'https://bscscan.com' },
    arbitrum:  { symbol: 'ETH',  chainId: 42161, name: 'Arbitrum One', explorer: 'https://arbiscan.io' },
    optimism:  { symbol: 'ETH',  chainId: 10,    name: 'Optimism', explorer: 'https://optimistic.etherscan.io' },
    avalanche: { symbol: 'AVAX', chainId: 43114, name: 'Avalanche', explorer: 'https://snowtrace.io' },
    base:      { symbol: 'ETH',  chainId: 8453,  name: 'Base', explorer: 'https://basescan.org' },
  };

  const TOKENS = {
    ethereum: [
      { symbol: 'ETH',  address: '' },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    ],
    polygon: [{ symbol: 'MATIC', address: '' }],
    bsc: [{ symbol: 'BNB', address: '' }],
    arbitrum: [{ symbol: 'ETH', address: '' }],
    optimism: [{ symbol: 'ETH', address: '' }],
    avalanche: [{ symbol: 'AVAX', address: '' }],
    base: [{ symbol: 'ETH', address: '' }],
  };

  // ── Load user wallets on mount ─────────────────────────
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await axios.get(`${API_BASE}/wallets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const walletList = res.data.wallets || [];
        setWallets(walletList);

        // Auto-select first wallet
        if (walletList.length > 0) {
          setSelectedWalletId(walletList[0].id);
          setSelectedWallet(walletList[0]);
          setBlockchain(walletList[0].blockchain);
        }
      } catch (err) {
        console.error('Failed to load wallets:', err);
        setError('Could not load wallets.');
      }
    };
    fetchWallets();
  }, []);

  // ── Sync selected wallet object when ID changes ───────
  useEffect(() => {
    const w = wallets.find(w => w.id === selectedWalletId);
    if (w) {
      setSelectedWallet(w);
      setBlockchain(w.blockchain);
      setAsset(CHAINS[w.blockchain]?.symbol || 'ETH');
      setAssetAddress('');
    }
  }, [selectedWalletId, wallets]);

  // ── Handle asset selection ─────────────────────────────
  const handleAssetChange = (symbol) => {
    setAsset(symbol);
    const tokenList = TOKENS[blockchain] || [];
    const token = tokenList.find(t => t.symbol === symbol);
    setAssetAddress(token?.address || '');
  };

  // ── Step 1: Prepare transaction via backend ────────────
  const handlePrepareSend = async () => {
    if (!selectedWalletId || !toAddress || !amount || parseFloat(amount) <= 0) {
      setError('Please fill in all fields with valid values.');
      return;
    }

    // Check if the local vault is unlocked
    if (!getActiveWallet()) {
      setError('Wallet is locked. Please go to Settings to unlock your wallet before sending.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.post(`${API_BASE}/wallets/send`, {
        walletId: selectedWalletId,
        toAddress,
        amount,
        asset,
        assetAddress: assetAddress || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { transaction, unsignedTransaction } = res.data;
      setTxData({ transaction, unsignedTransaction });
      setStep('confirm');

    } catch (err) {
      console.error('Prepare send error:', err);
      const msg = err.response?.data?.message || 'Failed to prepare transaction';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Sign Locally & Broadcast ───────────────────
  // THIS REPLACES METAMASK ENTIRELY
  const handleConfirmSend = async () => {
    if (!txData?.unsignedTransaction || !txData?.transaction) return;

    setError('');
    setLoading(true);
    setStep('signing');

    try {
      const { unsignedTransaction, transaction } = txData;

      // 1. Sign the transaction locally using the E2EE Vault
      // 2. Broadcast the signed hex via our backend
      const broadcastResult = await signAndBroadcast(unsignedTransaction);

      setTxHash(broadcastResult.txHash);

      // 3. Tell the backend to update the Transaction record in Postgres
      const token = localStorage.getItem('authToken');
      await axios.post(`${API_BASE}/wallets/broadcast`, {
        transactionId: transaction.id,
        txHash: broadcastResult.txHash,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStep('success');

    } catch (err) {
      console.error('Sign/broadcast error:', err);
      
      if (err.message.includes('Wallet is locked')) {
        setError('Your wallet is locked. Please return to settings to unlock it.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to sign or broadcast transaction.');
      }
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset form ─────────────────────────────────────────
  const resetForm = () => {
    setToAddress('');
    setAmount('');
    setStep('form');
    setTxData(null);
    setTxHash('');
    setError('');
  };

  // ── Helpers ────────────────────────────────────────────
  const truncateAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const isWalletLocked = !getActiveWallet();

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
      </header>

      <main className="main-scroll-area-gold">
        {error && (
          <div className="error-banner" style={{
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.4)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            {error}
          </div>
        )}

        {isWalletLocked && step === 'form' && (
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center'
          }}>
            <FontAwesomeIcon icon={faLock} style={{ color: '#f59e0b', fontSize: 20 }} />
            <div>
              <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: 14 }}>Wallet Locked</div>
              <div style={{ color: '#aaa', fontSize: 12 }}>Unlock your vault in Settings to send funds.</div>
            </div>
          </div>
        )}

        {/* ── STEP: FORM ─────────────────────────────────── */}
        {step === 'form' && (
          <div className="card send-card-gold">
            <div className="send-header-gold">
              <h2><FontAwesomeIcon icon={faPaperPlane} /> Send Crypto</h2>
            </div>

            <div className="input-group">
              <label className="label-gold">From Wallet</label>
              {wallets.length === 0 ? (
                <p style={{ color: '#a0a0a0', fontSize: '14px' }}>No wallets found.</p>
              ) : (
                <select
                  className="input-gold"
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.label || w.blockchain} — {truncateAddr(w.address)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="input-group">
              <label className="label-gold">Blockchain</label>
              <input
                type="text"
                className="input-gold"
                value={CHAINS[blockchain]?.name || blockchain}
                disabled
              />
            </div>

            <div className="input-group">
              <label className="label-gold">Asset</label>
              <select
                className="input-gold"
                value={asset}
                onChange={(e) => handleAssetChange(e.target.value)}
              >
                {(TOKENS[blockchain] || [{ symbol: CHAINS[blockchain]?.symbol || 'ETH', address: '' }]).map(t => (
                  <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                ))}
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
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <button
              className="btn-primary"
              onClick={handlePrepareSend}
              disabled={loading || !selectedWalletId || isWalletLocked}
            >
              {loading ? 'Preparing...' : 'Next'}
            </button>
          </div>
        )}

        {/* ── STEP: CONFIRM ──────────────────────────────── */}
        {step === 'confirm' && txData && (
          <div className="card confirm-card-gold">
            <h3>Confirm Transaction</h3>

            <div className="confirm-row-gold">
              <span>From:</span>
              <span className="text-sm">{truncateAddr(txData.transaction.from)}</span>
            </div>

            <div className="confirm-row-gold">
              <span>To:</span>
              <span className="text-sm truncate">{truncateAddr(toAddress)}</span>
            </div>

            <div className="confirm-row-gold">
              <span>Sending:</span>
              <span className="font-bold">{amount} {asset}</span>
            </div>

            <div className="confirm-row-gold">
              <span>Network:</span>
              <span>{CHAINS[blockchain]?.name || blockchain}</span>
            </div>

            <div className="confirm-row-gold" style={{ color: '#a0a0a0' }}>
              <span>
                <FontAwesomeIcon icon={faGasPump} style={{ marginRight: 4 }} />
                Gas:
              </span>
              <span>Network Fee (Signed locally)</span>
            </div>

            <button
              className="btn-primary"
              onClick={handleConfirmSend}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 8 }} />
              {loading ? 'Signing...' : 'Confirm & Send'}
            </button>

            <button
              className="btn-secondary"
              onClick={() => { setStep('form'); setError(''); }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── STEP: SIGNING ──────────────────────────────── */}
        {step === 'signing' && (
          <div className="card confirm-card-gold" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h3>Signing & Broadcasting</h3>
            <p style={{ color: '#a0a0a0', margin: '12px 0' }}>
              BlockVault is securely signing your transaction locally and broadcasting it to the network...
            </p>
            <div className="spinner" style={{ margin: '20px auto' }} />
          </div>
        )}

        {/* ── STEP: SUCCESS ──────────────────────────────── */}
        {step === 'success' && (
          <div className="card confirm-card-gold" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3>Transaction Submitted!</h3>

            <div className="confirm-row-gold" style={{ justifyContent: 'center' }}>
              <span>{amount} {asset}</span>
              <span>→</span>
              <span>{truncateAddr(toAddress)}</span>
            </div>

            {txHash && (
              <div style={{ margin: '12px 0' }}>
                <span className="label-gold">Tx Hash:</span>
                <p style={{
                  wordBreak: 'break-all',
                  fontSize: 12,
                  color: '#c9a84c',
                  margin: 4,
                }}>
                  {txHash}
                </p>
                <a
                  href={`${CHAINS[blockchain]?.explorer || 'https://etherscan.io'}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#c9a84c', fontSize: 14 }}
                >
                  View on Explorer →
                </a>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={() => navigate('/app/activity')}
              style={{ marginTop: 16 }}
            >
              View Activity
            </button>

            <button
              className="btn-secondary"
              onClick={resetForm}
            >
              Send Another
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default SendPage;
