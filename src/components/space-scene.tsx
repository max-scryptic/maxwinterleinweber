"use client";

import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, PerspectiveCamera } from "three";

import { Nebula } from "@/components/nebula";
import { Starfield } from "@/components/starfield";
import { Button } from "@/components/ui/button";
import { REDUCED_MOTION, WIDE, useMediaQuery } from "@/hooks/use-media-query";
import {
  CAMERA_RISE,
  CENTRE,
  FIGURES,
  FOV,
  OPENING,
  OPENING_PITCH,
  VIEWS,
  figureOf,
  versionOf,
  type Figure,
  type VersionId,
  type ViewId,
} from "@/lib/figure";
import { POSES, type PoseId } from "@/lib/poses";

/*
 * The one canvas the whole page sits on. It covers the window rather than a
 * column, so the sky is continuous behind the card as well as beside it, and
 * the figure is in the same scene as the sky rather than composited over a
 * picture of one.
 */

// The figures, three.js's loaders and several megabytes of model, split off so
// that a phone, which is shown the sky but not the figure, never fetches any of
// it.
const FigureRig = lazy(() => import("@/components/figure-stage"));

/*
 * Pulls a figure's model into the browser cache when its tab is hovered or
 * focused, so that pressing it starts the swap against a file already on the
 * machine rather than one still on its way.
 *
 * A plain fetch, rather than drei's own preloader, because reaching for that
 * here would mean importing three.js into the bundle this page is split to
 * avoid loading in the first place.
 */
const warmed = new Set<string>();

function warm(url: string) {
  if (warmed.has(url)) return;
  warmed.add(url);

  // A failure here costs nothing: the model is fetched again, for real, when
  // the figure is actually asked for. Forgetting it means a later hover tries
  // again rather than the file never being warmed at all.
  void fetch(url).catch(() => warmed.delete(url));
}

// Both rows of controls are the same object: a row of alternatives with one of
// them current. The current one is solid white, the rest are glass over the sky.
function control(active: boolean) {
  return active
    ? "pointer-events-auto bg-white text-neutral-900 hover:bg-white/90 hover:text-neutral-900"
    : "pointer-events-auto border border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white";
}

/*
 * How far above the middle of the window the foot of the version column sits,
 * in rem.
 *
 * It is placed against the pose column rather than against itself: that column
 * is centred, so clearing it means clearing half of it, which is its buttons at
 * 2rem each with 0.5rem between them, and then VERSION_GAP on top. Measured off
 * POSES rather than written down, so a fifth pose does not quietly push the
 * column up through this one.
 *
 * Anchoring to the middle of the window rather than stacking above whatever is
 * actually there is the whole point. The pose column is absent on a version
 * with no skeleton, and buttons that moved with it would jump out from under
 * the pointer on the press that made it appear.
 */
// The clear space between the two columns, in rem. Wider than the 0.5rem that
// separates buttons within either column, so that the break between them reads
// as a break rather than as one longer list with an uneven seam.
const VERSION_GAP = 1.25;
const VERSION_RISE =
  (POSES.length * 2 + (POSES.length - 1) * 0.5) / 2 + VERSION_GAP;

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
  const wide = useMediaQuery(WIDE);
  const still = useMediaQuery(REDUCED_MOTION);

  // Whether the canvas has a sky on it yet. Until it does the painted one in
  // the wrapper behind is what is showing, and this is what crosses from the
  // one to the other.
  const [lit, setLit] = useState(false);
  const light = useCallback(() => setLit(true), []);

  // The model the page opens on, fetched from here rather than waiting for the
  // chunk that draws it to be parsed and to ask for it itself. The two are
  // several megabytes and a few hundred kilobytes over the same connection;
  // starting them together rather than one after the other is most of a second
  // off how long the sky stands empty. Only on a viewport wide enough to show a
  // figure, so a phone still fetches neither.
  useEffect(() => {
    if (wide) warm(FIGURES[0].versions[0].url);
  }, [wide]);

  const [view, setView] = useState<ViewId>("full");

  /*
   * What is on stage, which is a version rather than a figure: a version is
   * what names a file, and the tab that is lit is worked out from it below.
   * Holding the two separately would mean keeping them in step by hand.
   *
   * The page opens on the first version of the first figure, which is the
   * placeholder every later one is measured against.
   */
  const [version, setVersion] = useState<VersionId>(FIGURES[0].versions[0].id);

  // The version showing and the figure it is a version of.
  const shown = versionOf(version);
  const figure = figureOf(version);

  // Pressing a tab shows that figure's first version. Pressing the tab already
  // showing does nothing, as it did before there were versions: choosing
  // between them is what the buttons down the side are for, and a press that
  // put the figure back to v1 would undo one of them.
  function show(next: Figure) {
    if (next.id !== figure.id) setVersion(next.versions[0].id);
  }

  /*
   * What it is doing, which is kept across a change of figure rather than reset
   * with it. Switching to a scan and back is then a way of seeing how far the
   * scan has to go, rather than something that quietly puts the placeholder back
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

  return (
    <div className="relative h-full w-full">
      <Canvas
        // The only hint that the figure is more than a picture. Nothing to grab
        // on a narrow window, where the figure is not there to drag.
        className={wide ? "cursor-grab active:cursor-grabbing" : undefined}
        // Held back until there is something on it, then brought up over the
        // painted sky in the wrapper behind. The two are close enough that this
        // reads as the sky coming into focus; cutting to the canvas instead is
        // a visible switch from one picture to another.
        style={{
          opacity: lit ? 1 : 0,
          transition: "opacity 700ms ease-out",
        }}
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

        <FirstLight onLit={light} />

        {/* Only where there is a figure to frame: on a narrow window the sky
            is the whole page and is left centred on it. */}
        {wide ? <ColumnFraming /> : null}

        {/* Suspends twice over: once on the chunk, once on the model inside
            it. Both resolve into the sky, which is already drawn. */}
        {wide ? (
          <Suspense fallback={null}>
            <FigureRig
              version={version}
              pose={pose}
              view={view}
              fitId={fitId}
              still={still}
            />
          </Suspense>
        ) : null}
      </Canvas>

      {/* Which iteration is showing, over the right hand half where it is.
          Above the figure rather than below it, so the two rows read as what
          is on stage and how it is being looked at, in that order. */}
      {wide ? (
        <div className="pointer-events-none absolute top-8 right-0 flex w-1/2 justify-center gap-2">
          {FIGURES.map((option) => (
            <Button
              key={option.id}
              variant="ghost"
              size="sm"
              className={control(option.id === figure.id)}
              aria-pressed={option.id === figure.id}
              onClick={() => show(option)}
              // Fetched on the way to the press rather than on the press
              // itself. A pointer arriving on the tab is most of a second of
              // warning, which is about what a four megabyte model needs. Only
              // the version the press would land on: the others behind the same
              // tab are warmed by their own buttons.
              onPointerEnter={() => warm(option.versions[0].url)}
              onFocus={() => warm(option.versions[0].url)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      ) : null}

      {/* Which version of this figure, for a figure that has more than one.
          Down the right hand edge with the poses, because a version is a
          property of the figure rather than of the framing, and stacked against
          that same edge so the two read as one axis. The gap under it is what
          keeps them from being read as one list: this chooses the model, and
          the column below chooses what that model is doing.

          Labelled by position. v1 is the capture as it came back and has no
          skeleton, so the pose column is simply missing under it; v2 and v3 are
          that mesh rigged, and pressing between them is what shows the poses
          running backwards and then forwards. */}
      {wide && figure.versions.length > 1 ? (
        <div
          className="pointer-events-none absolute right-8 flex flex-col items-stretch gap-2"
          style={{ bottom: `calc(50% + ${VERSION_RISE}rem)` }}
          role="group"
          aria-label={`${figure.label} version`}
        >
          {figure.versions.map((option, index) => (
            <Button
              key={option.id}
              variant="ghost"
              size="sm"
              className={control(option.id === version)}
              aria-pressed={option.id === version}
              onClick={() => setVersion(option.id)}
              onPointerEnter={() => warm(option.url)}
              onFocus={() => warm(option.url)}
            >
              v{index + 1}
            </Button>
          ))}
        </div>
      ) : null}

      {/* What the figure is doing, down the right hand edge and centred on it,
          clear of both of the horizontal rows. A column of its own rather than
          a third row, so the two axes say what they change: across the top and
          the bottom is which figure and which framing, and down the side is the
          figure itself. Stretched to a common width so it reads as one column
          rather than as four buttons that happen to be stacked.

          Only for a version with a skeleton under it. Nothing here can pose a
          photogrammetry scan that has not been rigged, so on one of those the
          column is absent rather than present and inert, and the version
          buttons above hold their place regardless so that they do not move on
          the press that makes the column appear. */}
      {wide && rigged ? (
        <div className="pointer-events-none absolute top-1/2 right-8 flex -translate-y-1/2 flex-col items-stretch gap-2">
          {POSES.map((option) => (
            <Button
              key={option.id}
              variant="ghost"
              size="sm"
              className={control(option.id === pose)}
              aria-pressed={option.id === pose}
              onClick={() => setPose(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      ) : null}

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
              className={control(option.id === view)}
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
