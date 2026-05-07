// src/wallet/decryptWallet.js
import { deriveKeyFromPasscode, encryptData } from '../utils/wallet';
import { ethers } from 'ethers';

// Note: In a real app, you need the specific salt used during encryption.
// We are passing a placeholder here, but you should store the salt with the wallet.
export const decryptWallet = async (encryptedString, passcode, ivString) => {
  try {
    // 1. Derive Key
    const key = await deriveKeyFromPasscode(passcode, 'global-salt-placeholder'); 
    
    // 2. Decrypt (using the same logic as encrypt, just reversed via subtle API)
    const dec = new TextDecoder();
    const iv = new Uint8Array(ivString.split('').map(c => c.charCodeAt(0)));
    const data = new Uint8Array(encryptedString.split('').map(c => c.charCodeAt(0)));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    
    const seedPhrase = dec.decode(decrypted);

    // 3. Reconstruct Wallet
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    
    return {
      privateKey: wallet.privateKey,
      address: wallet.address
    };
  } catch (e) {
    throw new Error("Decryption failed. Check passcode.");
  }
};
