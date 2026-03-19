// src/pages/DeFi.jsx
import React, { useState, useContext } from 'react';
import { Web3Context } from '../context/Web3Context';
import { Box, Grid, Card, CardContent, Typography, Button } from '@mui/material';
import QuickActionsView from '../components/wallet/QuickActionsView';
import ReceiveView from '../components/wallet/ReceiveView';
import SendView from '../components/wallet/SendView';
import SwapView from '../components/wallet/SwapView';
import { toast } from 'react-hot-toast';

const defiOptions = [
  { title: 'Quick Actions', component: QuickActionsView },
  { title: 'Receive', component: ReceiveView },
  { title: 'Send', component: SendView },
  { title: 'Swap', component: SwapView },
  // Add more DeFi features here like Lending, Staking, etc.
];

const DeFi = () => {
  const { account, connectWallet } = useContext(Web3Context);
  const [currentView, setCurrentView] = useState(null);

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected!');
    } catch (err) {
      toast.error('Failed to connect wallet.');
    }
  };

  const renderCurrentView = () => {
    if (!currentView) return null;
    const OptionComponent = defiOptions.find(opt => opt.title === currentView)?.component;
    return OptionComponent ? <OptionComponent /> : null;
  };

  return (
    <Box sx={{ p: 3 }}>
      {!account && (
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6">Connect your wallet to use DeFi features</Typography>
          <Button variant="contained" onClick={handleConnect}>
            Connect Wallet
          </Button>
        </Box>
      )}

      <Grid container spacing={2}>
        {defiOptions.map(option => (
          <Grid item xs={6} sm={3} key={option.title}>
            <Card
              sx={{ cursor: 'pointer', textAlign: 'center' }}
              onClick={() => setCurrentView(option.title)}
            >
              <CardContent>
                <Typography variant="subtitle1">{option.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        {renderCurrentView()}
      </Box>
    </Box>
  );
};

export default DeFi;
