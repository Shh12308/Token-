import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { faArrowLeft, faArrowUp, faArrowDown, faRepeat, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import BottomNav from '../components/BottomNav';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

// ── Token Metadata Config ──────────────────────────────────
const TOKEN_CONFIG = {
  eth:   { name: 'Ethereum',  icon: 'fa-brands fa-ethereum',          coingeckoId: 'ethereum',  address: '', decimals: 18 },
  usdc:  { name: 'USD Coin',  icon: 'fa-solid fa-circle-dollar-to-slot', coingeckoId: 'usd-coin',  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  matic: { name: 'Polygon',   icon: 'fa-solid fa-gem',                 coingeckoId: 'polygon-pos', address: '', decimals: 18 },
  bnb:   { name: 'BNB',       icon: 'fa-solid fa-coins',               coingeckoId: 'binancecoin', address: '', decimals: 18 },
  avax:  { name: 'Avalanche', icon: 'fa-solid fa-mountain',            coingeckoId: 'avalanche-2', address: '', decimals: 18 },
};

const AssetPage = () => {
  const navigate = useNavigate();
  const { symbol } = useParams();

  // ✅ Guard early
  if (!symbol) {
    return <div style={{ color: '#fff', padding: 20 }}>Invalid asset</div>;
  }

  const normalizedSymbol = symbol.toLowerCase();

  const tokenConfig =
    TOKEN_CONFIG[normalizedSymbol] || {
      name: normalizedSymbol.toUpperCase(),
      icon: 'fa-solid fa-coins',
      coingeckoId: normalizedSymbol,
      decimals: 18,
    };

  // ── State ──────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [value, setValue] = useState(0);
  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [chartDays, setChartDays] = useState(7);
  const [transactions, setTransactions] = useState([]);

  // ── Fetch Data ─────────────────────────────────────────
  useEffect(() => {
    fetchAssetData();
  }, [normalizedSymbol, chartDays]);

  const fetchAssetData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      // 1. Get Balance & Price
      const balRes = await axios.get(`${API_BASE}/balances`, {
  headers: { Authorization: `Bearer ${token}` },
});

      const assetInfo = (balRes.data.assets || []).find(
        a => a.symbol?.toLowerCase() === normalizedSymbol
      );

      if (assetInfo) {
        setBalance(assetInfo.balance || 0);
        setValue(assetInfo.value || 0);
        setPrice(assetInfo.price || 0);
        setChange(assetInfo.change || 0);
      }

      // 2. Get Chart Data
      const chartRes = await axios.get(${API_BASE}/market/chart, {
        params: { symbol: tokenConfig.coingeckoId, days: chartDays },
      });

      if (chartRes.data?.data?.prices) {
        const formatted = chartRes.data.data.prices.map(([timestamp, price]) => ({
          date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price,
        }));
        setChartData(formatted);
      } else {
        setChartData([]);
      }

      // 3. Get Transactions
      const txRes = await axios.get(${API_BASE}/transactions, {
        headers: { Authorization: Bearer ${token} },
        params: { limit: 10 },
      });

      const assetTxs = (txRes.data.transactions || []).filter(
        tx => tx.asset?.toLowerCase() === normalizedSymbol
      );

      setTransactions(assetTxs);

    } catch (err) {
      console.error('Asset page error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────
  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const isPositive = Number(change) >= 0;

  return (
    <div className="dashboard-container-gold">
      {/* Header /}
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
        <div className="header-title">
          <i className={tokenConfig.icon} style={{ marginRight: 8 }}></i>
          {tokenConfig.name}
        </div>
        <div style={{ width: 60 }}></div>
      </header>

      <main className="main-scroll-area-gold" style={{ padding: '20px' }}>

        {/ Price /}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
            ${formatCurrency(price)}
          </div>
          <div style={{
            color: isPositive ? '#4ade80' : '#f87171',
            fontSize: 16,
            marginTop: 4,
          }}>
            {isPositive ? '+' : ''}{Number(change).toFixed(2)}%
            <span style={{ color: '#888', fontSize: 12 }}> (24h)</span>
          </div>
        </div>

        {/ Chart /}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setChartDays(d)}
                style={{
                  background: chartDays === d ? 'rgba(201, 168, 76, 0.2)' : 'transparent',
                  border: chartDays === d ? '1px solid #c9a84c' : '1px solid transparent',
                  color: chartDays === d ? '#c9a84c' : '#888',
                  borderRadius: 8,
                  padding: '4px 12px',
                  cursor: 'pointer',
                }}
              >
                {d}D
              </button>
            ))}
          </div>

          <div style={{ height: 200 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    formatter={(val) => [$${formatCurrency(val)}, 'Price']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#c9a84c" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#888', paddingTop: 80 }}>
                Loading chart...
              </div>
            )}
          </div>
        </div>

        {/ Balance /}
        <div className="balance-card-gold" style={{ marginBottom: 24 }}>
          <div style={{ color: '#888' }}>Your Balance</div>
          <div style={{ fontSize: 28, color: '#fff' }}>
            {Number(balance).toFixed(4)} {normalizedSymbol.toUpperCase()}
          </div>
          <div style={{ color: '#c9a84c' }}>
            ≈ ${formatCurrency(value)}
          </div>
        </div>

        {/ Actions /}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <button onClick={() => navigate(/app/send?asset=${normalizedSymbol.toUpperCase()})}>Send</button>
          <button onClick={() => navigate('/app/receive')}>Receive</button>
          <button onClick={() => navigate(/app/swap?from=${normalizedSymbol.toUpperCase()})}>Swap</button>
          <button onClick={() => navigate(/app/buy?currency=${normalizedSymbol.toUpperCase()})}>Buy</button>
        </div>

        {/ Transactions */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ color: '#fff' }}>Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div style={{ color: '#666' }}>
              No transactions found for {normalizedSymbol.toUpperCase()}
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id}>
                {tx.type} - {tx.amount} {tx.asset}
              </div>
            ))
          )}
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default AssetPage;
