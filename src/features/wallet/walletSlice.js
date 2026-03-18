// src/features/wallet/walletSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  customNetworks: [], // store for user-added networks
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
    // NEW: add a custom network
    addCustomNetwork: (state, action) => {
      state.customNetworks.push(action.payload);
    },
    deleteCustomNetwork: (state, action) => {
      state.customNetworks = state.customNetworks.filter(
        (net) => net.chainId !== action.payload.chainId
      );
    },
  },
});

export const {
  setBalance,
  addTransaction,
  addCustomNetwork,
  deleteCustomNetwork,
} = walletSlice.actions;

export default walletSlice.reducer;
