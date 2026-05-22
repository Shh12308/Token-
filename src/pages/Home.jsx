import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

import {
  faEyeSlash,
  faEye,
  faBell,
  faPaperPlane,
  faQrcode,
  faRightLeft,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import BottomNav from '../components/BottomNav';

// ✅ WalletConnect modal
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'

const RPCS = {
  ethereum: "https://eth.llamarpc.com",
};

const CHAIN_INFO = {
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
  }
};

const Home = () => {
  const navigate = useNavigate();

  // ─────────────────────────────
  // WALLETCONNECT STATE
  // ─────────────────────────────
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [error, setError] = useState('');

  // ─────────────────────────────
  // INIT WALLET
  // ─────────────────────────────
  useEffect(() => {
    if (!isConnected) {
      setLoading(false)
      return
    }

    loadPortfolio(address)
  }, [address, isConnected])

  // ─────────────────────────────
  // LOAD PORTFOLIO
  // ─────────────────────────────
  const loadPortfolio = async (walletAddress) => {
    try {
      setLoading(true)
      setError('')

      const provider = new ethers.JsonRpcProvider(RPCS.ethereum)

      const assetsList = []

      // ETH balance
      const ethRaw = await provider.getBalance(walletAddress)
      const ethBalance = parseFloat(ethers.formatEther(ethRaw))

      if (ethBalance > 0.00001) {
        assetsList.push({
          name: 'Ethereum',
          symbol: 'ETH',
          balance: ethBalance,
          value: ethBalance * 3000,
          chain: 'ethereum'
        })
      }

      setAssets(assetsList)

      const total = assetsList.reduce((sum, a) => sum + a.value, 0)
      setTotalBalance(total)

    } catch (err) {
      console.error(err)
      setError("Failed to load portfolio.")
    } finally {
      setLoading(false)
    }
  }

  const weightedChange = useMemo(() => 2.4, [])

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const formatBalance = (balance) => {
    const num = Number(balance)
    if (!num) return '0'
    if (num < 0.0001) return '<0.0001'
    if (num < 1) return num.toFixed(4)
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }

  const truncateAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

  // ─────────────────────────────
  // LOADING
  // ─────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-loading-gold">
        <div className="loader-gold"></div>
      </div>
    )
  }

  // ─────────────────────────────
  // NOT CONNECTED STATE (IMPORTANT FIX)
  // ─────────────────────────────
  if (!isConnected) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <h2>Connect Wallet</h2>
          <p>Use MetaMask, WalletConnect, or any Web3 wallet</p>

          <button className="btn-primary" onClick={() => open()}>
            <FontAwesomeIcon icon={faWallet} /> Connect Wallet
          </button>

        </div>
      </div>
    )
  }

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div className="dashboard-container-gold">

      <header className="top-header-gold">
        <div className="header-left">
          <span style={{ fontSize: 12 }}>
            {truncateAddress(address)}
          </span>
        </div>

        <div className="header-right">
          <div onClick={() => navigate('/app/notifications')}>
            <FontAwesomeIcon icon={faBell} />
          </div>
        </div>
      </header>

      <main className="main-scroll-area-gold">

        {error && <div className="error-msg">{error}</div>}

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
            <span className="tag-gold">Self-Custody Wallet</span>
            <span style={{ color: '#4ade80' }}>
              +{weightedChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="quick-actions-gold">

          <button onClick={() => navigate('/app/send')}>
            <FontAwesomeIcon icon={faPaperPlane} />
            <span>Send</span>
          </button>

          <button onClick={() => navigate('/app/receive')}>
            <FontAwesomeIcon icon={faQrcode} />
            <span>Receive</span>
          </button>

          <button onClick={() => navigate('/app/swap')}>
            <FontAwesomeIcon icon={faRightLeft} />
            <span>Swap</span>
          </button>

        </div>

        {/* ASSETS */}
        <div className="assets-section-gold">
          <h3>Assets</h3>

          {assets.length === 0 ? (
            <div>No assets found.</div>
          ) : (
            assets.map((asset, i) => (
              <div key={i} className="asset-item-gold">

                <div className="asset-left">
                  <div className="asset-icon">
                    {asset.symbol}
                  </div>

                  <div>
                    <div className="asset-name">{asset.name}</div>
                    <div className="asset-balance">
                      {formatBalance(asset.balance)} {asset.symbol}
                    </div>
                  </div>
                </div>

                <div className="asset-right">
                  <div className="asset-value">
                    ${formatCurrency(asset.value)}
                  </div>
                </div>

              </div>
            ))
          )}

        </div>

      </main>

      <BottomNav />
    </div>
  )
}

export default Home
