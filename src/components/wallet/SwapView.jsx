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
  
  const [swap, { isLoading, error, isSuccess }] = useSwapTokenMutation();
  const { data: tokens } = useGetMarketsQuery();

  // Set default tokens on initial load
  useEffect(() => {
    if (tokens && tokens.length > 0 && !fromToken) {
      setFromToken(tokens.find(t => t.symbol === 'ETH'));
      setToToken(tokens.find(t => t.symbol === 'USDC'));
    }
  }, [tokens, fromToken, toToken]);

  const handleSwap = (e) => {
    e.preventDefault();
    if (!fromToken || !toToken || !amount) return;
    swap({ fromToken: fromToken.symbol, toToken: toToken.symbol, amount });
  };

  return (
    <>
      <form className="wallet-form" onSubmit={handleSwap}>
        <div className="swap-input-group">
          <input type="number" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button type="button" className="token-button" onClick={() => setIsFromModalOpen(true)}>
            {fromToken ? (
              <>
                <img src={fromToken.image} alt={fromToken.name} />
                <span>{fromToken.symbol}</span>
              </>
            ) : 'Select Token'}
          </button>
        </div>
        <button type="button" className="reverse-button" onClick={() => {
          const temp = fromToken; setFromToken(toToken); setToToken(temp);
        }}>⬇️</button>
        <div className="swap-input-group">
          <input type="text" placeholder="0.0" disabled />
          <button type="button" className="token-button" onClick={() => setIsToModalOpen(true)}>
            {toToken ? (
              <>
                <img src={toToken.image} alt={toToken.name} />
                <span>{toToken.symbol}</span>
              </>
            ) : 'Select Token'}
          </button>
        </div>
        {error && <p className="error-message">{error.data}</p>}
        {isSuccess && <p className="success-message">Swap Successful!</p>}
        <button type="submit" className="button-primary" disabled={isLoading || !amount}>
          {isLoading ? 'Swapping...' : 'Swap'}
        </button>
      </form>

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
    </>
  );
};

export default SwapView;
