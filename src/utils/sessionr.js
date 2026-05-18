// utils/session.js
let sessionWallet = null;
let sessionExpiry = null;

export const setSessionWallet = (wallet) => {
  sessionWallet = wallet;
  sessionExpiry = Date.now() + (15 * 60 * 1000); // 15 min
};

export const getSessionWallet = () => {
  if (Date.now() > sessionExpiry) {
    sessionWallet = null;
    return null;
  }
  return sessionWallet;
};
