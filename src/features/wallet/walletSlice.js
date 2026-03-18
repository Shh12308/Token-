// src/features/wallet/walletSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  customNetworks: [],
  wallets: [], // <-- add a wallets array
  balance: {},
  transactions: [],
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setBalance: (state, action) => {
      state.balance = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions.push(action.payload);
    },
    addCustomNetwork: (state, action) => {
      state.customNetworks.push(action.payload);
    },
    deleteCustomNetwork: (state, action) => {
      state.customNetworks = state.customNetworks.filter(
        (net) => net.chainId !== action.payload.chainId
      );
    },
    // NEW: addWallet action
    addWallet: (state, action) => {
      state.wallets.push(action.payload);
    },
  },
});

export const {
  setBalance,
  addTransaction,
  addCustomNetwork,
  deleteCustomNetwork,
  addWallet, // <-- export it
} = walletSlice.actions;

export default walletSlice.reducer;
