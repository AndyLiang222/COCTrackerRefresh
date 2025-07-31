require('dotenv').config();
const cron = require('node-cron');
const { Client } = require('clashofclans.js');
const { MongoClient } = require('mongodb');

// Load environment variables
const email = process.env.COC_EMAIL;
const password = process.env.COC_PASSWORD;
const mongoUri = process.env.MONGODB_URI;
const keyName = process.env.COC_KEY_NAME || 'Default'; 
const playerTags = "#2PRU9Q8RQ".split(',').map(tag => tag.trim()) || [];

console.log(email, password, mongoUri, keyName, playerTags);

const coc = new Client();
const mongoClient = new MongoClient(mongoUri);

async function runJob() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db();
    const statsCollection = db.collection('versus_stats');
    const playersCollection = await db.collection('players');

    for (const tag of playerTags) {
      try {
        const player = await coc.getPlayer(tag);
        const now = new Date();

        const doc = {
          tag: player.tag,
          versusTrophies: player.builderBaseTrophies,
          createdAt: now,              // ISO Date
          createdAtUnix: now.getTime() // Unix timestamp (ms)
        };

        await statsCollection.insertOne(doc);

        const filter = { tag: player.tag };
        const update = {
          $set: {
            name: player.name,
            bestBuilderBaseTrophies: player.bestBuilderBaseTrophies,
            createdAt: now.toISOString(),
            createdAtUnix: now.getTime()
          }
        };
        const options = { upsert: true };

        await playersCollection.updateOne(filter, update, options);

        console.log(`[${now.toISOString()}] Inserted data for ${player.name} (${player.tag})`);

      } catch (err) {
        console.error(`❌ Error fetching data for tag ${tag}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
  } finally {
    await mongoClient.close();
  }
}

async function init() {
  try {
    if (!email || !password || !mongoUri || playerTags.length === 0) {
      console.error('Missing required environment variables.');
      process.exit(1);
    }

    await coc.login({
      email,
      password,
      keyName,
      keyCount: 1,
      cache: true,
    });

    console.log('✅ Logged in to Clash of Clans API');

    cron.schedule('*/2 * * * *', () => {
      console.log(`[${new Date().toISOString()}] Running job...`);
      runJob();
    });

  } catch (err) {
    console.error('❌ Login error:', err.message);
    process.exit(1);
  }
}

init();
