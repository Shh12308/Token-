// utils/security/crypto.js

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ─────────────────────────────
// PBKDF2 Passcode Key
// ─────────────────────────────
export async function derivePasscodeKey(passcode, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 250000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─────────────────────────────
// Device Key (non-exportable)
// ─────────────────────────────
export async function generateDeviceKey() {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// ─────────────────────────────
// Combine Keys (HKDF style)
// ─────────────────────────────
export async function deriveFinalKey(deviceKey, passcodeKey) {
  const rawDevice = await crypto.subtle.exportKey('raw', deviceKey);
  const rawPass = await crypto.subtle.exportKey('raw', passcodeKey);

  const combined = new Uint8Array([...new Uint8Array(rawDevice), ...new Uint8Array(rawPass)]);

  return crypto.subtle.importKey(
    'raw',
    combined,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─────────────────────────────
// Encrypt / Decrypt
// ─────────────────────────────
export async function encrypt(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

export async function decrypt(encryptedData, iv, key) {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(encryptedData)
  );

  return decoder.decode(decrypted);
}
