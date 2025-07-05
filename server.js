// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// === Your Sightengine credentials ===
const SIGHTENGINE_USER = process.env.SIGHTENGINE_USER;
const SIGHTENGINE_SECRET = process.env.SIGHTENGINE_SECRET;

// === Moderation Route ===
app.post('/moderate-image', async (req, res) => {
  const { image, uid } = req.body;

  if (!image || !uid) return res.status(400).json({ ok: false, reason: "Missing image or uid" });

  try {
    const sightRes = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'api_user': SIGHTENGINE_USER,
        'api_secret': SIGHTENGINE_SECRET,
        'models': 'nudity,wad,offensive',
        'media': `data:image/jpeg;base64,${image}`
      })
    });

    const result = await sightRes.json();

    const { nudity, weapon, alcohol, drugs, offensive } = result;

    const isNude = nudity?.raw > 0.6 || nudity?.safe < 0.3;
    const isOffensive = (weapon > 0.4 || alcohol > 0.4 || drugs > 0.4 || offensive?.prob > 0.5);

    if (isNude || isOffensive) {
      const reason = isNude ? 'Nudity detected' : 'Offensive content';
      return res.json({ ok: false, reason, screenshot: `data:image/jpeg;base64,${image}` });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Moderation error:", err);
    res.json({ ok: true }); // fallback: allow if API fails
  }
});

app.get('/', (_, res) => res.send('👋 Sightengine moderation server is live!'));
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
