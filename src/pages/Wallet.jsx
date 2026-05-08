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

import { useGetBalancesQuery, useCreateBuySessionMutation } from '../app/services/walletApi';

const Wallet = () => {
  const [view, setView] = useState('quick');

  // 💳 BUY STATE
  const [openBuy, setOpenBuy] = useState(false);
  const [buyAmount, setBuyAmount] = useState('');
  const [buyCurrency, setBuyCurrency] = useState('ETH');
  const [ethPrice] = useState(2500); // optional mock price (replace with API)

  const { data, isLoading, error } = useGetBalancesQuery();
  const [createBuySession, { isLoading: buying }] = useCreateBuySessionMutation();

  const balances = data || {};

  // 💡 Estimated crypto preview
  const estimatedCrypto =
    buyAmount && ethPrice
      ? (Number(buyAmount) / ethPrice).toFixed(6)
      : 0;

  const handleBuy = async () => {
    if (!buyAmount || Number(buyAmount) < 20) {
      alert('Minimum buy is $20');
      return;
    }

    try {
      const res = await createBuySession({
        amount: Number(buyAmount),
        currency: buyCurrency,
        walletAddress: 'USER_WALLET_ADDRESS',
      }).unwrap();

      window.location.href = res.url; // redirect to provider
    } catch (err) {
      console.error(err);
      alert('Failed to create buy session');
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

      {/* BALANCE DISPLAY */}
      <Paper sx={{ p: 2, mb: 2 }}>
        {isLoading && <p>Loading balances...</p>}
        {error && <p style={{ color: 'red' }}>Failed to load balances</p>}

        {!isLoading && !error && (
          <div>
            <p>ETH: {balances.eth || 0}</p>
            <p>USDC: {balances.usdc || 0}</p>
          </div>
        )}

        {/* 💳 BUY BUTTON */}
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => setOpenBuy(true)}
        >
          Buy Crypto
        </Button>
      </Paper>

      {/* MODAL */}
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

          {/* AMOUNT INPUT */}
          <TextField
            fullWidth
            label="Enter USD amount"
            type="number"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            sx={{ mt: 2 }}
          />

          {/* CRYPTO SELECT */}
          <TextField
            select
            fullWidth
            label="Choose Crypto"
            value={buyCurrency}
            onChange={(e) => setBuyCurrency(e.target.value)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="ETH">ETH</MenuItem>
            <MenuItem value="BTC">BTC</MenuItem>
            <MenuItem value="USDC">USDC</MenuItem>
          </TextField>

          {/* 💡 OPTIONAL PREVIEW */}
          <Typography sx={{ mt: 2, fontSize: 14 }}>
            You will receive approx: <b>{estimatedCrypto} {buyCurrency}</b>
          </Typography>

          {/* ACTIONS */}
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleBuy}
            disabled={buying}
          >
            {buying ? 'Processing...' : 'Continue'}
          </Button>

          <Button
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => setOpenBuy(false)}
          >
            Cancel
          </Button>
        </Box>
      </Modal>

      {/* MAIN VIEW */}
      <Paper elevation={3} sx={{ p: 2 }}>
        {renderView()}
      </Paper>
    </Box>
  );
};

export default Wallet;
