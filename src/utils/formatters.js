// src/utils/formatters.js
import { ethers } from 'ethers';

export const formatAddress = (address) => {
  if (!address) return null;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance, decimals = 18) => {
  if (!balance) return '0';
  return parseFloat(ethers.utils.formatUnits(balance, decimals)).toFixed(4);
};
