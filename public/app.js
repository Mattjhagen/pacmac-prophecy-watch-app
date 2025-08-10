
// app.js
// Fetch data from the backend and render cards. Includes starfield background + PWA hooks.

const elApp = document.getElementById('app');
const elSearch = document.getElementById('search');
const elTopicFilter = document.getElementById('topicFilter');
const elRefresh = document.getElementById('refresh');

let NEWS = [];
let VERSES = {};

// [SECTION: INIT]
init();
async function init(){
  drawStars();
  await loadVerses();
  await loadNews();

  // PWA hooks
  const reg = await registerServiceWorker();
  if (reg) subscribePush(reg);
  // Fallback auto-refresh every 5 minutes
  setInterval(async () => { await loadNews(); render(); }, 5 * 60 * 1000);

  populateFilters();
  render();
}

// [SECTION: LOADERS]
async function loadNews(){
  const res = await fetch('/api/news');
  const data = await res.json();
  NEWS = data.items || [];
}
async function loadVerses(){
  const res = await fetch('/api/verses');
  VERSES = await res.json();
}

// [SECTION: UI WIRING]
elSearch.addEventListener('input', () => render());
elTopicFilter.addEventListener('change', () => render());
elRefresh.addEventListener('click', async () => {
  location.reload();
});

function populateFilters(){
  const optAll = document.createElement('option');
  optAll.value = ''; optAll.textContent = 'All topics';
  elTopicFilter.appendChild(optAll);

  Object.entries(VERSES).forEach(([key, v]) => {
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = v.label;
    elTopicFilter.appendChild(opt);
  });
}

// [SECTION: RENDER]
function render(){
  const q = (elSearch.value || '').toLowerCase();
  const topic = elTopicFilter.value;

  const filtered = NEWS.filter(n => {
    const matchesQ = !q || `${n.title} ${n.source}`.toLowerCase().includes(q);
    const matchesTopic = !topic || (n.topics || []).includes(topic);
    return matchesQ && matchesTopic;
  });

  elApp.innerHTML = '';
  if (!filtered.length){
    const empty = document.createElement('div');
    empty.className = 'card';
    empty.innerHTML = `<h3>No results</h3><p class="meta">Try a different search or topic.</p>`;
    elApp.appendChild(empty);
    return;
  }

  filtered.slice(0, 160).forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';

    const topics = (item.topics || []).map(t => `<span class="badge">${VERSES[t]?.label || t}</span>`).join('');

    const firstTopic = (item.topics || [])[0];
    let scriptureHTML = '';
    if (firstTopic && VERSES[firstTopic]?.verses?.length){
      const v = VERSES[firstTopic].verses[0];
      scriptureHTML = `<div class="scripture"><div class="ref">${v.ref}</div><div>${escapeHTML(v.text)}</div></div>`;
    }

    const date = item.isoDate ? new Date(item.isoDate).toLocaleString() : '';

    card.innerHTML = `
      <h3>${escapeHTML(item.title)}</h3>
      <div class="meta">${escapeHTML(item.source)} ${date ? '• ' + date : ''}</div>
      <div class="badges">${topics}</div>
      <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="button">Read Source</a>
      ${scriptureHTML}
    `;
    elApp.appendChild(card);
  });
}

// [SECTION: UTIL]
function escapeHTML(s){
  return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Pretty starfield (no libraries)
function drawStars(){
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let w, h; let stars = [];
  const N = 180; // count

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = new Array(N).fill(0).map(() => ({
      x: Math.random()*w,
      y: Math.random()*h,
      r: Math.random()*1.8 + 0.2,
      s: Math.random()*0.8 + 0.2
    }));
  }
  resize();
  window.addEventListener('resize', resize);

  (function tick(){
    ctx.clearRect(0,0,w,h);
    for (const st of stars){
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(126,249,255,${0.4 + Math.sin(performance.now()*0.002*st.s)*0.3})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  })();
}

// [SECTION: PWA]
async function registerServiceWorker(){
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.register('/sw.js');
  navigator.serviceWorker.addEventListener('message', (evt) => {
    if (evt.data && evt.data.type === 'refresh') {
      loadNews().then(render);
    }
  });
  return reg;
}

async function subscribePush(reg){
  try {
    const vapidRes = await fetch('/api/vapidPublicKey');
    const { publicKey } = await vapidRes.json();
    if (!publicKey) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    });
  } catch (e) { console.warn('Push subscribe failed:', e.message); }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
