"use client";

import { useCallback, useSyncExternalStore } from "react";

import dynamic from "next/dynamic";

import { Spinner } from "@/components/ui/spinner";

// Tailwind's md breakpoint, which is where the page splits into two columns and
// the figure gets a column of its own to stand in.
const WIDE = "(min-width: 48rem)";

function useMediaQuery(query: string) {
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
    // On the server there is no viewport to measure. Reporting false there and
    // for the first client render keeps hydration matching; the subscription
    // corrects it immediately afterwards.
    () => false,
  );
}

function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-6 text-neutral-400" />
    </div>
  );
}

/*
 * WebGL, the three.js runtime and the model itself only exist on the client, so
 * the scene is split into its own chunk and loaded with SSR off. The media
 * query gates that chunk as well: below md the column it lives in is not
 * rendered at all, and a phone should not be paying for a canvas it will never
 * see.
 */
const MannequinScene = dynamic(() => import("./mannequin-scene"), {
  ssr: false,
  loading: Loading,
});

export function MannequinViewer() {
  const isWide = useMediaQuery(WIDE);

  return (
    // The canvas sizes itself against this box, so it is pinned rather than
    // left to grow: a canvas that measures its own parent can otherwise walk
    // the parent's height upward one resize at a time.
    <div className="relative h-full w-full">
      <div className="absolute inset-0">{isWide ? <MannequinScene /> : null}</div>
    </div>
  );
}
