import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const createRequest = (url) => ({ url });

export const coingeckoApi = createApi({
  reducerPath: 'coingeckoApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.coingecko.com/api/v3/',
  }),

  endpoints: (builder) => ({
    getMarkets: builder.query({
      query: () =>
        createRequest(
          'coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false'
        ),
    }),
  }),
});

export const { useGetMarketsQuery } = coingeckoApi;
