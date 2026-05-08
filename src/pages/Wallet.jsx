import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Modal,
  TextField,
  MenuItem,
} from '@mui/material';

import QuickActionsView from '../components/wallet/QuickActionsView';
import SendView from '../components/wallet/SendView';
import ReceiveView from '../components/wallet/ReceiveView';
import SwapView from '../components/wallet/SwapView';

import {
  useGetBalancesQuery,
  useGetUserQuery,
  useCreateBuySessionMutation,
} from '../app/services/walletApi';

const Wallet = () => {
  const [view, setView] = useState('quick');

  // BUY STATE
  const [openBuy, setOpenBuy] = useState(false);
  const [buyAmount, setBuyAmount] = useState('');
  const [buyCurrency, setBuyCurrency] = useState('ETH');

  // 🔌 REAL BACKEND CONNECTIONS
  const { data: balances, isLoading, error } = useGetBalancesQuery();
  const { data: user } = useGetUserQuery();
  const [createBuySession, { isLoading: buying }] =
    useCreateBuySessionMutation();

  const walletAddress = user?.walletAddress;

  // backend should send estimates
  const estimated = balances?.estimates?.[buyCurrency] || 0;

  const handleBuy = async () => {
    if (!buyAmount || Number(buyAmount) < 20) {
      alert('Minimum buy is $20');
      return;
    }

    if (!walletAddress) {
      alert('Wallet not connected');
      return;
    }

    try {
      const res = await createBuySession({
        amount: Number(buyAmount),
        currency: buyCurrency,
        walletAddress,
      }).unwrap();

      // redirect to provider (MoonPay / Transak / Ramp)
      window.location.href = res.url;
    } catch (err) {
      console.error(err);
      alert('Buy failed');
    }
  };

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
      <Typography variant="h4">CryptoBean Wallet</Typography>

      {/* BALANCES */}
      <Paper sx={{ p: 2, mb: 2 }}>
        {isLoading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>API Error</p>}

        {!isLoading && !error && (
          <div>
            <p>ETH: {balances?.eth ?? 0}</p>
            <p>USDC: {balances?.usdc ?? 0}</p>
          </div>
        )}

        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => setOpenBuy(true)}
        >
          Buy Crypto
        </Button>
      </Paper>

      {/* BUY MODAL */}
      <Modal open={openBuy} onClose={() => setOpenBuy(false)}>
        <Box
          sx={{
            p: 3,
            backgroundColor: '#fff',
            width: 400,
            margin: '100px auto',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6">Buy Crypto</Typography>

          <TextField
            fullWidth
            label="USD Amount"
            type="number"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            sx={{ mt: 2 }}
          />

          <TextField
            select
            fullWidth
            label="Crypto"
            value={buyCurrency}
            onChange={(e) => setBuyCurrency(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="ETH">ETH</MenuItem>
            <MenuItem value="BTC">BTC</MenuItem>
            <MenuItem value="USDC">USDC</MenuItem>
          </TextField>

          <Typography sx={{ mt: 2 }}>
            Estimated: <b>{estimated} {buyCurrency}</b>
          </Typography>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleBuy}
            disabled={buying}
          >
            {buying ? 'Processing...' : 'Continue'}
          </Button>

          <Button fullWidth sx={{ mt: 1 }} onClick={() => setOpenBuy(false)}>
            Cancel
          </Button>
        </Box>
      </Modal>

      {/* MAIN VIEW */}
      <Paper sx={{ p: 2 }}>
        {renderView()}
      </Paper>
    </Box>
  );
};

export default Wallet;
