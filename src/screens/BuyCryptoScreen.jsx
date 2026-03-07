// src/screens/BuyCryptoScreen.jsx
import React from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';

const BuyCryptoScreen = () => {
  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: 'auto',
        mt: 5,
        p: 3,
        border: '1px solid #444',
        borderRadius: 2,
        backgroundColor: '#1e1e1e',
        color: '#fff',
      }}
    >
      <Typography variant="h5" mb={2}>
        Buy Crypto
      </Typography>
      <TextField
        fullWidth
        label="Amount in USD"
        variant="outlined"
        type="number"
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" fullWidth>
        Buy
      </Button>
    </Box>
  );
};

export default BuyCryptoScreen;
