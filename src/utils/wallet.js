// src/utils/wallet.js
import * as bip39 from "bip39";

// Generate 12-word seed phrase
export function generateSeedPhrase() {
  const mnemonic = bip39.generateMnemonic(128); // 128 bits = 12 words
  return mnemonic.split(" ");
}

// Validate phrase (useful for recovery login)
export function validateSeedPhrase(phrase) {
  if (Array.isArray(phrase)) {
    phrase = phrase.join(" ");
  }
  return bip39.validateMnemonic(phrase);
}
