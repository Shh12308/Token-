import { ethers } from 'ethers';
import { decryptData, deriveKeyFromPasscode } from '../utils/wallet';

const STORAGE_KEY = 'wallet_encrypted';

export const unlockWallet = async () => {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const salt = localStorage.getItem('device_salt');

  const passcode = prompt('Enter passcode');
  if (!passcode) throw new Error('No passcode');

  const key = await deriveKeyFromPasscode(passcode + salt);

  const seed = await decryptData(
    stored.encryptedSeed,
    key,
    stored.iv
  );

  return ethers.Wallet.fromPhrase(seed);
};
