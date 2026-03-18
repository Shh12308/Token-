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
import { setBalance } from '../store/slices/walletSlice';
import { fetchMarketData } from '../store/slices/marketSlice';

const Home = () => {
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

export default Home;
