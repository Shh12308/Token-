// src/store.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./context/UserSlice"; // example slice
import walletReducer from "./context/WalletSlice"; // example slice

export const store = configureStore({
  reducer: {
    user: userReducer,
    wallet: walletReducer,
  },
});

export default store;
