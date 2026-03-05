import { createSlice } from "@reduxjs/toolkit";

const initialState = { address: null, balance: 0, transactions: [] };

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setWallet: (state, action) => {
      Object.assign(state, action.payload);
    },
    addTransaction: (state, action) => {
      state.transactions.push(action.payload);
    },
  },
});

export const { setWallet, addTransaction } = walletSlice.actions;
export default walletSlice.reducer;
