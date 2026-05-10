// src/utils/wallet.js
import { ethers } from 'ethers';

// --- 1. SEED PHRASE GENERATION ---
export const generateSeedPhrase = () => {
  const wallet = ethers.Wallet.createRandom();
  return wallet.mnemonic.phrase.split(' ');
};

export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

// --- 2. BIOMETRIC CHECK ---
export const isBiometricAvailable = () => {
  return window.PublicKeyCredential !== undefined && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
};

// --- 3. ENCRYPTION / DECRYPTION (AES-GCM) ---
// Helper to convert string to buffer
const enc = new TextEncoder();
const dec = new TextDecoder();

// Derive a cryptographic key from a passcode (or simulated biometric string)
export const deriveKeyFromPasscode = async (passcode) => {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('blockvault-salt'), // In production, use a random salt stored with the IV
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptData = async (data, key) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(data)
  );

  return {
    iv: Array.from(iv).join(','), // Store IV as string for JSON
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))) // Store data as Base64
  };
};

export const decryptData = async (encryptedData, key, ivString) => {
  try {
    const iv = new Uint8Array(ivString.split(',').map(Number));
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    );
    return dec.decode(decrypted);
  } catch (e) {
    throw new Error('Decryption failed. Invalid passcode.');
  }
};
