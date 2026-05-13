import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faArrowLeft, faPaperPlane, faGasPump, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

// ── EIP-1559 gas estimation via provider ──────────────────
const estimateGas = async (tx) => {
  if (!window.ethereum) return null;
  try {
    const gasHex = await window.ethereum.request({
      method: 'eth_estimateGas',
      params: [{ ...tx }],
    });
    return parseInt(gasHex, 16);
  } catch {
    return 21000; // fallback to standard transfer
  }
};

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
  const [txData, setTxData] = useState(null);       // { transaction, unsignedTransaction }
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [txHash, setTxHash] = useState('');

  // ── Blockchain config ──────────────────────────────────
  const CHAINS = {
    ethereum:  { symbol: 'ETH',  chainId: 1,     name: 'Ethereum' },
    polygon:   { symbol: 'MATIC',chainId: 137,   name: 'Polygon' },
    bsc:       { symbol: 'BNB',  chainId: 56,    name: 'BNB Smart Chain' },
    arbitrum:  { symbol: 'ETH',  chainId: 42161, name: 'Arbitrum One' },
    optimism:  { symbol: 'ETH',  chainId: 10,    name: 'Optimism' },
    avalanche: { symbol: 'AVAX', chainId: 43114, name: 'Avalanche' },
    base:      { symbol: 'ETH',  chainId: 8453,  name: 'Base' },
  };

  const TOKENS = {
    ethereum: [
      { symbol: 'ETH',  address: '' },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    ],
    polygon: [
      { symbol: 'MATIC', address: '' },
    ],
    bsc: [
      { symbol: 'BNB', address: '' },
    ],
    arbitrum: [
      { symbol: 'ETH', address: '' },
    ],
    optimism: [
      { symbol: 'ETH', address: '' },
    ],
    avalanche: [
      { symbol: 'AVAX', address: '' },
    ],
    base: [
      { symbol: 'ETH', address: '' },
    ],
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
        setError('Could not load wallets. Please try again.');
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
      // Reset asset to native token when wallet changes
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

      // Backend returns: { message, transaction: { id, from, to, amount, asset }, unsignedTransaction }
      const { transaction, unsignedTransaction } = res.data;

      setTxData({ transaction, unsignedTransaction });

      // Estimate gas for display
      if (unsignedTransaction && window.ethereum) {
        const gas = await estimateGas({
          from: unsignedTransaction.from,
          to: unsignedTransaction.to,
          value: unsignedTransaction.value,
          data: unsignedTransaction.data || '0x',
        });
        setEstimatedGas(gas);
      }

      setStep('confirm');
    } catch (err) {
      console.error('Prepare send error:', err);
      const msg = err.response?.data?.message || 'Failed to prepare transaction';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Sign with MetaMask & broadcast ─────────────
  const handleConfirmSend = async () => {
    if (!txData?.unsignedTransaction || !txData?.transaction) return;

    setError('');
    setLoading(true);
    setStep('signing');

    try {
      const { unsignedTransaction, transaction } = txData;

      // ── Switch to correct chain if needed ────────────
      const targetChainId = CHAINS[blockchain]?.chainId || 1;
      const chainIdHex = `0x${targetChainId.toString(16)}`;

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchErr) {
        // Chain not added — for non-standard chains you'd call
        // wallet_addEthereumChain here. For now, abort.
        if (switchErr.code === 4902) {
          setError(`Please add ${CHAINS[blockchain]?.name} network to your wallet.`);
          setStep('confirm');
          setLoading(false);
          return;
        }
        throw switchErr;
      }

      // ── Request signature from MetaMask ──────────────
      const txParams = {
        from: unsignedTransaction.from,
        to: unsignedTransaction.to,
        value: unsignedTransaction.value,
        data: unsignedTransaction.data || '0x',
      };

      // Only include gasPrice if it's a legacy tx (pre-EIP-1559)
      if (unsignedTransaction.gasPrice) {
        txParams.gasPrice = unsignedTransaction.gasPrice;
      }

      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      setTxHash(hash);

      // ── Broadcast confirmation to backend ────────────
      const token = localStorage.getItem('authToken');
      await axios.post(`${API_BASE}/wallets/broadcast`, {
        transactionId: transaction.id,
        txHash: hash,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStep('success');

    } catch (err) {
      console.error('Sign/broadcast error:', err);

      if (err.code === 4001) {
        // User rejected the transaction
        setError('Transaction rejected by user.');
      } else if (err.code === -32603) {
        setError('Insufficient funds for gas or transaction value.');
      } else {
        setError(err.message || 'Failed to sign or broadcast transaction.');
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
    setEstimatedGas(null);
    setTxHash('');
    setError('');
  };

  // ── Gas fee display helper ─────────────────────────────
  const gasFeeEth = estimatedGas
    ? (estimatedGas * 20 * 1e-9).toFixed(8) // rough estimate at 20 gwei
    : null;

  // ── Truncate address helper ────────────────────────────
  const truncateAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

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

        {/* ── STEP: FORM ─────────────────────────────────── */}
        {step === 'form' && (
          <div className="card send-card-gold">
            <div className="send-header-gold">
              <h2><FontAwesomeIcon icon={faPaperPlane} /> Send Crypto</h2>
            </div>

            {/* Wallet selector */}
            <div className="input-group">
              <label className="label-gold">From Wallet</label>
              {wallets.length === 0 ? (
                <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
                  No wallets found. Import one first.
                </p>
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

            {/* Blockchain (driven by wallet) */}
            <div className="input-group">
              <label className="label-gold">Blockchain</label>
              <input
                type="text"
                className="input-gold"
                value={CHAINS[blockchain]?.name || blockchain}
                disabled
              />
            </div>

            {/* Asset */}
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

            {/* Recipient */}
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

            {/* Amount — BUG FIX: e.target.value instead of e.value */}
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
              disabled={loading || !selectedWalletId}
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

            {estimatedGas && (
              <div className="confirm-row-gold" style={{ color: '#a0a0a0' }}>
                <span>
                  <FontAwesomeIcon icon={faGasPump} style={{ marginRight: 4 }} />
                  Est. Gas:
                </span>
                <span>{estimatedGas.toLocaleString()} gas units</span>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleConfirmSend}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 8 }} />
              {loading ? 'Waiting for wallet...' : 'Confirm & Sign'}
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
            <h3>Signing Transaction</h3>
            <p style={{ color: '#a0a0a0', margin: '12px 0' }}>
              Please confirm the transaction in your wallet extension…
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
