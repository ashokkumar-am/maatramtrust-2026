"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

/**
 * Infinite-scroll + search state for a paginated admin/public list. Seeds from
 * the SSR first page, then appends subsequent pages (deduped by `id`) as the
 * sentinel scrolls into view. Typing in the search box (debounced) refetches
 * page 1 for the new query. Provide a stable `fetchPage(page, query)` (wrap in
 * `useCallback`) and attach `sentinelRef` to an element below the list.
 */
export function useInfiniteList<T extends { id: string }>(opts: {
  initialItems: T[];
  pageSize: number;
  fetchPage: (page: number, query: string) => Promise<T[]>;
  /** Change to refetch page 1 — encode any extra list filters here so a
   * filter change resets the list (fetchPage reads the filters from closure). */
  refreshKey?: string;
}) {
  const { initialItems, pageSize, fetchPage, refreshKey } = opts;
  const [items, setItems] = useState<T[]>(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialItems.length < pageSize);
  const [query, setQuery] = useState("");

  // The query/filter key currently reflected in `items` (avoids stale
  // closures in loadMore).
  const activeQuery = useRef("");
  const activeKey = useRef(refreshKey);

  const loadMore = useCallback(async () => {
    // A query/filter change is pending (debounced reset hasn't landed yet) —
    // appending a next page for the new filter onto the old list would skip
    // pages, so wait for the reset.
    if (query !== activeQuery.current || refreshKey !== activeKey.current) {
      return;
    }
    setLoading(true);
    try {
      const next = page + 1;
      const fetched = await fetchPage(next, activeQuery.current);
      // The reset won while this page was in flight — discard the stale result.
      if (query !== activeQuery.current || refreshKey !== activeKey.current) {
        return;
      }
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...fetched.filter((f) => !seen.has(f.id))];
      });
      setPage(next);
      if (fetched.length < pageSize) setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, fetchPage, query, refreshKey]);

  // Re-seed when the server page revalidates (e.g. `router.refresh()` after a
  // row delete) — `initialItems` then arrives with a new identity. With a
  // search/filter active the SSR seed (unfiltered page 1) doesn't apply, so
  // refetch the current view's first page instead.
  const seed = useRef(initialItems);
  useEffect(() => {
    if (seed.current === initialItems) return;
    seed.current = initialItems;
    let cancelled = false;
    (async () => {
      const filtered = activeQuery.current !== "" || Boolean(activeKey.current);
      const fresh = filtered
        ? await fetchPage(1, activeQuery.current).catch(() => null)
        : initialItems;
      if (cancelled || fresh === null) return;
      setItems(fresh);
      setPage(1);
      setDone(fresh.length < pageSize);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialItems, fetchPage, pageSize]);

  // Debounced search: when the query (or filter key) changes, refetch page 1.
  useEffect(() => {
    if (query === activeQuery.current && refreshKey === activeKey.current) {
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const fetched = await fetchPage(1, query);
        activeQuery.current = query;
        activeKey.current = refreshKey;
        setItems(fetched);
        setPage(1);
        setDone(fetched.length < pageSize);
      } catch {
        setDone(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, refreshKey, fetchPage, pageSize]);

  const sentinelRef = useIntersectionObserver<HTMLDivElement>(loadMore, {
    enabled: !done && !loading,
    rootMargin: "400px",
  });

  return { items, sentinelRef, loading, done, query, setQuery };
}
