# PacMac Prophecy Watch — PWA with Push Notifications & Improved Feeds

*A space-themed Progressive Web App that surfaces current events and shows possible correlations to biblical end-times passages (KJV public domain), now with resilient feeds and push notifications.*

---

## 🌌 Features
- **Progressive Web App** (PWA): Installable, offline-capable, and auto-refreshes.
- **Push Notifications**: Alerts for new headlines matching prophetic topics.
- **Feed Error Handling**: Retries, backoff, and proxies to avoid rate limits and 404s.
- **Customizable Topics**: Simple keyword → verse mapping for transparent filtering.
- **Space Theme**: Canvas starfield background for cosmic vibes.

---

## 📰 RSS Feed Sources
**Official feeds:**
- BBC World News – [`https://feeds.bbci.co.uk/news/world/rss.xml`](https://feeds.bbci.co.uk/news/world/rss.xml)
- NASA Breaking News – [`https://www.nasa.gov/rss/dyn/breaking_news.rss`](https://www.nasa.gov/rss/dyn/breaking_news.rss)

**Proxied via Google News RSS:**
- Reuters – `https://news.google.com/rss/search?q=site:reuters.com+when:7d&hl=en-US&gl=US&ceid=US:en`
- AP – `https://news.google.com/rss/search?q=site:apnews.com+when:7d&hl=en-US&gl=US&ceid=US:en`

**Extra official feeds:**
- Al Jazeera – [`https://www.aljazeera.com/xml/rss/all.xml`](https://www.aljazeera.com/xml/rss/all.xml)
- The Guardian World – [`https://www.theguardian.com/world/rss`](https://www.theguardian.com/world/rss)

---

## 🛠 Resilience Improvements
- **15 min cache** per feed to avoid hammering sources.
- **Randomized User-Agent** to reduce blocking.
- **Jittered backoff** on errors (0.5–1.2s per retry).
- **Retries** for `429`, `ENOTFOUND`, and timeouts.
- **Feed staggering** (250ms between requests) to spread load.

---

📜 Theology Posture
This app is a study tool, not a prophetic ticker. It surfaces possible correlations between world events and Scripture, for Berean-style examination (Acts 17:11).

🧭 Roadmap
Feed health dashboard.

User-editable topic list in the UI.

More granular push notification filters.

📄 License
Code: MIT

Scripture: KJV (public domain)
