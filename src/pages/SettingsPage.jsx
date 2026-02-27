import React from 'react';
import { useSelector } from 'react-redux';
import { selectAllWallets, selectActiveWallet } from '../features/wallet/walletSlice';
import Sidebar from '../components/common/Sidebar';

const SettingsPage = () => {
  const wallets = useSelector(selectAllWallets);
  const activeWallet = useSelector(selectActiveWallet);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main settings-main">
        <h1>Settings</h1>
        
        <div className="settings-section">
          <h2>Accounts & Wallets</h2>
          <div className="wallet-list-settings">
            {wallets.map(wallet => (
              <div key={wallet.id} className={`wallet-item-settings ${wallet.id === activeWallet.id ? 'active' : ''}`}>
                <div className="wallet-info">
                  <h3>{wallet.name}</h3>
                  <p>{wallet.address}</p>
                </div>
                <div className="wallet-actions">
                  <button className="button-small button-secondary">Rename</button>
                  <button className="button-small button-secondary">Export Private Key</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h2>Security</h2>
          <p>Change password, enable 2FA, etc.</p>
        </div>

        <div className="settings-section">
          <h2>Notifications</h2>
          <p>Manage email and in-app notifications.</p>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
