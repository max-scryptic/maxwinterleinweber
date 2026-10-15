"use client";

import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import { Group } from "three";

import { Nebula } from "@/components/nebula";
import { Starfield } from "@/components/starfield";
import { Button } from "@/components/ui/button";
import { REDUCED_MOTION, useMediaQuery } from "@/hooks/use-media-query";
import {
  CAMERA_RISE,
  FIGURES,
  FOV,
  VIEWS,
  figureOf,
  opening,
  versionOf,
  type Figure,
  type VersionId,
  type ViewId,
} from "@/lib/figure";
import { POSES, type PoseId } from "@/lib/poses";
import { warm } from "@/lib/warm";

/*
 * The model view: the figure adrift in its own patch of sky, held in a small
 * frame beside the introduction. The canvas fills whatever box it is put in,
 * and the figure stands in the middle of it.
 */

// The figures, three.js's loaders and several megabytes of model, split off from
// the chunk that draws the sky, so that the frame has a sky in it before any of
// that has arrived.
const FigureRig = lazy(() => import("@/components/figure-stage"));

// Every row of controls is the same object: a row of alternatives with one of
// them current. The current one is solid white, the rest are glass over the
// sky. Small, because the frame is: the figure is what the frame is for, and
// the buttons are kept to its edges.
// The sky is dark whichever theme the page is in, so these keep their own
// colours in both, including over the ghost button's dark mode hover.
function control(active: boolean) {
  const shape = "pointer-events-auto h-6 rounded-full px-2.5 text-[11px]";
  return active
    ? `${shape} bg-white text-neutral-900 hover:bg-white/90 hover:text-neutral-900 dark:hover:bg-white/90`
    : `${shape} border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white dark:hover:bg-white/20`;
}

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
    // Tilted, so the band of cloud runs across the frame on a slant instead of
    // sitting level with the top of it.
    <group ref={group} rotation={[0.22, 0, 0.14]}>
      <Nebula still={still} />
      <Starfield still={still} />
    </group>
  );
}

/*
 * Reports the first frame the canvas actually puts on screen, which is what the
 * fade up from the painted sky underneath is timed off.
 *
 * Not onCreated, which fires with the context made and nothing drawn on it, and
 * not an effect, which fires before the loop has run at all: either would start
 * the fade against an empty buffer and reach full strength somewhere in the
 * middle of compiling the shaders. useFrame runs before the frame it belongs
 * to, so the report is put off one further, to a frame that can only run once
 * this one has been drawn.
 */
function FirstLight({ onLit }: { onLit: () => void }) {
  const reported = useRef(false);

  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    requestAnimationFrame(onLit);
  });

  return null;
}

export default function SpaceScene() {
  const still = useMediaQuery(REDUCED_MOTION);

  // Where the camera stands on the first frame, before the canvas has measured
  // itself. Read once, when the canvas builds its camera; every frame after
  // that the controls inside the figure's own chunk have it, and correct it
  // against the real shape of the frame.
  const start = opening();

  const frame = useRef<HTMLDivElement>(null);

  // Whether the canvas has a sky on it yet. Until it does the painted one in
  // the frame behind is what is showing, and this is what crosses from the one
  // to the other.
  const [lit, setLit] = useState(false);
  const light = useCallback(() => setLit(true), []);

  /*
   * Whether the frame is on screen at all. The page scrolls past it, and a sky
   * and a hundred thousand triangles drawn every frame for a box nobody can see
   * is a laptop fan for nothing, so the render loop is stopped while it is out
   * of view and picks up where it left off when it comes back.
   */
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  /*
   * The wheel belongs to the page. The frame is a small box on a page that
   * scrolls, and OrbitControls takes every wheel event over the canvas to zoom
   * with: left alone, a visitor scrolling down past the introduction would find
   * the page stop and the figure lurch towards them instead whenever the
   * pointer happened to cross it.
   *
   * So a plain wheel is stopped on its way down to the canvas, in the capture
   * phase, before the controls ever see it, and since nothing calls
   * preventDefault on it the page scrolls as it would anywhere else. A pinch on
   * a trackpad arrives as a wheel with ctrlKey set, and so does a wheel turned
   * with ctrl held, which is how a browser says "zoom" rather than "scroll":
   * those are let through, so zooming the figure still works for anyone who
   * means it.
   */
  useEffect(() => {
    const element = frame.current;
    if (!element) return;

    const passToPage = (event: WheelEvent) => {
      if (!event.ctrlKey) event.stopPropagation();
    };
    element.addEventListener("wheel", passToPage, { capture: true });

    return () =>
      element.removeEventListener("wheel", passToPage, { capture: true });
  }, []);

  // The model the frame opens on, fetched from here rather than waiting for the
  // chunk that draws it to be parsed and to ask for it itself.
  useEffect(() => {
    warm(FIGURES[0].versions[0].url);
  }, []);

  const [view, setView] = useState<ViewId>("full");

  /*
   * What is on stage, which is a version rather than a figure: a version is
   * what names a file, and the tab that is lit is worked out from it below.
   * Holding the two separately would mean keeping them in step by hand.
   *
   * The frame opens on the first version of the first figure, which is the
   * earliest capture and the one every later one is measured against.
   */
  const [version, setVersion] = useState<VersionId>(FIGURES[0].versions[0].id);

  // The version showing and the figure it is a version of.
  const shown = versionOf(version);
  const figure = figureOf(version);

  // Pressing a tab shows that figure's first version. Pressing the tab already
  // showing does nothing: choosing between versions is what the buttons down
  // the side are for, and a press that put the figure back to v1 would undo one
  // of them.
  function show(next: Figure) {
    if (next.id !== figure.id) setVersion(next.versions[0].id);
  }

  /*
   * What it is doing, which is kept across a change of figure rather than reset
   * with it. Switching between two captures is then a way of seeing how far the
   * later one has gone, rather than something that quietly puts one of them back
   * on its feet while nobody is looking.
   */
  const [pose, setPose] = useState<PoseId>(POSES[0].id);

  // Whether what is on stage has a skeleton to pose. A scan does not until it
  // has been rigged, so the column is not offered rather than offered and
  // ignored, and that is a property of the version rather than of the tab: two
  // of scan 02's three are rigged and the one it opens on is not.
  const rigged = shown.rigged;

  // Bumped on every press so that pressing the active button re-frames rather
  // than doing nothing.
  const [fitId, setFitId] = useState(0);

  function select(next: ViewId) {
    setView(next);
    setFitId((count) => count + 1);
  }

  // Which capture is on stage.
  const tabs = FIGURES.map((option) => (
    <Button
      key={option.id}
      variant="ghost"
      size="xs"
      className={control(option.id === figure.id)}
      aria-pressed={option.id === figure.id}
      onClick={() => show(option)}
      // Fetched on the way to the press rather than on the press itself. Only
      // the version the press would land on: the others behind the same tab are
      // warmed by their own buttons.
      onPointerEnter={() => warm(option.versions[0].url)}
      onFocus={() => warm(option.versions[0].url)}
    >
      {option.label}
    </Button>
  ));

  /*
   * Which version of that capture, for one that has more than one. Labelled by
   * position: v1 is the capture as it came back and has no skeleton, so the pose
   * buttons are simply missing under it; v2 and v3 are that mesh rigged, and
   * pressing between them is what shows the poses running backwards and then
   * forwards.
   */
  const versions = figure.versions.map((option, index) => (
    <Button
      key={option.id}
      variant="ghost"
      size="xs"
      className={control(option.id === version)}
      aria-pressed={option.id === version}
      onClick={() => setVersion(option.id)}
      onPointerEnter={() => warm(option.url)}
      onFocus={() => warm(option.url)}
    >
      v{index + 1}
    </Button>
  ));

  // What the figure is doing.
  const poses = POSES.map((option) => (
    <Button
      key={option.id}
      variant="ghost"
      size="xs"
      className={control(option.id === pose)}
      aria-pressed={option.id === pose}
      onClick={() => setPose(option.id)}
    >
      {option.label}
    </Button>
  ));

  // How it is being looked at.
  const framings = VIEWS.map((option) => (
    <Button
      key={option.id}
      variant="ghost"
      size="xs"
      className={control(option.id === view)}
      // The button says which framing is showing, not just which one the next
      // press would give, so it is a state to announce.
      aria-pressed={option.id === view}
      onClick={() => select(option.id)}
    >
      {option.label}
    </Button>
  ));

  return (
    <div ref={frame} className="relative h-full w-full">
      <Canvas
        /*
         * The cursor is the only hint that the figure is more than a picture.
         *
         * The touch rules are what stop the figure from swallowing the page.
         * OrbitControls takes every touch on the canvas the moment it is built,
         * and the frame sits on a page that scrolls: a control that eats a swipe
         * up leaves a visitor on a phone pushing at a page that will not move.
         * Handing the vertical axis back to the browser gives the figure the
         * axis it actually turns on, which is the horizontal one, and gives the
         * page the one it scrolls on. Two fingers still reach the controls, so
         * pinching to zoom survives it.
         *
         * Reached through a descendant selector and marked important because of
         * what it is overriding and where. This className lands on the wrapper
         * the canvas is built inside rather than on the canvas itself, and what
         * has to be beaten is an inline style: three writes `touch-action: none`
         * straight onto the canvas from the controls' constructor, and nothing
         * short of an important rule outranks that.
         */
        className="cursor-grab [&_canvas]:touch-pan-y! active:cursor-grabbing"
        // Held back until there is something on it, then brought up over the
        // painted sky in the frame behind, which reads as the sky coming into
        // focus rather than one picture cutting to another.
        style={{
          opacity: lit ? 1 : 0,
          transition: "opacity 700ms ease-out",
        }}
        // Stopped outright while the frame is scrolled out of view, and started
        // again as it comes back.
        frameloop={inView ? "always" : "never"}
        // The sky fills every pixel, so there is nothing to composite against
        // and no reason to pay for an alpha channel.
        gl={{ alpha: false, antialias: true }}
        // The frame is small, so the full density of a retina display costs
        // little here and keeps the stars round and the edges of the figure
        // clean.
        dpr={[1, 2]}
        camera={{
          fov: FOV,
          position: [0, start.focus + CAMERA_RISE, start.distance],
          // Aimed at the middle of the figure from the first frame. Giving a
          // rotation is also what stops the canvas from pointing the camera at
          // the origin itself, which is the floor the figure would be standing
          // on and several degrees below where it is about to be looking.
          rotation: [start.pitch, 0, 0],
          near: NEAR,
          far: FAR,
        }}
      >
        <Sky still={still} />

        <FirstLight onLit={light} />

        {/* Suspends twice over: once on the chunk, once on the model inside
            it. Both resolve into the sky, which is already drawn. */}
        <Suspense fallback={null}>
          <FigureRig
            version={version}
            pose={pose}
            view={view}
            fitId={fitId}
            still={still}
          />
        </Suspense>
      </Canvas>

      {/* The controls, round the edges of the frame and out of the middle of
          it, which is where the figure is. Across the top is which figure, and
          across the bottom how it is being looked at; down the right hand side
          is the figure itself, which version of it and what it is doing, so the
          two axes say what they change. Every row passes clicks through except
          where its buttons are, so a drag that starts beside one still reaches
          the canvas and turns the figure. */}
      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center gap-1.5">
        {tabs}
      </div>

      {figure.versions.length > 1 || rigged ? (
        <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 flex-col items-stretch gap-1.5">
          {/* A version is a property of the figure rather than of the framing,
              so it sits in the same column as the poses, with a wider gap
              between the two than within either so the break still reads as a
              break: this chooses the model, and what follows chooses what that
              model is doing. Both are absent on a raw scan, which has neither a
              second version nor a skeleton, and the column goes with them. */}
          {figure.versions.length > 1 ? (
            <div
              className="flex flex-col items-stretch gap-1.5"
              role="group"
              aria-label={`${figure.label} version`}
            >
              {versions}
            </div>
          ) : null}

          {figure.versions.length > 1 && rigged ? (
            <div aria-hidden="true" className="h-2" />
          ) : null}

          {rigged ? (
            <div
              className="flex flex-col items-stretch gap-1.5"
              role="group"
              aria-label="Pose"
            >
              {poses}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {framings}
      </div>
    </div>
  );
}
