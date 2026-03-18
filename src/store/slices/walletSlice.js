// src/store/slices/walletSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  wallets: [],
  activeWallet: null,
  balance: {},
  transactions: [],
  customNetworks: [],
  userProfile: {},
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // Wallets
    addWallet: (state, action) => {
      state.wallets.push(action.payload);
    },
    setActiveWallet: (state, action) => {
      state.activeWallet = action.payload;
    },

    // Balance
    setBalance: (state, action) => {
      state.balance = action.payload;
    },
    updateBalance: (state, action) => {
      state.balance = {
        ...state.balance,
        ...action.payload,
      };
    },

    // Transactions
    addTransaction: (state, action) => {
      state.transactions.push(action.payload);
    },

    // Networks
    addCustomNetwork: (state, action) => {
      state.customNetworks.push(action.payload);
    },
    deleteCustomNetwork: (state, action) => {
      state.customNetworks = state.customNetworks.filter(
        (net) => net.chainId !== action.payload.chainId
      );
    },

    // User
    updateUserProfile: (state, action) => {
      state.userProfile = {
        ...state.userProfile,
        ...action.payload,
      };
    },
  },
});

// ✅ EXPORT ACTIONS
export const {
  addWallet,
  setActiveWallet,
  setBalance,
  updateBalance, // <-- THIS FIXES YOUR ERROR
  addTransaction,
  addCustomNetwork,
  deleteCustomNetwork,
  updateUserProfile,
} = walletSlice.actions;

// ✅ EXPORT SELECTORS
export const selectAllWallets = (state) => state.wallet.wallets;
export const selectActiveWallet = (state) => state.wallet.activeWallet;
export const selectBalance = (state) => state.wallet.balance;
export const selectTransactions = (state) => state.wallet.transactions;
export const selectCustomNetworks = (state) => state.wallet.customNetworks;
export const selectUserProfile = (state) => state.wallet.userProfile;

export default walletSlice.reducer;
