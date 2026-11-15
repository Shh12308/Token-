const express = require('express');

const router = express.Router();

const SUPPORTED_CHAINS = new Set([
  'ethereum',
  'polygon',
  'base',
]);

router.get('/:chain', async (req, res) => {
  const chain = String(req.params.chain || '').toLowerCase();
  const owner = String(req.query.owner || '');
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

  if (!SUPPORTED_CHAINS.has(chain)) {
    return res.status(400).json({
      error: 'Unsupported network. Use ethereum, polygon, or base.',
    });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
    return res.status(400).json({
      error: 'A valid public wallet address is required.',
    });
  }

  const apiKey = process.env.OPENSEA_API_KEY?.trim();

  if (
    !apiKey ||
    /^(your_opensea_api_key|placeholder|replace_me|your_api_key)$/i.test(apiKey)
  ) {
    return res.status(503).json({
      error: 'NFT service is not configured on the backend yet.',
    });
  }

  try {
    const url = new URL(
      `https://api.opensea.io/api/v2/chain/${chain}/account/${owner}/nfts`
    );
    url.searchParams.set('limit', String(limit));

    const upstream = await fetch(url, {
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey,
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!upstream.ok) {
      console.error(
        `OpenSea NFT request failed for ${chain} with status`,
        upstream.status
      );
      return res.status(502).json({
        error: 'The NFT provider could not be reached. Please try again.',
      });
    }

    const data = await upstream.json();

    return res.json({
      chain,
      nfts: Array.isArray(data.nfts) ? data.nfts : [],
      next: data.next || null,
    });
  } catch (error) {
    console.error(
      `OpenSea NFT request failed for ${chain}:`,
      error?.message || 'Unknown error'
    );

    return res.status(502).json({
      error: 'Unable to retrieve NFT holdings right now.',
    });
  }
});

module.exports = router;
