/* OneSecCV service worker — app shell caching for the installed PWA.
 *
 * Rules of engagement:
 *   • navigations       → network first, cached shell as the offline fallback
 *   • built assets      → stale-while-revalidate (hashed filenames, safe)
 *   • icons / manifest  → cache first
 *   • everything else   → straight to the network, never cached
 *
 * Compilation, Gemini, Drive and Analytics calls are deliberately excluded:
 * a stale CV or a replayed API response would be worse than an error.
 */

const VERSION = 'v4.0.0'
const SHELL_CACHE  = `oneseccv-shell-${VERSION}`
const ASSET_CACHE  = `oneseccv-assets-${VERSION}`

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_URLS.map(u => new Request(u, { cache: 'reload' }))))
      .catch(() => {})            // a missing optional file must not block install
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('oneseccv-') && k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map(k => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  )
})

// Lets the page trigger an immediate update after a deploy.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

function isAsset(url) {
  return url.pathname.startsWith('/assets/') ||
         /\.(?:js|css|woff2?|png|svg|webp|ico)$/.test(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Only handle our own origin; Google APIs and the compiler go direct.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // ── Navigations: network first, shell fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone()
          caches.open(SHELL_CACHE).then(c => c.put('/index.html', copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match('/index.html').then(r => r || caches.match('/'))),
    )
    return
  }

  // ── Assets: stale-while-revalidate ──
  if (isAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async cache => {
        const cached = await cache.match(request)
        const network = fetch(request)
          .then(res => {
            if (res.ok && res.type === 'basic') cache.put(request, res.clone())
            return res
          })
          .catch(() => cached)
        return cached || network
      }),
    )
  }
})
