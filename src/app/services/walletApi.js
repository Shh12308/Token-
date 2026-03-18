// src/app/services/walletApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://your-backend-url.com/api', // <-- your backend URL
  }),
  endpoints: (builder) => ({
    swapToken: builder.mutation({
      query: ({ fromToken, toToken, amount }) => ({
        url: '/swap',
        method: 'POST',
        body: { fromToken, toToken, amount },
      }),
    }),
    getBalances: builder.query({
      query: () => '/balances',
    }),
  }),
});

// Export hooks
export const { useSwapTokenMutation, useGetBalancesQuery } = walletApi;
