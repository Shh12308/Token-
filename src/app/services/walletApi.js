// src/app/services/walletApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://your-backend-url.com/api',
  }),

  endpoints: (builder) => ({
    // 💱 Swap tokens
    swapToken: builder.mutation({
      query: ({ fromToken, toToken, amount }) => ({
        url: '/swap',
        method: 'POST',
        body: { fromToken, toToken, amount },
      }),
    }),

    // 💰 Get balances
    getBalances: builder.query({
      query: () => '/balances',
    }),

    // 💳 BUY CRYPTO (NEW)
    createBuySession: builder.mutation({
      query: ({ amount, currency, walletAddress }) => ({
        url: '/buy',
        method: 'POST',
        body: { amount, currency, walletAddress },
      }),
    }),
  }),
});

// Export hooks
export const {
  useSwapTokenMutation,
  useGetBalancesQuery,
  useCreateBuySessionMutation,
} = walletApi;
