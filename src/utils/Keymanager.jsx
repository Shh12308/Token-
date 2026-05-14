// src/utils/keyManager.js
import { ethers } from 'ethers';

const VAULT_KEY = 'blockvault_vault';

/**
 * Encrypts a private key with a password and saves to localStorage
 */
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

/**
 * Decrypts a wallet from the vault using the password
 */
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
