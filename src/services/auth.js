import CryptoJS from 'crypto-js';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

// 1. "Register" -> Encrypt and save wallet
export const saveWallet = (privateKey, password, mnemonic) => {
  // Encrypt the private key with the password
  const encryptedKey = CryptoJS.AES.encrypt(privateKey, password).toString();
  const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();

  // Save the encrypted strings to local storage
  storage.set('encryptedPrivateKey', encryptedKey);
  storage.set('encryptedMnemonic', encryptedMnemonic);
  
  return true;
};

// 2. "Login" -> Decrypt and return wallet
export const unlockWallet = (password) => {
  try {
    const encryptedKey = storage.getString('encryptedPrivateKey');
    
    if (!encryptedKey) return null; // No wallet exists

    // Attempt to decrypt
    const bytes = CryptoJS.AES.decrypt(encryptedKey, password);
    const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);

    // If decryption fails (wrong password), it returns empty string
    if (!decryptedKey) throw new Error("Wrong Password");

    return decryptedKey;
  } catch (e) {
    return null; // Wrong password
  }
};

// Check if a wallet exists on the device
export const hasWallet = () => {
  return storage.contains('encryptedPrivateKey');
};
