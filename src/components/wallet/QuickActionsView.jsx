import React from 'react';

const QuickActionsView = ({ navigate }) => {
  return (
    <div className="p-6">
      <h2 className="text-xl mb-6 font-semibold">Wallet</h2>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => navigate('send')} className="btn-primary">
          Send
        </button>

        <button onClick={() => navigate('receive')} className="btn-primary">
          Receive
        </button>

        <button onClick={() => navigate('swap')} className="btn-secondary">
          Swap
        </button>

        <button className="btn-secondary">
          Buy
        </button>
      </div>
    </div>
  );
};

export default QuickActionsView;
