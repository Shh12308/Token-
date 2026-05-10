import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  faWallet, faGlobe, faArrowUp, faEye, faArrowDown, faRepeat, 
  faPlus, faGear, faBell, faChevronDown 
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Home = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [totalBalance, setTotalBalance] = useState(0);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Fetch Data on Mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Get User Balances
      const res = await axios.get(`${API_BASE}/balances`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      
      // 2. Get Market Data (for fiat value)
      const marketRes = await axios.get(`${API_BASE}/market?symbols=ethereum,bitcoin,polygon-pos`);
      const prices = marketRes.data.data;

      // Create a price map for easy lookup
      const priceMap = prices.reduce((acc, curr) => {
        acc[curr.symbol.toUpperCase()] = curr.current_price;
        return acc;
      }, {});

      setMarketData(priceMap);

      // 3. Process Assets for UI
      // Backend returns: { eth: "0.5", usdc: "100.0" }
      const assets = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: res.data.eth || 0,
          price: priceMap['ETH'] || 2800,
          change: 2.4,
          icon: 'fa-brands fa-ethereum' // Use FontAwesome Brand
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: res.data.usdc || 0,
          price: 1.00,
          change: 0.01,
          icon: 'fa-solid fa-circle-dollar-to-slot'
        },
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          balance: 0.005, // Mock or fetch from backend if available
          price: priceMap['BTC'] || 45000,
          change: 1.2,
          icon: 'fa-brands fa-bitcoin'
        }
      ];

      setBalances(assets);

      // Calculate Total Fiat Value
      const total = assets.reduce((acc, asset) => {
        return acc + (asset.balance * asset.price);
      }, 0);

      setTotalBalance(total);

    } catch (err) {
      console.error("Dashboard Error:", err);
      // If backend fails, maybe redirect to login if 401
      if(err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="dashboard-loading-gold">
      <div className="loader-gold"></div>
    </div>
  );

  return (
    <div className="dashboard-container-gold">
      
      {/* --- TOP HEADER (Logo & Settings Icon) --- */}
      <header className="top-header-gold">
        <div className="header-left">
          {/* Connected to logo.png */}
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="logo-gold" />
        </div>

        <div className="header-right">
          <div className="network-selector-gold">
            <span>Ethereum Mainnet</span>
            <i className="fa-solid fa-chevron-down"></i>
          </div>
          
          <div className="header-icon" onClick={() => navigate('/app/notifications')}>
            <FontAwesomeIcon icon={faBell} />
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="main-scroll-area-gold">
        
        {/* Balance Card */}
        <div className="balance-card-gold">
          <div className="balance-row-gold">
            <span className="balance-label-gold">Total Balance</span>
            <button onClick={() => setIsBalanceHidden(!isBalanceHidden)} className="eye-btn-gold">
              {isBalanceHidden ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
            </button>
          </div>
          
          <div className="balance-amount-gold">
            {isBalanceHidden ? '••••••••' : `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </div>
          
          <div className="balance-actions-gold">
             <span className="tag-gold">ETH</span>
             <span className="tag-gold active">+2.4%</span>
          </div>
        </div>

        {/* Assets List */}
        <div className="assets-section-gold">
          <h3 className="section-title-gold">Assets</h3>
          <div className="assets-list-gold">
            {balances.map((asset, index) => (
              <div 
                key={index} 
                className="asset-item-gold"
                onClick={() => navigate('/app/asset/' + asset.symbol)}
              >
                <div className="asset-left-gold">
                  <div className="asset-icon-gold">
                    <i className={asset.icon}></i>
                  </div>
                  <div className="asset-info-gold">
                    <div className="asset-name-gold">{asset.name}</div>
                    <div className="asset-balance-gold">
                      {isBalanceHidden ? '••••••' : `${asset.balance} ${asset.symbol}`}
                    </div>
                  </div>
                </div>

                <div className="asset-right-gold">
                  <div className="asset-value-gold">
                    {isBalanceHidden ? '••••••' : `$${(asset.balance * asset.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  </div>
                  <div className={`asset-change-gold ${asset.change >= 0 ? 'positive' : 'negative'}`}>
                    {asset.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- BOTTOM NAVIGATION (MetaMask Style) --- */}
      <nav className="bottom-nav-gold">
        {/* 1. Home (Wallet) */}
        <div 
          className={`nav-item-gold ${window.location.pathname === '/app' ? 'active' : ''}`}
          onClick={() => navigate('/app')}
        >
          <div className="nav-icon-gold">
             <FontAwesomeIcon icon={faWallet} />
          </div>
          <span>Wallet</span>
        </div>

        {/* 2. Browse (NFT Market) */}
        <div 
          className={`nav-item-gold ${window.location.pathname.includes('browse') ? 'active' : ''}`}
          onClick={() => navigate('/app/nft-market')}
        >
          <div className="nav-icon-gold">
            <FontAwesomeIcon icon={faGlobe} />
          </div>
          <span>Browse</span>
        </div>

        {/* 3. Send */}
        <div 
          className={`nav-item-gold ${window.location.pathname.includes('send') ? 'active' : ''}`}
          onClick={() => navigate('/app/send')}
        >
          <div className="nav-icon-gold send">
            <FontAwesomeIcon icon={faArrowUp} />
          </div>
          <span>Send</span>
        </div>

        {/* 4. Swap */}
        <div 
          className={`nav-item-gold ${window.location.pathname.includes('swap') ? 'active' : ''}`}
          onClick={() => navigate('/app/swap')}
        >
          <div className="nav-icon-gold swap">
            <FontAwesomeIcon icon={faRepeat} />
          </div>
          <span>Swap</span>
        </div>

        {/* 5. Buy (Options) */}
        <div 
          className={`nav-item-gold ${window.location.pathname.includes('buy') ? 'active' : ''}`}
          onClick={() => navigate('/app/buy')}
        >
          <div className="nav-icon-gold buy">
            <FontAwesomeIcon icon={faPlus} />
          </div>
          <span>Buy</span>
        </div>

        {/* 6. Settings */}
        <div 
          className={`nav-item-gold ${window.location.pathname.includes('settings') ? 'active' : ''}`}
          onClick={() => navigate('/app/settings')}
        >
          <div className="nav-icon-gold">
            <FontAwesomeIcon icon={faGear} />
          </div>
          <span>Settings</span>
        </div>
      </nav>

    </div>
  );
};

export default Home;
