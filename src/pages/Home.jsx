import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faEyeSlash, faEye, faBell, faPaperPlane, faQrcode, faRightLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://blockvault-backend-production.up.railway.app/api';

// Chain mapping (backend currently supports only Ethereum in /wallet/balance)
const CHAIN_INFO = {
  1: { name: 'Ethereum', symbol: 'ETH', color: '#627eea', icon: '⟠' },
  137: { name: 'Polygon', symbol: 'MATIC', color: '#8247e5', icon: '⬡' },
  56: { name: 'BNB Chain', symbol: 'BNB', color: '#f3ba2f', icon: '◈' },
  42161: { name: 'Arbitrum', symbol: 'ETH', color: '#28a0f0', icon: '◉' },
  8453: { name: 'Base', symbol: 'ETH', color: '#0052ff', icon: '◯' },
};

const Home = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  // ── AUTH + INITIAL LOAD ───────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedAddress = localStorage.getItem('walletAddress');

    if (!token) {
      navigate('/login');
      return;
    }

    if (storedAddress) setWalletAddress(storedAddress);

    fetchBalance(token);
  }, [navigate]);

  // ── FETCH BALANCE (FIXED TO MATCH BACKEND) ─────────────
  const fetchBalance = async (token) => {
    try {
      setLoading(true);
      setError('');

      const address = localStorage.getItem('walletAddress');

      const res = await axios.get(`${API_BASE}/wallet/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          address,
        },
        timeout: 15000,
      });

      if (res.data) {
        const data = res.data;

        const allAssets = [];

        if (Array.isArray(data.assets)) {
          data.assets.forEach((asset) => {
            allAssets.push({
              ...asset,
              chainId: asset.chainId || 1,
              chainKey: 'ethereum',
              chainName: 'Ethereum',
            });
          });
        }

        setAssets(allAssets);
        setTotalBalance(Number(data.totalBalance) || 0);

        if (data.address) setWalletAddress(data.address);
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

  // ── MEMO (placeholder growth %) ────────────────────────
  const weightedChange = useMemo(() => {
    if (assets.length === 0) return 0;
    return 2.4;
  }, [assets]);

  // ── HELPERS ────────────────────────────────────────────
  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatBalance = (balance) => {
    const num = Number(balance);
    if (!num) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const truncateAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  // ── LOADING STATE ──────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-loading-gold">
        <div className="loader-gold"></div>
      </div>
    );
  }

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
          <div className="header-icon" onClick={() => navigate('/app/notifications')}>
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
            <span className="tag-gold">Single Chain (ETH)</span>
            <span style={{ color: weightedChange >= 0 ? '#4ade80' : '#f87171' }}>
              {weightedChange >= 0 ? '+' : ''}
              {weightedChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* ACTIONS */}
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

        {/* ASSETS */}
        <div className="assets-section-gold">
          <h3>Assets</h3>

          {assets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              No assets found.
            </div>
          ) : (
            assets.map((asset, i) => {
              const chainId = asset.chainId || 1;
              const chainDisplay = CHAIN_INFO[chainId] || {
                name: 'Ethereum',
                color: '#888',
              };

              return (
                <div
                  key={`${asset.symbol}-${i}`}
                  className="asset-item-gold"
                >
                  <div className="asset-left">
                    <div className="asset-icon">
                      <span style={{ fontSize: 20 }}>
                        {asset.symbol?.charAt(0)}
                      </span>
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
                      {isBalanceHidden
                        ? '••••'
                        : `$${formatCurrency(asset.value)}`}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: chainDisplay.color,
                        border: `1px solid ${chainDisplay.color}33`,
                        background: `${chainDisplay.color}15`,
                        padding: '2px 6px',
                        borderRadius: 4,
                        marginTop: 4,
                      }}
                    >
                      {chainDisplay.name}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
