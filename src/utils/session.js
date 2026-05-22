import { ethers } from 'ethers';

const SESSION_KEY = 'session_wallet';

// Safe check for browser environment
const isBrowser = typeof window !== 'undefined';

// In-memory session (fast access)
let activeWallet = null;

// ─────────────────────────────────────────────
// SET SESSION WALLET
// ─────────────────────────────────────────────
export const setSessionWallet = (wallet) => {
  activeWallet = wallet;

  if (isBrowser) {
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          type: wallet.type || 'local',   // 'local' | 'external'
          address: wallet.address
        })
      );

      // optional legacy support
      localStorage.setItem('walletAddress', wallet.address);

    } catch (e) {
      console.error("Session save error:", e);
    }
  }
};

// ─────────────────────────────────────────────
// GET SESSION WALLET
// ─────────────────────────────────────────────
export const getSessionWallet = () => {
  // 1. return memory cache first
  if (activeWallet) return activeWallet;

  if (!isBrowser) return null;

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return {
      type: parsed.type || 'local',
      address: parsed.address
    };

  } catch (e) {
    console.error("Session load error:", e);
    return null;
  }
};

// ─────────────────────────────────────────────
// CLEAR SESSION WALLET
// ─────────────────────────────────────────────
export const clearSessionWallet = () => {
  activeWallet = null;

  if (isBrowser) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('authToken');
  }
};
