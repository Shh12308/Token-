import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import QuickActionView from '../components/wallet/QuickActionView';
import ReceiveView from '../components/wallet/ReceiveView';
import SendView from '../components/wallet/SendView';
import SwapView from '../components/wallet/SwapView';

const Wallet = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const TabPanel = ({ children, value, index }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        CryptoBean Wallet
      </Typography>

      <Paper elevation={3}>
        <Tabs
          value={activeTab}
          onChange={handleChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Quick Actions" />
          <Tab label="Receive" />
          <Tab label="Send" />
          <Tab label="Swap" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <QuickActionView />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <ReceiveView />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <SendView />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <SwapView />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Wallet;
