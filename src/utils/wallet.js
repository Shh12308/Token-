// src/utils/wallet.js
import { ethers } from 'ethers';

export const generateSeedPhrase = () => {
  // Generates a random 12 or 24 word mnemonic
  const entropy = window.crypto.getRandomValues(new Uint8Array(16)); // 128 bits for 12 words
  const mnemonic = ethers.entropyToMnemonic(entropy);
  return mnemonic.split(' ');
};

export const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    // Fallback
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }
};
