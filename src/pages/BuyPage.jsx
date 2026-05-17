import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faArrowLeft, faCreditCard, faShieldAlt, faBolt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

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
  arbitrum: 'ETH', // Arbitrum uses ETH as gas
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

  // Update currency when network changes
  const handleNetworkChange = (e) => {
    const net = e.target.value;
    setNetwork(net);
    setCurrency(DEFAULT_CURRENCIES[net] || 'ETH');
  };

  const handleAmountPreset = (value) => {
    setAmount(value);
  };

  const handleBuy = async () => {
    setLoading(true);
    setError('');

    const walletAddress = localStorage.getItem('walletAddress');
    const token = localStorage.getItem('authToken');

    if (!walletAddress) {
      setError('Wallet address not found. Please login again.');
      setLoading(false);
      return;
    }

    try {
      // Stateless endpoint: POST /fiat/onramp/session
      const res = await axios.post(`${API_BASE}/fiat/onramp/session`, {
        walletAddress,   // Destination address
        chain: network,  // Target chain
        amount,
        currency,
        provider
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Backend returns: { redirectUrl: "https://..." }
      if (res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        throw new Error('No redirect URL received from provider.');
      }

    } catch (err) {
      console.error(err);
      setLoading(false);
      if (err.response?.status === 403) {
        setError('KYC Required: Please complete verification to buy crypto.');
      } else {
        setError(err.response?.data?.message || 'Failed to initiate buy session.');
      }
    }
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> <span style={{ marginLeft: 8 }}>Back</span>
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
            <div style={{ color: '#f87171', marginBottom: 15, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Provider Selection */}
          <div className="input-group">
            <label className="label-gold">Provider</label>
            <select className="input-gold" value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="moonpay">MoonPay</option>
              <option value="ramp">Ramp Network</option>
              <option value="transak">Transak</option>
            </select>
          </div>

          {/* Network Selection */}
          <div className="input-group">
            <label className="label-gold">Network</label>
            <select className="input-gold" value={network} onChange={handleNetworkChange}>
              {SUPPORTED_NETWORKS.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          {/* Currency Selection */}
          <div className="input-group">
            <label className="label-gold">Currency</label>
            <select className="input-gold" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value={DEFAULT_CURRENCIES[network]}>{DEFAULT_CURRENCIES[network]}</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="DAI">DAI</option>
            </select>
          </div>

          {/* Amount Input */}
          <div className="input-group">
            <label className="label-gold">Amount (USD)</label>
            <input 
              type="number" 
              className="input-gold" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))} 
            />
            
            {/* Quick Amount Buttons */}
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

          <button className="btn-primary btn-full" onClick={handleBuy} disabled={loading}>
            {loading ? 'Processing...' : `Buy ${currency}`}
          </button>

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
