// src/utils/wallet.js
import { ethers } from 'ethers';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://blockvault-backend-production.up.railway.app/api';
const STORAGE_KEY = 'wallet_encrypted';

// --- Helpers ---
const ab2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b642ab = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
};

// --- Core Cryptographic Functions ---

export const generateSeedPhrase = () => {
  return ethers.Wallet.createRandom().mnemonic.phrase.split(' ');
};

export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

export const isBiometricAvailable = () => {
  return !!window.PublicKeyCredential;
};

export const deriveKeyFromPasscode = async (passcode) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('BlockVault-E2EE-Salt-V1'),
      iterations: 600000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptData = async (data, key) => {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(data)
  );
  return {
    data: ab2b64(encrypted),
    iv: ab2b64(iv)
  };
};

export const decryptData = async (encryptedData, key, iv) => {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b642ab(iv) },
    key,
    b642ab(encryptedData)
  );
  const dec = new TextDecoder();
  return dec.decode(decrypted);
};

// --- Wallet State Management ---

let activeWallet = null; // Kept in memory only while logged in

export const getStoredWallet = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const getActiveWallet = () => activeWallet;

export const lockWallet = () => {
  activeWallet = null;
};

// --- Auth & Sign Functions ---

export const registerVault = async (email, password) => {
  const wallet = ethers.Wallet.createRandom();
  const encryptedVault = await wallet.encrypt(password);
  
  await axios.post(`${API_BASE}/auth/register`, {
    email,
    password,
    walletAddress: wallet.address,
    encryptedVault,
  });

  activeWallet = wallet;
  localStorage.setItem('bv_vault_address', wallet.address);
  
  return wallet;
};

export const loginVault = async (email, password) => {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email, password
  });

  const wallet = await ethers.Wallet.fromEncryptedJson(res.data.encryptedVault, password);
  
  activeWallet = wallet;
  localStorage.setItem('authToken', res.data.token);
  localStorage.setItem('bv_vault_address', wallet.address);

  return { wallet, token: res.data.token };
};

// Legacy passcode unlock for local storage wallets (used in LoginPage)
export const unlockLocalVault = async (passcode) => {
  const stored = getStoredWallet();
  if (!stored) throw new Error("No local wallet found");
  
  const key = await deriveKeyFromPasscode(passcode);
  const decryptedSeed = await decryptData(stored.encryptedSeed, key, stored.iv);
  const wallet = new ethers.Wallet.fromPhrase(decryptedSeed);
  
  activeWallet = wallet;
  return wallet;
};

// Import seed phrase and save locally
export const saveWalletToVault = async (privateKeyOrPhrase, password, isPhrase = true) => {
  const wallet = isPhrase 
    ? ethers.Wallet.fromMnemonic(privateKeyOrPhrase.trim())
    : new ethers.Wallet(privateKeyOrPhrase.trim());

  const phraseString = wallet.mnemonic.phrase;
  const key = await deriveKeyFromPasscode(password);
  const encrypted = await encryptData(phraseString, key);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      address: wallet.address,
      encryptedSeed: encrypted.data,
      iv: encrypted.iv,
      createdAt: new Date().toISOString()
    })
  );

  activeWallet = wallet;
  return wallet;
};

// Sign a transaction locally and broadcast it
export const signAndBroadcast = async (unsignedTransaction) => {
  if (!activeWallet) throw new Error("Wallet is locked. Please enter password.");

  const signedTx = await activeWallet.signTransaction(unsignedTransaction);
  
  const token = localStorage.getItem('authToken');
  const res = await axios.post(`${API_BASE}/broadcast`, {
    signedTransaction: signedTx
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};
