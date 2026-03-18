// src/components/staking/StakingPool.jsx
import React, { useState } from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { selectBalance, updateBalance } from '../../store/slices/walletSlice';
import toast from 'react-hot-toast';

const StakingPool = () => {
  const dispatch = useDispatch();
  const balance = useSelector(selectBalance);

  const [amount, setAmount] = useState('');
  const [staked, setStaked] = useState(0);
  const [rewards, setRewards] = useState(0);

  const token = 'ETH'; // you can make dynamic later
  const apr = 12; // 12% APR (example)

  const handleStake = () => {
    const value = parseFloat(amount);

    if (!value || value <= 0) {
      toast.error('Enter valid amount');
      return;
    }

    if ((balance[token] || 0) < value) {
      toast.error('Insufficient balance');
      return;
    }

    // Deduct from wallet
    dispatch(updateBalance({
      [token]: (balance[token] || 0) - value
    }));

    setStaked(prev => prev + value);
    toast.success('Staked successfully');
    setAmount('');
  };

  const handleUnstake = () => {
    if (staked <= 0) {
      toast.error('Nothing to unstake');
      return;
    }

    dispatch(updateBalance({
      [token]: (balance[token] || 0) + staked + rewards
    }));

    setStaked(0);
    setRewards(0);
    toast.success('Unstaked + rewards claimed');
  };

  // Simulate rewards (simple)
  React.useEffect(() => {
    if (staked > 0) {
      const interval = setInterval(() => {
        setRewards(prev => prev + (staked * apr / 100 / 365));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [staked]);

  return (
    <Box sx={{ p: 3, border: '1px solid #444', borderRadius: 2, mb: 3 }}>
      <Typography variant="h5">Staking Pool</Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>
        APR: {apr}%
      </Typography>

      <Typography variant="body2">
        Wallet Balance: {balance[token] || 0} {token}
      </Typography>

      <Typography variant="body2">
        Staked: {staked} {token}
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Rewards: {rewards.toFixed(4)} {token}
      </Typography>

      <TextField
        fullWidth
        type="number"
        label={`Amount (${token})`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button fullWidth variant="contained" onClick={handleStake} sx={{ mb: 1 }}>
        Stake
      </Button>

      <Button fullWidth variant="outlined" onClick={handleUnstake}>
        Unstake + Claim
      </Button>
    </Box>
  );
};

export default StakingPool;
