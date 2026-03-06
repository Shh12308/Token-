import React, { useState, useEffect } from 'react';
import { Home, Wallet, Settings } from 'lucide-react';

// Define your supported networks
const networks = [
  {
    name: 'Ethereum',
    chainId: '0x1',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    icon: Home,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    explorer: 'https://etherscan.io',
  },
  {
    name: 'Polygon',
    chainId: '0x89',
    rpcUrl: 'https://polygon-rpc.com',
    icon: Wallet,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    explorer: 'https://polygonscan.com',
  },
  {
    name: 'CustomNet',
    chainId: '0x123',
    rpcUrl: 'https://your-custom-rpc.com',
    icon: Settings,
    nativeCurrency: { name: 'CST', symbol: 'CST', decimals: 18 },
    explorer: 'https://customscan.io',
  },
];

const NetworkSelector = ({ walletProvider }) => {
  // walletProvider is your custom provider managing JSON-RPC calls
  const [currentNetwork, setCurrentNetwork] = useState(networks[0]);

  useEffect(() => {
    // Optional: detect network from walletProvider if connected
    if (walletProvider?.getChainId) {
      const chainId = walletProvider.getChainId();
      const net = networks.find((n) => n.chainId === chainId);
      if (net) setCurrentNetwork(net);
    }
  }, [walletProvider]);

  const handleNetworkChange = async (event) => {
    const network = networks.find((n) => n.name === event.target.value);
    if (!network) return;

    setCurrentNetwork(network);

    // Switch your wallet provider to the new network
    if (walletProvider?.setRpc) {
      walletProvider.setRpc(network.rpcUrl);
    }

    // Optional: persist selection
    localStorage.setItem('selectedNetwork', network.chainId);
  };

  return (
    <div className="network-selector">
      {/* Icon rendered safely */}
      <span className="network-icon">
        {currentNetwork?.icon
          ? React.createElement(currentNetwork.icon)
          : '🔗'}
      </span>

      {/* Network dropdown */}
      <select
        value={currentNetwork.name}
        onChange={handleNetworkChange}
        className="network-dropdown"
      >
        {networks.map((net) => (
          <option key={net.chainId} value={net.name}>
            {net.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default NetworkSelector;
