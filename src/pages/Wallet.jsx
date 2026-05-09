import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Modal,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
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
  const [fiatAmount, setFiatAmount] = useState(''); // User types in USD
  const [cryptoCurrency, setCryptoCurrency] = useState('ETH'); // User wants to buy ETH
  const [provider, setProvider] = useState('moonpay'); // Default provider

  // 🔌 REAL BACKEND CONNECTIONS
  const { data: balances, isLoading, error } = useGetBalancesQuery();
  const { data: user } = useGetUserQuery();
  const [createBuySession, { isLoading: buying }] =
    useCreateBuySessionMutation();

  const walletAddress = user?.walletAddress;

  // --- CALCULATOR LOGIC (Like MetaMask) ---
  // backend sends rates: { ETH: 2800, BTC: 45000 }
  // We calculate: FiatInput / Rate = CryptoOutput
  const rates = balances?.rates || {};
  const currentRate = rates[cryptoCurrency] || 1;
  
  // Calculate estimated crypto amount
  const estimatedCrypto = fiatAmount 
    ? (parseFloat(fiatAmount) / currentRate).toFixed(6) 
    : '0.000000';

  const handleBuy = async () => {
    if (!fiatAmount || Number(fiatAmount) < 20) {
      alert('Minimum buy is $20');
      return;
    }

    if (!walletAddress) {
      alert('Wallet not connected');
      return;
    }

    try {
      const res = await createBuySession({
        amount: Number(fiatAmount),
        currency: cryptoCurrency,
        walletAddress,
        provider, // Pass selected provider to backend
      }).unwrap();

      // Redirect to provider (Non-custodial: Funds go directly to walletAddress)
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
      <Typography variant="h4" mb={2}>CryptoBean Wallet</Typography>

      {/* BALANCES */}
      <Paper sx={{ p: 2, mb: 2 }}>
        {isLoading && <p>Loading balances...</p>}
        {error && <p style={{ color: 'red' }}>API Error</p>}

        {!isLoading && !error && (
          <div>
            <p>ETH: {balances?.eth ?? 0}</p>
            <p>USDC: {balances?.usdc ?? 0}</p>
          </div>
        )}

        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => setOpenBuy(true)}
          fullWidth
        >
          Buy Crypto
        </Button>
      </Paper>

      {/* BUY MODAL */}
      <Modal open={openBuy} onClose={() => setOpenBuy(false)}>
        <Box
          sx={{
            p: 3,
            backgroundColor: '#1e1e1e', // Dark mode theme
            color: '#fff',
            width: 400,
            margin: '100px auto',
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Buy Crypto
          </Typography>
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            Non-custodial: Funds are sent directly to your wallet ({walletAddress?.slice(0,6)}...{walletAddress?.slice(-4)}).
          </Typography>

          {/* 1. Provider Selector */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="provider-label" sx={{ color: '#aaa' }}>Payment Provider</InputLabel>
            <Select
              labelId="provider-label"
              value={provider}
              label="Payment Provider"
              onChange={(e) => setProvider(e.target.value)}
              sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}
            >
              <MenuItem value="moonpay">MoonPay</MenuItem>
              <MenuItem value="transak">Transak</MenuItem>
              <MenuItem value="wyre">Wyre</MenuItem>
            </Select>
          </FormControl>

          {/* 2. Fiat Amount Input */}
          <TextField
            fullWidth
            label="Amount (USD)"
            type="number"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            sx={{ 
              mb: 2,
              inputProps: { style: { color: '#fff' } },
              '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#555' } }
            }}
            InputLabelProps={{ style: { color: '#aaa' } }}
          />

          {/* 3. Crypto Selector */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="crypto-label" sx={{ color: '#aaa' }}>Crypto Currency</InputLabel>
            <Select
              labelId="crypto-label"
              value={cryptoCurrency}
              label="Crypto Currency"
              onChange={(e) => setCryptoCurrency(e.target.value)}
              sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}
            >
              <MenuItem value="ETH">ETH (Ethereum)</MenuItem>
              <MenuItem value="BTC">BTC (Bitcoin)</MenuItem>
              <MenuItem value="USDC">USDC (USD Coin)</MenuItem>
            </Select>
          </FormControl>

          {/* 4. Live Calculator Display */}
          <Box sx={{ 
            p: 2, 
            border: '1px solid #333', 
            borderRadius: 1, 
            mb: 3, 
            textAlign: 'center',
            backgroundColor: '#252525'
          }}>
            <Typography variant="body2" color="text.secondary">
              You receive
            </Typography>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
              {estimatedCrypto} {cryptoCurrency}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rate: 1 {cryptoCurrency} ≈ ${currentRate} USD
            </Typography>
          </Box>

          {/* 5. Action Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleBuy}
            disabled={buying || !fiatAmount}
            sx={{ py: 1.5 }}
          >
            {buying ? <CircularProgress size={24} color="inherit" /> : `Buy ${cryptoCurrency}`}
          </Button>

          <Button 
            fullWidth 
            sx={{ mt: 1, color: '#aaa' }} 
            onClick={() => setOpenBuy(false)}
          >
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
