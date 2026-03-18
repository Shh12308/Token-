// src/components/wallet/SwapView.jsx
import React, { useState, useEffect } from 'react';
import { useSwapTokenMutation } from '../../app/services/walletApi';
import { useGetMarketsQuery } from '../../app/services/coingeckoApi';
import TokenSelectModal from '../common/TokenSelectModal';

const SwapView = ({ balances }) => {
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [isFromModalOpen, setIsFromModalOpen] = useState(false);
  const [isToModalOpen, setIsToModalOpen] = useState(false);

  // RTK Query mutation
  const [swap, { isLoading, error, data }] = useSwapTokenMutation();

  // Get available tokens from market API
  const { data: tokens } = useGetMarketsQuery();

  // Set default tokens on initial load
  useEffect(() => {
    if (tokens && tokens.length > 0 && !fromToken) {
      setFromToken(tokens.find(t => t.symbol === 'ETH') || tokens[0]);
      setToToken(tokens.find(t => t.symbol === 'USDC') || tokens[1]);
    }
  }, [tokens, fromToken]);

  const handleSwap = async (e) => {
    e.preventDefault();
    if (!fromToken || !toToken || !amount) return;

    try {
      const result = await swap({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount,
      }).unwrap(); // unwrap handles success/error

      console.log('Swap result:', result);
      setAmount(''); // clear input
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  return (
    <div className="swap-view-container">
      <form className="wallet-form" onSubmit={handleSwap}>
        {/* From token input */}
        <div className="swap-input-group">
          <input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            type="button"
            className="token-button"
            onClick={() => setIsFromModalOpen(true)}
          >
            {fromToken ? (
              <>
                <img src={fromToken.image} alt={fromToken.name} />
                <span>{fromToken.symbol}</span>
              </>
            ) : 'Select Token'}
          </button>
        </div>

        {/* Swap direction button */}
        <button
          type="button"
          className="reverse-button"
          onClick={() => {
            const temp = fromToken;
            setFromToken(toToken);
            setToToken(temp);
          }}
        >
          ⬇️
        </button>

        {/* To token input */}
        <div className="swap-input-group">
          <input type="text" placeholder="0.0" disabled />
          <button
            type="button"
            className="token-button"
            onClick={() => setIsToModalOpen(true)}
          >
            {toToken ? (
              <>
                <img src={toToken.image} alt={toToken.name} />
                <span>{toToken.symbol}</span>
              </>
            ) : 'Select Token'}
          </button>
        </div>

        {/* Status messages */}
        {error && (
          <p className="error-message">
            {error?.data?.message || 'Swap failed, try again.'}
          </p>
        )}
        {data && (
          <p className="success-message">
            Swapped {data.fromTokenAmount} {fromToken.symbol} → {data.toTokenAmount}{' '}
            {toToken.symbol}
          </p>
        )}

        {/* Swap button */}
        <button type="submit" className="button-primary" disabled={isLoading || !amount}>
          {isLoading ? 'Swapping...' : 'Swap'}
        </button>
      </form>

      {/* Token selection modals */}
      <TokenSelectModal
        isOpen={isFromModalOpen}
        onClose={() => setIsFromModalOpen(false)}
        onSelect={setFromToken}
      />
      <TokenSelectModal
        isOpen={isToModalOpen}
        onClose={() => setIsToModalOpen(false)}
        onSelect={setToToken}
      />
    </div>
  );
};

export default SwapView;
