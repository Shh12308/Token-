import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiTrendingUp, FiSearch, FiGrid, FiActivity, 
  FiGlobe, FiSettings, FiDollarSign, FiArrowUpRight,
  FiArrowDownLeft, FiClock, FiZap, FiShield, FiChevronRight,
  FiRefreshCw, FiEye, FiEyeOff, FiCopy, FiExternalLink
} from 'react-icons/fi';

// 1. IMPORT YOUR CSS FILE HERE
// If your file is named Home.css, uncomment the line below:
// import './Home.css'; 

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

// --- MOCK STYLED COMPONENTS (If you don't have the imports) ---
// These allow the page to render structure. Your CSS should style the classes inside.
const DashboardContainer = ({ children }) => (
  <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#ffffff', fontFamily: 'sans-serif' }}>
    {children}
  </div>
);
const AnimatedBackground = () => <div className="animated-background" />;
const WalletCard = ({ children }) => <div className="wallet-card" style={{ background: '#1e1e1e', padding: '20px', borderRadius: '16px', margin: '20px' }}>{children}</div>;
const QuickActions = ({ children }) => <div className="quick-actions" style={{ padding: '0 20px' }}>{children}</div>;
const MarketOverview = ({ children }) => <div className="market-overview" style={{ padding: '20px' }}>{children}</div>;
const RecentTransactions = ({ children }) => <div className="recent-transactions" style={{ padding: '20px' }}>{children}</div>;
const NetworkStatus = ({ network }) => <div className="network-status">{network || 'Ethereum'}</div>;

const Home = () => {
  const navigate = useNavigate();
  
  // State
  const [balances, setBalances] = useState({ usdValue: 0 });
  const [marketData, setMarketData] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [walletAddress, setWalletAddress] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log("Home Component Mounted");
    const token = localStorage.getItem('authToken');
    
    // Auth Check
    if (!token) {
      console.log("No token found, redirecting to login...");
      navigate('/auth/register');
      return;
    }

    const fetchData = async () => {
      try {
        console.log("Fetching dashboard data...");
        setLoading(true);

        // Fetch Wallets
        const walletRes = await axios.get(`${BACKEND_URL}/wallets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Wallets response:", walletRes.data);
        
        if (walletRes.data.wallets && walletRes.data.wallets.length > 0) {
          const primaryWallet = walletRes.data.wallets[0];
          setWalletAddress(primaryWallet.address);
          const nativeBal = parseFloat(primaryWallet.balances?.native || 0);
          setBalances({ usdValue: nativeBal * 2000 }); // Mock price
        }

        // Fetch Market
        const marketRes = await axios.get(`${BACKEND_URL}/market?symbols=ethereum,bitcoin,binancecoin,matic-network,solana`);
        if (marketRes.data.data) {
          setMarketData(marketRes.data.data);
        }

      } catch (err) {
        console.error("Dashboard Error:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/auth/login');
        } else {
          // If backend is down, use mock data to prevent blank page
          console.warn("Backend connection failed, using mock data");
          setMarketData([
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', current_price: 45000, price_change_percentage_24h: 2.5, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
            { id: 'ethereum', name: 'Ethereum', symbol: 'eth', current_price: 3000, price_change_percentage_24h: 1.2, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
            { id: 'binancecoin', name: 'BNB', symbol: 'bnb', current_price: 400, price_change_percentage_24h: -0.5, image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
            { id: 'matic-network', name: 'Polygon', symbol: 'matic', current_price: 0.8, price_change_percentage_24h: 5.0, image: 'https://assets.coingecko.com/coins/images/4713/large/matic-network-icon.png' }
          ]);
          setError('Using offline data (Backend unreachable)');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  // DEBUG: If loading, show something visible
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', background: '#121212' }}>
        <div>Loading CryptoBean...</div>
      </div>
    );
  }

  const totalBalance = Object.values(balances).reduce((acc, balance) => acc + (balance.usdValue || 0), 0);
  const totalChange = marketData.length > 0 
    ? marketData.reduce((acc, crypto) => acc + (crypto.price_change_percentage_24h || 0), 0) / marketData.length 
    : 0;

  return (
    <DashboardContainer>
      <AnimatedBackground />
      
      {/* Force opacity 1 to prevent framer-motion hiding issues */}
      <motion.div
        initial={{ opacity: 0 }} // Kept for smooth load, but container has bg
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="dashboard-content"
        style={{ padding: '20px', paddingBottom: '100px' }} // Ensure bottom padding
      >
        {/* Error Message (if any) */}
        {error && (
          <div style={{ background: 'red', color: 'white', padding: '10px', marginBottom: '10px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {/* Header */}
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="header-top">
            <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="logo" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                <span className="logo-icon">🫘</span>
                <span className="logo-text" style={{ marginLeft: '5px' }}>CryptoBean</span>
              </div>
              <NetworkStatus network={selectedNetwork} />
            </div>
            
            <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleRefresh} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <FiRefreshCw className={refreshing ? 'spin' : ''} />
              </button>
              <button onClick={() => navigate('/search')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <FiSearch />
              </button>
              <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <FiSettings />
              </button>
            </div>
          </div>
        </header>

        {/* Main Wallet Card */}
        <WalletCard>
          <div className="wallet-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div className="balance-section">
              <div className="balance-label" style={{ color: '#aaa', fontSize: '14px', marginBottom: '5px' }}>Total Balance</div>
              <div className="balance-amount" style={{ display: 'flex', alignItems: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                {showBalance ? (
                  <>
                    <span className="currency">$</span>
                    <span className="amount" style={{ marginLeft: '5px' }}>
                      {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </>
                ) : (
                  <span className="hidden-balance">••••••••</span>
                )}
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  style={{ background: 'none', border: 'none', color: '#aaa', marginLeft: '10px', cursor: 'pointer' }}
                >
                  {showBalance ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className={`balance-change ${totalChange >= 0 ? 'positive' : 'negative'}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', fontSize: '14px' }}>
                {totalChange >= 0 ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                <span style={{ color: totalChange >= 0 ? '#00c853' : '#ff3d00' }}>
                  {Math.abs(totalChange).toFixed(2)}% (24h)
                </span>
              </div>
            </div>
            
            <div className="wallet-address" style={{ background: '#2a2a2a', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(walletAddress)}>
              <span className="address-text" style={{ fontSize: '12px' }}>{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
              <FiCopy size={14} style={{ color: '#aaa' }} />
            </div>
          </div>
          
          <div className="wallet-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <button onClick={() => navigate('/wallet')} className="action-btn primary" style={{ background: '#4caf50', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <FiArrowUpRight />
              <span style={{ fontSize: '12px' }}>Send</span>
            </button>
            <button onClick={() => navigate('/wallet')} className="action-btn secondary" style={{ background: '#333', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <FiArrowDownLeft />
              <span style={{ fontSize: '12px' }}>Receive</span>
            </button>
            <button onClick={() => navigate('/wallet')} className="action-btn secondary" style={{ background: '#333', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <FiRefreshCw />
              <span style={{ fontSize: '12px' }}>Swap</span>
            </button>
            <button onClick={() => navigate('/crypto-sticks')} className="action-btn secondary" style={{ background: '#333', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <FiZap />
              <span style={{ fontSize: '12px' }}>Stake</span>
            </button>
          </div>
        </WalletCard>

        {/* Quick Actions Grid */}
        <QuickActions>
          <div className="actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {/* Generating buttons dynamically or manually for brevity */}
            {[
              { icon: <FiTrendingUp />, label: 'Crypto Sticks', sub: 'Stake & Earn', route: '/crypto-sticks' },
              { icon: <FiDollarSign />, label: 'DeFi', sub: 'Yield Farming', route: '/defi' },
              { icon: <FiGrid />, label: 'NFTs', sub: 'Marketplace', route: '/nft' },
              { icon: <FiGlobe />, label: 'Browser', sub: 'DApps & Web3', route: '/browser' },
              { icon: <FiActivity />, label: 'Activity', sub: 'Transactions', route: '/activity' },
              { icon: <FiShield />, label: 'Security', sub: 'Protection', route: '/security' },
            ].map((action, idx) => (
              <motion.button 
                key={idx}
                onClick={() => navigate(action.route)}
                className="action-card"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ background: '#1e1e1e', border: 'none', color: 'white', padding: '15px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ background: '#333', padding: '10px', borderRadius: '50%' }}>{action.icon}</div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{action.label}</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>{action.sub}</p>
                  </div>
                </div>
                <FiChevronRight color="#555" />
              </motion.button>
            ))}
          </div>
        </QuickActions>

        {/* Market Overview */}
        <MarketOverview>
          <h2 className="section-title" style={{ marginBottom: '15px' }}>Market Overview</h2>
          <div className="market-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {marketData.slice(0, 4).map((crypto, index) => (
              <div 
                key={crypto.id || index}
                className="market-card"
                style={{ background: '#1e1e1e', padding: '15px', borderRadius: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <img src={crypto.image} alt={crypto.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                  <div>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>{crypto.name}</span>
                    <span style={{ fontSize: '12px', color: '#aaa' }}>{crypto.symbol?.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>${crypto.current_price?.toLocaleString()}</span>
                  <span style={{ 
                    color: crypto.price_change_percentage_24h >= 0 ? '#00c853' : '#ff3d00',
                    fontSize: '12px',
                    background: crypto.price_change_percentage_24h >= 0 ? 'rgba(0,200,83,0.1)' : 'rgba(255,61,0,0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                    {crypto.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </MarketOverview>

        {/* Recent Transactions */}
        <RecentTransactions>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 className="section-title">Recent Activity</h2>
            <button onClick={() => navigate('/activity')} style={{ background: 'none', border: 'none', color: '#4caf50', cursor: 'pointer', fontSize: '14px' }}>
              View All
            </button>
          </div>
          <div className="transactions-list">
            {marketData.length === 0 ? (
               <div style={{ textAlign: 'center', color: '#777', padding: '20px' }}>No recent activity</div>
            ) : (
              [1, 2, 3].map((item) => (
                <div 
                  key={item}
                  className="transaction-item"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #333' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: '#333', padding: '10px', borderRadius: '50%' }}>
                      {item % 2 === 0 ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                    </div>
                    <div>
                      <span style={{ display: 'block', fontWeight: 'bold' }}>
                        {item % 2 === 0 ? 'Sent' : 'Received'} ETH
                      </span>
                      <span style={{ fontSize: '12px', color: '#aaa' }}>
                        <FiClock style={{ marginRight: '5px' }} /> {item}h ago
                      </span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: item % 2 === 0 ? '#ff3d00' : '#00c853' }}>
                    {item % 2 === 0 ? '-' : '+'}0.{item}5 ETH
                  </div>
                </div>
              ))
            )}
          </div>
        </RecentTransactions>
      </motion.div>
    </DashboardContainer>
  );
};

export default Home;
