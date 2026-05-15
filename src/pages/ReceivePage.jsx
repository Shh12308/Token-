import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { faArrowLeft, faCopy, faQrcode, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// REMOVED: import { QRCodeSVG }... to stop the crash. Added faExclamationTriangle for errors.

const ReceivePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWalletAddress = () => {
      try {
        // 1. Try to get from LocalStorage first (Fastest)
        const user = localStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          if (parsedUser.walletAddress || parsedUser.address) {
            setAddress(parsedUser.walletAddress || parsedUser.address);
            return; // Stop here if found
          }
        }

        // 2. If not in storage, you might be fetching from API.
        // Since your logs show "Failed to fetch account data", we handle that gracefully.
        // If you have an API call here, ensure it has a .catch() block.
        
      } catch (err) {
        console.error('Storage parsing error:', err);
        setError('Failed to load wallet data from storage.');
      }
    };

    fetchWalletAddress();
  }, []);

  const handleCopy = useCallback(() => {
    if (!address) return;

    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }, [address]);

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div 
          className="header-left" 
          onClick={() => navigate('/app')} 
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/app')}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
      </header>

      <main className="main-scroll-area-gold" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card receive-card-gold">
          <h2>Receive Funds</h2>
          
          {/* Error Display for Network/Storage Issues */}
          {error ? (
             <div style={{ textAlign: 'center', color: '#d9534f', marginTop: '20px' }}>
               <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
               <p style={{ marginTop: '10px' }}>{error}</p>
               <p style={{ fontSize: '0.8rem', color: '#666' }}>
                 Please check your internet connection or try logging in again.
               </p>
             </div>
          ) : (
            <>
              <p className="text-muted text-center">Scan QR or copy address below</p>

              {/* Safe QR Placeholder - Does not require external library */}
              <div 
                className="qr-placeholder-gold" 
                style={{ 
                  background: '#fff', 
                  padding: '20px', 
                  borderRadius: '10px', 
                  display: 'inline-block',
                  marginTop: '20px'
                }}
              >
                {address ? (
                   // If you installed qrcode.react, you can swap this icon for <QRCodeSVG value={address} size={180} />
                   <FontAwesomeIcon icon={faQrcode} size="5x" color="#333" />
                ) : (
                   <FontAwesomeIcon icon={faQrcode} size="5x" spin color="#ccc" />
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
                    wordBreak: 'break-all',
                    fontSize: '0.9rem'
                  }}
                >
                  {address || 'Address not available'}
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
