// ── SparkPro Field service worker ────────────────────────────────────────────
// Techs work in basements, crawlspaces, mechanical rooms and on rooftops. Losing
// signal must not mean losing the app. This caches the shell and static assets
// so a cold open works offline, while deliberately never caching Supabase —
// auth and tester data have to be live, and a stale cached session would be
// worse than an honest failure.

// Both values are rewritten at build time by scripts/inject-precache.mjs.
// Written so this file is still VALID JAVASCRIPT unprocessed: self.__PRECACHE__
// is simply undefined then, so PRECACHE falls back to [] and the worker
// degrades to the old lazy-caching behaviour instead of throwing on load. A
// service worker that throws at parse time registers nothing and fails silently.
const CACHE    = 'sparkpro-field-vL3NwYXJrcHJv'
const PRECACHE = [
  "/sparkpro-field-live/",
  "/sparkpro-field-live/index.html",
  "/sparkpro-field-live/manifest.json",
  "/sparkpro-field-live/assets/field-splash-Ch7Rpo15.webp",
  "/sparkpro-field-live/assets/field-splash-mobile-DgrP-jD2.webp",
  "/sparkpro-field-live/assets/hex-bg-BH7n1x9W.webp",
  "/sparkpro-field-live/assets/index-BzvbDvVW.css",
  "/sparkpro-field-live/assets/index-DKv2oYxJ.js",
  "/sparkpro-field-live/assets/sp-Bp1IW3QM.webp",
  "/sparkpro-field-live/assets/sparkpro-bg-DHVfRdv9.webp"
]

// '/sparkpro-field-live/sw.js' → '/sparkpro-field-live/'
const BASE = self.location.pathname.replace(/sw\.js$/, '')

// Pull the shell and every hashed asset down on install, so the app opens
// offline even if its FIRST open is offline. Cached one-by-one on purpose:
// cache.addAll() rejects the whole batch if any single request fails, which
// would leave a tester with no cache at all because of one stale entry.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(
        PRECACHE.map(url => c.add(url).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
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
