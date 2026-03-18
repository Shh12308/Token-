// src/components/staking/index.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiArrowDownLeft, FiZap, FiClock } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { updateBalance } from '../../store/slices/walletSlice';
import { fetchMarketData } from '../../store/slices/marketSlice';

// ✅ EXPORT COMPONENTS FOR BARREL IMPORTS
export { default as StakingPool } from './StakingPool';
export { default as FarmingPool } from './FarmingPool';
export { default as YieldCalculator } from './YieldCalculator';

// === STAKING OPTIONS ===
const stakingOptions = [
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', apr: 5.2 },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', apr: 3.1 },
  { id: 'usdc', name: 'USDC', symbol: 'USDC', apr: 7.5 },
];

// === STAKING CARD ===
const StakingCard = ({ staking, onStake }) => (
  <motion.div
    className="staking-card bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 flex flex-col"
    whileHover={{ scale: 1.03, y: -5 }}
    whileTap={{ scale: 0.97 }}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="crypto-name font-semibold">{staking.name}</div>
      <div className="crypto-symbol text-gray-500">{staking.symbol}</div>
    </div>
    <div className="staking-info flex justify-between items-center mb-4">
      <div className="apr text-green-500 font-bold">{staking.apr}% APR</div>
      <button
        onClick={() => onStake(staking.symbol)}
        className="stake-btn px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Stake
      </button>
    </div>
    <div className="staking-chart h-16 bg-gray-100 dark:bg-gray-700 rounded"></div>
  </motion.div>
);

// === STAKING PAGE ===
const Staking = () => {
  const dispatch = useDispatch();
  const { balance, activeWallet } = useSelector(state => state.wallet);
  const { marketData } = useSelector(state => state.market);
  const [stakingHistory, setStakingHistory] = useState([]);

  useEffect(() => {
    dispatch(fetchMarketData());
  }, [dispatch]);

  const handleStake = (symbol) => {
    const newStake = {
      id: stakingHistory.length + 1,
      symbol,
      amount: (Math.random() * 0.5).toFixed(4),
      timestamp: Date.now(),
      status: 'Staked',
    };
    setStakingHistory([newStake, ...stakingHistory]);
  };

  const totalBalance = Object.values(balance || {}).reduce((acc, val) => acc + val, 0);

  return (
    <div className="staking-page p-6">
      <h1 className="text-3xl font-bold mb-6">Crypto Staking</h1>

      {/* Wallet Summary */}
      <div className="wallet-summary flex justify-between items-center mb-6 bg-gray-50 dark:bg-gray-900 p-4 rounded shadow">
        <div>
          <div className="text-gray-500">Wallet</div>
          <div className="font-semibold">{activeWallet?.slice(0, 6)}...{activeWallet?.slice(-4)}</div>
        </div>
        <div>
          <div className="text-gray-500">Total Balance</div>
          <div className="font-bold">${totalBalance.toFixed(2)}</div>
        </div>
      </div>

      {/* Staking Options */}
      <div className="staking-options grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stakingOptions.map(option => (
          <StakingCard key={option.id} staking={option} onStake={handleStake} />
        ))}
      </div>

      {/* Staking History */}
      <div className="staking-history bg-gray-50 dark:bg-gray-900 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Stakes</h2>
        {stakingHistory.length === 0 && (
          <div className="text-gray-500">No staking activity yet.</div>
        )}
        <div className="history-list space-y-2">
          {stakingHistory.map(stake => (
            <motion.div
              key={stake.id}
              className="history-item flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded shadow-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-4">
                <FiZap className="text-yellow-400" />
                <div>
                  <div className="font-semibold">{stake.symbol}</div>
                  <div className="text-gray-500 text-sm">
                    {new Date(stake.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{stake.amount}</span>
                <span className={`status ${stake.status === 'Staked' ? 'text-green-500' : 'text-red-500'}`}>
                  {stake.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Staking;
