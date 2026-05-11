import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // <--- ADDED
import { 
  FiTrendingUp, FiZap, FiLock, FiUnlock, FiDollarSign, FiClock,
  FiChevronDown, FiChevronUp, FiInfo, FiExternalLink, FiRefreshCw,
  FiX, FiCheckCircle
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { StakingPool, FarmingPool, YieldCalculator } from '../components/staking';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_URL = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const CryptoSticks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('staking');
  const [expandedPool, setExpandedPool] = useState(null);
  const [selectedPool, setSelectedPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stakingPools, setStakingPools] = useState([]);
  const [farmingPools, setFarmingPools] = useState([]);
  
  // Modal States
  const [modalAction, setModalAction] = useState('stake'); // 'stake' | 'unstake'
  const [stakeAmount, setStakeAmount] = useState('');
  const [pendingTx, setPendingTx] = useState(false);
  const [historyData, setHistoryData] = useState(null); // For chart

  // --- 1. FETCH DATA FROM BACKEND ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/staking/pools`);
        
        const pools = res.data.pools;
        
        // Filter based on type
        setStakingPools(pools.filter(p => p.type === 'staking'));
        setFarmingPools(pools.filter(p => p.type === 'farming'));
      } catch (err) {
        console.error("Failed to fetch pools", err);
        // Fallback to dummy data if backend fails (optional)
        setStakingPools([
           { id:1, token: 'ETH', apr: 5.2, tvl: 125000000, lockPeriod: 'Flexible' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. FETCH CHART DATA WHEN POOL SELECTED ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedPool) return;
      try {
        const res = await axios.get(`${API_URL}/staking/history`, {
          params: { poolId: selectedPool.id, days: 30 }
        });
        setHistoryData(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    };
    fetchHistory();
  }, [selectedPool]);

  // --- 3. CHART CONFIGURATION ---
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: '#9CA3AF', maxTicksLimit: 6 }
      },
      y: { 
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9CA3AF' }
      }
    },
    elements: {
      line: { tension: 0.4 }, // Smooth curve
      point: { radius: 0, hoverRadius: 6 }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const generateChartData = () => {
    if (!historyData) return null;
    return {
      labels: historyData.labels,
      datasets: [{
        label: 'APR (%)',
        data: historyData.data,
        borderColor: '#8b5cf6',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
          return gradient;
        },
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: '#8b5cf6'
      }]
    };
  };

  // --- 4. ACTION HANDLERS ---
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    
    setPendingTx(true);
    try {
      // Call Backend to initiate transaction (or get unsigned TX)
      await axios.post(`${API_URL}/staking/stake`, {
        poolId: selectedPool.id,
        amount: stakeAmount
      });
      
      // Close modal and show success
      setSelectedPool(null);
      setStakeAmount('');
    } catch (err) {
      console.error("Staking failed", err);
    } finally {
      setPendingTx(false);
    }
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
            <button className="refresh-btn" onClick={() => window.location.reload()}>
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </motion.div>

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

      <div className="pools-container">
        {loading ? (
          <div className="loading-spinner">Loading pools...</div>
        ) : activeTab === 'staking' ? (
          <div className="pools-grid">
            {stakingPools.map((pool) => (
              <StakingPool 
                key={pool.id}
                pool={pool}
                expanded={expandedPool === pool.id}
                onToggle={() => setExpandedPool(expandedPool === pool.id ? null : pool.id)}
                onSelect={() => { setSelectedPool(pool); setModalAction('stake'); }}
              />
            ))}
          </div>
        ) : (
          <div className="pools-grid">
            {farmingPools.map((pool) => (
              <FarmingPool 
                key={pool.id}
                pool={pool}
                expanded={expandedPool === pool.id}
                onToggle={() => setExpandedPool(expandedPool === pool.id ? null : pool.id)}
                onSelect={() => { setSelectedPool(pool); setModalAction('stake'); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- ENHANCED STAKING MODAL WITH CHART --- */}
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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="modal-content staking-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="pool-header-info">
                  <span className="pool-icon">{selectedPool.token || 'LP'}</span>
                  <div>
                    <h3>{selectedPool.name || `${selectedPool.token} Staking`}</h3>
                    <span className="badge">Earned: {selectedPool.rewards?.join(', ') || 'Tokens'}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedPool(null)} className="close-btn">
                  <FiX />
                </button>
              </div>
              
              {/* PERFORMANCE CHART */}
              <div className="chart-container">
                <div className="chart-header">
                  <h4>Performance (30 Days)</h4>
                  <span className="current-apr">
                    <FiTrendingUp className="up-icon" />
                    {selectedPool.apr}% APR
                  </span>
                </div>
                <div className="chart-wrapper">
                  {historyData ? (
                    <Line data={generateChartData()} options={chartOptions} />
                  ) : (
                    <div className="chart-skeleton">Loading chart...</div>
                  )}
                </div>
              </div>

              <div className="modal-body">
                {/* TABS: STAKE | UNSTAKE */}
                <div className="action-tabs">
                  <button 
                    className={`action-tab ${modalAction === 'stake' ? 'active' : ''}`}
                    onClick={() => setModalAction('stake')}
                  >
                    <FiLock /> Stake
                  </button>
                  <button 
                    className={`action-tab ${modalAction === 'unstake' ? 'active' : ''}`}
                    onClick={() => setModalAction('unstake')}
                  >
                    <FiUnlock /> Unstake
                  </button>
                </div>

                <div className="stats-grid">
                  <div className="stat-box">
                    <small>TVL</small>
                    <span>${(selectedPool.tvl / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="stat-box">
                    <small>Lock Period</small>
                    <span>{selectedPool.lockPeriod}</span>
                  </div>
                  <div className="stat-box">
                    <small>Min Stake</small>
                    <span>{selectedPool.minAmount} {selectedPool.token}</span>
                  </div>
                </div>

                <div className="input-section">
                  <label>
                    {modalAction === 'stake' ? 'Amount to Stake' : 'Amount to Unstake'}
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.00"
                    />
                    <div className="input-actions">
                      <span className="token-symbol">{selectedPool.token}</span>
                      <button className="max-btn" onClick={() => setStakeAmount('100')}>MAX</button>
                    </div>
                  </div>
                  <div className="balance-info">
                    Available: 142.50 {selectedPool.token}
                  </div>
                </div>

                {/* REWARDS PREVIEW */}
                {modalAction === 'stake' && (
                  <div className="rewards-preview">
                    <div className="preview-row">
                      <span>Estimated Daily</span>
                      <span>~{(stakeAmount * (selectedPool.apr / 100) / 365).toFixed(4)} {selectedPool.token}</span>
                    </div>
                    <div className="preview-row highlight">
                      <span>Estimated Yearly</span>
                      <span>~{(stakeAmount * (selectedPool.apr / 100)).toFixed(2)} {selectedPool.token}</span>
                    </div>
                  </div>
                )}

                <button 
                  className={`stake-btn ${pendingTx ? 'loading' : ''}`}
                  onClick={handleStake}
                  disabled={pendingTx || !stakeAmount}
                >
                  {pendingTx ? (
                    <FiRefreshCw className="spin" />
                  ) : modalAction === 'stake' ? (
                    <FiLock />
                  ) : (
                    <FiUnlock />
                  )}
                  {pendingTx ? 'Confirming...' : `${modalAction} ${stakeAmount || '0'} ${selectedPool.token}`}
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
