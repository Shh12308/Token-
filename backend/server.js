require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { MoonPay } = require('@moonpay/moonpay-node');
const auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' }
});

function getBearerToken(req) {
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CryptoBean backend' });
});

app.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const result = await auth.register(req.body?.email, req.body?.password);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(201).json({
      customer: result.customer,
      message: 'Account created. Please log in.'
    });
  } catch (_error) {
    console.error('Customer registration failed');
    return res.status(500).json({ error: 'Unable to create account right now' });
  }
});

app.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const result = await auth.login(req.body?.email, req.body?.password);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    res.set('Cache-Control', 'no-store');
    return res.json({
      token: result.token,
      expiresAt: result.expiresAt,
      customer: result.customer
    });
  } catch (_error) {
    console.error('Customer login failed');
    return res.status(500).json({ error: 'Unable to log in right now' });
  }
});

app.get('/auth/me', async (req, res) => {
  try {
    const customer = await auth.authenticate(getBearerToken(req));
    if (!customer) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    res.set('Cache-Control', 'no-store');
    return res.json({ customer });
  } catch (_error) {
    console.error('Session validation failed');
    return res.status(500).json({ error: 'Unable to validate session right now' });
  }
});

app.post('/auth/logout', async (req, res) => {
  try {
    await auth.logout(getBearerToken(req));
    return res.status(204).end();
  } catch (_error) {
    console.error('Customer logout failed');
    return res.status(500).json({ error: 'Unable to log out right now' });
  }
});


app.get('/api/nfts', async (req, res) => {
  const owner = req.query.owner;
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

  if (typeof owner !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(owner)) {
    return res.status(400).json({ error: 'A valid public wallet address is required' });
  }

  const apiKey = process.env.OPENSEA_API_KEY?.trim();
  if (
    !apiKey ||
    /^(your_opensea_api_key|placeholder|replace_me|your_api_key)$/i.test(apiKey)
  ) {
    return res.status(503).json({ error: 'NFT service is not configured' });
  }

  try {
    const upstream = await fetch(
      `https://api.opensea.io/api/v2/chain/ethereum/account/${owner}/nfts?limit=${limit}`,
      {
        headers: { accept: 'application/json', 'x-api-key': apiKey },
        signal: AbortSignal.timeout(12000)
      }
    );

    if (!upstream.ok) {
      console.error('OpenSea NFT request failed with status', upstream.status);
      return res.status(502).json({ error: 'NFT provider request failed' });
    }

    const data = await upstream.json();
    return res.json({
      nfts: Array.isArray(data.nfts) ? data.nfts : [],
      next: data.next || null
    });
  } catch (_error) {
    console.error('OpenSea NFT request failed');
    return res.status(502).json({ error: 'Unable to retrieve NFT holdings' });
  }
});

app.post('/moonpay/buy-url', (req, res) => {
  try {
    const apiKey = process.env.MOONPAY_API_KEY;
    const secretKey = process.env.MOONPAY_SECRET_KEY;
    const { walletAddress, amount = 100, currency = 'gbp' } = req.body || {};

    if (!apiKey || !secretKey ||
        secretKey === 'your_test_secret_signing_key') {
      return res.status(503).json({
        error: 'MoonPay sandbox credentials are not configured'
      });
    }

    if (typeof walletAddress !== 'string' ||
        !/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      return res.status(400).json({
        error: 'A valid Ethereum wallet address is required'
      });
    }

    const supportedCurrencies = ['gbp', 'usd', 'eur'];
    const selectedCurrency =
      typeof currency === 'string' ? currency.toLowerCase() : '';

    if (!supportedCurrencies.includes(selectedCurrency)) {
      return res.status(400).json({
        error: 'Supported fiat currencies are GBP, USD and EUR'
      });
    }

    const fiatAmount = Number(amount);

    if (!Number.isFinite(fiatAmount) ||
        fiatAmount < 20 || fiatAmount > 10000) {
      return res.status(400).json({
        error: `Amount must be between 20 and 10000 ${selectedCurrency.toUpperCase()}`
      });
    }

    const moonpay = new MoonPay(secretKey);
    const url = moonpay.url.generate({
      flow: 'buy',
      params: {
        apiKey,
        walletAddress: walletAddress.trim(),
        currencyCode: 'eth',
        defaultCurrencyCode: 'eth',
        baseCurrencyCode: selectedCurrency,
        baseCurrencyAmount: String(fiatAmount)
      }
    });

    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' ||
        parsedUrl.hostname !== 'buy-sandbox.moonpay.com') {
      return res.status(500).json({
        error: 'Sandbox checkout URL validation failed'
      });
    }

    return res.json({ url });
  } catch (error) {
    console.error(
      'MoonPay checkout generation failed:',
      error?.message || 'Unknown error'
    );
    return res.status(500).json({
      error: 'Unable to generate MoonPay sandbox checkout'
    });
  }
});

const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`CryptoBean backend listening on ${HOST}:${PORT}`);
});
