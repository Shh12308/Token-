import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ FETCH MARKET DATA
export const fetchMarketData = createAsyncThunk(
  "market/fetchMarketData",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets",
        {
          params: {
            vs_currency: "usd",
            order: "market_cap_desc",
            per_page: 10,
            page: 1,
          },
        }
      );

      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ SLICE
const marketSlice = createSlice({
  name: "market",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default marketSlice.reducer;
