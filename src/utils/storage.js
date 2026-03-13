// src/utils/storage.js

const STORAGE_KEY = 'cryptoBeanAccount';

export const saveAccount = (account) => {
  // account: { email, passcode, seedPhrase }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
};

export const getAccount = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearAccount = () => {
  localStorage.removeItem(STORAGE_KEY);
};
