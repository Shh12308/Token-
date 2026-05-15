import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { faArrowLeft, faCopy, faQrcode, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Note: You would typically install this: npm install qrcode.react
import { QRCodeSVG } from 'qrcode.react';

const ReceivePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize state with empty string to avoid flashing "0x..."
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Effect for fetching address (Simulating secure storage retrieval)
  useEffect(() => {
    const fetchWalletAddress = () => {
      try {
        const user = localStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          // Support multiple possible address key names
          const walletAddr = parsedUser.walletAddress || parsedUser.address;
          
          if (walletAddr) {
            setAddress(walletAddr);
          } else {
            setError('No wallet address found for this user.');
          }
        } else {
          setError('User data not found. Please log in again.');
        }
      } catch (err) {
        console.error('Failed to parse user data:', err);
        setError('Failed to load wallet data.');
      }
    };

    fetchWalletAddress();
  }, []);

  // useCallback prevents function recreation on every render
  const handleCopy = useCallback(() => {
    if (!address) return;

    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }, [address]);

  // Truncate address for display: 0x1234...abcd
  const truncatedAddress = address 
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` 
    : 'Loading...';

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        {/* Accessibility: added aria-label and role */}
        <div 
          className="header-left" 
          onClick={() => navigate('/app')} 
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/app')}
          aria-label="Go back to dashboard"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
      </header>

      <main className="main-scroll-area-gold" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card receive-card-gold">
          <h2>Receive Funds</h2>
          <p className="text-muted text-center">Scan QR or copy address below</p>

          {/* Error Handling */}
          {error ? (
            <div className="error-message" style={{ color: 'red', padding: '20px' }}>
              {error}
            </div>
          ) : (
            <>
              {/* Updated QR Code Implementation */}
              <div className="qr-placeholder-gold" style={{ background: '#fff', padding: '10px', borderRadius: '10px' }}>
                {address ? (
                  <QRCodeSVG value={address} size={180} level="H" />
                ) : (
                  <FontAwesomeIcon icon={faQrcode} size="4x" spin />
                )}
              </div>

              <div className="address-display-gold" style={{ marginTop: '20px', width: '100%' }}>
                <div 
                  className="address-box-gold" 
                  style={{ 
                    padding: '10px', 
                    background: '#f5f5f5', 
                    borderRadius: '8px', 
                    fontFamily: 'monospace', 
                    textAlign: 'center',
                    wordBreak: 'break-all'
                  }}
                  title={address}
                >
                  {address || 'Fetching address...'}
                </div>
                
                <button 
                  className="btn-secondary" 
                  onClick={handleCopy} 
                  disabled={!address}
                  style={{ marginTop: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
              </div>
            </>
          )}
        </div>
      </main>
      
      <nav className="bottom-nav-gold">
        <div 
          className={`nav-item-gold ${location.pathname.includes('receive') ? 'active' : ''}`} 
          onClick={() => navigate('/app/receive')}
        >
          <span>Receive</span>
        </div>
      </nav>
    </div>
  );
};

export default ReceivePage;
