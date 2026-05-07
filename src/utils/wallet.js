// src/utils/wallet.js
import { ethers } from 'ethers';

// FIX: Use Wallet.createRandom(). This works in BOTH Ethers v5 and v6
export const generateSeedPhrase = () => {
  try {
    // FIX: Handle Ethers v5 vs v6
    let wallet;
    const randomWallet = ethers.Wallet.createRandom(); // createRandom works in both
    
    if (ethers.Wallet.fromPhrase) {
       wallet = ethers.Wallet.fromPhrase(randomWallet.mnemonic.phrase);
    } else {
       wallet = ethers.Wallet.fromMnemonic(randomWallet.mnemonic.phrase);
    }

    // wallet.mnemonic.phrase gives the 12 words
    return wallet.mnemonic.phrase.split(' ');
  } catch (error) {
    console.error("Seed generation failed:", error);
    throw new Error("Secure environment required to generate wallet.");
  }
};

export const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }
};

export const deriveKeyFromPasscode = async (passcode, salt) => {
  const enc = new TextEncoder();
  
  try {
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(passcode),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    // Use a default salt if none provided, but in production always use a stored salt
    const saltBuffer = salt ? enc.encode(salt) : window.crypto.getRandomValues(new Uint8Array(16));

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 100000, 
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (e) {
    console.error("Crypto API not available or failed", e);
    throw new Error("Secure context required (HTTPS)");
  }
};

export const encryptData = async (data, key) => {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(data)
  );

  return {
    iv: Array.from(iv).map(b => String.fromCharCode(b)).join(''),
    data: Array.from(new Uint8Array(encrypted)).map(b => String.fromCharCode(b)).join('')
  };
};
