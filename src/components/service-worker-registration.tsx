"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (public/sw.js) after mount. Required for
 * the browser's install / "Open in app" experience. Renders nothing.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  }, []);

  return null;
}
