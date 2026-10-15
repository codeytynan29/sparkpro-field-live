// Together service worker: cache the app shell so it opens with no signal.
// Navigations go network-first so a new deploy is picked up; Supabase and the
// CDN are cross-origin and always go straight to the network.
const CACHE = 'together-v2'
const SHELL = ['./', './index.html', './app.css', './app.js', './content.js', './sync.js', './config.js', './manifest.json', './icon.svg']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('together-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  // network first, cache fallback — files aren't content-hashed, so freshness wins
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) }
      return res
    }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  )
})
