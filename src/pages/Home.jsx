import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faEyeSlash, faEye, faBell } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const CHAIN_DISPLAY = {
  ethereum:  { name: 'Ethereum Mainnet', color: '#627eea' },
  polygon:   { name: 'Polygon',          color: '#8247e5' },
  bsc:       { name: 'BNB Smart Chain',  color: '#f3ba2f' },
  arbitrum:  { name: 'Arbitrum One',     color: '#28a0f0' },
  optimism:  { name: 'Optimism',         color: '#ff0420' },
  avalanche: { name: 'Avalanche C-Chain',color: '#e84142' },
  base:      { name: 'Base',             color: '#0052ff' },
};

const Home = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [primaryChain, setPrimaryChain] = useState('ethereum');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch on mount ─────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');
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

      // Single call — backend now returns everything
      const res = await axios.get(`${API_BASE}/balances`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAssets(res.data.assets || []);
      setTotalBalance(res.data.totalBalance || 0);
      setPrimaryChain(res.data.primaryChain || 'ethereum');

    } catch (err) {
      console.error('Dashboard Error:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth/login');
        return;
      }

      setError(
        err.response?.data?.message ||
        'Failed to load dashboard. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────
  const formatCurrency = (value) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatBalance = (balance) => {
    if (balance === 0) return '0';
    if (balance < 0.0001) return '<0.0001';
    if (balance < 1) return balance.toFixed(4);
    if (balance < 1000) return balance.toFixed(4);
    return balance.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // ── Weighted 24h change for total balance ──────────────
  const weightedChange = assets.length > 0
    ? assets.reduce((sum, a) => sum + (a.change * a.value) / (totalBalance || 1), 0)
    : 0;

  const chainInfo = CHAIN_DISPLAY[primaryChain] || CHAIN_DISPLAY.ethereum;

  if (loading) return (
    <div className="dashboard-loading-gold">
      <div className="loader-gold"></div>
    </div>
  );

  return (
    <div className="dashboard-container-gold">

      {/* ── TOP HEADER ────────────────────────────────── */}
      <header className="top-header-gold">
        <div className="header-left">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="logo-gold" />
        </div>

        <div className="header-right">
          <div className="network-selector-gold">
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: chainInfo.color,
                marginRight: 6,
              }}
            />
            {chainInfo.name}
            <i className="fa-solid fa-chevron-down" style={{ marginLeft: 4, fontSize: 10 }}></i>
          </div>

          <div className="header-icon" onClick={() => navigate('/app/notifications')}>
            <FontAwesomeIcon icon={faBell} />
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────── */}
      <main className="main-scroll-area-gold">

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.4)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* ── Balance Card ─────────────────────────────── */}
        <div className="balance-card-gold">
          <div className="balance-row-gold">
            <span className="balance-label-gold">Total Balance</span>
            <button
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="eye-btn-gold"
            >
              {isBalanceHidden
                ? <FontAwesomeIcon icon={faEyeSlash} />
                : <FontAwesomeIcon icon={faEye} />}
            </button>
          </div>

          <div className="balance-amount-gold">
            {isBalanceHidden
              ? '••••••••'
              : `$${formatCurrency(totalBalance)}`}
          </div>

          <div className="balance-actions-gold">
            <span className="tag-gold">{primaryChain.toUpperCase()}</span>
            <span className={`tag-gold ${weightedChange >= 0 ? 'active' : ''}`}
              style={weightedChange < 0 ? { color: '#f87171' } : {}}
            >
              {weightedChange >= 0 ? '+' : ''}{weightedChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* ── Assets List ──────────────────────────────── */}
        <div className="assets-section-gold">
          <h3 className="section-title-gold">Assets</h3>

          {assets.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#888',
            }}>
              <p style={{ fontSize: 16, marginBottom: 8 }}>No assets found</p>
              <p style={{ fontSize: 13 }}>
                Connect a wallet with funds to see your balances.
              </p>
            </div>
          ) : (
            <div className="assets-list-gold">
              {assets.map((asset, index) => (
                <div
                  key={`${asset.symbol}-${asset.blockchain}-${index}`}
                  className="asset-item-gold"
                  onClick={() => navigate('/app/asset/' + asset.symbol.toLowerCase())}
                >
                  <div className="asset-left-gold">
                    <div className="asset-icon-gold">
                      <i className={asset.icon}></i>
                    </div>
                    <div className="asset-info-gold">
                      <div className="asset-name-gold">{asset.name}</div>
                      <div className="asset-balance-gold">
                        {isBalanceHidden
                          ? '••••••'
                          : `${formatBalance(asset.balance)} ${asset.symbol}`}
                      </div>
                    </div>
                  </div>

                  <div className="asset-right-gold">
                    <div className="asset-value-gold">
                      {isBalanceHidden
                        ? '••••••'
                        : `$${formatCurrency(asset.value)}`}
                    </div>
                    <div
                      className={`asset-change-gold ${asset.change >= 0 ? 'positive' : 'negative'}`}
                      style={{ color: asset.change >= 0 ? '#4ade80' : '#f87171' }}
                    >
                      {asset.change >= 0 ? '+' : ''}{asset.change}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
