import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedNetwork } from '../../features/wallet/walletSlice';

const networks = [
  { id: 'ethereum', name: 'Ethereum', icon: '⬜' },
  { id: 'polygon', name: 'Polygon', icon: '🟣' },
  { id: 'bsc', name: 'BNB Smart Chain', icon: '🟡' },
];

const NetworkSelector = () => {
  const dispatch = useDispatch();
  const selectedNetwork = useSelector((state) => state.wallet.selectedNetwork);

  const handleNetworkChange = (e) => {
    dispatch(setSelectedNetwork(e.target.value));
  };

  const currentNetwork = networks.find(n => n.id === selectedNetwork);

  return (
    <div className="network-selector">
      <span className="network-icon">{currentNetwork.icon}</span>
      <select value={selectedNetwork} onChange={handleNetworkChange} className="network-dropdown">
        {networks.map(net => (
          <option key={net.id} value={net.id}>{net.name}</option>
        ))}
      </select>
    </div>
  );
};

export default NetworkSelector;
