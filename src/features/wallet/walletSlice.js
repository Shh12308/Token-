// src/features/wallet/walletSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  wallets: [],
  activeWallet: null,
  balance: {},
  transactions: [],
  customNetworks: [],
  userProfile: {},  // <-- add this
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    addWallet: (state, action) => { state.wallets.push(action.payload); },
    setActiveWallet: (state, action) => { state.activeWallet = action.payload; },
    setBalance: (state, action) => { state.balance = action.payload; },
    addTransaction: (state, action) => { state.transactions.push(action.payload); },
    addCustomNetwork: (state, action) => { state.customNetworks.push(action.payload); },
    deleteCustomNetwork: (state, action) => {
      state.customNetworks = state.customNetworks.filter(
        (net) => net.chainId !== action.payload.chainId
      );
    },
    updateUserProfile: (state, action) => {
      state.userProfile = { ...state.userProfile, ...action.payload };
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
  updateUserProfile, // <-- needed by SettingsPage.jsx
} = walletSlice.actions;

// Export selectors
export const selectAllWallets = (state) => state.wallet.wallets;
export const selectActiveWallet = (state) => state.wallet.activeWallet;
export const selectCustomNetworks = (state) => state.wallet.customNetworks;
export const selectUserProfile = (state) => state.wallet.userProfile; // <-- needed

export default walletSlice.reducer;
