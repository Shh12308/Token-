import React from 'react';

const QuickActionsView = ({ setView }) => {
  return (
    <div className="quick-actions-view">
      <h2>What would you like to do?</h2>

      <div className="action-grid">
        <button className="action-card" onClick={() => setView('swap')}>
          <span className="icon">🔄</span>
          <span>Swap Crypto</span>
        </button>

        <button className="action-card">
          <span className="icon">💳</span>
          <span>Buy with Fiat</span>
        </button>

        <button className="action-card" onClick={() => setView('send')}>
          <span className="icon">💸</span>
          <span>Send Crypto</span>
        </button>

        <button className="action-card" onClick={() => setView('receive')}>
          <span className="icon">📥</span>
          <span>Receive</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActionsView;
