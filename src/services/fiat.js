// CryptoBean Buy Crypto service.
// Checkout stays unavailable until a public HTTPS backend and MoonPay sandbox
// credentials are configured. Never put MoonPay secret keys in the mobile app.

const API_URL = 'https://blockvault-backend-production.up.railway.app';

export async function getBuyUrl(walletAddress, amount = 100) {
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error('A valid wallet address is required.');
  }

  const response = await fetch(`${API_URL}/moonpay/buy-url`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, amount }),
  });

  if (!response.ok) {
    if (response.status === 503 || response.status === 404) {
      throw new Error('Buy Crypto is not configured yet. Please try again later.');
    }
    throw new Error('The purchase service is currently unavailable.');
  }

  const result = await response.json();
  if (
    typeof result.url !== 'string' ||
    !result.url.startsWith('https://buy-sandbox.moonpay.com/')
  ) {
    throw new Error('The purchase service returned an invalid checkout link.');
  }

  return result.url;
}
