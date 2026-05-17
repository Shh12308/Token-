// utils/security/vault.js

import {
  derivePasscodeKey,
  generateDeviceKey,
  deriveFinalKey,
  encrypt,
  decrypt
} from './crypto';

import { saveVault, getVault } from './storage';

// ─────────────────────────────
// Create Vault
// ─────────────────────────────
export async function createVault(seedPhrase, passcode) {
  const salt = crypto.randomUUID();

  const deviceKey = await generateDeviceKey();
  const passcodeKey = await derivePasscodeKey(passcode, salt);
  const finalKey = await deriveFinalKey(deviceKey, passcodeKey);

  const encrypted = await encrypt(seedPhrase, finalKey);

  await saveVault({
    encryptedSeed: encrypted.data,
    iv: encrypted.iv,
    salt,
    createdAt: new Date().toISOString()
  });

  return true;
}

// ─────────────────────────────
// Unlock Vault
// ─────────────────────────────
export async function unlockVault(passcode) {
  const vault = await getVault();
  if (!vault) throw new Error('Vault not found');

  const deviceKey = await generateDeviceKey(); // should persist in real app
  const passcodeKey = await derivePasscodeKey(passcode, vault.salt);

  const finalKey = await deriveFinalKey(deviceKey, passcodeKey);

  return decrypt(vault.encryptedSeed, vault.iv, finalKey);
}
