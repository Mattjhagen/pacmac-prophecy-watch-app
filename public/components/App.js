
import React, { useState, useEffect } from 'react';
import NewsGrid from './NewsGrid';

const FEEDS = [
  // Official feeds
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' }, // official
  { name: 'NASA Breaking News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' }, // official (be gentle)
  // Proxies via Google News RSS (stable and rate-friendly)
  { name: 'Reuters (via Google News)', url: 'https://news.google.com/rss/search?q=site:reuters.com+when:7d&hl=en-US&gl=US&ceid=US:en' },
  { name: 'AP (via Google News)', url: 'https://news.google.com/rss/search?q=site:apnews.com+when:7d&hl=en-US&gl=US&ceid=US:en' },
  // A couple more solid, official feeds to diversify:
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss' }
];

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

function getAIVerse(verses) {
  return verses[Math.floor(Math.random() * verses.length)];
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
    const data = await response.json();
    if (data.status !== 'ok') throw new Error('RSS fetch failed');
    return data.items.map(item => {
      const textBlob = `${item.title || ''} ${item.description || ''}`;
      const topics = inferTopics(textBlob);
      let verse = null;
      let allVerses = [];
      if (topics.length > 0) {
        allVerses = topics.flatMap(t => TOPICS[t].verses);
      } else {
        allVerses = Object.values(TOPICS).flatMap(t => t.verses);
      }
      if (allVerses.length > 0) {
        verse = getAIVerse(allVerses);
      }
      return {
        source: feed.name,
        title: item.title || 'Untitled',
        link: item.link,
        isoDate: item.pubDate || null,
        topics,
        verse,
      };
    });
  } catch (e) {
    console.error('Feed error:', feed.name, e.message);
    return [];
  }
}

async function fetchAllFeeds() {
  const results = [];
  for (const feed of FEEDS) {
    const items = await fetchFeed(feed);
    results.push(...items);
  }
  results.sort((a, b) => new Date(b.isoDate || 0) - new Date(a.isoDate || 0));
  return results;
}

const App = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetchAllFeeds().then(setArticles);
  }, []);

  return (
    <div>
      <h1>PacMac Prophecy Watch</h1>
      <NewsGrid articles={articles} />
    </div>
  );
};

export default App;
