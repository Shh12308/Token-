// src/store/slices/marketSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  prices: {},        // e.g., { ethereum: 1700, bitcoin: 26000 }
  trending: [],      // list of trending tokens
  topGainers: [],    // top gainers
  topLosers: [],     // top losers
  lastUpdated: null, // timestamp of last update
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setPrices: (state, action) => {
      state.prices = action.payload;
      state.lastUpdated = Date.now();
    },
    setTrending: (state, action) => {
      state.trending = action.payload;
    },
    setTopGainers: (state, action) => {
      state.topGainers = action.payload;
    },
    setTopLosers: (state, action) => {
      state.topLosers = action.payload;
    },
    resetMarket: (state) => {
      state.prices = {};
      state.trending = [];
      state.topGainers = [];
      state.topLosers = [];
      state.lastUpdated = null;
    },
  },
});

export const { setPrices, setTrending, setTopGainers, setTopLosers, resetMarket } =
  marketSlice.actions;

export default marketSlice.reducer;
