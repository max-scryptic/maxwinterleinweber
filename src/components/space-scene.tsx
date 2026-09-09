"use client";

import { Suspense, lazy, useLayoutEffect, useRef, useState } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, PerspectiveCamera } from "three";

import { Nebula } from "@/components/nebula";
import { Starfield } from "@/components/starfield";
import { Button } from "@/components/ui/button";
import { REDUCED_MOTION, WIDE, useMediaQuery } from "@/hooks/use-media-query";
import {
  CAMERA_RISE,
  CENTRE,
  FOV,
  OPENING,
  OPENING_PITCH,
  VIEWS,
  type ViewId,
} from "@/lib/figure";

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

/*
 * Slides the camera's frustum sideways so that the figure, which sits at the
 * origin, projects into the middle of the right hand half rather than into the
 * middle of the window.
 *
 * This is a change to the projection, not a move: the figure holds its place on
 * screen however far the camera is orbited around it. Offsetting the orbit
 * target instead would not, because that offset would swing round with the
 * camera and carry the figure across the page with it.
 *
 * It belongs to the canvas rather than to the figure, even though it is the
 * figure it is framing. Left inside the chunk the figure is loaded from, it was
 * applied a second or so after the page opened, and the sky, which is drawn
 * through the same camera, visibly slid a quarter of the window sideways when
 * it arrived.
 */
function ColumnFraming() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    // The full size is the viewport's own, so nothing is scaled: only the
    // window onto the frustum moves. Negative, because putting the subject to
    // the right of centre means looking at a region that starts left of it.
    camera.setViewOffset(
      size.width,
      size.height,
      (0.5 - CENTRE) * size.width,
      0,
      size.width,
      size.height,
    );
    camera.updateProjectionMatrix();

    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
  }, [camera, size]);

  return null;
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
          // Aimed at the middle of the figure from the first frame. Giving a
          // rotation is also what stops the canvas from pointing the camera at
          // the origin itself, which is the floor the figure would be standing
          // on and several degrees below where it is about to be looking.
          rotation: [OPENING_PITCH, 0, 0],
          near: NEAR,
          far: FAR,
        }}
      >
        <Sky still={still} />

        {/* Only where there is a figure to frame: on a narrow window the sky
            is the whole page and is left centred on it. */}
        {wide ? <ColumnFraming /> : null}

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
