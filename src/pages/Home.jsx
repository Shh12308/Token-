import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 1. Import Axios
import { 
  FiHome, FiTrendingUp, FiSearch, FiGrid, FiActivity, 
  FiGlobe, FiSettings, FiLock, FiUser, FiDollarSign, FiArrowUpRight,
  FiArrowDownLeft, FiClock, FiZap, FiShield, FiChevronRight,
  FiRefreshCw, FiEye, FiEyeOff, FiCopy, FiExternalLink
} from 'react-icons/fi';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Assuming these styled components are imported or defined elsewhere in your file
// If they are CSS classes, adjust the JSX accordingly.
const DashboardContainer = ({ children }) => <div className="dashboard-container">{children}</div>;
const AnimatedBackground = () => <div className="animated-background" />;
const WalletCard = ({ children }) => <div className="wallet-card">{children}</div>;
const QuickActions = ({ children }) => <div className="quick-actions">{children}</div>;
const MarketOverview = ({ children }) => <div className="market-overview">{children}</div>;
const RecentTransactions = ({ children }) => <div className="recent-transactions">{children}</div>;

const NetworkStatus = ({ network }) => <div className="network-status">{network || 'Ethereum'}</div>;

const Home = () => {
  const navigate = useNavigate();
  
  // 2. Local State instead of Redux for direct Backend connection
  const [balances, setBalances] = useState({});
  const [marketData, setMarketData] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [walletAddress, setWalletAddress] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3. Auth Check & Data Fetching
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    // REDIRECT LOGIC: If not logged in, go to Login page
    if (!token) {
      navigate('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // A. Fetch Wallet Data
        const walletRes = await axios.get(`${BACKEND_URL}/wallets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (walletRes.data.wallets && walletRes.data.wallets.length > 0) {
          const primaryWallet = walletRes.data.wallets[0];
          setWalletAddress(primaryWallet.address);
          // Calculate total balance from the first wallet (simple example)
          // In production, you would sum up balances across all wallets/tokens
          const nativeBal = parseFloat(primaryWallet.balances?.native || 0);
          setBalances({ 
            usdValue: nativeBal * 2000 // Mock conversion or fetch price from marketData
          });
        }

        // B. Fetch Market Data
        // Fetching top 5 coins for the dashboard
        const marketRes = await axios.get(`${BACKEND_URL}/market?symbols=ethereum,bitcoin,binancecoin,matic-network,solana`);
        if (marketRes.data.data) {
          setMarketData(marketRes.data.data);
        }

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        // If token is invalid (401), logout and redirect
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/auth/login');
        } else {
          setError('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for real-time updates (every 30s)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger the fetch logic again (refactor fetchData to be reusable if desired, or just reload)
    window.location.reload(); 
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  // Calculate totals based on fetched data
  const totalBalance = Object.values(balances).reduce((acc, balance) => acc + (balance.usdValue || 0), 0);
  const totalChange = marketData.length > 0 
    ? marketData.reduce((acc, crypto) => acc + (crypto.price_change_percentage_24h || 0), 0) / marketData.length 
    : 0;

  return (
    <DashboardContainer>
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-content"
      >
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-top">
            <div className="logo-section">
              <div className="logo">
                <span className="logo-icon">🫘</span>
                <span className="logo-text">CryptoBean</span>
              </div>
              <NetworkStatus network={selectedNetwork} />
            </div>
            
            <div className="header-actions">
              <button 
                onClick={handleRefresh}
                className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                disabled={refreshing}
              >
                <FiRefreshCw />
              </button>
              <button onClick={() => navigate('/search')} className="search-btn">
                <FiSearch />
              </button>
              <button onClick={() => navigate('/browser')} className="browser-btn">
                <FiGlobe />
              </button>
              <button onClick={() => navigate('/settings')} className="settings-btn">
                <FiSettings />
              </button>
            </div>
          </div>
        </header>

        {/* Main Wallet Card */}
        <WalletCard>
          <div className="wallet-header">
            <div className="balance-section">
              <div className="balance-label">Total Balance</div>
              <div className="balance-amount">
                {showBalance ? (
                  <>
                    <span className="currency">$</span>
                    <span className="amount">{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </>
                ) : (
                  <span className="hidden-balance">••••••••</span>
                )}
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="toggle-visibility"
                >
                  {showBalance ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className={`balance-change ${totalChange >= 0 ? 'positive' : 'negative'}`}>
                {totalChange >= 0 ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                <span>{Math.abs(totalChange).toFixed(2)}% (24h)</span>
              </div>
            </div>
            
            <div className="wallet-address">
              <span className="address-text">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
              <button onClick={() => navigator.clipboard.writeText(walletAddress)}>
                <FiCopy />
              </button>
            </div>
          </div>
          
          <div className="wallet-actions">
            <button onClick={() => navigate('/wallet')} className="action-btn primary">
              <FiArrowUpRight />
              <span>Send</span>
            </button>
            <button onClick={() => navigate('/wallet')} className="action-btn secondary">
              <FiArrowDownLeft />
              <span>Receive</span>
            </button>
            <button onClick={() => navigate('/wallet')} className="action-btn secondary">
              <FiRefreshCw />
              <span>Swap</span>
            </button>
            <button onClick={() => navigate('/crypto-sticks')} className="action-btn secondary">
              <FiZap />
              <span>Stake</span>
            </button>
          </div>
        </WalletCard>

        {/* Quick Actions Grid */}
        <QuickActions>
          <motion.div 
            className="actions-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, staggerChildren: 0.1 }}
          >
            <motion.button 
              onClick={() => navigate('/crypto-sticks')}
              className="action-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="action-icon">
                <FiTrendingUp />
              </div>
              <div className="action-content">
                <h3>Crypto Sticks</h3>
                <p>Stake & Earn</p>
              </div>
              <FiChevronRight className="action-arrow" />
            </motion.button>

            <motion.button 
              onClick={() => navigate('/defi')}
              className="action-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="action-icon">
                <FiDollarSign />
              </div>
              <div className="action-content">
                <h3>DeFi</h3>
                <p>Yield Farming</p>
              </div>
              <FiChevronRight className="action-arrow" />
            </motion.button>

            <motion.button 
              onClick={() => navigate('/nft')}
              className="action-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="action-icon">
                <FiGrid />
              </div>
              <div className="action-content">
                <h3>NFTs</h3>
                <p>Marketplace</p>
              </div>
              <FiChevronRight className="action-arrow" />
            </motion.button>

            <motion.button 
              onClick={() => navigate('/browser')}
              className="action-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="action-icon">
                <FiGlobe />
              </div>
              <div className="action-content">
                <h3>Browser</h3>
                <p>DApps & Web3</p>
              </div>
              <FiChevronRight className="action-arrow" />
            </motion.button>

            <motion.button 
              onClick={() => navigate('/activity')}
              className="action-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="action-icon">
                <FiActivity />
              </div>
              <div className="action-content">
                <h3>Activity</h3>
                <p>Transactions</p>
              </div>
              <FiChevronRight className="action-arrow" />
            </motion.button>

            <motion.button 
              onClick={() => navigate('/security')}
              className="action-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="action-icon">
                <FiShield />
              </div>
              <div className="action-content">
                <h3>Security</h3>
                <p>Protection</p>
              </div>
              <FiChevronRight className="action-arrow" />
            </motion.button>
          </motion.div>
        </QuickActions>

        {/* Market Overview */}
        const MarketCard = ({ crypto }) => {
  return (
    <motion.div 
      className="market-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="market-header">
        <img src={crypto.image} alt={crypto.name} className="crypto-icon" />
        <div className="crypto-info">
          <span className="crypto-name">{crypto.name}</span>
          <span className="crypto-symbol">{crypto.symbol.toUpperCase()}</span>
        </div>
      </div>
      <div className="market-price">
        <span className="price">${crypto.current_price?.toLocaleString() || '0.00'}</span>
        <span className={`change ${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
          {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
          {crypto.price_change_percentage_24h?.toFixed(2) || '0.00'}%
        </span>
      </div>
      <div className="market-chart">
        {/* Mini chart placeholder */}
        <div className="mini-chart"></div>
      </div>
    </motion.div>
  );
};

// ...

<MarketOverview>
  <h2 className="section-title">Market Overview</h2>
  <div className="market-grid">
    {marketData.slice(0, 4).map((crypto, index) => (
      <MarketCard key={crypto.id} crypto={crypto} />
    ))}
  </div>
</MarketOverview>

        {/* Recent Transactions */}
        <RecentTransactions>
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
            <button onClick={() => navigate('/activity')} className="view-all">
              View All <FiExternalLink />
            </button>
          </div>
          <div className="transactions-list">
            {/* In a real app, you would map over fetched transactions here */}
            {[1, 2, 3].map((item) => (
              <motion.div 
                key={item}
                className="transaction-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + item * 0.1 }}
              >
                <div className="transaction-icon">
                  {item % 2 === 0 ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                </div>
                <div className="transaction-details">
                  <span className="transaction-type">
                    {item % 2 === 0 ? 'Sent' : 'Received'} ETH
                  </span>
                  <span className="transaction-time">
                    <FiClock /> {item}h ago
                  </span>
                </div>
                <div className="transaction-amount">
                  <span className={item % 2 === 0 ? 'negative' : 'positive'}>
                    {item % 2 === 0 ? '-' : '+'}0.{item}5 ETH
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </RecentTransactions>
      </motion.div>
    </DashboardContainer>
  );
};

export default Home;
