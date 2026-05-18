import { ethers } from 'ethers';

const STORAGE_KEY = 'wallet_encrypted';
const SESSION_KEY = 'session_wallet';

// Safe check for browser environment
const isBrowser = typeof window !== 'undefined';

// ── Session Wallet (In-Memory) ───────────────────────────
let activeWallet = null;

export const setSessionWallet = (wallet) => {
  activeWallet = wallet;
  if (isBrowser) {
    try {
      // Storing address only, NOT the private key for security
      localStorage.setItem('walletAddress', wallet.address);
    } catch (e) { console.error("LocalStorage error", e); }
  }
};

export const getSessionWallet = () => {
  if (activeWallet) return activeWallet;

  // Logic to recover from storage if needed would go here
  // But for this app, we rely on the memory variable after login.
  
  return null;
};

export const clearSessionWallet = () => {
  activeWallet = null;
  if (isBrowser) {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('authToken');
  }
};
