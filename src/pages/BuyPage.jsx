import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faArrowLeft, faCreditCard, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BuyPage = () => {
  const navigate = useNavigate();
  
  const [amount, setAmount] = useState(100);
  const [currency, setCurrency] = useState('ETH');
  const [provider, setProvider] = useState('moonpay');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/buy`, {
        amount,
        currency,
        provider
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      // Backend returns: { url: "https://..." }
      // We redirect the user to the provider
      window.location.href = res.data.url;

    } catch (err) {
      console.error(err);
      setLoading(false);
      if (err.response?.status === 403) {
        alert('KYC Required: Please complete verification to buy crypto.');
        navigate('/app/settings');
      } else {
        alert('Failed to initiate buy session.');
      }
    }
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
      </header>

      <main className="main-scroll-area-gold">
        <div className="card buy-card-gold">
          <div className="buy-header-gold">
            <FontAwesomeIcon icon={faCreditCard} size="2x" />
            <h2>Buy Crypto</h2>
          </div>

          <div className="input-group">
            <label className="label-gold">Provider</label>
            <select className="input-gold" value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="moonpay">MoonPay</option>
              <option value="transak">Transak</option>
              <option value="wyre">Wyre</option>
            </select>
          </div>

          <div className="input-group">
            <label className="label-gold">Currency</label>
            <select className="input-gold" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="USDC">USDC</option>
            </select>
          </div>

          <div className="input-group">
            <label className="label-gold">Amount (USD)</label>
            <input 
              type="number" 
              className="input-gold" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>

          <button className="btn-primary" onClick={handleBuy} disabled={loading}>
            {loading ? 'Processing...' : `Buy ${currency}`}
          </button>

          <div className="secure-note-gold">
            <FontAwesomeIcon icon={faShieldAlt} />
            <span>Secured by Bank-grade encryption</span>
          </div>
        </div>
      </main>
      <nav className="bottom-nav-gold">
        <div className={`nav-item-gold ${window.location.pathname.includes('buy') ? 'active' : ''}`} onClick={() => navigate('/app/buy')}><span>Buy</span></div>
      </nav>
    </div>
  );
};

export default BuyPage;
