// src/components/staking/FarmingPool.jsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const FarmingPool = () => {
  return (
    <Box sx={{ p: 3, border: '1px solid #444', borderRadius: 2 }}>
      <Typography variant="h5">Farming Pool</Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Provide liquidity and earn dual rewards
      </Typography>

      <Button variant="contained">
        Add Liquidity
      </Button>
    </Box>
  );
};

export default FarmingPool;
