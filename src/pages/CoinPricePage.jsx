import React, { useState } from 'react';
import { useGetMarketsQuery } from '../store/services/coingeckoApi';

const CoinPricePage = () => {
  const { data, isLoading, error } = useGetMarketsQuery();
  const [search, setSearch] = useState('');

  // IMPORTANT: prevent crash (t.map error)
  const coins = Array.isArray(data) ? data : [];

  const filteredCoins = coins.filter((coin) =>
    coin.name.toLowerCase().includes(search.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div style={{ padding: 20 }}>Loading markets...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', padding: 20 }}>Failed to load data</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Crypto Prices</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search coin..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: 10,
          marginBottom: 20,
          width: '100%',
          maxWidth: 400,
        }}
      />

      {/* TABLE */}
      <div style={{ overflowX: 'auto' }}>
        <table width="100%" cellPadding="10">
          <thead>
            <tr>
              <th>#</th>
              <th>Coin</th>
              <th>Price</th>
              <th>24h %</th>
              <th>Market Cap</th>
            </tr>
          </thead>

          <tbody>
            {filteredCoins.map((coin, index) => (
              <tr key={coin.id}>
                <td>{index + 1}</td>

                <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={coin.image} alt={coin.name} width="24" />
                  <span>{coin.name} ({coin.symbol.toUpperCase()})</span>
                </td>

                <td>${coin.current_price?.toLocaleString()}</td>

                <td
                  style={{
                    color: coin.price_change_percentage_24h >= 0 ? 'green' : 'red',
                  }}
                >
                  {coin.price_change_percentage_24h?.toFixed(2)}%
                </td>

                <td>${coin.market_cap?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoinPricePage;
