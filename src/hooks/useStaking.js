// hooks/useStaking.js
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

export const useStaking = (pool) => {
  const { wallet } = useWeb3();

  const stake = async (amount) => { ... };
  const withdraw = async () => { ... };
  const getUserRewards = async () => { ... };

  return { stake, withdraw, getUserRewards };
};
