"use client";

import dynamic from "next/dynamic";

/*
 * WebGL, the three.js runtime and the sky itself only exist on the client, so
 * the scene is split into its own chunk and loaded with SSR off.
 */
const SpaceScene = dynamic(() => import("@/components/space-scene"), {
  ssr: false,
});

/*
 * A still of the sky, in CSS, painted with the rest of the markup.
 *
 * The canvas cannot be there on the first paint: the chunk it lives in is
 * fetched after hydration, and the sky is not drawn until WebGL has compiled
 * the shaders that draw it. That is most of a second of the page being up with
 * nothing behind it, and a flat colour there is read as the background rather
 * than as the sky not having arrived: the page opened black and then turned
 * purple.
 *
 * So this stands in. It is the same colours the nebula shader mixes, banked
 * where the cloud actually falls in the opening frame, which the sky is: the
 * noise is fixed, the sky starts unturned and the camera opens on the same
 * spot, so every visitor gets the same first picture and it can be matched
 * once. Close enough that the canvas fading up over it reads as the sky coming
 * into focus rather than as one picture replacing another. It is also what is
 * left if WebGL is unavailable.
 */
const OPENING_SKY = [
  // The three banks of lit cloud, read off where they actually fall in the
  // opening frame: one high and left of centre, one low on the left, and the
  // one behind the figure across the bottom of the right hand half.
  "radial-gradient(28% 34% at 36% 20%, rgba(158, 118, 216, 0.98), rgba(80, 51, 162, 0.6) 55%, transparent 84%)",
  "radial-gradient(21% 27% at 24% 80%, rgba(152, 112, 210, 0.95), rgba(72, 45, 152, 0.5) 55%, transparent 84%)",
  "radial-gradient(31% 27% at 71% 94%, rgba(178, 142, 222, 0.98), rgba(87, 57, 172, 0.55) 52%, transparent 84%)",
  // A thinner one along the top, where the cloud runs off the edge.
  "radial-gradient(30% 30% at 56% 2%, rgba(74, 46, 162, 0.6), transparent 78%)",
  // Empty sky behind all of it. The right hand edge is all but black, which is
  // most of what makes the cloud read as something in a space rather than as a
  // wash over the whole window.
  "linear-gradient(96deg, #1b0f66 0%, #0d0648 32%, #060331 52%, #030225 74%, #01011c 92%)",
].join(", ");

/**
 * The space the page floats in: pinned to the window, behind everything, and
 * unaffected by anything scrolling above it.
 */
export function SpaceBackdrop() {
  return (
    <div
      className="fixed inset-0 z-0 bg-[#0e0930]"
      style={{ backgroundImage: OPENING_SKY }}
    >
      <SpaceScene />
    </div>
  );
}
