import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faEyeSlash, faEye, faBell } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://blockvault-backend-production.up.railway.app/api';

const CHAIN_DISPLAY = {
  ethereum: { name: 'Ethereum Mainnet', color: '#627eea' },
  polygon: { name: 'Polygon', color: '#8247e5' },
  bsc: { name: 'BNB Smart Chain', color: '#f3ba2f' },
  arbitrum: { name: 'Arbitrum One', color: '#28a0f0' },
  optimism: { name: 'Optimism', color: '#ff0420' },
  avalanche: { name: 'Avalanche C-Chain', color: '#e84142' },
  base: { name: 'Base', color: '#0052ff' },
};

const Home = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [primaryChain, setPrimaryChain] = useState('ethereum');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch on mount ─────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');

    console.log("INIT TOKEN:", token);

    if (!token) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setError('');
      const token = localStorage.getItem('authToken');

      if (!token) {
        navigate('/login');
        return;
      }

      console.log("Calling API:", `${API_BASE}/balances`);

      const res = await axios.get(`${API_BASE}/balances`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log("API RESPONSE:", res);

      if (!res || !res.data) {
        throw new Error("Invalid API response");
      }

      setAssets(Array.isArray(res.data.assets) ? res.data.assets : []);
      setTotalBalance(Number(res.data.totalBalance) || 0);
      setPrimaryChain(res.data.primaryChain || 'ethereum');

    } catch (err) {
      console.error('Dashboard Error FULL:', err);

      // 🚨 NETWORK ERROR (most important)
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Backend may be down or CORS blocked.');
        return;
      }

      // 🔐 Unauthorized
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth/login');
        return;
      }

      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

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
    if (balance < 1000) return balance.toFixed(4);
    return balance.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const weightedChange =
    assets.length > 0
      ? assets.reduce(
          (sum, a) =>
            sum + ((Number(a.change) || 0) * (Number(a.value) || 0)) / (totalBalance || 1),
          0
        )
      : 0;

  const chainInfo = CHAIN_DISPLAY[primaryChain] || CHAIN_DISPLAY.ethereum;

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
          }}>
            {error}
          </div>
        )}

        {/* BALANCE */}
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
            <span className="tag-gold">{primaryChain.toUpperCase()}</span>

            <span style={{ color: weightedChange >= 0 ? '#4ade80' : '#f87171' }}>
              {weightedChange >= 0 ? '+' : ''}
              {weightedChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* ASSETS */}
        <div className="assets-section-gold">
          <h3>Assets</h3>

          {assets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              No assets found
            </div>
          ) : (
            assets.map((asset, i) => (
              <div
                key={i}
                className="asset-item-gold"
                onClick={() =>
                  navigate('/app/asset/' + asset.symbol?.toLowerCase())
                }
              >
                <div>
                  <div>{asset.name}</div>
                  <div>
                    {isBalanceHidden
                      ? '••••'
                      : `${formatBalance(asset.balance)} ${asset.symbol}`}
                  </div>
                </div>

                <div>
                  <div>
                    {isBalanceHidden
                      ? '••••'
                      : `$${formatCurrency(asset.value)}`}
                  </div>
                  <div
                    style={{
                      color: asset.change >= 0 ? '#4ade80' : '#f87171',
                    }}
                  >
                    {asset.change >= 0 ? '+' : ''}
                    {asset.change}%
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
