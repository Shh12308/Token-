import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

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
      // Calls the backend endpoint defined in your server code
      const res = await axios.post(`${API_BASE}/wallets/send`, {
        toAddress,
        amount,
        asset
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      // Backend returns { transaction: {...}, unsignedTransaction: {...} }
      // In a real non-custodial app, you would sign 'unsignedTransaction' here using ethers.js
      console.log("Unsigned Transaction:", res.data.unsignedTransaction);
      
      setStep('confirm');

    } catch (err) {
      console.error(err);
      alert('Failed to prepare transaction');
      setLoading(false);
    }
  };

  const confirmSend = async () => {
    // Simulate signing and broadcasting
    setLoading(true);
    setTimeout(() => {
        // In real flow: const signedTx = wallet.signTransaction(unsignedTx);
        // await axios.post('/api/wallets/broadcast', { ... });
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
              <input 
                type="text" 
                className="input-gold" 
                placeholder="0x..."
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)} 
              />
            </div>

            <div className="input-group">
              <label className="label-gold">Amount</label>
              <input 
                type="number" 
                className="input-gold" 
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.value)} 
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
      <BottomNav />
    </div>
  );
};

export default SendPage;
