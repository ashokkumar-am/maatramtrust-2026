// Minimal service worker so the site meets PWA installability criteria
// (Chrome's "Install" / "Open in app" prompt). Network requests pass
// through untouched; add caching here if offline support is ever needed.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
