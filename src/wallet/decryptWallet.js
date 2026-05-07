// src/wallet/decryptWallet.js
import { deriveKeyFromPasscode, decryptData } from '../utils/crypto';

export const decryptWallet = async (encryptedString, passcode, ivString) => {
  // 1. Derive the key using the passcode
  // Note: In a real app, you must fetch the specific salt used during encryption.
  // For this implementation to match your existing code structure, we assume
  // a deterministic derivation or the salt was passed implicitly. 
  // Ideally, add 'salt' to your stored wallet object.
  const key = await deriveKeyFromPasscode(passcode, 'global-salt-placeholder'); 
  
  // 2. Decrypt the seed phrase
  const decryptedSeed = await decryptData(encryptedString, key, ivString);
  
  // 3. Reconstruct Wallet from Seed
  // We return an object mimicking your existing usage
  const wallet = ethers.Wallet.fromPhrase(decryptedSeed);
  
  return {
    privateKey: wallet.privateKey,
    address: wallet.address
  };
};
