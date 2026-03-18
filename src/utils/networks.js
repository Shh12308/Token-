// src/utils/networks.js

export const NETWORKS = {
  ethereum: {
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

  polygon: {
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

  bsc: {
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

  arbitrum: {
    id: 'arbitrum',
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc'
    ],
    blockExplorer: 'https://arbiscan.io'
  }
};

export const DEFAULT_NETWORK = NETWORKS.ethereum;

// Helper: get RPC (with fallback)
export const getRpcUrl = (network) => {
  return network.rpcUrls[0];
};

// Helper: get network by chainId
export const getNetworkByChainId = (chainId) => {
  return Object.values(NETWORKS).find(
    (net) => net.chainId === chainId
  );
};

// Helper: format chainId for MetaMask
export const toHexChainId = (chainId) => {
  return '0x' + chainId.toString(16);
};
