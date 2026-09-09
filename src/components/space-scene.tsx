"use client";

import { Suspense, lazy, useRef, useState } from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import { Group } from "three";

import { Nebula } from "@/components/nebula";
import { Starfield } from "@/components/starfield";
import { Button } from "@/components/ui/button";
import { REDUCED_MOTION, WIDE, useMediaQuery } from "@/hooks/use-media-query";
import { CAMERA_RISE, FOV, OPENING, VIEWS, type ViewId } from "@/lib/figure";

/*
 * The one canvas the whole page sits on. It covers the window rather than a
 * column, so the sky is continuous behind the card as well as beside it, and
 * the figure is in the same scene as the sky rather than composited over a
 * picture of one.
 */

// The figure, three.js's loaders and a three megabyte model, split off so that
// a phone, which is shown the sky but not the figure, never fetches any of it.
const MannequinRig = lazy(() => import("@/components/mannequin"));

// Radians per second: one revolution of the sky roughly every twelve minutes.
// Slow enough that it is only noticeable by having changed.
const SKY_TURN = (Math.PI * 2) / 720;

// Far enough for the sky sphere and every star to be inside the frustum, near
// enough that the figure can still be zoomed right up to.
const NEAR = 0.1;
const FAR = 1500;

function Sky({ still }: { still: boolean }) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (still || !group.current) return;
    // Delta is clamped for the same reason as the figure's turn: a tab coming
    // back from the background reports the whole time it was away.
    group.current.rotation.y += SKY_TURN * Math.min(delta, 0.1);
  });

  return (
    // Tilted, so the band of cloud runs across the page on a slant instead of
    // sitting level with the top of the window.
    <group ref={group} rotation={[0.22, 0, 0.14]}>
      <Nebula still={still} />
      <Starfield still={still} />
    </group>
  );
}

export default function SpaceScene() {
  const wide = useMediaQuery(WIDE);
  const still = useMediaQuery(REDUCED_MOTION);

  const [view, setView] = useState<ViewId>("full");

  // Bumped on every press so that pressing the active button re-frames rather
  // than doing nothing.
  const [fitId, setFitId] = useState(0);

  function select(next: ViewId) {
    setView(next);
    setFitId((count) => count + 1);
  }

  return (
    <div className="relative h-full w-full">
      <Canvas
        // The only hint that the figure is more than a picture. Nothing to grab
        // on a narrow window, where the figure is not there to drag.
        className={wide ? "cursor-grab active:cursor-grabbing" : undefined}
        // The sky fills every pixel, so there is nothing to composite against
        // and no reason to pay for an alpha channel.
        gl={{ alpha: false, antialias: true }}
        // Full device pixel ratio over the whole window is four times the
        // fragments of a half-width canvas, and most of them are sky. Below two
        // the noise stays smooth and the stars stay round.
        dpr={[1, 1.75]}
        camera={{
          fov: FOV,
          position: [0, OPENING.focus + CAMERA_RISE, OPENING.distance],
          near: NEAR,
          far: FAR,
        }}
      >
        <Sky still={still} />

        {/* Suspends twice over: once on the chunk, once on the model inside
            it. Both resolve into the sky, which is already drawn. */}
        {wide ? (
          <Suspense fallback={null}>
            <MannequinRig view={view} fitId={fitId} still={still} />
          </Suspense>
        ) : null}
      </Canvas>

      {/* Over the right hand half, where the figure is. The row spans that half
          so it passes clicks through everywhere the buttons themselves are not;
          otherwise it would swallow drags along the whole width of the strip. */}
      {wide ? (
        <div className="pointer-events-none absolute right-0 bottom-8 flex w-1/2 justify-center gap-2">
          {VIEWS.map((option) => (
            <Button
              key={option.id}
              variant="ghost"
              size="sm"
              className={
                option.id === view
                  ? "pointer-events-auto bg-white text-neutral-900 hover:bg-white/90 hover:text-neutral-900"
                  : "pointer-events-auto border border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
              }
              // The button says which framing is showing, not just which one
              // the next press would give, so it is a state to announce.
              aria-pressed={option.id === view}
              onClick={() => select(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
