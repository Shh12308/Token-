// src/utils/crypto.js

// Derives a cryptographic key from the user's passcode using PBKDF2
export const deriveKeyFromPasscode = async (passcode, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  // In production, always use a unique random salt per user stored with the IV
  const saltBuffer = salt ? enc.encode(salt) : window.crypto.getRandomValues(new Uint8Array(16));

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000, // High iteration count for security
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

// Encrypts data (Seed Phrase) using AES-GCM
export const encryptData = async (data, key) => {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Random IV
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(data)
  );

  // Return buffers as strings/Base64 for storage
  return {
    iv: Array.from(iv).map(b => String.fromCharCode(b)).join(''),
    data: Array.from(new Uint8Array(encrypted)).map(b => String.fromCharCode(b)).join('')
  };
};

// Decrypts data
export const decryptData = async (encryptedData, key, ivString) => {
  const dec = new TextDecoder();
  const iv = new Uint8Array(ivString.split('').map(c => c.charCodeAt(0)));
  const data = new Uint8Array(encryptedData.split('').map(c => c.charCodeAt(0)));

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    return dec.decode(decrypted);
  } catch (e) {
    throw new Error("Decryption failed. Invalid passcode.");
  }
};
