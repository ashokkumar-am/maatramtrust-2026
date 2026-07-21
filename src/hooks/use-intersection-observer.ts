"use client";

import { useEffect, useRef } from "react";

/**
 * Observe an element and invoke `onIntersect` when it scrolls into view. Returns
 * a ref to attach to the sentinel element. Re-observes when `onIntersect` or the
 * options change; pass a stable callback (e.g. `useCallback`) and toggle
 * `enabled` to pause (e.g. while a fetch is in flight or all data is loaded).
 */
export function useIntersectionObserver<T extends Element>(
  onIntersect: () => void,
  options: { enabled?: boolean; rootMargin?: string; threshold?: number } = {},
) {
  const { enabled = true, rootMargin = "0px", threshold = 0 } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootMargin, threshold, onIntersect]);

  return ref;
}
