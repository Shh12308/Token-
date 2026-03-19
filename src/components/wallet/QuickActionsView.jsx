import React from 'react';

const QuickActionsView = ({ setActiveView }) => {
  return (
    <div className="quick-actions-view">
      <h2>What would you like to do?</h2>
      <div className="action-grid">
        <button className="action-card" onClick={() => setActiveView('swap')}>
          <span className="icon">🔄</span>
          <span>Swap from Crypto</span>
        </button>
        <button className="action-card">
          <span className="icon">💳</span>
          <span>Buy with Fiat</span>
        </button>
        <button className="action-card" onClick={() => setActiveView('send')}>
          <span className="icon">💸</span>
          <span>Sell Crypto</span>
        </button>
        <button className="action-card" onClick={() => setActiveView('receive')}>
          <span className="icon">📥</span>
          <span>Receive</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActionsView;
