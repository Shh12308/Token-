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

    // --- STAKING ENDPOINTS ---

    // Fetch available staking/farming pools
    getStakingPools: builder.query({
      query: () => '/staking/pools',
      providesTags: ['StakingPool'], // Useful for cache invalidation
    }),

    // Fetch historical APR data for the chart
    getStakingHistory: builder.query({
      query: ({ poolId, days = 30 }) => `/staking/history?poolId=${poolId}&days=${days}`,
    }),

    // Stake tokens
    stakeTokens: builder.mutation({
      query: (body) => ({
        url: '/staking/stake',
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
  // Export new hooks
  useGetStakingPoolsQuery,
  useGetStakingHistoryQuery,
  useStakeTokensMutation,
} = walletApi;
