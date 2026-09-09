"use client";

import { useCallback, useSyncExternalStore } from "react";

// Tailwind's md breakpoint, which is where the page splits into two columns and
// the figure gets a side of its own to float in.
export const WIDE = "(min-width: 48rem)";

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Subscribes to a CSS media query.
 *
 * On the server there is no viewport to measure. Reporting false there and for
 * the first client render keeps hydration matching; the subscription corrects
 * it immediately afterwards.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
