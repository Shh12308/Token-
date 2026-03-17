// src/store/slices/walletSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  balance: {},
  transactions: [],
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setBalance: (state, action) => { state.balance = action.payload; },
    addTransaction: (state, action) => { state.transactions.push(action.payload); },
  },
});

export const { setBalance, addTransaction } = walletSlice.actions;
export default walletSlice.reducer;
