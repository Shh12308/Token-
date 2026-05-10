import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

// Icons
import {
  FiTrendingUp, FiSearch, FiGrid, FiActivity,
  FiGlobe, FiSettings, FiArrowUpRight, FiArrowDownLeft,
  FiClock, FiZap, FiShield, FiChevronRight,
  FiRefreshCw, FiEye, FiEyeOff, FiCopy, FiExternalLink
} from 'react-icons/fi';

// Components (Assuming these are in the same directory)
// If they are not, you will need to create them or import them correctly.
const QuickActions = ({ children }) => <div className="quick-actions">{children}</div>;
const MarketOverview = ({ children }) => <div className="market-overview">{children}</div>;
const RecentTransactions = ({ children }) => <div className="recent-transactions">{children}</div>;

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const DashboardContainer = ({ children }) => <div className="dashboard-container">{children}</div>;
const AnimatedBackground = () => <div className="animated-background" />;
const WalletCard = ({ children }) => <div className="wallet-card">{children}</div>;
const NetworkStatus = ({ network }) => <div className="network-status">{network || 'Ethereum'}</div>;

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

    // Define fetchData inside useEffect or outside to be accessible to cleanup
    const fetchData = async () => {
      try {
        setLoading(true);

        // WALLET
        const walletRes = await axios.get(`${BACKEND_URL}/wallets`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const wallets = walletRes.data?.wallets || [];

        if (wallets.length > 0) {
          const primaryWallet = wallets[0];

          setWalletAddress(primaryWallet.address || '');

          // Assuming balances are returned on the wallet object or user object
          const nativeBal = parseFloat(primaryWallet?.balances?.native || 0);

          setBalances({
            usdValue: nativeBal * 2000 
          });
        }

        // MARKET
        const marketRes = await axios.get(
          `${BACKEND_URL}/market?symbols=ethereum,bitcoin,binancecoin,matic-network,solana`
        );

        const data = marketRes.data?.data || [];

        setMarketData(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error(err);

        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Polling logic
    const interval = setInterval(fetchData, 30000);

    // Cleanup function
    return () => clearInterval(interval);
  }, [navigate]); // Re-run if navigation changes

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, you'd call fetchData() again
    // window.location.reload(); // Refreshing the whole page is simple but jarring
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', height: '100vh', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const totalBalance = Object.values(balances || {}).reduce(
    (acc, b) => acc + (b?.usdValue || 0),
    0
  );

  // Calculate average 24h change
  const totalChange =
    marketData.length > 0
      ? marketData.reduce(
          (acc, c) => acc + (c?.price_change_percentage_24h || 0),
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
          <div className="balance-header">
            <div>Total Balance</div>
            <div className="balance-actions">
              <NetworkStatus network={selectedNetwork} />
            </div>
          </div>

          <div className="balance-display">
            <div className="main-amount">
              {showBalance ? (
                `$${totalBalance.toLocaleString()}`
              ) : (
                '•••••••••'
              )}
            </div>
            
            <button 
              className="toggle-btn" 
              onClick={() => setShowBalance(!showBalance)}
              title={showBalance ? "Hide Balance" : "Show Balance"}
            >
              {showBalance ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="balance-change">
            <span>24h:</span>
            <span className={totalChange >= 0 ? 'positive' : 'negative'}>
              {totalChange >= 0 ? '+' : ''}
              {totalChange.toFixed(2)}%
            </span>
          </div>
        </WalletCard>

        {/* MARKET */}
        <MarketOverview>
          <h2>Market</h2>

          {marketData.length === 0 ? (
            <p className="empty-state">No market data available.</p>
          ) : (
            <div className="market-grid">
              {marketData.slice(0, 4).map((crypto) => (
                <MarketCard key={crypto.id || Math.random()} crypto={crypto} />
              ))}
            </div>
          )}
        </MarketOverview>

        {/* ACTIVITY */}
        <RecentTransactions>
          <h2>Recent Activity</h2>

          <div className="activity-list">
            {[1, 2, 3].map((item) => (
              <div key={item} className="activity-item">
                <div className="activity-icon">
                  {item % 2 === 0 ? '↓' : '↑'}
                </div>
                <div className="activity-details">
                  <span className="activity-type">
                    {item % 2 === 0 ? 'Sent' : 'Received'}
                  </span>
                  <span className="activity-amount">
                    0.01 ETH
                  </span>
                </div>
              </div>
            ))}
          </div>
        </RecentTransactions>
      </div>
    </DashboardContainer>
  );
};

export default Home;
