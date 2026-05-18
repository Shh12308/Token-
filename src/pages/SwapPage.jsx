import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { faArrowLeft, faRepeat, faChevronDown, faInfoCircle, faExchangeAlt, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';
import { getSessionWallet } from '../utils/session'; // Import session manager

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

// Supported Chains for Swap
const CHAINS = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', color: '#8247e5' },
  { id: 56, name: 'BSC', symbol: 'BNB', color: '#f3ba2f' },
];

const SwapPage = () => {
  const navigate = useNavigate();
  
  // ── State ───────────────────────────────────────────
  const [chainId, setChainId] = useState(1); // Default Ethereum
  const [fromToken, setFromToken] = useState({ symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' });
  const [toToken, setToToken] = useState({ symbol: 'USDC', address: '' }); // Address filled by backend
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('0.0');
  const [tokenList, setTokenList] = useState([]);

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false); // ERC20 Approval State
  const [error, setError] = useState('');

  // ── Fetch Token List on Chain Change ───────────────────
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tokens/list`, { params: { chainId } });
        const tokens = res.data.tokens || [];
        
        // Add Native Token to the list manually
        const chainInfo = CHAINS.find(c => c.id === chainId);
        const nativeToken = { symbol: chainInfo?.symbol || 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 };
        
        setTokenList([nativeToken, ...tokens]);
        
        // Set Defaults
        setFromToken(nativeToken);
        if (tokens.length > 0) setToToken(tokens[0]);
        else setToToken(nativeToken); 
        
        setFromAmount('');
        setToAmount('0.0');
      } catch (e) {
        console.error("Failed to fetch tokens", e);
      }
    };
    fetchTokens();
  }, [chainId]);

  // ── Debounced Quote Fetcher ────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        fetchQuote();
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, chainId]);

  const fetchQuote = async () => {
    if (!fromToken.address || !toToken.address) return;
    
    setLoadingQuote(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/swap/quote`, {
        params: {
          chainId,
          from: fromToken.address,
          to: toToken.address,
          amount: ethers.parseUnits(fromAmount, fromToken.decimals || 18).toString()
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      setToAmount(ethers.formatUnits(res.data.toAmount, toToken.decimals || 18));
      // Simple check: If selling token is not Native, we probably need approval
      setNeedsApproval(fromToken.address !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
    } catch (e) {
      console.error('Quote Error:', e);
      setError('Could not fetch rate');
      setToAmount('0.0');
    } finally {
      setLoadingQuote(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────
  
  const handleApprove = async () => {
    setError('');
    setLoadingTx(true);
    try {
      const wallet = getSessionWallet();
      if (!wallet) return navigate('/login');

      // 1. Get Approval TX from Backend
      const { data } = await axios.get(`${API_BASE}/swap/approve`, {
        params: { chainId, tokenAddress: fromToken.address },
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      // 2. Sign Locally
      const signedTx = await wallet.signTransaction(data.approveTransaction);
      
      // 3. Broadcast
      await axios.post(`${API_BASE}/tx/broadcast`, {
        signedTransaction: signedTx,
        chainId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      alert('Approval sent! Please wait a moment before swapping.');
      setNeedsApproval(false); // Optimistic update
      
    } catch (e) {
      console.error(e);
      setError('Approval failed.');
    } finally {
      setLoadingTx(false);
    }
  };

  const handleSwap = async () => {
    setError('');
    setLoadingTx(true);
    try {
      const wallet = getSessionWallet();
      if (!wallet) return navigate('/login');

      // 1. Build Swap TX
      const { data } = await axios.post(`${API_BASE}/swap/build`, {
        chainId,
        from: fromToken.address,
        to: toToken.address,
        amount: ethers.parseUnits(fromAmount, fromToken.decimals || 18).toString(),
        fromAddress: wallet.address,
        slippage: 0.5
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      // 2. Sign Locally
      // Note: 1inch returns a partially filled TX object
      const txRequest = {
          to: data.tx.to,
          data: data.tx.data,
          value: data.tx.value,
          gasLimit: data.tx.gas,
          // Ethers v6 needs some gasPrice data usually, simplified here
      };
      
      const signedTx = await wallet.signTransaction(txRequest);

      // 3. Broadcast
      const broadcastRes = await axios.post(`${API_BASE}/tx/broadcast`, {
        signedTransaction: signedTx,
        chainId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      alert(`Swap Submitted! TxHash: ${broadcastRes.data.txHash}`);
      navigate('/app');

    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Swap failed.');
    } finally {
      setLoadingTx(false);
    }
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    // Recalculate quote? useEffect handles it via fromAmount change
  };

  const selectChain = (id) => {
    setChainId(id);
    const chain = CHAINS.find(c => c.id === id);
    // Reset token selection when chain changes
    setFromToken({ symbol: chain.symbol, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' });
    setToToken({ symbol: '...', address: '' });
  };

  // ── UI ────────────────────────────────────────────────
  const activeChain = CHAINS.find(c => c.id === chainId);

  return (
    <div className="dashboard-container-gold">
      <header className="top-header-gold">
        <div className="header-left" onClick={() => navigate('/app')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </div>
        <div className="header-right">
          <div style={{ display: 'flex', gap: '8px' }}>
            {CHAINS.map(c => (
              <button 
                key={c.id}
                className={`network-pill-gold ${chainId === c.id ? 'active' : ''}`}
                onClick={() => selectChain(c.id)}
                style={{ 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  border: chainId === c.id ? `1px solid ${c.color}` : '1px solid #444',
                  background: chainId === c.id ? `${c.color}22` : 'transparent',
                  color: chainId === c.id ? c.color : '#888',
                  fontSize: '12px'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="main-scroll-area-gold" style={{ justifyContent: 'center' }}>
        <div className="card swap-card-gold">
          <div className="swap-header-gold">
            <span>Swap Tokens</span>
            <FontAwesomeIcon icon={faInfoCircle} className="text-muted" />
          </div>

          {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

          {/* From Input */}
          <div className="swap-input-group-gold">
            <div className="input-label-gold">
              <span>You Pay</span>
              <div className="select-badge-gold" onClick={() => alert('Open Token Modal')}>
                {fromToken.symbol} <FontAwesomeIcon icon={faChevronDown} style={{fontSize: '10px', marginLeft:'5px'}}/>
              </div>
            </div>
            <input 
              type="number" 
              className="input-gold" 
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />
          </div>

          {/* Icon Swap */}
          <div className="swap-arrow-gold" onClick={switchTokens} style={{ cursor: 'pointer' }}>
             <FontAwesomeIcon icon={faExchangeAlt} />
          </div>

          {/* To Input */}
          <div className="swap-input-group-gold">
            <div className="input-label-gold">
              <span>You Receive</span>
              <div className="select-badge-gold" onClick={() => alert('Open Token Modal')}>
                {toToken.symbol} <FontAwesomeIcon icon={faChevronDown} style={{fontSize: '10px', marginLeft:'5px'}}/>
              </div>
            </div>
            <input 
              type="number" 
              className="input-gold" 
              placeholder="0.0"
              value={toAmount}
              readOnly
            />
            {loadingQuote && <FontAwesomeIcon icon={faSpinner} spin style={{ position: 'absolute', right: 16, bottom: 16, color: '#888' }} />}
          </div>

          {/* Actions */}
          <div style={{ marginTop: 24 }}>
            {/* Conditional Button Logic */}
            {needsApproval ? (
              <button 
                className="btn-primary" 
                onClick={handleApprove} 
                disabled={loadingTx}
                style={{ background: '#333', border: '1px solid #444' }}
              >
                {loadingTx ? 'Approving...' : `1. Approve ${fromToken.symbol}`}
              </button>
            ) : (
              <button 
                className="btn-primary btn-swap-gold" 
                onClick={handleSwap} 
                disabled={loadingTx || loadingQuote || !fromAmount}
              >
                {loadingTx ? 'Signing...' : 'Swap'}
              </button>
            )}
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default SwapPage;
