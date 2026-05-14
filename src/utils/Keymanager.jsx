// src/utils/keyManager.js
import { ethers } from 'ethers';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';

let activeWallet = null; // Keep the decrypted wallet in memory during the session

export const registerVault = async (email, password) => {
  const wallet = ethers.Wallet.createRandom();
  const encryptedVault = await wallet.encrypt(password);
  
  await axios.post(`${API_BASE}/auth/register`, {
    email,
    password,
    walletAddress: wallet.address,
    encryptedVault,
  });

  activeWallet = wallet;
  localStorage.setItem('bv_vault_address', wallet.address);
  
  return wallet;
};

export const saveWalletToVault = async (privateKey, password) => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const encryptedJson = await wallet.encrypt(password);
    
    let vault = JSON.parse(localStorage.getItem(VAULT_KEY) || '[]');
    
    // Avoid duplicates
    if (vault.find(v => v.address === wallet.address)) {
      throw new Error('Wallet already in vault');
    }

    vault.push({
      address: wallet.address,
      encrypted: encryptedJson,
    });

    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    return wallet.address;
  } catch (error) {
    console.error('Vault save error:', error);
    throw error;
  }
};

export const getWalletFromVault = async (address, password) => {
  const vault = JSON.parse(localStorage.getItem(VAULT_KEY) || '[]');
  const entry = vault.find(v => v.address.toLowerCase() === address.toLowerCase());
  
  if (!entry) throw new Error('Wallet not found in vault');
  
  try {
    const wallet = await ethers.Wallet.fromEncryptedJson(entry.encrypted, password);
    return wallet;
  } catch (error) {
    throw new Error('Invalid password');
  }
};

/**
 * Lists all public addresses stored in the vault
 */
export const getVaultAddresses = () => {
  const vault = JSON.parse(localStorage.getItem(VAULT_KEY) || '[]');
  return vault.map(v => v.address);
};

/**
 * Removes a wallet from the local vault
 */
export const removeWalletFromVault = (address) => {
  let vault = JSON.parse(localStorage.getItem(VAULT_KEY) || '[]');
  vault = vault.filter(v => v.address.toLowerCase() !== address.toLowerCase());
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
};

export const loginVault = async (email, password) => {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email, password
  });

  // Decrypt the vault locally
  const wallet = await ethers.Wallet.fromEncryptedJson(res.data.encryptedVault, password);
  
  activeWallet = wallet;
  localStorage.setItem('authToken', res.data.token);
  localStorage.setItem('bv_vault_address', wallet.address);

  return { wallet, token: res.data.token };
};

export const getActiveWallet = () => activeWallet;

export const lockWallet = () => {
  activeWallet = null; // Clears the private key from memory
};

// Sign a transaction locally and broadcast it
export const signAndBroadcast = async (unsignedTransaction) => {
  if (!activeWallet) throw new Error("Wallet is locked. Please enter password.");

  // Connect wallet to provider to fetch fresh nonces/gas automatically if needed, 
  // but here we sign the exact TX the backend prepared
  const signedTx = await activeWallet.signTransaction(unsignedTransaction);
  
  const token = localStorage.getItem('authToken');
  const res = await axios.post(`${API_BASE}/broadcast`, {
    signedTransaction: signedTx
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};
