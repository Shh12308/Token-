// utils/security/storage.js

const DB_NAME = 'blockvault_secure';
const STORE = 'vault';

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(STORE);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = reject;
  });
}

export async function saveVault(data) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(data, 'vault');
  return tx.complete;
}

export async function getVault() {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  return tx.objectStore(STORE).get('vault');
}

export async function clearVault() {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).clear();
}
