// Together service worker: cache the app shell so it opens with no signal.
// Navigations go network-first so a new deploy is picked up; Supabase and the
// CDN are cross-origin and always go straight to the network.
const CACHE = 'together-v5'
const SHELL = ['./', './index.html', './app.css?v=6', './app.js?v=6', './content.js?v=6', './sync.js?v=6', './config.js?v=6', './manifest.json', './icon.svg']

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
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) }
      return res
    }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  )
})

// ── Push: daily tips and partner check-ins ──────────────────────────────────
self.addEventListener('push', e => {
  let msg = { title: 'Together', body: 'You have a new update.', tag: 'together' }
  try { msg = { ...msg, ...e.data.json() } } catch {}
  e.waitUntil(self.registration.showNotification(msg.title, {
    body: msg.body, tag: msg.tag, icon: 'icon-192.png', badge: 'icon-192.png', data: { url: './' },
  }))
})
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.includes('/together/'))
    return open ? open.focus() : self.clients.openWindow('./')
  }))
})
