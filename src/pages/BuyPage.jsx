import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { faArrowLeft, faCreditCard, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

import { getSessionWallet } from '../../utils/session';

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

// 🔥 Direct provider configs (NO BACKEND NEEDED)
const PROVIDERS = {
  moonpay: 'https://buy.moonpay.com',
  ramp: 'https://buy.ramp.network',
  transak: 'https://global.transak.com'
};

const BuyPage = () => {
  const navigate = useNavigate();

  const [amount, setAmount] = useState(100);
  const [network, setNetwork] = useState('ethereum');
  const [currency, setCurrency] = useState('ETH');
  const [provider, setProvider] = useState('moonpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNetworkChange = (e) => {
    const net = e.target.value;
    setNetwork(net);
    setCurrency(DEFAULT_CURRENCIES[net] || 'ETH');
  };

  const handleBuy = async () => {
    setLoading(true);
    setError('');

    // ✅ Get wallet from session (NOT localStorage)
    const wallet = getSessionWallet();

    if (!wallet) {
      setError('Wallet not loaded. Please login again.');
      setLoading(false);
      return;
    }

    try {
      const address = wallet.address;

      // 🔥 Build direct provider URL (non-custodial)
      let url = '';

      if (provider === 'moonpay') {
        url = `${PROVIDERS.moonpay}?apiKey=YOUR_API_KEY
          &walletAddress=${address}
          &baseCurrencyCode=${currency}
          &quoteCurrencyAmount=${amount}`;
      }

      if (provider === 'ramp') {
        url = `${PROVIDERS.ramp}?userAddress=${address}
          &swapAsset=${currency}
          &fiatValue=${amount}`;
      }

      if (provider === 'transak') {
        url = `${PROVIDERS.transak}?walletAddress=${address}
          &cryptoCurrencyCode=${currency}
          &fiatAmount=${amount}`;
      }

      // Clean URL
      url = url.replace(/\s+/g, '');

      // 🚀 Redirect directly (no backend)
      window.location.href = url;

    } catch (err) {
      console.error(err);
      setError('Failed to initiate purchase.');
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
      </header>

      <main className="main-scroll-area-gold">
        <div className="card buy-card-gold">
          <FontAwesomeIcon icon={faCreditCard} size="2x" color="#c9a84c" />
          <h2>Buy Crypto</h2>
          <p style={{ color: '#888' }}>
            Funds go directly to your wallet
          </p>

          {error && <div className="error">{error}</div>}

          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="moonpay">MoonPay</option>
            <option value="ramp">Ramp</option>
            <option value="transak">Transak</option>
          </select>

          <select value={network} onChange={handleNetworkChange}>
            {SUPPORTED_NETWORKS.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>

          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value={DEFAULT_CURRENCIES[network]}>
              {DEFAULT_CURRENCIES[network]}
            </option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
          </select>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <button onClick={handleBuy} disabled={loading}>
            {loading ? 'Processing...' : `Buy ${currency}`}
          </button>

          <div className="secure-note-gold">
            <FontAwesomeIcon icon={faShieldAlt} />
            <span>Non-Custodial</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default BuyPage;
