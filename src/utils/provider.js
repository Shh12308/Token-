import { ethers } from 'ethers';

const RPC_URL = 'https://rpc.ankr.com/eth';

// singleton provider (prevents listener leaks)
let provider;

export const getProvider = () => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL, {
      name: 'Ethereum',
      chainId: 1
    });
  }

  return provider;
};

export const testConnection = async () => {
  const p = getProvider();
  return await p.getBlockNumber();
};
