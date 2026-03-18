// src/components/staking/FarmingPool.jsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const FarmingPool = () => {
  return (
    <Box sx={{ p: 2, border: '1px solid #444', borderRadius: 2, mb: 2 }}>
      <Typography variant="h6">Farming Pool</Typography>
      <Typography variant="body2">Provide liquidity and earn yield.</Typography>
      <Button variant="contained" sx={{ mt: 1 }}>
        Farm
      </Button>
    </Box>
  );
};

export default FarmingPool;
