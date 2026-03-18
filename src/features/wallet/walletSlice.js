// src/features/wallet/walletSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  wallets: [],
  activeWallet: null,
  balance: {},
  transactions: [],
  customNetworks: [],
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    addWallet: (state, action) => {
      state.wallets.push(action.payload);
    },
    setActiveWallet: (state, action) => {
      state.activeWallet = action.payload;
    },
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
  },
});

// Export actions
export const {
  addWallet,
  setActiveWallet,
  setBalance,
  addTransaction,
  addCustomNetwork,
  deleteCustomNetwork,
} = walletSlice.actions;

// Selectors
export const selectAllWallets = (state) => state.wallet.wallets;
export const selectActiveWallet = (state) => state.wallet.activeWallet;

export default walletSlice.reducer;
