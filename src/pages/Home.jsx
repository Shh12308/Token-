import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faEyeSlash, faEye, faBell, faPaperPlane, faQrcode, faRightLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://blockvault-backend-production.up.railway.app/api';

const CHAIN_DISPLAY = {
  ethereum: { name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
  polygon: { name: 'Polygon', symbol: 'MATIC', color: '#8247e5' },
  bsc: { name: 'BNB Chain', symbol: 'BNB', color: '#f3ba2f' },
  arbitrum: { name: 'Arbitrum', symbol: 'ARB', color: '#28a0f0' },
  optimism: { name: 'Optimism', symbol: 'OP', color: '#ff0420' },
  avalanche: { name: 'Avalanche', symbol: 'AVAX', color: '#e84142' },
  base: { name: 'Base', symbol: 'BASE', color: '#0052ff' },
};

const Home = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [primaryChain, setPrimaryChain] = useState('ethereum');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  // ── Auth & Data Fetch ─────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const address = localStorage.getItem('walletAddress');

    if (!token || !address) {
      navigate('/login');
      return;
    }

    setWalletAddress(address);
    fetchDashboardData(address, token);
  }, [navigate]);

  const fetchDashboardData = async (address, token) => {
    try {
      setError('');
      setLoading(true);

      // Stateless Endpoint: Pass address as query param
      const res = await axios.get(`${API_BASE}/wallet/balance`, {
        params: { address: address }, 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000, // Increased timeout for multi-chain fetches
      });

      if (res.data) {
        setAssets(Array.isArray(res.data.assets) ? res.data.assets : []);
        setTotalBalance(Number(res.data.totalBalance) || 0);
        setPrimaryChain(res.data.primaryChain || 'ethereum');
      }

    } catch (err) {
      console.error('Dashboard Error:', err);

      if (err.code === 'ERR_NETWORK') {
        setError('Network error. Check connection.');
      } else if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to load assets.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Memoized Calculations ─────────────────────────────────
  const weightedChange = useMemo(() => {
    if (assets.length === 0 || totalBalance === 0) return 0;
    return assets.reduce(
      (sum, a) => sum + ((Number(a.change) || 0) * (Number(a.value) || 0)) / totalBalance,
      0
    );
  }, [assets, totalBalance]);

  const chainInfo = CHAIN_DISPLAY[primaryChain] || CHAIN_DISPLAY.ethereum;

  // ── Helpers ────────────────────────────────────────────
  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatBalance = (balance) => {
    if (!balance) return '0';
    if (balance < 0.0001) return '<0.0001';
    if (balance < 1) return balance.toFixed(4);
    return balance.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const truncateAddress = (addr) => 
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  if (loading)
    return (
      <div className="dashboard-loading-gold">
        <div className="loader-gold"></div>
      </div>
    );

  return (
    <div className="dashboard-container-gold">

      {/* HEADER */}
      <header className="top-header-gold">
        <div className="header-left">
          <img
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Logo"
            className="logo-gold"
          />
          <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
            {truncateAddress(walletAddress)}
          </span>
        </div>

        <div className="header-right">
          <div className="network-selector-gold">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: chainInfo.color,
                marginRight: 6,
                display: 'inline-block',
              }}
            />
            {chainInfo.name}
          </div>

          <div
            className="header-icon"
            onClick={() => navigate('/app/notifications')}
          >
            <FontAwesomeIcon icon={faBell} />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="main-scroll-area-gold">

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.4)',
            color: '#fca5a5',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* BALANCE CARD */}
        <div className="balance-card-gold">
          <div className="balance-row-gold">
            <span>Total Balance</span>
            <button onClick={() => setIsBalanceHidden(!isBalanceHidden)}>
              <FontAwesomeIcon icon={isBalanceHidden ? faEyeSlash : faEye} />
            </button>
          </div>

          <div className="balance-amount-gold">
            {isBalanceHidden ? '••••••••' : `$${formatCurrency(totalBalance)}`}
          </div>

          <div className="balance-actions-gold">
            <span className="tag-gold">{chainInfo.symbol}</span>
            <span style={{ color: weightedChange >= 0 ? '#4ade80' : '#f87171' }}>
              {weightedChange >= 0 ? '+' : ''}{weightedChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="quick-actions-gold">
          <button className="action-btn" onClick={() => navigate('/app/send')}>
            <FontAwesomeIcon icon={faPaperPlane} />
            <span>Send</span>
          </button>
          
          <button className="action-btn" onClick={() => navigate('/app/receive')}>
            <FontAwesomeIcon icon={faQrcode} />
            <span>Receive</span>
          </button>

          <button className="action-btn" onClick={() => navigate('/app/swap')}>
            <FontAwesomeIcon icon={faRightLeft} />
            <span>Swap</span>
          </button>
        </div>

        {/* ASSETS LIST */}
        <div className="assets-section-gold">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Assets</h3>
            <span style={{ fontSize: '12px', color: '#c9a84c', cursor: 'pointer' }} onClick={() => fetchDashboardData(walletAddress, localStorage.getItem('authToken'))}>
              Refresh
            </span>
          </div>

          {assets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              No assets found on {chainInfo.name}.
            </div>
          ) : (
            assets.map((asset, i) => (
              <div
                key={`${asset.symbol}-${asset.chain || i}`}
                className="asset-item-gold"
                onClick={() =>
                  navigate('/app/asset/' + asset.symbol?.toLowerCase(), { state: { asset } })
                }
              >
                <div className="asset-left">
                  <div className="asset-icon">
                    {/* Placeholder for token icon */}
                    <span style={{ fontSize: 20 }}>{asset.symbol?.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="asset-name">{asset.name}</div>
                    <div className="asset-balance">
                      {isBalanceHidden
                        ? '••••'
                        : `${formatBalance(asset.balance)} ${asset.symbol}`}
                    </div>
                  </div>
                </div>

                <div className="asset-right">
                  <div className="asset-value">
                    {isBalanceHidden ? '••••' : `$${formatCurrency(asset.value)}`}
                  </div>
                  <div
                    className="asset-change"
                    style={{
                      color: asset.change >= 0 ? '#4ade80' : '#f87171',
                    }}
                  >
                    {asset.change >= 0 ? '+' : ''}{asset.change}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
