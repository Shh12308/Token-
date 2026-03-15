// CryptoBean - Advanced Crypto Wallet Application
// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Web3Provider } from './contexts/Web3Context';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import GlobalStyles from './styles/GlobalStyles';
import { AnimatePresence } from 'framer-motion';

// Import Components
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';
import CryptoSticks from './pages/CryptoSticks';
import Search from './pages/Search';
import NFTMarketplace from './pages/NFTMarketplace';
import DeFi from './pages/DeFi';
import Activity from './pages/Activity';
import Security from './pages/Security';
import Browser from './pages/Browser';
import Profile from './pages/Profile';
import LockScreen from './components/LockScreen';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasOnboarded = localStorage.getItem('cryptoBean_onboarded');
    const isLockedState = localStorage.getItem('cryptoBean_locked');
    
    setTimeout(() => {
      setIsLoading(false);
      setIsOnboarded(hasOnboarded === 'true');
      setIsLocked(isLockedState === 'true');
    }, 2000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Provider store={store}>
      <Web3Provider>
        <ThemeProvider>
          <NotificationProvider>
            <GlobalStyles />
            <Router>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={
                    !isOnboarded ? 
                    <Navigate to="/onboarding" replace /> : 
                    isLocked ? 
                    <Navigate to="/lock" replace /> : 
                    <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/lock" element={<LockScreen />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/crypto-sticks" element={<CryptoSticks />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/nft" element={<NFTMarketplace />} />
                  <Route path="/defi" element={<DeFi />} />
                  <Route path="/activity" element={<Activity />} />
                  <Route path="/browser" element={<Browser />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Router>
          </NotificationProvider>
        </ThemeProvider>
      </Web3Provider>
    </Provider>
  );
};

export default App;

// Dashboard.js - Main Dashboard Page
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FiHome, FiWallet, FiTrendingUp, FiSearch, FiGrid, FiActivity, 
  FiGlobe, FiSettings, FiLock, FiUser, FiDollarSign, FiArrowUpRight,
  FiArrowDownLeft, FiClock, FiZap, FiShield, FiChevronRight,
  FiRefreshCw, FiEye, FiEyeOff, FiCopy, FiExternalLink
} from 'react-icons/fi';
import { updateBalance } from '../store/slices/walletSlice';
import { fetchMarketData } from '../store/slices/marketSlice';
import { 
  DashboardContainer, 
  WalletCard, 
  QuickActions, 
  MarketOverview,
  RecentTransactions,
  NetworkStatus,
  AnimatedBackground
} from '../components/dashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { balances, selectedNetwork, walletAddress } = useSelector(state => state.wallet);
  const { marketData } = useSelector(state => state.market);
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(updateBalance());
    dispatch(fetchMarketData());
    const interval = setInterval(() => {
      dispatch(updateBalance());
      dispatch(fetchMarketData());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(updateBalance());
    await dispatch(fetchMarketData());
    setTimeout(() => setRefreshing(false), 1000);
  };

  const totalBalance = Object.values(balances).reduce((acc, balance) => acc + balance.usdValue, 0);
  const totalChange = marketData.reduce((acc, crypto) => acc + (crypto.price_change_percentage_24h || 0), 0) / marketData.length;

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
        <MarketOverview>
          <h2 className="section-title">Market Overview</h2>
          <div className="market-grid">
            {marketData.slice(0, 4).map((crypto, index) => (
              <motion.div 
                key={crypto.id}
                className="market-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="market-header">
                  <img src={crypto.image} alt={crypto.name} className="crypto-icon" />
                  <div className="crypto-info">
                    <span className="crypto-name">{crypto.name}</span>
                    <span className="crypto-symbol">{crypto.symbol.toUpperCase()}</span>
                  </div>
                </div>
                <div className="market-price">
                  <span className="price">${crypto.current_price.toLocaleString()}</span>
                  <span className={`change ${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                    {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                    {crypto.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
                <div className="market-chart">
                  {/* Mini chart placeholder */}
                  <div className="mini-chart"></div>
                </div>
              </motion.div>
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

export default Dashboard;

// CryptoSticks.js - Staking and Farming Page
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiTrendingUp, FiZap, FiLock, FiUnlock, FiDollarSign, FiClock,
  FiChevronDown, FiChevronUp, FiInfo, FiExternalLink, FiRefreshCw
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import { StakingPool, FarmingPool, YieldCalculator } from '../components/staking';

const CryptoSticks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('staking');
  const [expandedPool, setExpandedPool] = useState(null);
  const [selectedPool, setSelectedPool] = useState(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  const stakingPools = [
    {
      id: 1,
      token: 'ETH',
      apr: 5.2,
      tvl: 125000000,
      lockPeriod: 'Flexible',
      minAmount: 0.1,
      icon: '🔷',
      rewards: ['ETH', 'BEAN'],
      tier: 'Premium'
    },
    {
      id: 2,
      token: 'BEAN',
      apr: 12.8,
      tvl: 45000000,
      lockPeriod: '30 days',
      minAmount: 100,
      icon: '🫘',
      rewards: ['BEAN', 'ETH'],
      tier: 'Standard'
    },
    {
      id: 3,
      token: 'USDC',
      apr: 8.5,
      tvl: 89000000,
      lockPeriod: 'Flexible',
      minAmount: 10,
      icon: '💵',
      rewards: ['USDC', 'BEAN'],
      tier: 'Premium'
    }
  ];

  const farmingPools = [
    {
      id: 1,
      pair: 'ETH/USDC',
      apr: 18.5,
      tvl: 67000000,
      lpToken: 'UNI-V2',
      icon: '🌊',
      rewards: ['UNI', 'BEAN'],
      risk: 'Medium'
    },
    {
      id: 2,
      pair: 'BEAN/ETH',
      apr: 25.3,
      tvl: 34000000,
      lpToken: 'UNI-V2',
      icon: '🌾',
      rewards: ['UNI', 'BEAN'],
      risk: 'High'
    },
    {
      id: 3,
      pair: 'USDT/USDC',
      apr: 6.8,
      tvl: 120000000,
      lpToken: 'UNI-V2',
      icon: '💧',
      rewards: ['UNI', 'BEAN'],
      risk: 'Low'
    }
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'APR History',
      data: [4.8, 5.1, 5.3, 5.0, 5.4, 5.2],
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4
    }]
  };

  return (
    <div className="crypto-sticks-page">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="page-header"
      >
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              ← Dashboard
            </button>
            <h1 className="page-title">
              <span className="title-icon">🌱</span>
              Crypto Sticks
            </h1>
            <p className="page-subtitle">Stake and farm your crypto to earn rewards</p>
          </div>
          <div className="header-actions">
            <button className="calculator-btn" onClick={() => setShowCalculator(!showCalculator)}>
              <FiDollarSign />
              Yield Calculator
            </button>
            <button className="tutorial-btn">
              <FiExternalLink />
              Tutorial
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="calculator-section"
          >
            <YieldCalculator pools={[...stakingPools, ...farmingPools]} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'staking' ? 'active' : ''}`}
            onClick={() => setActiveTab('staking')}
          >
            <FiLock />
            Staking
          </button>
          <button 
            className={`tab ${activeTab === 'farming' ? 'active' : ''}`}
            onClick={() => setActiveTab('farming')}
          >
            <FiTrendingUp />
            Liquidity Farming
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'staking' ? (
          <motion.div
            key="staking"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pools-container"
          >
            <div className="pools-header">
              <h2>Available Staking Pools</h2>
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-label">Total TVL</span>
                  <span className="stat-value">$259M</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Avg APR</span>
                  <span className="stat-value">8.8%</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Your Earnings</span>
                  <span className="stat-value">$1,234.56</span>
                </div>
              </div>
            </div>

            <div className="pools-grid">
              {stakingPools.map((pool) => (
                <StakingPool 
                  key={pool.id}
                  pool={pool}
                  expanded={expandedPool === pool.id}
                  onToggle={() => setExpandedPool(expandedPool === pool.id ? null : pool.id)}
                  onSelect={() => setSelectedPool(pool)}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="farming"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pools-container"
          >
            <div className="pools-header">
              <h2>Liquidity Farming Pools</h2>
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-label">Total TVL</span>
                  <span className="stat-value">$221M</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Avg APR</span>
                  <span className="stat-value">16.9%</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Impermanence Loss</span>
                  <span className="stat-value">-2.3%</span>
                </div>
              </div>
            </div>

            <div className="pools-grid">
              {farmingPools.map((pool) => (
                <FarmingPool 
                  key={pool.id}
                  pool={pool}
                  expanded={expandedPool === pool.id}
                  onToggle={() => setExpandedPool(expandedPool === pool.id ? null : pool.id)}
                  onSelect={() => setSelectedPool(pool)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staking Modal */}
      <AnimatePresence>
        {selectedPool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedPool(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Stake {selectedPool.token}</h3>
                <button onClick={() => setSelectedPool(null)} className="close-btn">×</button>
              </div>
              
              <div className="modal-body">
                <div className="pool-details">
                  <div className="detail-row">
                    <span>APR</span>
                    <span className="highlight">{selectedPool.apr}%</span>
                  </div>
                  <div className="detail-row">
                    <span>Lock Period</span>
                    <span>{selectedPool.lockPeriod}</span>
                  </div>
                  <div className="detail-row">
                    <span>Min Amount</span>
                    <span>{selectedPool.minAmount} {selectedPool.token}</span>
                  </div>
                </div>

                <div className="input-section">
                  <label>Amount to Stake</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                      min={selectedPool.minAmount}
                    />
                    <button className="max-btn">MAX</button>
                  </div>
                  <div className="balance-info">
                    Balance: 10.5 {selectedPool.token}
                  </div>
                </div>

                <div className="rewards-preview">
                  <h4>Estimated Rewards</h4>
                  <div className="reward-item">
                    <span>Daily</span>
                    <span>0.025 {selectedPool.token}</span>
                  </div>
                  <div className="reward-item">
                    <span>Monthly</span>
                    <span>0.75 {selectedPool.token}</span>
                  </div>
                  <div className="reward-item">
                    <span>Yearly</span>
                    <span>9.0 {selectedPool.token}</span>
                  </div>
                </div>

                <button className="stake-btn">
                  <FiLock />
                  Stake {stakeAmount || '0'} {selectedPool.token}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CryptoSticks;

// Search.js - Advanced Search Page with Google/Tor Integration
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiGlobe, FiShield, FiTrendingUp, FiClock, FiExternalLink,
  FiFilter, FiX, FiChevronDown, FiLock, FiUnlock, FiRefreshCw
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchEngine, setSearchEngine] = useState('google');
  const [isTorEnabled, setIsTorEnabled] = useState(false);
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    time: 'all',
    safe: 'moderate'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Load search history
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
    
    // Load trending searches
    setTrending([
      'Ethereum Merge',
      'DeFi Yield Farming',
      'NFT Marketplace',
      'Web3 Browser',
      'Crypto Staking',
      'DAO Governance',
      'Layer 2 Solutions',
      'Smart Contracts'
    ]);

    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Add to search history
    const newHistory = [searchQuery, ...searchHistory.filter(q => q !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    
    // Simulate search
    setTimeout(() => {
      const mockResults = [
        {
          id: 1,
          title: `${searchQuery} - Wikipedia`,
          url: 'https://en.wikipedia.org/wiki/' + searchQuery,
          description: `Comprehensive information about ${searchQuery} including history, technical details, and current developments.`,
          type: 'wiki',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          title: `Understanding ${searchQuery} - Crypto Academy`,
          url: 'https://crypto.academy/learn/' + searchQuery,
          description: `In-depth guide to ${searchQuery} with expert insights, tutorials, and best practices for cryptocurrency enthusiasts.`,
          type: 'educational',
          timestamp: new Date().toISOString()
        },
        {
          id: 3,
          title: `${searchQuery} Price & Charts - CoinGecko`,
          url: 'https://coingecko.com/en/coins/' + searchQuery,
          description: `Real-time price tracking, market cap, charts, and trading data for ${searchQuery}. Historical performance and predictions.`,
          type: 'market',
          timestamp: new Date().toISOString()
        },
        {
          id: 4,
          title: `${searchQuery} News & Updates - CryptoNews`,
          url: 'https://cryptonews.com/tags/' + searchQuery,
          description: `Latest news, updates, and analysis about ${searchQuery}. Expert opinions and market insights.`,
          type: 'news',
          timestamp: new Date().toISOString()
        },
        {
          id: 5,
          title: `${searchQuery} Community - Reddit`,
          url: 'https://reddit.com/r/' + searchQuery,
          description: `Join the discussion about ${searchQuery}. Community insights, discussions, and user experiences.`,
          type: 'community',
          timestamp: new Date().toISOString()
        }
      ];
      
      setResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const searchEngines = [
    { id: 'google', name: 'Google', icon: '🔍' },
    { id: 'duckduckgo', name: 'DuckDuckGo', icon: '🦆' },
    { id: 'brave', name: 'Brave', icon: '🦁' },
    { id: 'bing', name: 'Bing', icon: '🔷' }
  ];

  return (
    <div className="search-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="search-container"
      >
        {/* Search Header */}
        <div className="search-header">
          <div className="search-controls">
            <div className="engine-selector">
              <select 
                value={searchEngine} 
                onChange={(e) => setSearchEngine(e.target.value)}
                className="engine-select"
              >
                {searchEngines.map(engine => (
                  <option key={engine.id} value={engine.id}>
                    {engine.icon} {engine.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="tor-toggle">
              <button 
                className={`tor-btn ${isTorEnabled ? 'active' : ''}`}
                onClick={() => setIsTorEnabled(!isTorEnabled)}
              >
                {isTorEnabled ? <FiUnlock /> : <FiLock />}
                {isTorEnabled ? 'Tor Active' : 'Enable Tor'}
              </button>
            </div>
            
            <button 
              className={`filter-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter />
              Filters
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search the web, DApps, or blockchain data..."
              className="search-input"
            />
            {isSearching ? (
              <FiRefreshCw className="searching-icon animate-spin" />
            ) : (
              <button 
                onClick={() => handleSearch()}
                className="search-submit"
                disabled={!query.trim()}
              >
                Search
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="filters-panel"
              >
                <div className="filter-group">
                  <label>Content Type</label>
                  <select 
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                  >
                    <option value="all">All Content</option>
                    <option value="web">Web Pages</option>
                    <option value="dapp">DApps</option>
                    <option value="nft">NFTs</option>
                    <option value="defi">DeFi</option>
                    <option value="news">News</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Time Range</label>
                  <select 
                    value={filters.time}
                    onChange={(e) => setFilters({...filters, time: e.target.value})}
                  >
                    <option value="all">Any Time</option>
                    <option value="day">Past 24 Hours</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="year">Past Year</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Safe Search</label>
                  <select 
                    value={filters.safe}
                    onChange={(e) => setFilters({...filters, safe: e.target.value})}
                  >
                    <option value="off">Off</option>
                    <option value="moderate">Moderate</option>
                    <option value="strict">Strict</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="search-results"
          >
            <div className="results-header">
              <h3>Results ({results.length})</h3>
              <span className="search-info">
                {searchEngine} {isTorEnabled && 'via Tor'} • {filters.type} • {filters.time}
              </span>
            </div>
            
            <div className="results-list">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="result-item"
                >
                  <div className="result-header">
                    <h4 className="result-title">
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        {result.title}
                      </a>
                    </h4>
                    <span className="result-type">{result.type}</span>
                  </div>
                  
                  <div className="result-url">
                    <FiExternalLink size={12} />
                    {result.url}
                  </div>
                  
                  <p className="result-description">{result.description}</p>
                  
                  <div className="result-footer">
                    <span className="result-time">
                      <FiClock size={12} />
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                    <button className="result-action">Save</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search History & Trending */}
        {!results.length && (
          <div className="search-suggestions">
            {searchHistory.length > 0 && (
              <div className="history-section">
                <div className="section-header">
                  <h3>Recent Searches</h3>
                  <button onClick={clearHistory} className="clear-btn">
                    <FiX size={14} />
                    Clear
                  </button>
                </div>
                <div className="history-list">
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(item);
                        handleSearch(item);
                      }}
                      className="history-item"
                    >
                      <FiClock size={14} />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="trending-section">
              <div className="section-header">
                <h3>
                  <FiTrendingUp />
                  Trending Searches
                </h3>
              </div>
              <div className="trending-list">
                {trending.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                    className="trending-item"
                  >
                    <span className="trending-number">#{index + 1}</span>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Search;

// Additional required files and components...

// GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --primary: #8b5cf6;
    --primary-dark: #7c3aed;
    --secondary: #ec4899;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --dark: #1f2937;
    --light: #f3f4f6;
    --white: #ffffff;
    --gray: #6b7280;
    --border: #e5e7eb;
    --shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--light);
    color: var(--dark);
    line-height: 1.6;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--light);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--gray);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--primary);
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

// Web3Context.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const Web3Context = createContext();

const initialState = {
  isConnected: false,
  account: null,
  balance: '0',
  network: 'ethereum',
  provider: null,
  contracts: {},
  loading: false,
  error: null
};

const web3Reducer = (state, action) => {
  switch (action.type) {
    case 'CONNECT_WALLET':
      return {
        ...state,
        isConnected: true,
        account: action.payload.account,
        balance: action.payload.balance,
        provider: action.payload.provider,
        loading: false
      };
    case 'DISCONNECT_WALLET':
      return {
        ...state,
        isConnected: false,
        account: null,
        balance: '0',
        provider: null,
        contracts: {}
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_BALANCE':
      return { ...state, balance: action.payload };
    case 'SWITCH_NETWORK':
      return { ...state, network: action.payload };
    default:
      return state;
  }
};

export const Web3Provider = ({ children }) => {
  const [state, dispatch] = useReducer(web3Reducer, initialState);

  const connectWallet = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Simulate wallet connection
      setTimeout(() => {
        const mockAccount = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
        const mockBalance = '10.5';
        
        dispatch({
          type: 'CONNECT_WALLET',
          payload: {
            account: mockAccount,
            balance: mockBalance,
            provider: { connected: true }
          }
        });
      }, 1500);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const disconnectWallet = () => {
    dispatch({ type: 'DISCONNECT_WALLET' });
  };

  const value = {
    ...state,
    connectWallet,
    disconnectWallet,
    dispatch
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Redux Store Setup
import { configureStore } from '@reduxjs/toolkit';
import walletReducer from './slices/walletSlice';
import marketReducer from './slices/marketSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    market: marketReducer,
    settings: settingsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
});

// walletSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  balances: {
    ethereum: { ETH: 10.5, USDC: 5000, BEAN: 1000 },
    polygon: { MATIC: 5000, USDC: 2500 },
    bsc: { BNB: 5, BUSD: 3000 }
  },
  selectedNetwork: 'ethereum',
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  transactions: [],
  loading: false
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    updateBalance: (state) => {
      // Simulate balance updates
      state.loading = true;
      setTimeout(() => {
        state.loading = false;
      }, 1000);
    },
    setSelectedNetwork: (state, action) => {
      state.selectedNetwork = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    }
  }
});

export const { updateBalance, setSelectedNetwork, addTransaction } = walletSlice.actions;
export default walletSlice.reducer;

// marketSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  marketData: [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'btc',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      current_price: 43250,
      price_change_percentage_24h: 2.5
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'eth',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      current_price: 2280,
      price_change_percentage_24h: 3.2
    },
    {
      id: 'binancecoin',
      name: 'BNB',
      symbol: 'bnb',
      image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
      current_price: 315,
      price_change_percentage_24h: -1.2
    },
    {
      id: 'cardano',
      name: 'Cardano',
      symbol: 'ada',
      image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
      current_price: 0.58,
      price_change_percentage_24h: 4.8
    }
  ],
  loading: false
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    fetchMarketData: (state) => {
      state.loading = true;
      // Simulate API call
      setTimeout(() => {
        state.loading = false;
      }, 1000);
    },
    updateMarketData: (state, action) => {
      state.marketData = action.payload;
    }
  }
});

export const { fetchMarketData, updateMarketData } = marketSlice.actions;
export default marketSlice.reducer;

// settingsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'dark',
  currency: 'USD',
  language: 'en',
  notifications: {
    price: true,
    transactions: true,
    security: true
  },
  privacy: {
    showBalance: true,
    analytics: false
  },
  security: {
    biometric: false,
    twoFactor: false,
    autoLock: '5min'
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action) => {
      return { ...state, ...action.payload };
    },
    toggleNotification: (state, action) => {
      state.notifications[action.payload] = !state.notifications[action.payload];
    }
  }
});

export const { updateSettings, toggleNotification } = settingsSlice.actions;
export default settingsSlice.reducer;
