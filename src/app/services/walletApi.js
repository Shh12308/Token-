// src/app/services/walletApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'https://blockvault-backend-production.up.railway.app/api';

export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),

  endpoints: (builder) => ({
    getBalances: builder.query({
      query: () => '/balances',
    }),

    getUser: builder.query({
      query: () => '/user',
    }),

    createBuySession: builder.mutation({
      query: (body) => ({
        url: '/buy',
        method: 'POST',
        body,
      }),
    }),

    swapToken: builder.mutation({
      query: (body) => ({
        url: '/swap',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetBalancesQuery,
  useGetUserQuery,
  useCreateBuySessionMutation,
  useSwapTokenMutation,
} = walletApi;
