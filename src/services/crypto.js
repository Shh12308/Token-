import { ethers } from 'ethers';

// 1. Create a new wallet (Non-Custodial)
export const createWallet = () => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase, // User must save this!
  };
};

// 2. Import wallet from Seed Phrase
export const importWallet = (mnemonic) => {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    throw new Error("Invalid Seed Phrase");
  }
};
