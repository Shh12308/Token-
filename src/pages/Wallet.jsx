import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';

import QuickActionsView from '../components/wallet/QuickActionsView';
import ReceiveView from '../components/wallet/ReceiveView';
import SendView from '../components/wallet/SendView';
import SwapView from '../components/wallet/SwapView';

const Wallet = () => {
  const [view, setView] = useState('quick');

  const renderView = () => {
    switch (view) {
      case 'send':
        return <SendView setView={setView} />;
      case 'receive':
        return <ReceiveView setView={setView} />;
      case 'swap':
        return <SwapView setView={setView} />;
      default:
        return <QuickActionsView setView={setView} />;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        CryptoBean Wallet
      </Typography>

      <Paper elevation={3} sx={{ p: 2 }}>
        {renderView()}
      </Paper>
    </Box>
  );
};

export default Wallet;
