const CACHE_NAME = "showprep-v1";
const SHELL_ASSETS = ["/", "/cases", "/shows", "/scan", "/manifest.webmanifest", "/favicon-32x32.png", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {
      // Ignore install cache failures; runtime caching will still work.
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigation = request.mode === "navigate";
  const isStaticAsset =
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon-32x32.png" ||
    url.pathname === "/apple-touch-icon.png";
  const isApiGet = url.pathname.startsWith("/api/") && !url.pathname.includes("/import");

  if (!isNavigation && !isStaticAsset && !isApiGet) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => {
              // Ignore cache update failures.
            });
          }
          return response;
        })
        .catch(() => cached);

      if (cached) {
        return cached;
      }

      return networkFetch;
    })
  );
});
