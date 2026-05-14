// src/utils/wallet.js
import { ethers } from 'ethers';

// --- Helpers for Base64 <-> ArrayBuffer conversion ---
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
  // Checks if device supports WebAuthn (FaceID / Fingerprint)
  return !!window.PublicKeyCredential;
};

/**
 * Derives a 256-bit AES-GCM encryption key from a user's passcode using PBKDF2.
 * This ensures the passcode itself is never stored or sent anywhere.
 */
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
      salt: enc.encode('BlockVault-E2EE-Salt-V1'), // Static salt for client-side vault
      iterations: 600000, // High iteration count to resist brute force
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts the seed phrase using the derived AES key.
 * Returns the ciphertext and the Initialization Vector (IV) needed for decryption.
 */
export const encryptData = async (data, key) => {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM standard IV size
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

/**
 * Decrypts the seed phrase using the derived key and stored IV.
 */
export const decryptData = async (encryptedData, key, iv) => {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b642ab(iv) },
    key,
    b642ab(encryptedData)
  );
  const dec = new TextDecoder();
  return dec.decode(decrypted);
};
