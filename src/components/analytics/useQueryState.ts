"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Explorer state in the URL, without breaking static export.
 *
 * `useSearchParams()` would force every page carrying an explorer to bail out
 * of static rendering (or to be wrapped in Suspense and render twice), so this
 * reads `window.location.search` after mount instead. The first paint is
 * therefore the default state — which is what the statically exported HTML
 * contains — and the URL is applied on hydration. That keeps the pages
 * pre-rendered and keeps a shared link working.
 *
 * Writes go through the History API rather than the router, because a router
 * navigation would remount the page and lose scroll position on every chip
 * click. `push: true` adds a history entry, so Back returns to the previous
 * selection; secondary toggles pass `push: false` and replace instead, so a
 * dozen layer switches don't bury the page a dozen entries deep. `popstate`
 * is listened to either way, so Back and Forward both re-apply state.
 */
export type QueryValues = Record<string, string | undefined>;

function readParams(keys: readonly string[]): QueryValues {
  if (typeof window === "undefined") return {};
  const search = new URLSearchParams(window.location.search);
  const out: QueryValues = {};
  for (const key of keys) {
    const value = search.get(key);
    if (value) out[key] = value;
  }
  return out;
}

export function useQueryState(keys: readonly string[]) {
  const keyList = useMemo(() => [...keys], [keys]);
  const [values, setValues] = useState<QueryValues>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValues(readParams(keyList));
    setHydrated(true);

    const onPop = () => setValues(readParams(keyList));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // keyList is stable for a given call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setQuery = useCallback(
    (next: QueryValues, options?: { push?: boolean }) => {
      setValues((prev) => {
        const merged: QueryValues = { ...prev, ...next };

        if (typeof window !== "undefined") {
          const search = new URLSearchParams(window.location.search);
          for (const key of keyList) {
            const value = merged[key];
            if (value) search.set(key, value);
            else search.delete(key);
          }
          const query = search.toString();
          const url = `${window.location.pathname}${query ? `?${query}` : ""}${
            window.location.hash
          }`;
          if (options?.push) window.history.pushState(null, "", url);
          else window.history.replaceState(null, "", url);
        }

        return merged;
      });
    },
    [keyList],
  );

  return { values, setQuery, hydrated } as const;
}

/** Comma-separated list params (`?compare=a,b,c`), de-duplicated and clamped. */
export function parseList(
  value: string | undefined,
  allowed: readonly string[],
  limit = 3,
): string[] {
  if (!value) return [];
  const seen: string[] = [];
  for (const item of value.split(",")) {
    const id = item.trim();
    if (id && allowed.includes(id) && !seen.includes(id)) seen.push(id);
    if (seen.length >= limit) break;
  }
  return seen;
}

/** A single param validated against a vocabulary, or undefined. */
export function parseOne(
  value: string | undefined,
  allowed: readonly string[],
): string | undefined {
  return value && allowed.includes(value) ? value : undefined;
}
