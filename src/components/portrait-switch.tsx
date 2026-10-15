"use client";

import { Box, Camera } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

import portrait from "@/assets/max.png";
import { ASPECT, FIGURES } from "@/lib/figure";
import { warm } from "@/lib/warm";

/*
 * WebGL, the three.js runtime and the sky itself only exist on the client, so
 * the scene is split into its own chunk and loaded with SSR off. Nothing of it
 * is fetched until the model view is asked for: the photo is what the page
 * opens on, and most visitors never leave it.
 */
const SpaceScene = dynamic(() => import("@/components/space-scene"), {
  ssr: false,
});

/*
 * Everything the model view needs, fetched on the way to the press rather than
 * on it: the scene's chunk, the figure's chunk with three.js inside it, and the
 * model the frame opens on. A pointer arriving on the switch is most of a
 * second of warning, which is about what the model needs.
 */
function prefetch() {
  void import("@/components/space-scene");
  void import("@/components/figure-stage");
  warm(FIGURES[0].versions[0].url);
}

// How long the frame takes to change shape, and the photo to fade over the sky
// or back. One duration for both, so the circle opening into the rectangle and
// the picture changing inside it read as one movement.
const SWAP_MS = 500;

/*
 * What the cut-out photo stands on: a soft, warm grey lit from above, so the
 * portrait reads as a studio shot rather than as a head on a blank page.
 */
const PHOTO_BACKDROP =
  "radial-gradient(120% 90% at 50% 18%, #f3f1ee 0%, #e3dfda 55%, #d1cbc4 100%)";

/*
 * What the frame shows while the scene's chunk and shaders are on their way: a
 * still of the same sky, deep indigo with a glow of the nebula's violet low in
 * the middle where the figure is about to stand. Close enough that the canvas
 * fading up over it reads as the sky coming into focus, and what is left if
 * WebGL is unavailable.
 */
const FRAME_SKY = [
  "radial-gradient(70% 45% at 50% 70%, rgba(158, 118, 216, 0.55), rgba(80, 51, 162, 0.25) 55%, transparent 80%)",
  "radial-gradient(55% 35% at 25% 15%, rgba(110, 76, 190, 0.45), transparent 80%)",
  "linear-gradient(170deg, #1b0f66 0%, #0d0648 45%, #030225 100%)",
].join(", ");

type Mode = "photo" | "model";

function segment(active: boolean) {
  return `inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none ${
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:text-foreground"
  }`;
}

/**
 * The portrait beside the introduction, and the switch that turns it into the
 * model view: the circle opens out into a small rectangle of sky with the 3D
 * scans of Max standing in it, and closes back to the photo.
 */
export function PortraitSwitch() {
  const [mode, setMode] = useState<Mode>("photo");
  const model = mode === "model";

  /*
   * Whether the scene is on the page, which is not quite the same as whether it
   * is being shown. It goes up the moment the model view is asked for, and
   * comes down only once the photo has finished fading back over it, so the
   * sky is still there to fade from. Coming down at all is the point: a canvas
   * left mounted under the photo would hold a WebGL context and a render loop
   * for something nobody can see.
   */
  const [scene, setScene] = useState(false);

  useEffect(() => {
    if (model) return;

    const timer = setTimeout(() => setScene(false), SWAP_MS);
    return () => clearTimeout(timer);
  }, [model]);

  function choose(next: Mode) {
    setMode(next);
    if (next === "model") setScene(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The frame, a circle around the photo and a rectangle around the sky,
          one element whose height and corners change between the two. Its
          width is set once in --w, so the rectangle's height can be worked out
          from the same aspect the camera is framed against: the box and the
          shot inside it cannot disagree about their shape. */}
      <div
        className="relative w-[var(--w)] overflow-hidden shadow-[0_28px_60px_-30px_rgba(20,16,40,0.5)] transition-[height,border-radius] ease-[cubic-bezier(0.22,1,0.36,1)] [--w:min(18rem,calc(100vw_-_3rem))] md:[--w:clamp(15rem,26vw,22rem)]"
        style={{
          height: model ? `calc(var(--w) / ${ASPECT})` : "var(--w)",
          borderRadius: model ? "1.75rem" : "50%",
          transitionDuration: `${SWAP_MS}ms`,
        }}
      >
        {/* The sky underneath, so that the photo fading out reveals it rather
            than the two crossing over a moment of nothing. */}
        {scene ? (
          <div
            className="absolute inset-0 bg-[#0e0930]"
            style={{ backgroundImage: FRAME_SKY }}
          >
            <SpaceScene />
          </div>
        ) : null}

        {/* The photo on top, faded away rather than removed, and out of the
            pointer's way while it is, so a drag reaches the canvas beneath. */}
        <div
          aria-hidden={model}
          className={`absolute inset-0 transition-opacity ${model ? "pointer-events-none opacity-0" : "opacity-100"}`}
          style={{ background: PHOTO_BACKDROP, transitionDuration: `${SWAP_MS}ms` }}
        >
          <Image
            src={portrait}
            alt="Max Winter-Leinweber"
            fill
            preload
            placeholder="blur"
            sizes="22rem"
            className="scale-[1.06] object-cover object-top"
          />
        </div>
      </div>

      <div
        role="group"
        aria-label="Portrait"
        className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-xs"
      >
        <button
          type="button"
          aria-pressed={!model}
          onClick={() => choose("photo")}
          className={segment(!model)}
        >
          <Camera aria-hidden="true" className="size-4" />
          Photo
        </button>
        <button
          type="button"
          aria-pressed={model}
          onClick={() => choose("model")}
          onPointerEnter={prefetch}
          onFocus={prefetch}
          className={segment(model)}
        >
          <Box aria-hidden="true" className="size-4" />
          3D model
        </button>
      </div>
    </div>
  );
}
