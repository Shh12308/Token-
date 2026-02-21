// src/services/authService.js
import CryptoJS from 'crypto-js';
import { ethers } from 'ethers';

const DB_NAME = 'LuxWalletDB';
const STORE_NAME = 'encryptedKeys';
const PBKDF2_ITERATIONS = 10000;

// Utility to open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Derive an encryption key from the passcode
const deriveKey = (passcode, salt) => {
  return CryptoJS.PBKDF2(passcode, salt, {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
  });
};

// Create a new wallet and encrypt it
export const createWallet = async (passcode) => {
  const wallet = ethers.Wallet.createRandom();
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const key = deriveKey(passcode, salt);
  const encryptedPrivateKey = CryptoJS.AES.encrypt(wallet.privateKey, key).toString();

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).put({
    salt: salt.toString(),
    encryptedPrivateKey,
  }, 'userWallet');

  // IMPORTANT: Securely show the user their mnemonic phrase ONCE.
  // They must write it down.
  return { mnemonic: wallet.mnemonic.phrase, address: wallet.address };
};

// Unlock an existing wallet
export const unlockWallet = async (passcode) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const data = await tx.objectStore(STORE_NAME).get('userWallet');

  if (!data) {
    throw new Error('Wallet not found. Please create a new wallet.');
  }

  const { salt, encryptedPrivateKey } = data;
  const key = deriveKey(passcode, CryptoJS.enc.Hex.parse(salt));
  
  try {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedPrivateKey, key);
    const privateKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!privateKey) throw new Error('Incorrect passcode.');

    const wallet = new ethers.Wallet(privateKey);
    return wallet;
  } catch (error) {
    throw new Error('Incorrect passcode.');
  }
};

// Biometric Registration (simplified example)
export const registerBiometric = async () => {
  // This would create a WebAuthn credential and store its ID
  // This is a complex process, but here's the idea:
  const credential = await navigator.credentials.create({
    publicKey: {
      // Relying Party (your app's) identity
      rp: { name: 'LUX Crypto PWA', id: window.location.hostname },
      user: {
        id: new Uint8Array(16), // Random user ID
        name: 'user',
        displayName: 'LUX User',
      },
      challenge: new Uint8Array(32), // Random challenge from server
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: { userVerification: 'required' },
    },
  });
  // Store credential.id in IndexedDB to link it to the user's wallet
  console.log('Biometric registered:', credential.id);
  return credential.id;
};
