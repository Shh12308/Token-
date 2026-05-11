import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faArrowLeft, faRepeat, faChevronDown, faInfoCircle } from '@fortawesome/free-solid-svg-icons'; // ADDED faArrowBack
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav'; // Import shared nav

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const SwapPage = () => {
  const navigate = useNavigate();
  
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSwap = async () => {
    if (!fromAmount) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/swap`, {
        fromToken,
        toToken,
        fromAmount,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      
      alert(`Swap simulation successful! TxID: ${res.data.transactionId}`);
      navigate('/app/activity');
    } catch (err) {
      console.error(err);
      alert('Swap failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          {/* FIX: Use object, not string */}
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
        <div className="header-right">
           <span className="network-pill-gold">Ethereum</span>
        </div>
      </header>

      <main className="main-scroll-area-gold" style={{ justifyContent: 'center' }}>
        <div className="card swap-card-gold">
          <div className="swap-header-gold">
            <span>Swap</span>
            <FontAwesomeIcon icon={faInfoCircle} className="text-muted" />
          </div>

          {/* From Input */}
          <div className="swap-input-group-gold">
            <div className="input-label-gold">
              <span>Pay</span>
              <div className="select-badge-gold" onClick={() => setFromToken('USDC')}>
                {fromToken} <FontAwesomeIcon icon={faChevronDown} style={{fontSize: '10px', marginLeft:'5px'}}/>
              </div>
            </div>
            <input 
              type="number" 
              className="input-gold" 
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />
            <div className="balance-hint-gold">Balance: 0.5 ETH</div>
          </div>

          {/* Icon Swap */}
          <div className="swap-arrow-gold">
             <FontAwesomeIcon icon={faRepeat} />
          </div>

          {/* To Input */}
          <div className="swap-input-group-gold">
            <div className="input-label-gold">
              <span>Receive</span>
              <div className="select-badge-gold" onClick={() => setToToken('ETH')}>
                {toToken} <FontAwesomeIcon icon={faChevronDown} style={{fontSize: '10px', marginLeft:'5px'}}/>
              </div>
            </div>
            <input 
              type="number" 
              className="input-gold" 
              placeholder="0.0"
              value={toAmount}
              readOnly
            />
            <div className="balance-hint-gold">Balance: 0.00 USDC</div>
          </div>

          {/* Settings */}
          <div className="swap-settings-gold">
            <div className="setting-row-gold">
              <span>Slippage Tolerance</span>
              <span>0.5%</span>
            </div>
            <div className="setting-row-gold">
              <span>Deadline</span>
              <span>20 mins</span>
            </div>
          </div>

          <button className="btn-primary btn-swap-gold" onClick={handleSwap} disabled={loading}>
            {loading ? 'Swapping...' : 'Swap'}
          </button>
        </div>
      </main>
      
      {/* Use Shared Nav */}
      <BottomNav />
    </div>
  );
};

export default SwapPage;
