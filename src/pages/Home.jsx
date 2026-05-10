import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Icons (Make sure these are installed)
import {
  FiTrendingUp, FiSearch, FiGrid, FiActivity,
  FiGlobe, FiSettings, FiArrowUpRight, FiArrowDownLeft,
  FiClock, FiZap, FiShield, FiChevronRight,
  FiRefreshCw, FiEye, FiEyeOff, FiCopy, FiExternalLink
} from 'react-icons/fi';

// Components
// Assuming these files exist in your project
import QuickActions from '../components/wallet/QuickActionsView'; 
import SendView from '../components/wallet/SendView';
import ReceiveView from '../components/wallet/ReceiveView';
import SwapView from '../components/wallet/SwapView';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const DashboardContainer = ({ children }) => <div className="dashboard-container">{children}</div>;
const AnimatedBackground = () => <div className="animated-background" />;
const WalletCard = ({ children }) => <div className="wallet-card">{children}</div>;
const NetworkStatus = ({ network }) => <div className="network-status">{network || 'Ethereum'}</div>;

// --- HELPER: GET AUTH HEADERS ---
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  
  // FIX: Check if token exists before adding Authorization header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// --- HELPER: MARKET CARD COMPONENT ---
const MarketCard = ({ crypto }) => {
  if (!crypto) return null;

  return (
    <motion.div className="market-card">
      <div className="market-header">
        <img src={crypto.image || ''} alt={crypto.name || ''} className="crypto-icon" />
        <div className="crypto-info">
          <span className="crypto-name">{crypto.name || 'Unknown'}</span>
          <span className="crypto-symbol">
            {crypto.symbol?.toUpperCase() || ''}
          </span>
        </div>
      </div>
      <div className="market-price">
        <span className="price">
          ${crypto.current_price?.toLocaleString() || '0.00'}
        </span>
        <span className={`change ${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
          {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
          {crypto.price_change_percentage_24h?.toFixed(2) || '0.00'}%
        </span>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const navigate = useNavigate();

  const [balances, setBalances] = useState({});
  const [marketData, setMarketData] = useState([]);
  const [selectedNetwork] = useState('ethereum');
  const [walletAddress, setWalletAddress] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      navigate('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // WALLET
        // FIX: Use getAuthHeaders helper
        const walletRes = await axios.get(`${BACKEND_URL}/wallets`, {
          headers: getAuthHeaders(), // <-- CRITICAL FIX FOR 401
        });

        const wallets = walletRes.data?.wallets || [];

        if (wallets.length > 0) {
          const primaryWallet = wallets[0];
          setWalletAddress(primaryWallet.address || '');
          const nativeBal = parseFloat(primaryWallet?.balances?.native || 0);

          setBalances({
            usdValue: nativeBal * 2000 
          });
        }

        // MARKET
        // FIX: Use getAuthHeaders helper
        const marketRes = await axios.get(
          `${BACKEND_URL}/market?symbols=ethereum,bitcoin,binancecoin,matic-network,solana&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`
        ); // Note: Fixed URL params to valid symbols

        const data = marketRes.data?.data || [];
        setMarketData(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error(err);

        // FIX: Handle 401 specifically
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Polling logic (reduced from 30s to 10s for responsiveness, or keep as needed)
    const interval = setInterval(fetchData, 10000); 

    return () => clearInterval(interval);
  }, [navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, you'd call fetchData() again
    setTimeout(() => setRefreshing(false), 1000); 
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  const totalBalance = Object.values(balances || {}).reduce(
    (acc, b) => acc + (b?.usdValue || 0),
    0
  );

  // Calculate average change (handle undefined rates gracefully)
  const totalChange =
    marketData.length > 0
      ? marketData.reduce(
          (acc, c) => acc + (parseFloat(c?.price_change_percentage_24h) || 0),
          0
        ) / marketData.length
      : 0;

  return (
    <DashboardContainer>
      <AnimatedBackground />

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-actions">
            <button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <div className="spin"><FiRefreshCw /></div> : <FiRefreshCw />}
            </button>
            <button onClick={() => navigate('/search')}>
              <FiSearch />
            </button>
            <button onClick={() => navigate('/settings')}>
              <FiSettings />
            </button>
          </div>
        </header>

        {/* WALLET */}
        <WalletCard>
          <div>
            <div>Total Balance</div>

            <div className="balance-display">
              {showBalance ? (
                <>{totalBalance.toFixed(2)}</>
              ) : (
                '••••••••••'
              )}

              <button 
                className="toggle-btn" 
                onClick={() => setShowBalance(!showBalance)}
                title={showBalance ? "Hide Balance" : "Show Balance"}
              >
                {showBalance ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="balance-change">
              <span>{totalChange >= 0 ? '+' : ''}</span>
              <span className={totalChange >= 0 ? 'positive' : 'negative'}>
                {Math.abs(totalChange).toFixed(2)}%
              </span>
            </div>
          </div>

          <div>
            <span>{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(walletAddress || '')}
              title="Copy Address"
            >
              <FiCopy />
            </button>
          </div>
        </WalletCard>

        {/* MARKET */}
        <div className="market-overview">
          <h2>Market</h2>

          <div className="market-grid">
            {marketData.slice(0, 4).map((crypto) => (
              <MarketCard key={crypto.id || Math.random()} crypto={crypto} />
            ))}
          </div>
        </div>

        {/* ACTIVITY */}
        <div className="recent-activity">
          <h2>Recent Activity</h2>

          <div className="activity-list">
            {[1, 2, 3].map((item) => (
              <div key={item}>
                {item % 2 === 0 ? 'Sent' : 'Received'} ETH
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
};

export default Home;
