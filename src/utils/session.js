import { ethers } from 'ethers';

let activeWallet = null;

// ─────────────────────────────
// SET SESSION WALLET (PERSIST)
// ─────────────────────────────
export const setSessionWallet = (wallet) => {
  if (!wallet || typeof wallet.signMessage !== 'function') {
    throw new Error('Invalid ethers Wallet instance');
  }

  activeWallet = wallet;

  // Persist private key in sessionStorage (NOT localStorage)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('pk', wallet.privateKey);
    localStorage.setItem('walletAddress', wallet.address);
  }
};

// ─────────────────────────────
// RESTORE SESSION WALLET
// ─────────────────────────────
export const restoreSessionWallet = () => {
  if (activeWallet) return activeWallet;

  if (typeof window !== 'undefined') {
    const pk = sessionStorage.getItem('pk');

    if (pk) {
      try {
        activeWallet = new ethers.Wallet(pk);
        return activeWallet;
      } catch (e) {
        console.error('Failed to restore wallet:', e);
        clearSessionWallet();
      }
    }
  }

  return null;
};

// ─────────────────────────────
// GET SESSION WALLET
// ─────────────────────────────
export const getSessionWallet = () => {
  return activeWallet || restoreSessionWallet();
};

// ─────────────────────────────
// CLEAR SESSION
// ─────────────────────────────
export const clearSessionWallet = () => {
  activeWallet = null;

  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('pk');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('authToken');
  }
};
