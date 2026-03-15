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
