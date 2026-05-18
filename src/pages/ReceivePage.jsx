import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { faArrowLeft, faCopy, faCheck, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { QRCodeSVG } from 'qrcode.react'; // Ensure you run: npm install qrcode.react
import BottomNav from '../components/BottomNav';
import { getSessionWallet } from '../../utils/session'; // Import session manager

const CHAINS = {
  ethereum: { name: 'Ethereum', explorer: 'https://etherscan.io' },
  polygon: { name: 'Polygon', explorer: 'https://polygonscan.com' },
  bsc: { name: 'BNB Chain', explorer: 'https://bscscan.com' },
  arbitrum: { name: 'Arbitrum', explorer: 'https://arbiscan.io' },
  base: { name: 'Base', explorer: 'https://basescan.org' },
};


const ReceivePage = () => {
  const navigate = useNavigate();
  
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedChain, setSelectedChain] = useState('ethereum');

  // ── Load active wallet address on mount ─────────────────
  useEffect(() => {
    // 1. Try getting from memory session (imported from utils)
    const activeWallet = getSessionWallet();
    
    if (activeWallet?.address) {
      setAddress(activeWallet.address);
    } else {
      // 2. Fallback to localStorage set during Login
      const storedAddress = localStorage.getItem('walletAddress');
      if (storedAddress) {
        setAddress(storedAddress);
      }
    }
  }, []);

  const handleCopy = () => {
    if (!address) return;

    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Fallback for HTTP contexts
      const textArea = document.createElement('textarea');
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const truncateAddr = (addr) => addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '';

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
        <div className="header-center">
          <h2>Receive Assets</h2>
        </div>
      </header>

      <main className="main-scroll-area-gold" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="card receive-card-gold" style={{ textAlign: 'center' }}>
          
          <div className="input-group" style={{ textAlign: 'left', marginBottom: 24 }}>
            <label className="label-gold">Select Network</label>
            <select 
              className="input-gold" 
              value={selectedChain} 
              onChange={(e) => setSelectedChain(e.target.value)}
            >
              {Object.keys(CHAINS).map(key => (
                <option key={key} value={key}>{CHAINS[key].name}</option>
              ))}
            </select>
          </div>

          {/* QR Code */}
          <div style={{ 
            background: '#ffffff', 
            padding: '24px', 
            borderRadius: '16px', 
            display: 'inline-block',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            {address ? (
              <QRCodeSVG 
                value={address} 
                size={180} 
                bgColor="#ffffff" 
                fgColor="#000000" 
                level="M" 
                includeMargin={false}
              />
            ) : (
              <div style={{ width: 180, height: 180, background: '#eee', borderRadius: 8 }} />
            )}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
            Only send {CHAINS[selectedChain].name} assets to this address.
          </p>

          {/* Address Display */}
          <div style={{ 
            padding: '16px', 
            background: 'var(--bg-input)', 
            border: '1px solid var(--border-color)',
            borderRadius: '12px', 
            fontFamily: 'monospace', 
            wordBreak: 'break-all',
            fontSize: '14px',
            color: 'var(--text-main)',
            marginBottom: '16px'
          }}>
            {address || 'Loading address...'}
          </div>

          {/* Action Buttons */}
          <button 
            className="btn-primary" 
            onClick={handleCopy} 
            disabled={!address}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {copied ? (
              <>
                <FontAwesomeIcon icon={faCheck} /> Copied!
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCopy} /> Copy Address
              </>
            )}
          </button>

          {address && (
            <button 
              className="btn-secondary" 
              onClick={() => window.open(`${CHAINS[selectedChain].explorer}/address/${address}`, '_blank')}
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <FontAwesomeIcon icon={faUpRightFromSquare} /> View on Explorer
            </button>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ReceivePage;
