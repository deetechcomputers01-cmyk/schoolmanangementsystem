const CACHE_NAME = "school-ms-v1";
const STATIC_ASSETS = ["/", "/login", "/dashboard", "/students", "/attendance", "/fees", "/gradebook", "/timetable", "/manifest.json"];

// Live Offline & Sync settings (Settings > Offline & Sync), refreshed periodically
// from the same /api/settings endpoint the Settings screen reads/writes — so an
// admin's change takes effect here without a new deploy.
let offlineConfig = { offlineModeEnabled: true, cacheSizeMb: 50 };
let configFetchedAt = 0;
const CONFIG_TTL_MS = 5 * 60 * 1000;

async function refreshConfig() {
  if (Date.now() - configFetchedAt < CONFIG_TTL_MS) return offlineConfig;
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      const extra = data.extra || {};
      offlineConfig = {
        offlineModeEnabled: extra.offlineModeEnabled !== false,
        cacheSizeMb: Number(extra.cacheSizeMb) || 50,
      };
      configFetchedAt = Date.now();
    }
  } catch {
    // Offline or logged out — keep the last-known config.
  }
  return offlineConfig;
}

// Byte-accurate accounting would require reading every cached response body;
// this approximates entry count from the configured MB budget instead (~50KB/entry).
async function enforceCacheLimit(cache, maxMb) {
  const maxEntries = Math.max(Math.floor((maxMb * 1024 * 1024) / 50000), 10);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toEvict = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toEvict.map((k) => cache.delete(k)));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    refreshConfig().then((config) => {
      if (!config.offlineModeEnabled) {
        // Offline mode disabled by the admin — plain passthrough, no caching/fallback.
        return fetch(request);
      }
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
            enforceCacheLimit(cache, config.cacheSizeMb);
          });
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/dashboard")));
    })
  );
});
