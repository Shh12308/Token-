import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import { faArrowLeft, faChevronDown, faInfoCircle, faExchangeAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BottomNav from '../components/BottomNav';
import { getSessionWallet } from '../utils/session'; 

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

const CHAINS = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', color: '#8247e5' },
  { id: 56, name: 'BSC', symbol: 'BNB', color: '#f3ba2f' },
];

const SwapPage = () => {
  const navigate = useNavigate();
  
  // ── State ───────────────────────────────────────────
  const [chainId, setChainId] = useState(1);
  const [fromToken, setFromToken] = useState({ symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 });
  const [toToken, setToToken] = useState({ symbol: 'USDC', address: '', decimals: 6 });
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('0.0');
  const [tokenList, setTokenList] = useState([]);

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch Token List ───────────────────────────────────
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tokens/list`, { params: { chainId } });
        const tokens = res.data.tokens || [];
        
        const chainInfo = CHAINS.find(c => c.id === chainId);
        const nativeToken = { symbol: chainInfo?.symbol || 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 };
        
        setTokenList([nativeToken, ...tokens]);
        
        setFromToken(nativeToken);
        if (tokens.length > 0) setToToken(tokens[0]);
        else setToToken(nativeToken); 
        
        setFromAmount('');
        setToAmount('0.0');
        setError('');
      } catch (e) {
        console.error("Failed to fetch tokens", e);
      }
    };
    fetchTokens();
  }, [chainId]);

  // ── Debounced Quote Fetcher ────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only fetch if we have valid addresses and amount
      if (fromAmount && parseFloat(fromAmount) > 0 && fromToken.address && toToken.address) {
        fetchQuote();
      }
    }, 500);
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
      setNeedsApproval(fromToken.address !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
    } catch (e) {
      console.error('Quote Error:', e);
      
      // FIX: Show the actual error message from Backend/1inch
      const errorData = e.response?.data;
      const errorMsg = errorData?.error || errorData?.message || 'Could not fetch rate';
      
      setError(`Error: ${errorMsg}`);
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

      // 1. Fetch Approval Data & Nonce/Gas Data in parallel
      const [approveRes, prepRes] = await Promise.all([
          axios.get(`${API_BASE}/swap/approve`, {
            params: { chainId, tokenAddress: fromToken.address },
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          }),
          // Use a dummy call to get fresh nonce and gas prices
          axios.post(`${API_BASE}/tx/build`, {
            fromAddress: wallet.address,
            toAddress: wallet.address, 
            amount: "0",
            chainId: chainId
          }, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
      ]);

      const unsignedBase = prepRes.data.unsignedTransaction;

      // 2. Construct Full Transaction
      const approvalTx = {
          to: approveRes.data.approveTransaction.to,
          data: approveRes.data.approveTransaction.data,
          value: approveRes.data.approveTransaction.value,
          from: wallet.address,
          nonce: unsignedBase.nonce, 
          chainId: chainId,
          type: 2,
          maxFeePerGas: unsignedBase.maxFeePerGas,
          maxPriorityFeePerGas: unsignedBase.maxPriorityFeePerGas,
          gasLimit: 60000 
      };

      // 3. Sign Locally
      const signedTx = await wallet.signTransaction(approvalTx);
      
      // 4. Broadcast
      await axios.post(`${API_BASE}/tx/broadcast`, {
        signedTransaction: signedTx,
        chainId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      alert('Approval sent! Please wait a moment before swapping.');
      setNeedsApproval(false);
      
    } catch (e) {
      console.error(e);
      setError('Approval failed: ' + (e.response?.data?.message || e.message));
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

      // 2. Get fresh nonce/gas from backend helper
      const prepRes = await axios.post(`${API_BASE}/tx/build`, {
          fromAddress: wallet.address,
          toAddress: data.tx.to, 
          amount: "0", 
          chainId: chainId
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });

      // 3. Construct Full Transaction
      const txRequest = {
          to: data.tx.to,
          data: data.tx.data,
          value: data.tx.value,
          from: wallet.address,
          nonce: prepRes.data.unsignedTransaction.nonce,
          chainId: chainId,
          type: 2,
          maxFeePerGas: prepRes.data.unsignedTransaction.maxFeePerGas,
          maxPriorityFeePerGas: prepRes.data.unsignedTransaction.maxPriorityFeePerGas,
          gasLimit: data.tx.gas || 150000
      };
      
      // 4. Sign & Broadcast
      const signedTx = await wallet.signTransaction(txRequest);
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
      setError(e.response?.data?.message || e.message || 'Swap failed.');
    } finally {
      setLoadingTx(false);
    }
  };

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
  };

  const selectChain = (id) => {
    setChainId(id);
    const chain = CHAINS.find(c => c.id === id);
    setFromToken({ symbol: chain.symbol, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' });
    setToToken({ symbol: '...', address: '' });
    setNeedsApproval(false);
  };

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
                  fontSize: '12px',
                  cursor: 'pointer'
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

          {error && <div className="error-msg" style={{ marginBottom: 12, color: 'red', fontSize: 14 }}>{error}</div>}

          {/* From Input */}
          <div className="swap-input-group-gold">
            <div className="input-label-gold">
              <span>You Pay</span>
              <div className="select-badge-gold" style={{ cursor: 'pointer' }}>
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
              <div className="select-badge-gold" style={{ cursor: 'pointer' }}>
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
