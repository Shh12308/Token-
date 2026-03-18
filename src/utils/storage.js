// src/utils/storage.js

export const getLocalAccount = () => {
  try {
    const data = localStorage.getItem('wallet_account');
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to get local account:', err);
    return null;
  }
};

export const setLocalAccount = (account) => {
  localStorage.setItem('wallet_account', JSON.stringify(account));
};

export const clearLocalAccount = () => {
  localStorage.removeItem('wallet_account');
};
