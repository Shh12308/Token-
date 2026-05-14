import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiTrendingUp, FiZap, FiLock, FiUnlock, FiDollarSign, FiClock,
  FiChevronDown, FiInfo, FiExternalLink, FiRefreshCw,
  FiX, FiCheckCircle, FiAlertTriangle, FiSearch,
  FiRepeat, FiGift, FiBarChart2, FiPercent, FiShield,
  FiCpu, FiAward, FiSettings
} from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
);

const API_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

/* ── HELPERS ──────────────────────────────────────────── */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const n = parseFloat(num);
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
  return n.toFixed(decimals);
};

const formatCurrency = (num) => `$${formatNumber(num)}`;

const timeAgo = (timestamp) => {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const shortenAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

/* ── MAIN COMPONENT ──────────────────────────────────── */
const Staking = () => {
  const navigate = useNavigate();

  /* ── Core State ── */
  const [activeTab, setActiveTab] = useState('staking');
  const [stakingPools, setStakingPools] = useState([]);
  const [farmingPools, setFarmingPools] = useState([]);
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ── Wallet balances from /api/balances ── */
  const [walletAssets, setWalletAssets] = useState([]);

  /* ── Search / Sort / Filter ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('tvl');
  const [sortDir, setSortDir] = useState('desc');
  const [filterLock, setFilterLock] = useState('all');

  /* ── Modal State ── */
  const [selectedPool, setSelectedPool] = useState(null);
  const [modalAction, setModalAction] = useState('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [pendingTx, setPendingTx] = useState(false);
  const [approvalStep, setApprovalStep] = useState('idle');
  const [autoCompound, setAutoCompound] = useState(false);
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('30d');
  const [chartType, setChartType] = useState('line');

  /* ── Toast State ── */
  const [toasts, setToasts] = useState([]);

  /* ── Chart State ── */
  const [historyData, setHistoryData] = useState(null);

  /* ── Position Detail ── */
  const [expandedPosition, setExpandedPosition] = useState(null);

  /* ── Yield Calculator ── */
  const [calcAmount, setCalcAmount] = useState('1000');
  const [calcApr, setCalcApr] = useState('10');
  const [calcDuration, setCalcDuration] = useState('365');

  /* ── Auth check ── */
  const isAuthenticated = !!(localStorage.getItem('token') || localStorage.getItem('authToken'));

  /* ── Toast Helper ── */
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  /* ── Wallet balance lookup ── */
  const getWalletBalance = useCallback((token) => {
    const asset = walletAssets.find(a =>
      a.symbol?.toUpperCase() === token?.toUpperCase()
    );
    return asset ? parseFloat(asset.balance) : 0;
  }, [walletAssets]);

  /* ── FETCH DATA ── */
  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Pools (public)
      const poolsRes = await axios.get(`${API_URL}/staking/pools`);
      const pools = poolsRes.data.pools || [];
      setStakingPools(pools.filter(p => p.type === 'staking'));
      setFarmingPools(pools.filter(p => p.type === 'farming'));

      // Auth-dependent requests
      if (isAuthenticated) {
        const [positionsRes, historyRes, balancesRes] = await Promise.allSettled([
          axios.get(`${API_URL}/staking/positions`, { headers: getAuthHeaders() }),
          axios.get(`${API_URL}/staking/transactions`, { headers: getAuthHeaders() }),
          axios.get(`${API_URL}/balances`, { headers: getAuthHeaders() }),
        ]);

        if (positionsRes.status === 'fulfilled') {
          setPositions(positionsRes.value.data.positions || []);
        } else {
          setPositions([]);
        }

        if (historyRes.status === 'fulfilled') {
          setHistory(historyRes.value.data.history || []);
        } else {
          setHistory([]);
        }

        if (balancesRes.status === 'fulfilled') {
          setWalletAssets(balancesRes.value.data.assets || []);
        } else {
          setWalletAssets([]);
        }
      } else {
        setPositions([]);
        setHistory([]);
        setWalletAssets([]);
      }
    } catch (err) {
      console.error('Failed to fetch staking data:', err);
      addToast('Failed to load staking data. Please try again.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── FETCH CHART ── */
  useEffect(() => {
    if (!selectedPool) return;
    let cancelled = false;
    const fetchChart = async () => {
      setHistoryData(null);
      try {
        const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const res = await axios.get(`${API_URL}/staking/history`, {
          params: { poolId: selectedPool.id, days: daysMap[chartPeriod] || 30 }
        });
        if (!cancelled) setHistoryData(res.data);
      } catch (err) {
        console.error('Chart fetch failed:', err);
        if (!cancelled) setHistoryData(null);
      }
    };
    fetchChart();
    return () => { cancelled = true; };
  }, [selectedPool, chartPeriod]);

  /* ── DERIVED VALUES ── */
  const currentPools = activeTab === 'staking' ? stakingPools : farmingPools;

  const filteredPools = useMemo(() => {
    let pools = [...currentPools];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      pools = pools.filter(p =>
        (p.token || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.network || '').toLowerCase().includes(q)
      );
    }
    if (filterLock === 'flexible') pools = pools.filter(p => p.lockPeriod === 'Flexible' || p.lockPeriod === 'No Lock');
    else if (filterLock === 'locked') pools = pools.filter(p => p.lockPeriod !== 'Flexible' && p.lockPeriod !== 'No Lock');

    pools.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'tvl') { valA = parseFloat(a.tvl) || 0; valB = parseFloat(b.tvl) || 0; }
      else if (sortBy === 'apr') { valA = parseFloat(a.apr) || 0; valB = parseFloat(b.apr) || 0; }
      else { valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); }
      if (sortDir === 'desc') return valB > valA ? 1 : -1;
      return valA > valB ? 1 : -1;
    });
    return pools;
  }, [currentPools, searchQuery, sortBy, sortDir, filterLock]);

  const portfolioStats = useMemo(() => {
    // Use token prices from wallet assets for USD conversion
    const getPrice = (token) => {
      const a = walletAssets.find(x => x.symbol?.toUpperCase() === token?.toUpperCase());
      return a ? parseFloat(a.price) || 0 : 0;
    };
    const totalStaked = positions.reduce((s, p) => s + (parseFloat(p.stakedAmount) || 0) * getPrice(p.token), 0);
    const totalRewards = positions.reduce((s, p) => s + (parseFloat(p.rewardAmount) || 0) * getPrice(p.token), 0);
    const avgApr = positions.length ? positions.reduce((s, p) => s + (parseFloat(p.apr) || 0), 0) / positions.length : 0;
    return { totalStaked, totalRewards, avgApr, positionCount: positions.length };
  }, [positions, walletAssets]);

  /* ── CHART CONFIG ── */
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(15, 15, 30, 0.95)',
        titleColor: '#e2e8f0', bodyColor: '#e2e8f0',
        borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: 1,
        padding: 12, cornerRadius: 8,
        callbacks: { label: ctx => `APR: ${Number(ctx.parsed.y).toFixed(2)}%` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 7, font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => Number(v).toFixed(1) + '%' }, border: { display: false } }
    },
    elements: { line: { tension: 0.4 }, point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2 } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  const generateChartData = () => {
    if (!historyData || !historyData.labels || !historyData.data) return null;
    return {
      labels: historyData.labels,
      datasets: [{
        label: 'APR (%)',
        data: historyData.data.map(Number),
        borderColor: '#8b5cf6',
        backgroundColor: chartType === 'line'
          ? (ctx) => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, 'rgba(139,92,246,0.35)'); g.addColorStop(1, 'rgba(139,92,246,0)'); return g; }
          : 'rgba(139,92,246,0.5)',
        fill: chartType === 'line',
        borderWidth: 2,
        pointBackgroundColor: '#8b5cf6',
        borderRadius: chartType === 'bar' ? 4 : 0
      }]
    };
  };

  /* ── ACTION HANDLERS ── */
  const handleApprove = async () => {
    setApprovalStep('approving');
    try {
      await new Promise(r => setTimeout(r, 2000));
      setApprovalStep('approved');
      addToast('Token approved successfully!', 'success');
    } catch {
      setApprovalStep('idle');
      addToast('Approval failed.', 'error');
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    if (!isAuthenticated) { addToast('Please connect your wallet first.', 'error'); return; }

    setPendingTx(true);
    try {
      const endpoint = modalAction === 'stake' ? '/staking/stake' : '/staking/unstake';
      const payload = modalAction === 'stake'
        ? { poolId: selectedPool.id, amount: stakeAmount, autoCompound }
        : { positionId: selectedPool.positionId, amount: stakeAmount };

      const res = await axios.post(`${API_URL}${endpoint}`, payload, { headers: getAuthHeaders() });

      addToast(
        `Successfully ${modalAction === 'stake' ? 'staked' : 'unstaked'} ${stakeAmount} ${selectedPool.token}!`,
        'success'
      );
      setSelectedPool(null);
      setStakeAmount('');
      setApprovalStep('idle');
      fetchData(); // Refresh data
    } catch (err) {
      const msg = err.response?.data?.message || 'Transaction failed. Please try again.';
      addToast(msg, 'error');
    } finally {
      setPendingTx(false);
    }
  };

  const handleClaimRewards = async (positionId) => {
    if (!isAuthenticated) { addToast('Please connect your wallet.', 'error'); return; }
    addToast('Claiming rewards...', 'info');
    try {
      await axios.post(`${API_URL}/staking/claim`, { positionId }, { headers: getAuthHeaders() });
      addToast('Rewards claimed successfully!', 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to claim rewards.', 'error');
    }
  };

  const handleCompound = async (positionId) => {
    if (!isAuthenticated) { addToast('Please connect your wallet.', 'error'); return; }
    addToast('Compounding rewards...', 'info');
    try {
      await axios.post(`${API_URL}/staking/compound`, { positionId }, { headers: getAuthHeaders() });
      addToast('Rewards compounded!', 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Compounding failed.', 'error');
    }
  };

  const openStakeModal = (pool, action = 'stake') => {
    setSelectedPool(pool);
    setModalAction(action);
    setStakeAmount('');
    setApprovalStep('idle');
    setAutoCompound(pool.autoCompound || false);
    setShowSettings(false);
    setChartPeriod('30d');
  };

  const calculateYield = () => {
    const amount = parseFloat(calcAmount) || 0;
    const apr = parseFloat(calcApr) || 0;
    const days = parseInt(calcDuration) || 0;
    const daily = (amount * apr / 100) / 365;
    const total = daily * days;
    return {
      daily: daily.toFixed(4),
      weekly: (daily * 7).toFixed(4),
      monthly: (daily * 30).toFixed(4),
      yearly: (daily * 365).toFixed(4),
      total: total.toFixed(4),
      roi: amount > 0 ? ((total / amount) * 100).toFixed(2) : '0'
    };
  };

  /* ─────────────── RENDER ─────────────── */
  return (
    <div style={styles.page}>
      {/* TOAST CONTAINER */}
      <div style={styles.toastContainer}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              style={{
                ...styles.toast,
                borderLeft: `4px solid ${t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#3b82f6'}`
              }}
            >
              {t.type === 'success' ? <FiCheckCircle style={{ color: '#10b981', flexShrink: 0 }} /> :
               t.type === 'error' ? <FiAlertTriangle style={{ color: '#ef4444', flexShrink: 0 }} /> :
               <FiInfo style={{ color: '#3b82f6', flexShrink: 0 }} />}
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* PAGE HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            <span style={{ fontSize: 18 }}>←</span><span>Dashboard</span>
          </button>
          <div>
            <h1 style={styles.pageTitle}>
              <FiZap style={{ color: '#8b5cf6', marginRight: 8 }} />
              Staking & Farming
            </h1>
            <p style={styles.pageSub}>Earn passive income by staking your crypto assets</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <motion.button
            whileTap={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            style={styles.iconBtn}
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <FiRefreshCw style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </motion.button>
        </div>
      </motion.div>

      {/* PORTFOLIO OVERVIEW */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={styles.portfolioCard}>
        <div style={styles.portfolioGrid}>
          <div style={styles.portfolioStat}>
            <div style={{ ...styles.statIconBox, background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))' }}>
              <FiLock style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <div style={styles.statLabel}>Total Staked</div>
              <div style={styles.statValue}>{formatCurrency(portfolioStats.totalStaked)}</div>
            </div>
          </div>
          <div style={styles.portfolioStat}>
            <div style={{ ...styles.statIconBox, background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' }}>
              <FiTrendingUp style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={styles.statLabel}>Total Earned</div>
              <div style={{ ...styles.statValue, color: '#10b981' }}>+{formatCurrency(portfolioStats.totalRewards)}</div>
            </div>
          </div>
          <div style={styles.portfolioStat}>
            <div style={{ ...styles.statIconBox, background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))' }}>
              <FiPercent style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <div style={styles.statLabel}>Avg. APR</div>
              <div style={styles.statValue}>{portfolioStats.avgApr.toFixed(1)}%</div>
            </div>
          </div>
          <div style={styles.portfolioStat}>
            <div style={{ ...styles.statIconBox, background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' }}>
              <FiAward style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div style={styles.statLabel}>Active Positions</div>
              <div style={styles.statValue}>{portfolioStats.positionCount}</div>
            </div>
          </div>
        </div>
        {isAuthenticated && positions.length > 0 && (
          <div style={styles.portfolioActions}>
            <button style={styles.portfolioActionBtn} onClick={() => {
              positions.forEach(p => handleClaimRewards(p.id));
            }}><FiGift /> Claim All Rewards</button>
            <button style={styles.portfolioActionBtnSecondary} onClick={() => {
              positions.forEach(p => handleCompound(p.id));
            }}><FiRepeat /> Compound All</button>
          </div>
        )}
      </motion.div>

      {/* TABS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={styles.tabsWrapper}>
        {['staking', 'farming', 'positions', 'calculator'].map(tab => (
          <button
            key={tab}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
            onClick={() => { setActiveTab(tab); setSearchQuery(''); setFilterLock('all'); }}
          >
            {tab === 'staking' && <FiLock />}
            {tab === 'farming' && <FiTrendingUp />}
            {tab === 'positions' && <FiBarChart2 />}
            {tab === 'calculator' && <FiCpu />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'positions' && positions.length > 0 && (
              <span style={styles.tabBadge}>{positions.length}</span>
            )}
          </button>
        ))}
      </motion.div>

      {/* SEARCH / FILTER BAR */}
      {(activeTab === 'staking' || activeTab === 'farming') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.searchBar}>
          <div style={styles.searchInputWrap}>
            <FiSearch style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              style={styles.searchInput}
              placeholder={`Search ${activeTab} pools...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={styles.clearBtn}><FiX size={14} /></button>
            )}
          </div>
          <div style={styles.filterGroup}>
            {['all', 'flexible', 'locked'].map(f => (
              <button
                key={f}
                style={{ ...styles.filterBtn, ...(filterLock === f ? styles.filterBtnActive : {}) }}
                onClick={() => setFilterLock(f)}
              >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
          <div style={styles.sortWrap}>
            <button style={styles.sortBtn} onClick={() => {
              if (sortBy === 'tvl') setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
              else { setSortBy('tvl'); setSortDir('desc'); }
            }}>TVL {sortBy === 'tvl' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</button>
            <button style={styles.sortBtn} onClick={() => {
              if (sortBy === 'apr') setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
              else { setSortBy('apr'); setSortDir('desc'); }
            }}>APR {sortBy === 'apr' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</button>
          </div>
        </motion.div>
      )}

      {/* CONTENT AREA */}
      <div style={styles.contentArea}>
        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <p style={{ color: '#64748b', marginTop: 12 }}>Loading pools...</p>
          </div>
        ) : activeTab === 'staking' || activeTab === 'farming' ? (
          filteredPools.length === 0 ? (
            <div style={styles.emptyState}>
              <FiSearch size={40} style={{ color: '#475569', marginBottom: 12 }} />
              <p style={{ color: '#94a3b8', fontSize: 15 }}>No pools found</p>
            </div>
          ) : (
            <div style={styles.poolsGrid}>
              {filteredPools.map((pool, idx) => {
                const apr = parseFloat(pool.apr) || 0;
                const tvl = parseFloat(pool.tvl) || 0;
                const minAmount = parseFloat(pool.minAmount) || 0;
                const multiplier = parseFloat(pool.multiplier) || 1;
                return (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={styles.poolCard}
                    whileHover={{ borderColor: 'rgba(139,92,246,0.4)', transform: 'translateY(-2px)' }}
                  >
                    <div style={styles.poolCardTop}>
                      <div style={styles.poolIdentity}>
                        <div style={styles.poolIconBox}>
                          <span style={{ fontSize: 22 }}>{pool.icon || '🪙'}</span>
                        </div>
                        <div>
                          <div style={styles.poolName}>
                            {pool.name || `${pool.token} Staking`}
                            {pool.isVerified && <FiShield style={{ color: '#3b82f6', marginLeft: 6, fontSize: 13 }} />}
                          </div>
                          <div style={styles.poolNetwork}>{pool.network || 'Ethereum'}</div>
                        </div>
                      </div>
                      <div style={styles.aprBadge}>
                        <FiTrendingUp style={{ marginRight: 4, fontSize: 12 }} />
                        {apr}% APR
                      </div>
                    </div>

                    <div style={styles.poolStats}>
                      <div style={styles.poolStat}>
                        <span style={styles.poolStatLabel}>TVL</span>
                        <span style={styles.poolStatValue}>{formatCurrency(tvl)}</span>
                      </div>
                      <div style={styles.poolStat}>
                        <span style={styles.poolStatLabel}>Lock</span>
                        <span style={styles.poolStatValue}>{pool.lockPeriod}</span>
                      </div>
                      <div style={styles.poolStat}>
                        <span style={styles.poolStatLabel}>Multiplier</span>
                        <span style={{ ...styles.poolStatValue, color: '#f59e0b' }}>{multiplier}x</span>
                      </div>
                    </div>

                    <div style={styles.poolTags}>
                      {pool.autoCompound && <span style={styles.tagAuto}>⚡ Auto-compound</span>}
                      {pool.rewards && pool.rewards.map((r, i) => (
                        <span key={i} style={styles.tagReward}>Earn {r}</span>
                      ))}
                    </div>

                    <div style={styles.poolActions}>
                      <button style={styles.stakeBtnPrimary} onClick={() => openStakeModal(pool, 'stake')}>
                        <FiLock size={14} /> Stake
                      </button>
                      <button style={styles.stakeBtnSecondary} onClick={() => openStakeModal(pool, 'unstake')}>
                        <FiUnlock size={14} /> Unstake
                      </button>
                      <button style={styles.stakeBtnGhost} onClick={() => openStakeModal(pool, 'stake')}>
                        <FiInfo size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : activeTab === 'positions' ? (
          !isAuthenticated ? (
            <div style={styles.emptyState}>
              <FiLock size={40} style={{ color: '#475569', marginBottom: 12 }} />
              <p style={{ color: '#94a3b8', fontSize: 15 }}>Connect your wallet to view positions</p>
              <button style={{ ...styles.stakeBtnPrimary, marginTop: 16 }} onClick={() => navigate('/login')}>
                Connect Wallet
              </button>
            </div>
          ) : positions.length === 0 ? (
            <div style={styles.emptyState}>
              <FiLock size={40} style={{ color: '#475569', marginBottom: 12 }} />
              <p style={{ color: '#94a3b8', fontSize: 15 }}>No active positions</p>
              <button style={{ ...styles.stakeBtnPrimary, marginTop: 16 }} onClick={() => setActiveTab('staking')}>
                Start Staking
              </button>
            </div>
          ) : (
            <div style={styles.positionsList}>
              {positions.map((pos, idx) => {
                const stakedAmount = parseFloat(pos.stakedAmount) || 0;
                const rewardAmount = parseFloat(pos.rewardAmount) || 0;
                const apr = parseFloat(pos.apr) || 0;
                return (
                  <motion.div
                    key={pos.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    style={styles.positionCard}
                  >
                    <div style={styles.positionMain} onClick={() => setExpandedPosition(expandedPosition === pos.id ? null : pos.id)}>
                      <div style={styles.positionIdentity}>
                        <div style={styles.positionIcon}>{pos.icon || '🪙'}</div>
                        <div>
                          <div style={styles.positionName}>{pos.name}</div>
                          <div style={styles.positionSub}>{pos.lockPeriod} • Staked {timeAgo(pos.stakedDate)}</div>
                        </div>
                      </div>
                      <div style={styles.positionNumbers}>
                        <div style={styles.positionStaked}>{stakedAmount} {pos.token}</div>
                        <div style={styles.positionReward}>
                          <FiTrendingUp size={12} style={{ color: '#10b981' }} />
                          +{rewardAmount.toFixed(4)} {pos.token}
                        </div>
                      </div>
                      <motion.div animate={{ rotate: expandedPosition === pos.id ? 180 : 0 }} style={{ flexShrink: 0 }}>
                        <FiChevronDown style={{ color: '#64748b' }} />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {expandedPosition === pos.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={styles.positionDetails}>
                            <div style={styles.posDetailGrid}>
                              <div style={styles.posDetailItem}>
                                <span style={styles.posDetailLabel}>APR</span>
                                <span style={{ ...styles.posDetailValue, color: '#10b981' }}>{apr}%</span>
                              </div>
                              <div style={styles.posDetailItem}>
                                <span style={styles.posDetailLabel}>Status</span>
                                <span style={{ ...styles.posDetailValue, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                  {pos.status}
                                </span>
                              </div>
                              <div style={styles.posDetailItem}>
                                <span style={styles.posDetailLabel}>Auto-compound</span>
                                <span style={styles.posDetailValue}>{pos.autoCompound ? 'On' : 'Off'}</span>
                              </div>
                              <div style={styles.posDetailItem}>
                                <span style={styles.posDetailLabel}>Since</span>
                                <span style={styles.posDetailValue}>{new Date(pos.stakedDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div style={styles.posActions}>
                              <button style={styles.posActionPrimary} onClick={() => openStakeModal(pos, 'unstake')}>
                                <FiUnlock size={13} /> Unstake
                              </button>
                              <button style={styles.posActionSecondary} onClick={() => handleClaimRewards(pos.id)}>
                                <FiGift size={13} /> Claim ({rewardAmount.toFixed(4)} {pos.token})
                              </button>
                              <button style={styles.posActionSecondary} onClick={() => handleCompound(pos.id)}>
                                <FiRepeat size={13} /> Compound
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Transaction History */}
              <div style={styles.historySection}>
                <h3 style={styles.sectionTitle}><FiClock /> Transaction History</h3>
                {history.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>No staking transactions yet</p>
                ) : (
                  <div style={styles.historyList}>
                    {history.slice(0, 10).map((tx) => {
                      const amount = parseFloat(tx.amount) || 0;
                      return (
                        <div key={tx.id} style={styles.historyItem}>
                          <div style={{
                            ...styles.historyIcon,
                            background: tx.type === 'stake' ? 'rgba(139,92,246,0.15)' : tx.type === 'unstake' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'
                          }}>
                            {tx.type === 'stake' ? <FiLock size={14} style={{ color: '#8b5cf6' }} /> :
                             tx.type === 'unstake' ? <FiUnlock size={14} style={{ color: '#ef4444' }} /> :
                             <FiGift size={14} style={{ color: '#10b981' }} />}
                          </div>
                          <div style={styles.historyInfo}>
                            <div style={styles.historyType}>
                              {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {tx.token}
                              {tx.status === 'pending' && <span style={styles.pendingBadge}>Pending</span>}
                            </div>
                            <div style={styles.historySub}>
                              {amount} {tx.token} • {formatCurrency(tx.usdValue)} • {timeAgo(tx.timestamp)}
                            </div>
                          </div>
                          {tx.txHash && (
                            <button style={styles.historyLink} onClick={() => { navigator.clipboard.writeText(tx.txHash); addToast('Tx hash copied!', 'success'); }}>
                              <FiExternalLink size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* YIELD CALCULATOR */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.calcCard}>
            <div style={styles.calcHeader}>
              <FiCpu style={{ color: '#8b5cf6', fontSize: 22 }} />
              <div>
                <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: 18 }}>Yield Calculator</h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>Estimate your potential earnings</p>
              </div>
            </div>
            <div style={styles.calcInputs}>
              <div style={styles.calcInputGroup}>
                <label style={styles.calcLabel}>Investment Amount (USD)</label>
                <input type="number" value={calcAmount} onChange={e => setCalcAmount(e.target.value)} style={styles.calcInput} placeholder="1000" />
              </div>
              <div style={styles.calcInputGroup}>
                <label style={styles.calcLabel}>Annual Percentage Rate (%)</label>
                <input type="number" value={calcApr} onChange={e => setCalcApr(e.target.value)} style={styles.calcInput} placeholder="10" />
              </div>
              <div style={{ ...styles.calcInputGroup, gridColumn: '1 / -1' }}>
                <label style={styles.calcLabel}>Duration (Days)</label>
                <input type="number" value={calcDuration} onChange={e => setCalcDuration(e.target.value)} style={styles.calcInput} placeholder="365" />
                <div style={styles.durationPresets}>
                  {[30, 90, 180, 365].map(d => (
                    <button key={d} style={{ ...styles.durationBtn, ...(calcDuration === String(d) ? styles.durationBtnActive : {}) }} onClick={() => setCalcDuration(String(d))}>{d}d</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={styles.calcResults}>
              <div style={styles.calcResultMain}>
                <span style={styles.calcResultLabel}>Estimated Total Return</span>
                <span style={styles.calcResultValue}>
                  ${calculateYield().total} <small style={{ color: '#10b981', fontSize: 14, fontWeight: 500 }}>({calculateYield().roi}% ROI)</small>
                </span>
              </div>
              <div style={styles.calcResultGrid}>
                <div style={styles.calcResultItem}><span style={styles.calcResultItemLabel}>Daily</span><span style={styles.calcResultItemValue}>${calculateYield().daily}</span></div>
                <div style={styles.calcResultItem}><span style={styles.calcResultItemLabel}>Weekly</span><span style={styles.calcResultItemValue}>${calculateYield().weekly}</span></div>
                <div style={styles.calcResultItem}><span style={styles.calcResultItemLabel}>Monthly</span><span style={styles.calcResultItemValue}>${calculateYield().monthly}</span></div>
                <div style={styles.calcResultItem}><span style={styles.calcResultItemLabel}>Yearly</span><span style={styles.calcResultItemValue}>${calculateYield().yearly}</span></div>
              </div>
            </div>
            <div style={styles.calcDisclaimer}>
              <FiAlertTriangle style={{ color: '#f59e0b', flexShrink: 0, marginRight: 8 }} />
              <span>Estimates based on current APR. Actual returns vary with market conditions and compounding frequency.</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* STAKING MODAL */}
      <AnimatePresence>
        {selectedPool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setSelectedPool(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={styles.modal}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={styles.modalHeader}>
                <div style={styles.modalPoolInfo}>
                  <div style={styles.modalPoolIcon}><span style={{ fontSize: 24 }}>{selectedPool.icon || '🪙'}</span></div>
                  <div>
                    <h3 style={styles.modalTitle}>{selectedPool.name || `${selectedPool.token} Staking`}</h3>
                    <div style={styles.modalBadges}>
                      {selectedPool.isVerified && <span style={styles.verifiedBadge}><FiShield size={10} /> Verified</span>}
                      {selectedPool.network && <span style={styles.networkBadge}>{selectedPool.network}</span>}
                    </div>
                  </div>
                </div>
                <div style={styles.modalHeaderRight}>
                  <div style={styles.modalApr}>
                    <FiTrendingUp size={14} />
                    {parseFloat(selectedPool.apr || 0).toFixed(1)}% APR
                  </div>
                  <button onClick={() => setSelectedPool(null)} style={styles.modalCloseBtn}><FiX size={18} /></button>
                </div>
              </div>

              {/* Chart */}
              <div style={styles.modalChartSection}>
                <div style={styles.chartToolbar}>
                  <div style={styles.chartTabs}>
                    {['7d', '30d', '90d', '1y'].map(p => (
                      <button key={p} style={{ ...styles.chartTab, ...(chartPeriod === p ? styles.chartTabActive : {}) }} onClick={() => setChartPeriod(p)}>{p}</button>
                    ))}
                  </div>
                  <div style={styles.chartTypeToggle}>
                    <button style={{ ...styles.chartTypeBtn, ...(chartType === 'line' ? styles.chartTypeBtnActive : {}) }} onClick={() => setChartType('line')}>Line</button>
                    <button style={{ ...styles.chartTypeBtn, ...(chartType === 'bar' ? styles.chartTypeBtnActive : {}) }} onClick={() => setChartType('bar')}>Bar</button>
                  </div>
                </div>
                <div style={styles.chartWrapper}>
                  {historyData && historyData.labels && historyData.data ? (
                    chartType === 'line' ? (
                      <Line data={generateChartData()} options={chartOptions} />
                    ) : (
                      <Bar data={generateChartData()} options={chartOptions} />
                    )
                  ) : (
                    <div style={styles.chartSkeleton}>
                      <FiRefreshCw style={{ animation: 'spin 1s linear infinite', color: '#475569' }} />
                      <span>Loading chart...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Tabs */}
              <div style={styles.modalActionTabs}>
                <button style={{ ...styles.modalActionTab, ...(modalAction === 'stake' ? styles.modalActionTabActive : {}) }} onClick={() => setModalAction('stake')}>
                  <FiLock size={14} /> Stake
                </button>
                <button style={{ ...styles.modalActionTab, ...(modalAction === 'unstake' ? styles.modalActionTabActive : {}) }} onClick={() => setModalAction('unstake')}>
                  <FiUnlock size={14} /> Unstake
                </button>
              </div>

              {/* Stats */}
              <div style={styles.modalStats}>
                <div style={styles.modalStatBox}>
                  <small style={styles.modalStatLabel}>TVL</small>
                  <span style={styles.modalStatValue}>{formatCurrency(parseFloat(selectedPool.tvl) || 0)}</span>
                </div>
                <div style={styles.modalStatBox}>
                  <small style={styles.modalStatLabel}>Lock Period</small>
                  <span style={styles.modalStatValue}>{selectedPool.lockPeriod}</span>
                </div>
                <div style={styles.modalStatBox}>
                  <small style={styles.modalStatLabel}>Min. Amount</small>
                  <span style={styles.modalStatValue}>{parseFloat(selectedPool.minAmount) || 0} {selectedPool.token}</span>
                </div>
                <div style={styles.modalStatBox}>
                  <small style={styles.modalStatLabel}>Multiplier</small>
                  <span style={{ ...styles.modalStatValue, color: '#f59e0b' }}>{parseFloat(selectedPool.multiplier) || 1}x</span>
                </div>
              </div>

              {/* Amount Input */}
              <div style={styles.modalInputSection}>
                <div style={styles.modalInputHeader}>
                  <label style={styles.modalInputLabel}>{modalAction === 'stake' ? 'Amount to Stake' : 'Amount to Unstake'}</label>
                  <span style={styles.modalBalance}>
                    Available: {getWalletBalance(selectedPool.token).toFixed(4)} {selectedPool.token}
                  </span>
                </div>
                <div style={styles.modalInputWrap}>
                  <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} placeholder="0.00" style={styles.modalInput} />
                  <div style={styles.modalInputRight}>
                    <span style={styles.modalTokenSymbol}>{selectedPool.token}</span>
                    <button style={styles.maxBtn} onClick={() => setStakeAmount(String(getWalletBalance(selectedPool.token)))}>MAX</button>
                  </div>
                </div>
                <div style={styles.quickAmounts}>
                  {['25%', '50%', '75%', '100%'].map(pct => (
                    <button key={pct} style={styles.quickAmountBtn} onClick={() => {
                      const bal = getWalletBalance(selectedPool.token);
                      setStakeAmount((bal * parseInt(pct) / 100).toFixed(6));
                    }}>{pct}</button>
                  ))}
                </div>
              </div>

              {/* Auto-Compound Toggle */}
              {modalAction === 'stake' && (
                <div style={styles.toggleRow} onClick={() => setAutoCompound(!autoCompound)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiZap size={14} style={{ color: autoCompound ? '#8b5cf6' : '#64748b' }} />
                    <span style={{ color: '#e2e8f0', fontSize: 13 }}>Auto-compound Rewards</span>
                  </div>
                  <div style={{ ...styles.toggleSwitch, ...(autoCompound ? styles.toggleSwitchOn : {}) }}>
                    <div style={{ ...styles.toggleKnob, ...(autoCompound ? styles.toggleKnobOn : {}) }} />
                  </div>
                </div>
              )}

              {/* Rewards Preview */}
              {modalAction === 'stake' && stakeAmount && parseFloat(stakeAmount) > 0 && (
                <div style={styles.rewardsPreview}>
                  <div style={styles.previewRow}>
                    <span style={styles.previewLabel}>Estimated Daily</span>
                    <span style={styles.previewValue}>
                      ~{(parseFloat(stakeAmount) * (parseFloat(selectedPool.apr) / 100) / 365).toFixed(6)} {selectedPool.token}
                    </span>
                  </div>
                  <div style={styles.previewRow}>
                    <span style={styles.previewLabel}>Estimated Monthly</span>
                    <span style={styles.previewValue}>
                      ~{(parseFloat(stakeAmount) * (parseFloat(selectedPool.apr) / 100) / 12).toFixed(4)} {selectedPool.token}
                    </span>
                  </div>
                  <div style={{ ...styles.previewRow, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ ...styles.previewLabel, fontWeight: 600 }}>Estimated Yearly</span>
                    <span style={{ ...styles.previewValue, color: '#10b981', fontWeight: 600 }}>
                      ~{(parseFloat(stakeAmount) * (parseFloat(selectedPool.apr) / 100)).toFixed(4)} {selectedPool.token}
                    </span>
                  </div>
                </div>
              )}

              {/* Gas / Settings */}
              <div style={styles.gasRow}>
                <span style={styles.gasLabel}><FiCpu size={13} style={{ marginRight: 4 }} />Est. Gas: ~0.0025 ETH</span>
                <button style={styles.settingsBtn} onClick={() => setShowSettings(!showSettings)}><FiSettings size={14} /></button>
              </div>
              {showSettings && (
                <div style={styles.settingsPanel}>
                  <div style={styles.slippageRow}>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>Slippage Tolerance</span>
                    <div style={styles.slippageOptions}>
                      {['0.1', '0.5', '1.0'].map(s => (
                        <button key={s} style={{ ...styles.slippageBtn, ...(slippage === s ? styles.slippageBtnActive : {}) }} onClick={() => setSlippage(s)}>{s}%</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!isAuthenticated ? (
                <button style={{ ...styles.confirmBtn, ...styles.confirmBtnStake }} onClick={() => { setSelectedPool(null); navigate('/login'); }}>
                  Connect Wallet to Continue
                </button>
              ) : modalAction === 'stake' && approvalStep !== 'approved' ? (
                <button
                  style={{ ...styles.confirmBtn, ...(approvalStep === 'approving' ? styles.confirmBtnLoading : {}), opacity: approvalStep === 'approving' ? 0.7 : 1 }}
                  onClick={handleApprove}
                  disabled={approvalStep === 'approving'}
                >
                  {approvalStep === 'approving' ? <><FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> Approving...</> : <><FiCheckCircle /> Approve {selectedPool.token}</>}
                </button>
              ) : (
                <button
                  style={{ ...styles.confirmBtn, ...styles.confirmBtnStake, ...(pendingTx ? styles.confirmBtnLoading : {}), opacity: pendingTx ? 0.7 : 1 }}
                  onClick={handleStake}
                  disabled={pendingTx || !stakeAmount || parseFloat(stakeAmount) <= 0}
                >
                  {pendingTx ? <><FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} /> Confirming...</> : (
                    <>{modalAction === 'stake' ? <FiLock /> : <FiUnlock />} {modalAction === 'stake' ? 'Stake' : 'Unstake'} {stakeAmount || '0'} {selectedPool.token}</>
                  )}
                </button>
              )}

              {/* Contract */}
              {selectedPool.contractAddress && (
                <div style={styles.contractRow}>
                  <span style={styles.contractLabel}>Contract:</span>
                  <span style={styles.contractAddr}>{shortenAddress(selectedPool.contractAddress)}</span>
                  <FiExternalLink size={12} style={{ color: '#64748b', cursor: 'pointer' }} />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
};

/* ─────────────────── STYLES ─────────────────── */
const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f23 50%, #0a0a1a 100%)', color: '#e2e8f0', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", padding: '0 0 60px', overflowX: 'hidden' },
  toastContainer: { position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 },
  toast: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(15,15,35,0.95)', backdropFilter: 'blur(20px)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: 280, maxWidth: 380 },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 28px 0', flexWrap: 'wrap', gap: 16 },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: 12 },
  headerRight: { display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  pageTitle: { fontSize: 28, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', margin: 0 },
  pageSub: { color: '#64748b', fontSize: 14, margin: '4px 0 0' },
  iconBtn: { width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  portfolioCard: { margin: '20px 28px 0', background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(59,130,246,0.05),rgba(16,185,129,0.05))', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 16, padding: 24 },
  portfolioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20, marginBottom: 20 },
  portfolioStat: { display: 'flex', alignItems: 'center', gap: 12 },
  statIconBox: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: 700, color: '#f1f5f9' },
  portfolioActions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  portfolioActionBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  portfolioActionBtnSecondary: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  tabsWrapper: { display: 'flex', gap: 4, padding: '20px 28px 0', overflowX: 'auto' },
  tab: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: '10px 10px 0 0', background: 'transparent', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  tabActive: { background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontWeight: 600 },
  tabBadge: { background: '#8b5cf6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, marginLeft: 4 },
  searchBar: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px 28px 0', flexWrap: 'wrap' },
  searchInputWrap: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', flex: '1 1 220px', minWidth: 200 },
  searchInput: { background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13, width: '100%' },
  clearBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', borderRadius: 4, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' },
  filterGroup: { display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.06)' },
  filterBtn: { padding: '6px 12px', borderRadius: 6, background: 'transparent', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  filterBtnActive: { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
  sortWrap: { display: 'flex', gap: 4 },
  sortBtn: { padding: '6px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 12, cursor: 'pointer' },
  contentArea: { padding: '16px 28px 0' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60 },
  spinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', animation: 'spin 1s linear infinite' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, textAlign: 'center' },
  poolsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 },
  poolCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, transition: 'all 0.25s ease' },
  poolCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  poolIdentity: { display: 'flex', alignItems: 'center', gap: 12 },
  poolIconBox: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  poolName: { fontSize: 15, fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center' },
  poolNetwork: { fontSize: 12, color: '#64748b', marginTop: 2 },
  aprBadge: { display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 8 },
  poolStats: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 },
  poolStat: {},
  poolStatLabel: { fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 },
  poolStatValue: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  poolTags: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tagAuto: { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 500 },
  tagReward: { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 500 },
  poolActions: { display: 'flex', gap: 8 },
  stakeBtnPrimary: { display: 'flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1 },
  stakeBtnSecondary: { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', flex: 1 },
  stakeBtnGhost: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' },
  positionsList: { display: 'flex', flexDirection: 'column', gap: 10 },
  positionCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' },
  positionMain: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', gap: 16 },
  positionIdentity: { display: 'flex', alignItems: 'center', gap: 12, flex: 1 },
  positionIcon: { width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  positionName: { fontSize: 14, fontWeight: 600, color: '#f1f5f9' },
  positionSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  positionNumbers: { textAlign: 'right', flexShrink: 0 },
  positionStaked: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  positionReward: { fontSize: 13, color: '#10b981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 },
  positionDetails: { borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px', background: 'rgba(255,255,255,0.01)' },
  posDetailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 },
  posDetailItem: {},
  posDetailLabel: { fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 },
  posDetailValue: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  posActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  posActionPrimary: { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  posActionSecondary: { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  historySection: { marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, margin: '0 0 14px' },
  historyList: { display: 'flex', flexDirection: 'column', gap: 6 },
  historyItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' },
  historyIcon: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  historyInfo: { flex: 1 },
  historyType: { fontSize: 13, fontWeight: 500, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 },
  pendingBadge: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600 },
  historySub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  historyLink: { background: 'rgba(255,255,255,0.04)', border: 'none', color: '#64748b', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  calcCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28, maxWidth: 640 },
  calcHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 },
  calcInputs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  calcInputGroup: { gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 6 },
  calcLabel: { fontSize: 12, color: '#94a3b8', fontWeight: 500 },
  calcInput: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 16, fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' },
  durationPresets: { display: 'flex', gap: 4, marginTop: 4 },
  durationBtn: { padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 11, cursor: 'pointer' },
  durationBtnActive: { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.3)' },
  calcResults: { background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(59,130,246,0.04))', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: 20, marginBottom: 16 },
  calcResultMain: { marginBottom: 16, textAlign: 'center' },
  calcResultLabel: { fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 },
  calcResultValue: { fontSize: 28, fontWeight: 700, color: '#f1f5f9' },
  calcResultGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 },
  calcResultItem: { textAlign: 'center' },
  calcResultItemLabel: { fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 },
  calcResultItemValue: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  calcDisclaimer: { display: 'flex', alignItems: 'flex-start', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 10, padding: '12px 14px', fontSize: 11, color: '#94a3b8', lineHeight: 1.5 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: 'linear-gradient(180deg,#13132b,#0f0f23)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.5),0 0 80px rgba(139,92,246,0.08)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalPoolInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  modalPoolIcon: { width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  modalBadges: { display: 'flex', gap: 6, marginTop: 4 },
  verifiedBadge: { display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600 },
  networkBadge: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 500 },
  modalHeaderRight: { display: 'flex', alignItems: 'center', gap: 10 },
  modalApr: { display: 'flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 14, fontWeight: 700, padding: '6px 12px', borderRadius: 8 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  modalChartSection: { marginBottom: 20 },
  chartToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chartTabs: { display: 'flex', gap: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: 2 },
  chartTab: { padding: '4px 10px', borderRadius: 4, background: 'transparent', border: 'none', color: '#64748b', fontSize: 11, fontWeight: 500, cursor: 'pointer' },
  chartTabActive: { background: 'rgba(139,92,246,0.2)', color: '#8b5cf6' },
  chartTypeToggle: { display: 'flex', gap: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: 2 },
  chartTypeBtn: { padding: '4px 10px', borderRadius: 4, background: 'transparent', border: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer' },
  chartTypeBtnActive: { background: 'rgba(139,92,246,0.2)', color: '#8b5cf6' },
  chartWrapper: { height: 180, position: 'relative' },
  chartSkeleton: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#475569', fontSize: 12 },
  modalActionTabs: { display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3, marginBottom: 16 },
  modalActionTab: { display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', padding: '10px 16px', borderRadius: 8, background: 'transparent', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  modalActionTabActive: { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
  modalStats: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 },
  modalStatBox: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' },
  modalStatLabel: { fontSize: 10, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
  modalStatValue: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  modalInputSection: { marginBottom: 12 },
  modalInputHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalInputLabel: { fontSize: 12, color: '#94a3b8', fontWeight: 500 },
  modalBalance: { fontSize: 11, color: '#64748b' },
  modalInputWrap: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '4px 4px 4px 14px' },
  modalInput: { background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 20, fontWeight: 700, flex: 1, padding: '8px 0', minWidth: 0 },
  modalInputRight: { display: 'flex', alignItems: 'center', gap: 6 },
  modalTokenSymbol: { fontSize: 13, color: '#94a3b8', fontWeight: 500 },
  maxBtn: { background: 'rgba(139,92,246,0.2)', border: 'none', color: '#8b5cf6', fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 8, cursor: 'pointer' },
  quickAmounts: { display: 'flex', gap: 4, marginTop: 6 },
  quickAmountBtn: { flex: 1, padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 11, fontWeight: 500, borderRadius: 6, cursor: 'pointer' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12, cursor: 'pointer' },
  toggleSwitch: { width: 40, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.3s' },
  toggleSwitchOn: { background: '#8b5cf6' },
  toggleKnob: { width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: 2, transition: 'all 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' },
  toggleKnobOn: { left: 20 },
  rewardsPreview: { background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 },
  previewRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' },
  previewLabel: { fontSize: 12, color: '#94a3b8' },
  previewValue: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  gasRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', marginBottom: 8 },
  gasLabel: { fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center' },
  settingsBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  settingsPanel: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 },
  slippageRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  slippageOptions: { display: 'flex', gap: 4 },
  slippageBtn: { padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 11, cursor: 'pointer' },
  slippageBtnActive: { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.3)' },
  confirmBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 15, fontWeight: 600, borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s', marginTop: 4 },
  confirmBtnStake: { background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', border: 'none', color: '#fff' },
  confirmBtnLoading: { opacity: 0.7, cursor: 'not-allowed' },
  contractRow: { display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12, fontSize: 11, color: '#475569' },
  contractLabel: {},
  contractAddr: { fontFamily: 'monospace', color: '#64748b' },
};

export default Staking;
