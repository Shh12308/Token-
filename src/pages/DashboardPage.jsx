import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from '../components/common/Sidebar';
import NetworkSelector from '../components/common/NetworkSelector';
import SwapView from '../components/wallet/SwapView';
import SendView from '../components/wallet/SendView';
import ReceiveView from '../components/wallet/ReceiveView';
import QuickActionsView from '../components/wallet/QuickActionsView'; // New Buy Tab

const DashboardPage = () => {
  const [activeView, setActiveView] = useState('quick-actions'); // Default to the new buy tab
  const selectedNetwork = useSelector((state) => state.wallet.selectedNetwork);
  const balances = useSelector((state) => state.wallet.balances[selectedNetwork] || {});

  const renderActiveView = () => {
    const commonProps = { balances };
    switch (activeView) {
      case 'swap': return <SwapView {...commonProps} />;
      case 'send': return <SendView {...commonProps} />;
      case 'receive': return <ReceiveView />;
      case 'quick-actions': return <QuickActionsView setActiveView={setActiveView} />;
      default: return <QuickActionsView setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="wallet-header">
          <h1>Wallet</h1>
          <NetworkSelector />
        </div>
        
        <div className="wallet-tabs">
          <button onClick={() => setActiveView('quick-actions')} className={`tab ${activeView === 'quick-actions' ? 'active' : ''}`}>Buy</button>
          <button onClick={() => setActiveView('swap')} className={`tab ${activeView === 'swap' ? 'active' : ''}`}>Swap</button>
          <button onClick={() => setActiveView('send')} className={`tab ${activeView === 'send' ? 'active' : ''}`}>Send</button>
          <button onClick={() => setActiveView('receive')} className={`tab ${activeView === 'receive' ? 'active' : ''}`}>Receive</button>
        </div>

        <div className="wallet-content">
          {renderActiveView()}
        </div>

        <Outlet />
      </main>
    </div>
  );
};

export default DashboardPage;
