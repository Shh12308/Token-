import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faEyeSlash, faEye, faBell } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

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
    const token = localStorage.getItem('authToken');
    if(!token) {
        navigate('/login');
        return;
    }
    fetchDashboardData();
  }, [navigate]);

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
      const assets = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: res.data.eth || 0,
          price: priceMap['ETH'] || 2800,
          change: 2.4,
          icon: 'fa-brands fa-ethereum'
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
          balance: 0.005, 
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
      // If backend fails or returns 401, redirect to login
      if(err.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth/login');
      }
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
      
      {/* --- TOP HEADER --- */}
      <header className="top-header-gold">
        <div className="header-left">
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

      <BottomNav />
    </div>
  );
};

export default Home;
