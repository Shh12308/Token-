import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import {
  faEyeSlash,
  faEye,
  faBell,
  faPaperPlane,
  faQrcode,
  faRightLeft
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';

// Chain UI mapping
const CHAIN_INFO = {
  1: { name: 'Ethereum', symbol: 'ETH', color: '#627eea', icon: '⟠' },
};

const Home = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  // ── CONNECT + LOAD ───────────────────────────────
  useEffect(() => {
    connectAndLoad();
  }, []);

  const connectAndLoad = async () => {
    try {
      if (!window.ethereum) {
        setError("Please install MetaMask");
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];

      setWalletAddress(address);

      await fetchBalance(provider, address);

    } catch (err) {
      console.error(err);
      setError("Wallet connection failed");
      setLoading(false);
    }
  };

  // ── FETCH ON-CHAIN DATA ───────────────────────────
  const fetchBalance = async (provider, address) => {
    try {
      setLoading(true);
      setError('');

      const allAssets = [];

      // ✅ ETH balance
      const ethBalanceRaw = await provider.getBalance(address);
      const ethBalance = parseFloat(ethers.formatEther(ethBalanceRaw));

      if (ethBalance > 0.0001) {
        allAssets.push({
          name: 'Ethereum',
          symbol: 'ETH',
          balance: ethBalance,
          value: ethBalance * 3000, // TODO: replace with real price API
          chainId: 1
        });
      }

      // ✅ stETH (Lido)
      try {
        const stethContract = new ethers.Contract(
          "0xae7ab96520de3a18e5e111bbeafaba64847cfb4f",
          ["function balanceOf(address) view returns (uint256)"],
          provider
        );

        const stethRaw = await stethContract.balanceOf(address);
        const stethBalance = parseFloat(ethers.formatEther(stethRaw));

        if (stethBalance > 0.0001) {
          allAssets.push({
            name: 'Lido Staked Ether',
            symbol: 'stETH',
            balance: stethBalance,
            value: stethBalance * 3000,
            chainId: 1
          });
        }
      } catch (err) {
        console.warn("stETH fetch failed");
      }

      setAssets(allAssets);

      const total = allAssets.reduce((sum, a) => sum + a.value, 0);
      setTotalBalance(total);

    } catch (err) {
      console.error(err);
      setError("Failed to fetch wallet data");
    } finally {
      setLoading(false);
    }
  };

  // ── MEMO ──────────────────────────────────────────
  const weightedChange = useMemo(() => {
    if (assets.length === 0) return 0;
    return 2.4;
  }, [assets]);

  // ── HELPERS ───────────────────────────────────────
  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatBalance = (balance) => {
    const num = Number(balance);
    if (!num) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const truncateAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  // ── LOADING ───────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-loading-gold">
        <div className="loader-gold"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container-gold">

      {/* HEADER */}
      <header className="top-header-gold">
        <div className="header-left">
          <img
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Logo"
            className="logo-gold"
          />
          <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
            {truncateAddress(walletAddress)}
          </span>
        </div>

        <div className="header-right">
          <div
            className="header-icon"
            onClick={() => navigate('/app/notifications')}
          >
            <FontAwesomeIcon icon={faBell} />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="main-scroll-area-gold">

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.4)',
            color: '#fca5a5',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* BALANCE */}
        <div className="balance-card-gold">
          <div className="balance-row-gold">
            <span>Total Balance</span>
            <button onClick={() => setIsBalanceHidden(!isBalanceHidden)}>
              <FontAwesomeIcon icon={isBalanceHidden ? faEyeSlash : faEye} />
            </button>
          </div>

          <div className="balance-amount-gold">
            {isBalanceHidden ? '••••••••' : `$${formatCurrency(totalBalance)}`}
          </div>

          <div className="balance-actions-gold">
            <span className="tag-gold">On-chain Wallet</span>
            <span style={{ color: '#4ade80' }}>
              +{weightedChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="quick-actions-gold">
          <button className="action-btn" onClick={() => navigate('/app/send')}>
            <FontAwesomeIcon icon={faPaperPlane} />
            <span>Send</span>
          </button>

          <button className="action-btn" onClick={() => navigate('/app/receive')}>
            <FontAwesomeIcon icon={faQrcode} />
            <span>Receive</span>
          </button>

          <button className="action-btn" onClick={() => navigate('/app/swap')}>
            <FontAwesomeIcon icon={faRightLeft} />
            <span>Swap</span>
          </button>
        </div>

        {/* ASSETS */}
        <div className="assets-section-gold">
          <h3>Assets</h3>

          {assets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              No assets found.
            </div>
          ) : (
            assets.map((asset, i) => {
              const chain = CHAIN_INFO[asset.chainId];

              return (
                <div key={`${asset.symbol}-${i}`} className="asset-item-gold">
                  <div className="asset-left">
                    <div className="asset-icon">
                      {asset.symbol?.charAt(0)}
                    </div>

                    <div>
                      <div className="asset-name">{asset.name}</div>
                      <div className="asset-balance">
                        {isBalanceHidden
                          ? '••••'
                          : `${formatBalance(asset.balance)} ${asset.symbol}`}
                      </div>
                    </div>
                  </div>

                  <div className="asset-right">
                    <div className="asset-value">
                      {isBalanceHidden
                        ? '••••'
                        : `$${formatCurrency(asset.value)}`}
                    </div>

                    <div style={{
                      fontSize: 10,
                      color: chain.color,
                      border: `1px solid ${chain.color}33`,
                      background: `${chain.color}15`,
                      padding: '2px 6px',
                      borderRadius: 4,
                      marginTop: 4,
                    }}>
                      {chain.name}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
