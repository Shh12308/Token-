import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faArrowLeft, faPaperPlane, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const SendPage = () => {
  const navigate = useNavigate();
  
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('ETH');
  const [step, setStep] = useState('form'); // form -> confirm
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!toAddress || !amount) return;
    setLoading(true);

    try {
      // 1. Create Transaction Draft
      const res = await axios.post(`${API_BASE}/wallets/send`, {
        toAddress,
        amount,
        asset
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      const unsignedTx = res.data.unsignedTransaction;
      console.log("Unsigned Transaction:", unsignedTx);

      // 2. Move to confirm step (In real app, this triggers wallet signing)
      setStep('confirm');

    } catch (err) {
      console.error(err);
      alert('Failed to prepare transaction');
      setLoading(false);
    }
  };

  const confirmSend = () => {
    // 3. Broadcast Transaction (Simulated for this demo)
    setLoading(true);
    setTimeout(async () => {
        // Normally you would sign here and call /broadcast
        alert("Transaction sent! (Simulated)");
        navigate('/app/activity');
    }, 1000);
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
      </header>

      <main className="main-scroll-area-gold">
        {step === 'form' && (
          <div className="card send-card-gold">
            <div className="send-header-gold">
              <h2>Send Crypto</h2>
            </div>

            <div className="input-group">
              <label className="label-gold">Asset</label>
              <select className="input-gold" value={asset} onChange={(e) => setAsset(e.target.value)}>
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
              </select>
            </div>

            <div className="input-group">
              <label className="label-gold">Recipient Address</label>
              <div className="input-wrapper-gold">
                <input 
                  type="text" 
                  className="input-gold" 
                  placeholder="0x..."
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)} 
                />
                <FontAwesomeIcon icon={faCopy} className="copy-icon-gold" />
              </div>
            </div>

            <div className="input-group">
              <label className="label-gold">Amount</label>
              <input 
                type="number" 
                className="input-gold" 
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)} 
              />
            </div>

            <button className="btn-primary" onClick={handleSend} disabled={loading}>
              {loading ? 'Preparing...' : 'Next'}
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="card confirm-card-gold">
            <h3>Confirm Transaction</h3>
            <div className="confirm-row-gold">
              <span>Sending:</span>
              <span className="font-bold">{amount} {asset}</span>
            </div>
            <div className="confirm-row-gold">
              <span>To:</span>
              <span className="text-sm truncate">{toAddress}</span>
            </div>
            <button className="btn-primary" onClick={confirmSend} disabled={loading}>
              {loading ? 'Broadcasting...' : 'Confirm & Send'}
            </button>
            <button className="btn-secondary" onClick={() => setStep('form')}>
              Cancel
            </button>
          </div>
        )}
      </main>
      <nav className="bottom-nav-gold">
        <div className={`nav-item-gold ${window.location.pathname.includes('send') ? 'active' : ''}`} onClick={() => navigate('/app/send')}><span>Send</span></div>
      </nav>
    </div>
  );
};

export default SendPage;
