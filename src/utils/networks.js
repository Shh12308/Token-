// src/utils/networks.js

// 🔥 MAIN ARRAY (LOWERCASE as requested)
export const networks = [
  {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrls: [
      'https://rpc.ankr.com/eth',
      'https://cloudflare-eth.com'
    ],
    blockExplorer: 'https://etherscan.io'
  },

  {
    id: 'polygon',
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon'
    ],
    blockExplorer: 'https://polygonscan.com'
  },

  {
    id: 'bsc',
    chainId: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://rpc.ankr.com/bsc'
    ],
    blockExplorer: 'https://bscscan.com'
  },

  {
    id: 'arbitrum',
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc'
    ],
    blockExplorer: 'https://arbiscan.io'
  }
];

// ✅ DEFAULT NETWORK
export const DEFAULT_NETWORK = networks[0];

// -------------------------
// HELPERS
// -------------------------

// Get RPC URL
export const getRpcUrl = (network) => {
  return network.rpcUrls?.[0];
};

// Get network by chainId
export const getNetworkByChainId = (chainId) => {
  return networks.find((net) => net.chainId === chainId);
};

// Convert chainId → hex (MetaMask)
export const toHexChainId = (chainId) => {
  return '0x' + chainId.toString(16);
};
