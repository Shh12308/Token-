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
  const { symbol } = useParams(); // gets 'usdc' from /app/asset/usdc
  const tokenConfig = TOKEN_CONFIG[symbol] || { name: symbol.toUpperCase(), icon: 'fa-solid fa-coins', coingeckoId: symbol };

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
    if (symbol) fetchAssetData();
  }, [symbol, chartDays]);

  const fetchAssetData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    try {
      // 1. Get Balance & Price
      const balRes = await axios.get(`${API_BASE}/balances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const assetInfo = balRes.data.assets.find(
        a => a.symbol.toLowerCase() === symbol.toLowerCase()
      );

      if (assetInfo) {
        setBalance(assetInfo.balance);
        setValue(assetInfo.value);
        setPrice(assetInfo.price);
        setChange(assetInfo.change);
      }

      // 2. Get Chart Data
      const chartRes = await axios.get(`${API_BASE}/market/chart`, {
        params: { symbol: tokenConfig.coingeckoId, days: chartDays },
      });
      
      if (chartRes.data?.data?.prices) {
        const formatted = chartRes.data.data.prices.map(([timestamp, price]) => ({
          date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price,
        }));
        setChartData(formatted);
      }

      // 3. Get Transactions for this asset
      const txRes = await axios.get(`${API_BASE}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10 },
      });
      const assetTxs = (txRes.data.transactions || []).filter(
        tx => tx.asset?.toLowerCase() === symbol.toLowerCase()
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
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const isPositive = change >= 0;

  return (
    <div className="dashboard-container-gold">
      {/* ── Header ─────────────────────────────────────── */}
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
        
        {/* ── Price & Change ────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
            ${formatCurrency(price)}
          </div>
          <div style={{
            color: isPositive ? '#4ade80' : '#f87171',
            fontSize: 16,
            marginTop: 4,
          }}>
            {isPositive ? '+' : ''}{change.toFixed(2)}% <span style={{ color: '#888', fontSize: 12 }}>(24h)</span>
          </div>
        </div>

        {/* ── Chart ─────────────────────────────────────── */}
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
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c9a84c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#888' }}
                    itemStyle={{ color: '#c9a84c', fontWeight: 700 }}
                    formatter={(val) => [`$${formatCurrency(val)}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#c9a84c" fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#888', paddingTop: 80 }}>Loading chart...</div>
            )}
          </div>
        </div>

        {/* ── Balance Card ──────────────────────────────── */}
        <div className="balance-card-gold" style={{ marginBottom: 24 }}>
          <div style={{ color: '#888', fontSize: 14 }}>Your Balance</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginTop: 4 }}>
            {balance.toFixed(4)} <span style={{ textTransform: 'uppercase' }}>{symbol}</span>
          </div>
          <div style={{ color: '#c9a84c', fontSize: 16, marginTop: 4 }}>
            ≈ ${formatCurrency(value)}
          </div>
        </div>

        {/* ── Action Buttons ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { icon: faArrowUp, label: 'Send', color: '#f87171', action: () => navigate(`/app/send?asset=${symbol.toUpperCase()}`) },
            { icon: faArrowDown, label: 'Receive', color: '#4ade80', action: () => navigate('/app/receive') },
            { icon: faRepeat, label: 'Swap', color: '#60a5fa', action: () => navigate(`/app/swap?from=${symbol.toUpperCase()}`) },
            { icon: faCartShopping, label: 'Buy', color: '#c9a84c', action: () => navigate(`/app/buy?currency=${symbol.toUpperCase()}`) },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 12,
                padding: '16px 8px', cursor: 'pointer', color: '#fff',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: `${btn.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FontAwesomeIcon icon={btn.icon} color={btn.color} />
              </div>
              <span style={{ fontSize: 12, color: '#ccc' }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* ── Token Info ────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ color: '#fff', marginBottom: 12 }}>Token Info</h3>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#888' }}>Network</span>
              <span style={{ color: '#fff' }}>Ethereum</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#888' }}>Decimals</span>
              <span style={{ color: '#fff' }}>{tokenConfig.decimals}</span>
            </div>
            {tokenConfig.address && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Contract</span>
                <span style={{ color: '#c9a84c', fontSize: 12 }}>
                  {tokenConfig.address.slice(0, 6)}...{tokenConfig.address.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Transactions ───────────────────────── */}
        <div>
          <h3 style={{ color: '#fff', marginBottom: 12 }}>Recent Transactions</h3>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: 24 }}>
              No transactions found for {symbol.toUpperCase()}
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FontAwesomeIcon 
                    icon={tx.type === 'send' ? faArrowUp : faArrowDown} 
                    color={tx.type === 'send' ? '#f87171' : '#4ade80'} 
                  />
                  <div>
                    <div style={{ textTransform: 'capitalize', color: '#fff' }}>{tx.type}</div>
                    <div style={{ color: '#888', fontSize: 12 }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: tx.type === 'send' ? '#f87171' : '#4ade80' }}>
                    {tx.type === 'send' ? '-' : '+'}{parseFloat(tx.amount).toFixed(4)} {tx.asset}
                  </div>
                  <div style={{ color: '#888', fontSize: 12, textTransform: 'capitalize' }}>{tx.status}</div>
                </div>
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
