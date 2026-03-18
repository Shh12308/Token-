// src/app/services/walletApi.js
import { ethers } from 'ethers';

/**
 * Initialize a provider from the user's wallet (MetaMask, etc.)
 * @returns {ethers.providers.Web3Provider|null}
 */
export const getProvider = () => {
  if (typeof window.ethereum !== 'undefined') {
    return new ethers.BrowserProvider(window.ethereum);
  }
  console.warn('No Ethereum wallet detected');
  return null;
};

/**
 * List accounts connected to the wallet
 * @returns {Promise<string[]>} array of addresses
 */
export const listAccounts = async () => {
  const provider = getProvider();
  if (!provider) return [];
  try {
    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts;
  } catch (err) {
    console.error('Error fetching accounts:', err);
    return [];
  }
};

/**
 * Get the ETH balance of an address
 * @param {string} address
 * @returns {Promise<string>} balance in ETH
 */
export const getBalance = async (address) => {
  const provider = getProvider();
  if (!provider) return '0';
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (err) {
    console.error('Error fetching balance:', err);
    return '0';
  }
};

/**
 * Send ETH from the currently connected wallet
 * @param {string} to recipient address
 * @param {string|number} amount ETH amount
 * @returns {Promise<string|null>} transaction hash
 */
export const sendTransaction = async (to, amount) => {
  const provider = getProvider();
  if (!provider) return null;
  try {
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amount.toString()),
    });
    await tx.wait();
    return tx.hash;
  } catch (err) {
    console.error('Error sending transaction:', err);
    return null;
  }
};
