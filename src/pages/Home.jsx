import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { getSessionWallet } from '../utils/session';

import {
  Send,
  ArrowDown,
  Repeat,
  Plus,
  Copy
} from 'lucide-react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://blockvault-backend-production.up.railway.app/api';

const Home = () => {
  const [assets, setAssets] = useState([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState("0.00");

  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const wallet = getSessionWallet();
      if (!wallet) return;

      setAddress(wallet.address);

      const token = localStorage.getItem('authToken');

      const res = await axios.get(`${API_BASE}/wallet/portfolio`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const portfolio = res.data.portfolio?.ethereum?.assets || [];
      const total = res.data.totalBalance || "0.00";

      setAssets(portfolio);
      setTotalBalance(total);

    } catch (err) {
      console.error('Portfolio load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3>Wallet</h3>

          <p style={styles.address}>
            {address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : 'No wallet'}

            <Copy
              size={14}
              style={{ marginLeft: 6, cursor: 'pointer' }}
              onClick={copyAddress}
            />
          </p>
        </div>
      </div>

      {/* Balance */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={styles.balanceCard}>
          <p style={{ opacity: 0.6 }}>Total Balance</p>
          <h1>${totalBalance}</h1>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <Action icon={<Send size={18} />} label="Send" onClick={() => navigate('/send')} />
        <Action icon={<ArrowDown size={18} />} label="Receive" onClick={() => navigate('/receive')} />
        <Action icon={<Repeat size={18} />} label="Swap" onClick={() => navigate('/swap')} />
        <Action icon={<Plus size={18} />} label="Buy" onClick={() => navigate('/buy')} />
      </div>

      {/* Assets */}
      <div style={styles.assetList}>
        {assets.length === 0 ? (
          <p style={{ opacity: 0.5 }}>No assets found</p>
        ) : (
          assets.map((a, i) => (
            <div key={i} style={styles.assetItem}>
              <div>
                <strong>{a.symbol}</strong>
                <p style={styles.subText}>
                  {a.balance} {a.symbol}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <strong>${a.value}</strong>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

const Action = ({ icon, label, onClick }) => (
  <div
    style={styles.actionBtn}
    onClick={onClick}
  >
    {icon}
    <span style={styles.actionText}>{label}</span>
  </div>
);

const styles = {
  container: {
    maxWidth: 420,
    margin: '0 auto',
    padding: 20,
    fontFamily: 'sans-serif',
    background: '#0c0c0c',
    minHeight: '100vh',
    color: 'white'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  address: {
    fontSize: 12,
    opacity: 0.6,
    display: 'flex',
    alignItems: 'center'
  },
  balanceCard: {
    background: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  actionBtn: {
    background: '#1a1a1a',
    padding: 12,
    borderRadius: 10,
    width: 70,
    textAlign: 'center',
    cursor: 'pointer'
  },
  actionText: {
    fontSize: 11,
    marginTop: 4,
    display: 'block'
  },
  assetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  assetItem: {
    background: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'space-between'
  },
  subText: {
    margin: 0,
    fontSize: 12,
    opacity: 0.6
  }
};

export default Home;
