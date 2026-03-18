// src/components/staking/YieldCalculator.jsx
import React, { useState } from 'react';
import { Box, TextField, Typography, Button } from '@mui/material';
import toast from 'react-hot-toast';

const YieldCalculator = () => {
  const [amount, setAmount] = useState('');
  const [apr, setApr] = useState('');
  const [days, setDays] = useState('');
  const [yieldResult, setYieldResult] = useState(null);

  const calculateYield = () => {
    if (!amount || !apr || !days) {
      toast.error('Please fill in all fields!');
      return;
    }
    const principal = parseFloat(amount);
    const rate = parseFloat(apr) / 100;
    const time = parseFloat(days) / 365;
    const result = principal * rate * time;
    setYieldResult(result.toFixed(4));
  };

  return (
    <Box
      sx={{
        p: 3,
        border: '1px solid #444',
        borderRadius: 2,
        backgroundColor: '#1e1e1e',
        color: '#fff',
        maxWidth: 400,
        mx: 'auto',
        mt: 4,
      }}
    >
      <Typography variant="h5" mb={2}>
        Yield Calculator
      </Typography>

      <TextField
        fullWidth
        label="Amount"
        variant="outlined"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="APR (%)"
        variant="outlined"
        type="number"
        value={apr}
        onChange={(e) => setApr(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Duration (days)"
        variant="outlined"
        type="number"
        value={days}
        onChange={(e) => setDays(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button fullWidth variant="contained" onClick={calculateYield} sx={{ mb: 2 }}>
        Calculate
      </Button>

      {yieldResult !== null && (
        <Typography variant="body1">
          Estimated Yield: <strong>{yieldResult}</strong>
        </Typography>
      )}
    </Box>
  );
};

export default YieldCalculator;
