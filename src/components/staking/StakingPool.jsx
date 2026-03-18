// src/components/staking/StakingPool.jsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const StakingPool = () => {
  return (
    <Box sx={{ p: 2, border: '1px solid #444', borderRadius: 2, mb: 2 }}>
      <Typography variant="h6">Staking Pool</Typography>
      <Typography variant="body2">Stake your tokens and earn rewards.</Typography>
      <Button variant="contained" sx={{ mt: 1 }}>
        Stake
      </Button>
    </Box>
  );
};

export default StakingPool;
