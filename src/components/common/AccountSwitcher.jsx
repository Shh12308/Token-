import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllWallets, selectActiveWallet, setActiveWallet } from '../../features/wallet/walletSlice';
import NewAccountModal from './NewAccountModal';

const AccountSwitcher = () => {
  const dispatch = useDispatch();
  const wallets = useSelector(selectAllWallets);
  const activeWallet = useSelector(selectActiveWallet);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSwitchWallet = (walletId) => {
    dispatch(setActiveWallet(walletId));
  };

  return (
    <>
      <div className="account-switcher">
        <button className="account-trigger">
          <span className="wallet-name">{activeWallet?.name}</span>
          <span className="wallet-address">{activeWallet?.address?.slice(0, 6)}...{activeWallet?.address?.slice(-4)}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        <div className="account-dropdown">
          <div className="wallet-list">
            {wallets.map(wallet => (
              <button
                key={wallet.id}
                className={`wallet-item ${wallet.id === activeWallet.id ? 'active' : ''}`}
                onClick={() => handleSwitchWallet(wallet.id)}
              >
                <div className="wallet-info">
                  <span className="wallet-name">{wallet.name}</span>
                  <span className="wallet-address">{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span>
                </div>
                {wallet.id === activeWallet.id && <span className="checkmark">✓</span>}
              </button>
            ))}
          </div>
          <div className="dropdown-footer">
            <button className="create-wallet-button" onClick={() => setIsModalOpen(true)}>
              + Create New Wallet
            </button>
          </div>
        </div>
      </div>
      <NewAccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default AccountSwitcher;
