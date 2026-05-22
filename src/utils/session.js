import { ethers } from 'ethers';

let activeWallet = null;

// ─────────────────────────────
// SET SESSION WALLET (STRICT)
// ─────────────────────────────
export const setSessionWallet = (wallet) => {
  if (!wallet || typeof wallet.signMessage !== 'function') {
    throw new Error('Invalid ethers Wallet instance');
  }

  activeWallet = wallet;
};

// ─────────────────────────────
// GET SESSION WALLET
// ─────────────────────────────
export const getSessionWallet = () => {
  return activeWallet;
};

// ─────────────────────────────
// CLEAR SESSION
// ─────────────────────────────
export const clearSessionWallet = () => {
  activeWallet = null;

  if (typeof window !== 'undefined') {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('authToken');
  }
};
