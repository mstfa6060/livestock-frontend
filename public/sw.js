// Livestock Trading PWA Service Worker
// Handles: caching, offline fallback, push notifications

const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Offline fallback page (static HTML, always cached on install)
const OFFLINE_PAGE = "/offline.html";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  OFFLINE_PAGE,
  "/manifest.json",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
];

// Max items in each dynamic cache
const DYNAMIC_CACHE_LIMIT = 50;
const IMAGE_CACHE_LIMIT = 100;

// ─── Helpers ───────────────────────────────────────────────

function isNavigationRequest(request) {
  return request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|eot|otf)(\?.*)?$/i.test(url.pathname);
}

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)(\?.*)?$/i.test(url.pathname);
}

function isApiRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("dev-api.livestock-trading.com") ||
    url.hostname.includes("api.livestock-trading.com")
  );
}

function isNextDataRequest(url) {
  return url.pathname.startsWith("/_next/data/");
}

function isNextStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isSentryOrAnalytics(url) {
  return (
    url.hostname.includes("sentry.io") ||
    url.hostname.includes("cloudflareinsights.com") ||
    url.pathname.startsWith("/monitoring")
  );
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Delete oldest entries (FIFO)
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// ─── Cache Strategies ──────────────────────────────────────

/** Cache-first: check cache, fall back to network, update cache */
async function cacheFirst(request, cacheName, maxItems) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (maxItems) trimCache(cacheName, maxItems);
    }
    return response;
  } catch {
    return new Response("", { status: 408, statusText: "Offline" });
  }
}

/** Stale-while-revalidate: return cached, update in background */
async function staleWhileRevalidate(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        if (maxItems) trimCache(cacheName, maxItems);
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

/** Network-first: try network, fall back to cache */
async function networkFirst(request, cacheName, maxItems) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (maxItems) trimCache(cacheName, maxItems);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || null;
  }
}

// ─── Install ───────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin analytics/monitoring
  if (isSentryOrAnalytics(url)) return;

  // API requests: network-only (no caching)
  if (isApiRequest(url)) return;

  // Next.js build-hashed static assets (/_next/static/): cache-first (immutable)
  if (isNextStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Next.js data requests: network-first with cache fallback
  if (isNextDataRequest(url)) {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT).then(
        (response) => response || caches.match(OFFLINE_PAGE)
      )
    );
    return;
  }

  // Static assets (JS, CSS, fonts): stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Images: cache-first with size limit
  if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, IMAGE_CACHE_LIMIT));
    return;
  }

  // HTML navigation requests: network-first, offline fallback
  if (isNavigationRequest(request)) {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT).then(
        (response) => response || caches.match(OFFLINE_PAGE)
      )
    );
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT));
});

// ─── Push Notifications ────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = { title: "Livestock Trading", body: "", url: "/" };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-192x192.svg",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});

// ─── Background Sync (future use) ─────────────────────────

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
