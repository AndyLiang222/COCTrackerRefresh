require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

const mongoUri = process.env.MONGODB_URI;
const client = new MongoClient(mongoUri);

let statsCollection;
let playersCollection;

async function connectDB() {
  await client.connect();
  const db = client.db();
  statsCollection = db.collection('versus_stats');
  playersCollection = db.collection('players');
  console.log('Connected to MongoDB');
}

connectDB().catch(console.error);

// GET /player-data?tag=#TAG&start=2025-07-01&end=2025-07-20
app.get('/player-data', async (req, res) => {
  try {
    const { tag, startUnix, endUnix } = req.query;

    console.log(tag, startUnix, endUnix);

    if (!tag) {
      return res.status(400).json({ error: 'Missing player tag parameter' });
    }

    if (!startUnix || !endUnix) {
      return res.status(400).json({ error: 'Missing start or end date parameters' });
    }

    const start = startUnix ? parseInt(startUnix, 10) : 0;
    const end = endUnix ? parseInt(endUnix, 10) : Date.now();

    const docs = await statsCollection
      .find({
        tag: tag,
        createdAtUnix: { $gte: start, $lte: end }
      })
      .sort({ createdAt: 1 })
      .toArray();

    res.json({ count: docs.length, data: docs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /player-data?tag=#TAG&start=2025-07-01&end=2025-07-20
app.get('/player', async (req, res) => {
  try {
    const { tag} = req.query;

    console.log(tag);

    if (!tag) {
      return res.status(400).json({ error: 'Missing player tag parameter' });
    }

    const docs = await playersCollection
      .find({
        tag: tag,
      })
      .sort({ createdAt: 1 })
      .toArray();

    res.json({ count: docs.length, data: docs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
