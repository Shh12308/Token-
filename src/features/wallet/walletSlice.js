import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedNetwork: 'ethereum', // Default network
  balances: {
    ethereum: { 'ETH': 1.5, 'USDC': 1000, 'SHIB': 1000000 },
    polygon: { 'MATIC': 5000, 'USDC': 500 },
    bsc: { 'BNB': 2.0, 'BUSD': 800 },
  },
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setSelectedNetwork: (state, action) => {
      state.selectedNetwork = action.payload;
    },
    // In a real app, you'd have more complex reducers for updating balances
  },
});

export const { setSelectedNetwork } = walletSlice.actions;
export default walletSlice.reducer;
