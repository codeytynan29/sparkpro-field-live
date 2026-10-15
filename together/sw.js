// Together service worker: notifications only.
// It deliberately has no fetch handler. An earlier version served the app's
// files from its own cache, and Safari could end up stuck between versions
// (a black screen). Now every file comes straight from the network/browser
// cache, and this worker only exists so push notifications can arrive.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  // clear every cache earlier versions left behind
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('together-')).map(k => caches.delete(k))))
    .then(() => self.clients.claim()))
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
