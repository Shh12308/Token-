import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiTrendingUp, FiSearch, FiGrid, FiActivity,
  FiGlobe, FiSettings, FiArrowUpRight, FiArrowDownLeft,
  FiClock, FiZap, FiShield, FiChevronRight,
  FiRefreshCw, FiEye, FiEyeOff, FiCopy, FiExternalLink
} from 'react-icons/fi';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const DashboardContainer = ({ children }) => <div className="dashboard-container">{children}</div>;
const AnimatedBackground = () => <div className="animated-background" />;
const WalletCard = ({ children }) => <div className="wallet-card">{children}</div>;
const QuickActions = ({ children }) => <div className="quick-actions">{children}</div>;
const MarketOverview = ({ children }) => <div className="market-overview">{children}</div>;
const RecentTransactions = ({ children }) => <div className="recent-transactions">{children}</div>;
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

          const nativeBal = parseFloat(primaryWallet?.balances?.native || 0);

          setBalances({
            usdValue: nativeBal * 2000
          });
        }

        // MARKET
        const marketRes = await axios.get(
          `${BACKEND_URL}/market?symbols=ethereum,bitcoin,binancecoin,matic-network,solana`
        );

        const data = marketRes.data?.data || marketRes.data || [];

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
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    window.location.reload();
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
            <button onClick={handleRefresh}>
              <FiRefreshCw />
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

            <div>
              {showBalance ? (
                <>${totalBalance.toFixed(2)}</>
              ) : (
                '••••••'
              )}

              <button onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div>
              {totalChange >= 0 ? '+' : ''}
              {totalChange.toFixed(2)}%
            </div>
          </div>

          <div>
            <span>{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
            <button onClick={() => navigator.clipboard.writeText(walletAddress || '')}>
              <FiCopy />
            </button>
          </div>
        </WalletCard>

        {/* MARKET */}
        <MarketOverview>
          <h2>Market</h2>

          <div className="market-grid">
            {marketData.slice(0, 4).map((crypto) => (
              <MarketCard key={crypto.id || Math.random()} crypto={crypto} />
            ))}
          </div>
        </MarketOverview>

        {/* ACTIVITY */}
        <RecentTransactions>
          <h2>Recent Activity</h2>

          {[1, 2, 3].map((item) => (
            <div key={item}>
              {item % 2 === 0 ? 'Sent' : 'Received'} ETH
            </div>
          ))}
        </RecentTransactions>
      </div>
    </DashboardContainer>
  );
};

export default Home;
