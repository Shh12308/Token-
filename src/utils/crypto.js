// src/utils/crypto.js
import localforage from 'localforage';

// --- Base64 helpers ---
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
};

// --- Salt generation ---
export const generateSalt = () => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return arrayBufferToBase64(array);
};

// --- Key derivation ---
export const deriveKey = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToArrayBuffer(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// --- Encrypt data ---
export const encryptData = async (data, password) => {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data))
  );

  return {
    encryptedData: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    salt,
  };
};

// --- Decrypt data ---
export const decryptData = async (encryptedData, password, iv, salt) => {
  try {
    const key = await deriveKey(password, salt);
    const dec = new TextDecoder();

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToArrayBuffer(iv),
      },
      key,
      base64ToArrayBuffer(encryptedData)
    );

    return JSON.parse(dec.decode(decrypted));
  } catch (err) {
    throw new Error('Decryption failed. Wrong password or corrupted data.');
  }
};

// --- Hash (for PIN verification) ---
export const hashPassword = async (password) => {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest(
    'SHA-256',
    enc.encode(password)
  );

  return arrayBufferToBase64(hashBuffer);
};

// --- LocalForage storage helpers ---
const walletStore = localforage.createInstance({
  name: 'CryptoBeanWallet',
  storeName: 'wallet_data',
});

// Save encrypted wallet
export const saveWallet = async (encryptedWallet) => {
  await walletStore.setItem('wallet', encryptedWallet);
};

// Retrieve encrypted wallet
export const getWallet = async () => {
  return await walletStore.getItem('wallet');
};

// Clear wallet (logout / lock)
export const clearWallet = async () => {
  await walletStore.removeItem('wallet');
};
