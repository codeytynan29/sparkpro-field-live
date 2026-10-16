// Together service worker: push notifications, plus opening with no signal.
//
// Offline rule: the network always wins. A file is only ever served from this
// cache when the network request fails outright (no signal). An earlier
// version served cached files first and Safari ended up mixing two versions of
// the app (a black screen); that can't happen when online requests never
// touch the cache. Every app file is versioned (?v=…), so the cached index
// and the cached bundle it points at always belong together.
const CACHE = 'together-offline-1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  // clear the caches older versions left behind
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('together-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.includes('/together/')) return
  e.respondWith(fetch(req).then(res => {
    if (res.ok && res.type === 'basic') {
      const copy = res.clone()
      caches.open(CACHE).then(async c => {
        // keep one copy per file: drop older ?v= versions of the same path
        if (req.mode !== 'navigate') for (const k of await c.keys()) { const u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) c.delete(k) }
        c.put(req.mode === 'navigate' ? new Request(url.pathname) : req, copy)
      }).catch(() => {})
    }
    return res
  }).catch(async () => {
    const c = await caches.open(CACHE)
    if (req.mode === 'navigate') return (await c.match(url.pathname)) || (await c.match(url.pathname.replace(/[^/]*$/, ''))) || Response.error()
    return (await c.match(req)) || Response.error()
  }))
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
