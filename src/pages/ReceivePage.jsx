import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { faArrowLeft, faCopy, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ReceivePage = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('0x...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try to get address from stored user object or DB
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      setAddress(parsedUser.walletAddress || parsedUser.address);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
      </header>

      <main className="main-scroll-area-gold" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="card receive-card-gold">
          <h2>Receive Funds</h2>
          <p className="text-muted text-center">Send crypto to this address</p>

          <div className="qr-placeholder-gold">
             <FontAwesomeIcon icon={faQrcode} size="4x" />
             {/* In production: <QRCode value={address} size={200} /> */}
          </div>

          <div className="address-display-gold">
            <div className="address-box-gold">{address}</div>
            <button className="btn-secondary" onClick={handleCopy}>
              {copied ? 'Copied!' : <><FontAwesomeIcon icon={faCopy} /> Copy Address</>}
            </button>
          </div>
        </div>
      </main>
      <nav className="bottom-nav-gold">
         <div className={`nav-item-gold ${window.location.pathname.includes('receive') ? 'active' : ''}`} onClick={() => navigate('/app/receive')}><span>Receive</span></div>
      </nav>
    </div>
  );
};

export default ReceivePage;
