const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');

// === Firebase Admin ===
const serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// === Express ===
const app = express();
app.use(cors());
app.use(bodyParser.json());

// === Matchmaking ===
app.post('/match', async (req, res) => {
  const { uid, prefs } = req.body;
  console.log(`🔍 Matching for ${uid}`, prefs);

  const snap = await db.collection('waiting').get();
  const candidates = [];
  snap.forEach(doc => {
    const data = doc.data();
    if (data.uid !== uid) {
      const score = scoreMatch(prefs, data.prefs);
      candidates.push({ ...data, score });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  if (best) {
    console.log(`✅ Found: ${best.uid} (score ${best.score})`);
    await db.collection('waiting').doc(uid).delete();
    await db.collection('waiting').doc(best.uid).delete();
    res.json({ partner: best });
  } else {
    console.log(`🕒 No match, adding ${uid}`);
    await db.collection('waiting').doc(uid).set({ uid, prefs });
    res.json({ partner: null });
  }
});

function scoreMatch(p1, p2) {
  let score = 0;
  if (p1.gender === p2.selfGender) score += 3;
  if (p1.location === p2.location) score += 2;
  if (p1.language && p2.language && p1.language === p2.language) score += 2;
  if (p1.lifestyle && p2.lifestyle && p1.lifestyle === p2.lifestyle) score += 1;
  if (p1.hobbies && p2.hobbies) {
    const shared = p1.hobbies.split(',').filter(h => p2.hobbies.includes(h));
    score += shared.length * 1.5;
  }
  return score;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, (
