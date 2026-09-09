"use client";

import dynamic from "next/dynamic";

/*
 * WebGL, the three.js runtime and the sky itself only exist on the client, so
 * the scene is split into its own chunk and loaded with SSR off.
 */
const SpaceScene = dynamic(() => import("@/components/space-scene"), {
  ssr: false,
});

/**
 * The space the page floats in: pinned to the window, behind everything, and
 * unaffected by anything scrolling above it.
 *
 * The colour on the wrapper is not a placeholder for a failure, it is the first
 * frame. It stands in for the sky between the first paint and the moment the
 * canvas has one, so the page opens dark instead of flashing white, and it is
 * what remains if WebGL is unavailable.
 */
export function SpaceBackdrop() {
  return (
    <div className="fixed inset-0 z-0 bg-[#0a0620]">
      <SpaceScene />
    </div>
  );
}
