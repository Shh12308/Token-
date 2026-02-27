import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const cryptoApiHeaders = {
  'X-CoinGecko-API-Key': import.meta.env.VITE_COINGECKO_API_KEY,
};

const createRequest = (url) => ({ url, headers: cryptoApiHeaders });

export const coingeckoApi = createApi({
  reducerPath: 'coingeckoApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.coingecko.com/api/v3/' }),
  endpoints: (builder) => ({
    // Get top 250 coins by market cap, a good starting list
    getMarkets: builder.query({
      query: () => createRequest('coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false'),
    }),
  }),
});

export const { useGetMarketsQuery } = coingeckoApi;
