import React, { useState, useEffect } from 'react';
import { Home, Wallet, Settings } from 'lucide-react';

const networks = [
  {
    name: 'Ethereum',
    chainId: '0x1',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    icon: Home,
  },
  {
    name: 'Sepolia Testnet',
    chainId: '0xaa36a7',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    icon: Home,
  },
  {
    name: 'Polygon',
    chainId: '0x89',
    rpcUrl: 'https://polygon-rpc.com',
    icon: Wallet,
  },
  {
    name: 'Polygon Mumbai (Testnet)',
    chainId: '0x13881',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    icon: Wallet,
  },
  {
    name: 'BNB Smart Chain',
    chainId: '0x38',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    icon: Settings,
  },
  {
    name: 'BNB Testnet',
    chainId: '0x61',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    icon: Settings,
  },
  {
    name: 'Arbitrum One',
    chainId: '0xa4b1',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    icon: Home,
  },
  {
    name: 'Optimism',
    chainId: '0xa',
    rpcUrl: 'https://mainnet.optimism.io',
    icon: Home,
  },
  {
    name: 'Avalanche C-Chain',
    chainId: '0xa86a',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    icon: Wallet,
  },
  {
    name: 'CustomNet',
    chainId: '0x123',
    rpcUrl: 'https://your-custom-rpc.com',
    icon: Settings,
  },
];

const NetworkSelector = ({ walletProvider }) => {
  const [currentNetwork, setCurrentNetwork] = useState(networks[0]);

  useEffect(() => {
    if (walletProvider?.getChainId) {
      const chainId = walletProvider.getChainId();
      const net = networks.find((n) => n.chainId === chainId);
      if (net) setCurrentNetwork(net);
    }
  }, [walletProvider]);

  const handleNetworkChange = (event) => {
    const network = networks.find((n) => n.name === event.target.value);
    if (!network) return;

    setCurrentNetwork(network);
    walletProvider?.setRpc?.(network.rpcUrl);
    localStorage.setItem('selectedNetwork', network.chainId);
  };

  return (
    <div className="network-selector">
      {/* Render icon via JSX instead of React.createElement */}
      <span className="network-icon">
        {currentNetwork?.icon ? <currentNetwork.icon /> : '🔗'}
      </span>

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
