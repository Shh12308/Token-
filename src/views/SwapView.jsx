// src/views/SwapView.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

const SwapView = () => {
  const selectedNetwork = useSelector((state) => state.wallet.selectedNetwork);
  const balances = useSelector((state) => state.wallet.balances[selectedNetwork] || {});

  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);

  const handleSwap = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    if (!balances[fromToken] || balances[fromToken] < amount) {
      alert(`Insufficient ${fromToken} balance`);
      return;
    }

    setLoading(true);
    setTxResult(null);

    try {
      const response = await axios.post("/api/swap", {
        fromToken,
        toToken,
        amount: Number(amount),
        network: selectedNetwork,
      });

      if (response.data.success) {
        setTxResult({
          success: true,
          txHash: response.data.txHash,
          message: `Swap completed! TX: ${response.data.txHash}`,
        });
      } else {
        setTxResult({ success: false, message: response.data.message || "Swap failed" });
      }
    } catch (err) {
      console.error(err);
      setTxResult({ success: false, message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="swap-view">
      <h2>Swap Tokens</h2>

      <div className="swap-form">
        <div className="form-group">
          <label>From</label>
          <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
            {Object.keys(balances).map((token) => (
              <option key={token} value={token}>
                {token} ({balances[token]})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>To</label>
          <select value={toToken} onChange={(e) => setToToken(e.target.value)}>
            {Object.keys(balances).map((token) => (
              <option key={token} value={token}>
                {token}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <button className="swap-button" onClick={handleSwap} disabled={loading}>
          {loading ? "Swapping..." : "Swap"}
        </button>

        {txResult && (
          <div className={`tx-result ${txResult.success ? "success" : "error"}`}>
            {txResult.message}
            {txResult.txHash && (
              <a
                href={`https://etherscan.io/tx/${txResult.txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View on Etherscan
              </a>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .swap-view {
          max-width: 400px;
          margin: 2rem auto;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
        }
        h2 {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .swap-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        label {
          font-weight: 600;
          margin-bottom: 0.3rem;
        }
        select,
        input {
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid #ccc;
        }
        .swap-button {
          padding: 0.6rem;
          font-weight: 600;
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .swap-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .swap-button:hover:not(:disabled) {
          background: #4338ca;
        }
        .tx-result {
          margin-top: 1rem;
          padding: 0.5rem;
          border-radius: 4px;
        }
        .tx-result.success {
          background: #d1fae5;
          color: #065f46;
        }
        .tx-result.error {
          background: #fee2e2;
          color: #991b1b;
        }
        .tx-result a {
          display: block;
          margin-top: 0.3rem;
          font-size: 0.9rem;
          color: #4f46e5;
        }
      `}</style>
    </div>
  );
};

export default SwapView;
