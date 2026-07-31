// ── SparkPro Field service worker ────────────────────────────────────────────
// Techs work in basements, crawlspaces, mechanical rooms and on rooftops. Losing
// signal must not mean losing the app. This caches the shell and static assets
// so a cold open works offline, while deliberately never caching Supabase —
// auth and tester data have to be live, and a stale cached session would be
// worse than an honest failure.

const CACHE = 'sparkpro-field-v1'

// '/sparkpro-field-live/sw.js' → '/sparkpro-field-live/'
const BASE = self.location.pathname.replace(/sw\.js$/, '')

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Cross-origin (Supabase, Google, model-lookup links) always goes to network.
  // Never serve a cached auth response.
  if (url.origin !== self.location.origin) return

  // Page loads: try network so a deployed update is picked up, but fall back to
  // the cached shell so the app still opens with no signal.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match(BASE + 'index.html')))
    )
    return
  }

  // Static assets are content-hashed by Vite, so a cache hit is always correct
  // for that exact filename — cache-first is safe and makes cold opens instant.
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit
      return fetch(req).then(res => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {})
        }
        return res
      })
    })
  )
})
