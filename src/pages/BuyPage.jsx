import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  faArrowLeft,
  faCreditCard,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

// ✅ NON-CUSTODIAL SESSION
import { getSessionWallet } from '../utils/session';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const SUPPORTED_NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
  { id: 'base', name: 'Base', symbol: 'ETH' },
];

const DEFAULT_CURRENCIES = {
  ethereum: 'ETH',
  polygon: 'MATIC',
  arbitrum: 'ETH',
  base: 'ETH',
};

const BuyPage = () => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState(100);
  const [network, setNetwork] = useState('ethereum');
  const [currency, setCurrency] = useState('ETH');
  const [provider, setProvider] = useState('moonpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─────────────────────────────────────────────
  // NETWORK CHANGE
  // ─────────────────────────────────────────────
  const handleNetworkChange = (e) => {
    const net = e.target.value;
    setNetwork(net);
    setCurrency(DEFAULT_CURRENCIES[net] || 'ETH');
  };

  const handleAmountPreset = (value) => {
    setAmount(value);
  };

  // ─────────────────────────────────────────────
  // 🔥 NON-CUSTODIAL BUY FLOW
  // ─────────────────────────────────────────────
  const handleBuy = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionWallet = getSessionWallet();

      if (!sessionWallet) {
        throw new Error('Wallet not unlocked. Please login again.');
      }

      const walletAddress = sessionWallet.address;

      // 🔐 SIGN REQUEST (PROVES OWNERSHIP)
      const message = `Authorize buy session at ${Date.now()}`;
      const signature = await sessionWallet.signMessage(message);

      // 🚀 CALL BACKEND
      const res = await axios.post(`${API_BASE}/fiat/onramp/session`, {
        walletAddress,
        chain: network,
        amount,
        currency,
        provider,
        signature,
        message
      });

      if (res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        throw new Error('No redirect URL received.');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to initiate buy.');
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span style={{ marginLeft: 8 }}>Back</span>
        </div>
      </header>

      <main className="main-scroll-area-gold">
        <div className="card buy-card-gold">
          <div className="buy-header-gold">
            <FontAwesomeIcon icon={faCreditCard} size="2x" color="#c9a84c" />
            <h2>Buy Crypto</h2>
            <p style={{ color: '#888', fontSize: 14, marginTop: -10 }}>
              Funds sent directly to your wallet
            </p>
          </div>

          {error && (
            <div className="error-msg">
              {error}
            </div>
          )}

          {/* PROVIDER */}
          <div className="input-group">
            <label>Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="moonpay">MoonPay</option>
              <option value="ramp">Ramp Network</option>
              <option value="transak">Transak</option>
            </select>
          </div>

          {/* NETWORK */}
          <div className="input-group">
            <label>Network</label>
            <select value={network} onChange={handleNetworkChange}>
              {SUPPORTED_NETWORKS.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          {/* CURRENCY */}
          <div className="input-group">
            <label>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value={DEFAULT_CURRENCIES[network]}>
                {DEFAULT_CURRENCIES[network]}
              </option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="DAI">DAI</option>
            </select>
          </div>

          {/* AMOUNT */}
          <div className="input-group">
            <label>Amount (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              {[50, 100, 250, 500].map(val => (
                <button
                  key={val}
                  className={`preset-btn ${amount === val ? 'active' : ''}`}
                  onClick={() => handleAmountPreset(val)}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          {/* BUY BUTTON */}
          <button
            className="btn-primary btn-full"
            onClick={handleBuy}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Buy ${currency}`}
          </button>

          {/* SECURITY NOTE */}
          <div className="secure-note-gold">
            <FontAwesomeIcon icon={faShieldAlt} />
            <span>Non-Custodial Purchase</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default BuyPage;
