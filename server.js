require('dotenv').config();
// server.js
// Express server that fetches RSS feeds, tags items by topics, serves API, and handles Web Push.

const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const NodeCache = require('node-cache');
const webpush = require('web-push');

const app = express();
const parser = new Parser({ timeout: 15000 });
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // cache ~10 mins

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// [SECTION: WEB PUSH CONFIG]
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('⚠️ VAPID keys missing — push notifications disabled.');
}

// Keep subscriptions in memory (demo). In production, persist.
const SUBSCRIPTIONS = new Set();

// [SECTION: RSS FEEDS]
const FEEDS = [
  { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?best-topics=world&post_type=best' },
  { name: 'AP Top Stories', url: 'https://feeds.apnews.com/apf-topnews' },
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'NASA News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' }
];

// [SECTION: TOPIC KEYWORDS]
const TOPICS = {
  israel: {
    label: 'Israel & Jerusalem',
    keywords: ['israel', 'jerusalem', 'gaza', 'west bank', 'idf', 'hezbollah', 'hamas', 'iran'],
    verses: [
      { ref: 'Zechariah 12:2-3', text: 'Behold, I will make Jerusalem a cup of trembling... all the people of the earth be gathered together against it.' },
      { ref: 'Luke 21:20', text: 'And when ye shall see Jerusalem compassed with armies, then know that the desolation thereof is nigh.' }
    ]
  },
  wars: {
    label: 'Wars & Rumours of Wars',
    keywords: ['war', 'invasion', 'missile', 'artillery', 'offensive', 'strike', 'conflict', 'troops', 'border clash'],
    verses: [
      { ref: 'Matthew 24:6-7', text: 'And ye shall hear of wars and rumours of wars... For nation shall rise against nation...' }
    ]
  },
  disasters: {
    label: 'Earthquakes & Disasters',
    keywords: ['earthquake', 'famine', 'pestilence', 'outbreak', 'pandemic', 'wildfire', 'hurricane', 'flooding', 'volcano'],
    verses: [
      { ref: 'Matthew 24:7', text: '...and there shall be famines, and pestilences, and earthquakes, in divers places.' }
    ]
  },
  persecution: {
    label: 'Persecution of Believers',
    keywords: ['church attack', 'christian', 'pastor arrested', 'blasphemy law', 'religious persecution'],
    verses: [
      { ref: 'Matthew 24:9', text: 'Then shall they deliver you up to be afflicted, and shall kill you...' },
      { ref: 'Revelation 6:9', text: 'I saw under the altar the souls of them that were slain for the word of God...' }
    ]
  },
  deception: {
    label: 'Deception & False Christs',
    keywords: ['disinformation', 'deepfake', 'false christ', 'propaganda', 'messiah claimant', 'cult leader'],
    verses: [
      { ref: 'Matthew 24:4-5', text: 'Take heed that no man deceive you. For many shall come in my name...' }
    ]
  },
  tech_control: {
    label: 'Control Tech / Economy',
    keywords: ['digital id', 'central bank digital currency', 'cbdc', 'biometric', 'surveillance', 'cashless', 'implant', 'microchip', 'mark'],
    verses: [
      { ref: 'Revelation 13:16-17', text: 'And he causeth all... to receive a mark... that no man might buy or sell, save he that had the mark...' }
    ]
  },
  globalism: {
    label: 'Global Governance',
    keywords: ['global treaty', 'world health', 'un resolution', 'global tax', 'international court', 'one world'],
    verses: [
      { ref: 'Daniel 7:23-25', text: '...the fourth beast shall be the fourth kingdom upon earth... and shall devour the whole earth...' },
      { ref: 'Revelation 13:7', text: '...power was given him over all kindreds, and tongues, and nations.' }
    ]
  }
};

function inferTopics(text) {
  const found = new Set();
  const lower = (text || '').toLowerCase();
  for (const [key, cfg] of Object.entries(TOPICS)) {
    if (cfg.keywords.some(k => lower.includes(k))) found.add(key);
  }
  return [...found];
}

async function fetchAllFeeds() {
  const cacheKey = 'ALL_NEWS';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const results = [];
  for (const feed of FEEDS) {
    try {
      const data = await parser.parseURL(feed.url);
      for (const item of data.items || []) {
        const textBlob = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`;
        const topics = inferTopics(textBlob);
        results.push({
          source: feed.name,
          title: item.title || 'Untitled',
          link: item.link,
          isoDate: item.isoDate || item.pubDate || null,
          topics,
        });
      }
    } catch (e) {
      console.error('Feed error:', feed.name, e.message);
    }
  }

  // Sort newest first
  results.sort((a, b) => new Date(b.isoDate || 0) - new Date(a.isoDate || 0));
  cache.set(cacheKey, results);
  return results;
}

// [SECTION: API ROUTES]
app.get('/api/news', async (req, res) => {
  try {
    const news = await fetchAllFeeds();
    res.json({ items: news });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.get('/api/verses', (req, res) => {
  const payload = {};
  for (const [key, cfg] of Object.entries(TOPICS)) {
    payload[key] = { label: cfg.label, verses: cfg.verses };
  }
  res.json(payload);
});

// [SECTION: PUSH ROUTES]
app.get('/api/vapidPublicKey', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || null });
});

app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  SUBSCRIPTIONS.add(sub);
  res.json({ ok: true });
});

// [SECTION: NEWS NOTIFIER]
let lastNotifiedISO = null;

async function checkAndNotify() {
  try {
    const news = await fetchAllFeeds();
    if (!news.length) return;
    const newest = news[0];
    const newestISO = newest.isoDate ? new Date(newest.isoDate).toISOString() : null;

    if (!newestISO) return;

    if (!lastNotifiedISO || new Date(newestISO) > new Date(lastNotifiedISO)) {
      lastNotifiedISO = newestISO;
      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return; // push disabled

      const payload = JSON.stringify({
        title: 'Prophecy Watch — New headline',
        body: newest.title,
        url: newest.link || '/',
      });

      for (const sub of Array.from(SUBSCRIPTIONS)) {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (err) {
          console.warn('Push failed, removing subscription:', err?.statusCode || err?.message);
          SUBSCRIPTIONS.delete(sub);
        }
      }
    }
  } catch (e) {
    console.error('Notifier error:', e.message);
  }
}

// Check every 5 minutes
setInterval(checkAndNotify, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PacMac Prophecy Watch listening on http://localhost:${PORT}`));
