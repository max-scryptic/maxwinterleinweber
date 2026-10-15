/*
 * The numbers that describe where the figure sits on the page and how the
 * camera is pointed at it.
 *
 * Kept apart from the components that use them because they are needed on both
 * sides of a split: the canvas has to set up its camera and draw its buttons
 * from these, while the figure itself, three.js and a three megabyte model are
 * a separate chunk that is only fetched once the model view is asked for.
 */

// Metres. The model is rescaled to this, so it also sets the scale of every
// distance derived from it.
export const HEIGHT = 1.8;

/*
 * The figures the tabs switch between, in the order they were made, each with
 * the versions of it that the buttons down the right hand side switch between.
 *
 * A tab is a capture. A version is one take on that capture, and most of them
 * have exactly one, in which case the version buttons are not drawn at all.
 * Scan 02 has three, because the same mesh is on the page raw, rigged wrongly
 * and rigged again properly, and those are three states of one scan rather than
 * three scans. Keeping all three is the point: a rig is worth having, is not
 * worth losing the untouched capture to, and can be redone when it comes out
 * wrong, which is what v3 is. The buttons are labelled by position, so v1 is
 * whatever is first in the list here. See `public/models/README.md`.
 *
 * Every version is normalised to HEIGHT on load and stood on the plane through
 * the origin, so they can arrive at any size, in any unit and sitting anywhere
 * relative to their own origin, and still land framed the same way. That is
 * what lets a new scan be dropped in beside the others without a second set of
 * camera numbers to go with it.
 *
 * shift, rise and yaw are small visual calibrations after that normalisation.
 * Scan 01's exported bounds do not centre its visible head, and it was captured
 * at an angle to the axis the others face along, so it otherwise lands slightly
 * left and low while facing the wrong way. Scan 03 arrived with the same
 * rear-facing export convention as the raw Scan 02 capture, so it carries a
 * half turn, then an 18 degree clockwise nudge to match the other scans
 * visually. Keeping those corrections on the version leaves every model aligned
 * at the same shared turntable angle through every framing. Yaw is measured in
 * radians about the vertical axis. All three versions of scan 02 are the one
 * capture, a clean export centred and standing on its own origin, so none of
 * them needs a shift or a rise.
 *
 * rigged says whether the model has a skeleton inside it, which is what decides
 * whether the pose buttons are offered for it at all. It is stated here rather
 * than discovered from the file because the buttons are drawn on the canvas,
 * which is on the page long before three.js has been loaded, let alone a model
 * opened and looked inside. Getting it wrong costs nothing worse than a row of
 * buttons that do not do anything: the figure itself reads the real skeleton and
 * is not fooled by this.
 *
 * It is false for the raw scans, and that is not an oversight.
 * Photogrammetry produces a single mesh and no bones, and a mesh with no bones
 * cannot be posed by any amount of code at this end; scan-01 has no limbs to rig
 * either. Scan 02's v2 and v3 are its own mesh after `scripts/rig-scan.py`,
 * which is where their skeletons came from.
 *
 * The first figure is what the page opens on, and its first version with it.
 */
export const FIGURES = [
  {
    id: "scan-01",
    label: "Scan 01",
    versions: [
      {
        id: "scan-01",
        url: "/models/scan-01.glb",
        shift: 0.13,
        rise: 0.08,
        yaw: (Math.PI * 5) / 4,
        rigged: false,
      },
    ],
  },
  {
    id: "scan-02",
    label: "Scan 02",
    versions: [
      // v1: the capture as it came back, with no skeleton in it and so no poses
      // offered for it. Turned here, because it was captured back to the camera,
      // where the two rigged versions are not: rigging is the moment to turn the
      // export round instead. That is what v3 does, and what v2 only claimed to.
      {
        id: "scan-02",
        url: "/models/scan-02.glb",
        shift: 0,
        rise: 0,
        yaw: Math.PI,
        rigged: false,
      },
      // v2: that mesh rigged, and posed backwards for it. No yaw, and this one
      // is wrong. Rigging was meant to be the moment the export was turned
      // round, and the half turn that would have done it was dropped without a
      // word by the rigger, so mesh and skeleton both came out still facing
      // away. It is left standing exactly as it came back: this is the version
      // that shows what that costs, and v3 is the same capture with the turn
      // actually applied.
      {
        id: "scan-03",
        url: "/models/scan-03.glb",
        shift: 0,
        rise: 0,
        yaw: 0,
        rigged: true,
      },
      // v3: the same rig, facing the way it always meant to. No yaw, and this
      // one means it. The rig, the mesh and the poses now agree about which way
      // the figure faces, which is the whole of what v2 got wrong.
      {
        id: "scan-04",
        url: "/models/scan-04.glb",
        shift: 0,
        rise: 0,
        yaw: 0,
        rigged: true,
      },
    ],
  },
  {
    id: "model3",
    label: "Scan 03",
    versions: [
      {
        id: "model3",
        url: "/models/model3.glb",
        shift: 0,
        rise: 0,
        yaw: Math.PI - Math.PI / 10,
        rigged: false,
      },
    ],
  },
] as const;

export type Figure = (typeof FIGURES)[number];
export type FigureId = Figure["id"];
export type Version = Figure["versions"][number];
export type VersionId = Version["id"];

/**
 * The version on stage, and the figure whose tab it belongs to. What is
 * selected on the page is a version, since that is what names a file; which tab
 * is lit follows from it rather than being tracked beside it, so the two can
 * never disagree about what is showing.
 *
 * Both fall back to the opening figure rather than throwing, because an id that
 * is not in the list is a typo in a prop somewhere and the page standing there
 * showing the figure it opens on is a better answer to that than a blank
 * canvas.
 */
export function versionOf(id: VersionId): Version {
  for (const figure of FIGURES) {
    const found = (figure.versions as readonly Version[]).find(
      (version) => version.id === id,
    );
    if (found) return found;
  }

  return FIGURES[0].versions[0];
}

export function figureOf(id: VersionId): Figure {
  return (
    FIGURES.find((figure) =>
      (figure.versions as readonly Version[]).some(
        (version) => version.id === id,
      ),
    ) ?? FIGURES[0]
  );
}

// Degrees, vertical.
export const FOV = 35;

/*
 * Metres. The furthest the camera may ever be pulled back from the figure.
 *
 * The nearest star sits 14 metres out (`src/components/starfield.tsx`), so this
 * is what keeps the field from being flown into: past it the stars nearest the
 * camera start to slide against the ones behind them and the sky stops reading
 * as a backdrop. It is a ceiling rather than the limit itself, which is worked
 * out from the framings the buttons can ask for and the shape of the frame; it
 * only binds when the frame is a good deal taller than it is wide, where the
 * widest pose has to stand a long way off to fit across it.
 */
export const HORIZON = 12;

// The camera sits above whatever it is looking at, angled very slightly down.
export const CAMERA_RISE = HEIGHT * 0.22;

// How much of the frame is left empty around the part being shown. 1 would
// crop to it exactly. Generous, because the frame is small and its buttons are
// not: a row of them stands across the top and the bottom at a fixed size, and
// at 1.3 the head of a figure that has drifted up its full height reached them.
const MARGIN = 1.45;

/*
 * The figure has a frame of its own on the page: a small rectangle beside the
 * introduction, taller than it is wide, which the canvas fills exactly. So it
 * stands in the middle of the canvas, and the camera only has to be far enough
 * back to fit it, with nothing to offset.
 *
 * ASPECT is that frame's width over its height. The frame is drawn from this
 * same number, so the camera's opening distance and the box it is opening in
 * cannot drift apart.
 */
export const ASPECT = 4 / 5;

/*
 * The three framings, as fractions of the figure's height measured from its
 * feet: the band of the body each one has to fit on screen, and how wide that
 * band is at its widest point. Proportions of a standing figure, not of this
 * particular mesh, so they survive the swap from one capture to the next: the
 * hips sit a little above half of a person's height, and the head is the top
 * eighth.
 */
export const VIEWS = [
  // Width here is what must not be cropped, which is not always the whole
  // silhouette: the full-body view has to hold the arms, but a torso shot that
  // loses the hands at the edges of a narrow frame is still a torso shot, and
  // insisting on the arm span there would pull the camera back far enough to
  // show the knees.
  { id: "full", label: "Full body", bottom: 0, top: 1, width: 0.44 },
  { id: "torso", label: "Torso", bottom: 0.52, top: 1, width: 0.32 },
  { id: "head", label: "Head", bottom: 0.85, top: 1, width: 0.16 },
] as const;

export type View = (typeof VIEWS)[number];
export type ViewId = View["id"];

/*
 * Where the camera has to be to fit one of those bands. The vertical field of
 * view is fixed, so the distance that fits the band's height is fixed too; the
 * distance that fits its width depends on the shape of the space the figure is
 * given. Taking the larger of the two is what keeps a head from being cropped
 * down the sides in a narrow frame, where fitting the height alone is not
 * enough.
 *
 * span is how wide the figure is being made by whatever it is doing, in the same
 * units as a view's own width, and is taken instead of it when it is the larger.
 * A view's width describes a figure standing still, so a pose that reaches wider
 * than that, which is a T pose and nothing else so far, would otherwise be
 * framed by a number that was never about it.
 */
export function framing(view: View, aspect: number, span = 0) {
  const halfFov = Math.tan((FOV * Math.PI) / 360);
  const height = (view.top - view.bottom) * HEIGHT * MARGIN;
  const width = Math.max(view.width, span) * HEIGHT * MARGIN;

  return {
    focus: ((view.top + view.bottom) / 2) * HEIGHT,
    distance: Math.max(
      height / 2 / halfFov,
      width / 2 / (halfFov * aspect),
    ),
  };
}

/**
 * The framing the canvas opens on, before it has measured itself, and how far
 * the camera is tilted down at it.
 *
 * The aspect is the one the frame is drawn at. It only has to be close enough
 * not to be seen jumping: the first frame after mount corrects it against the
 * canvas's real size. At this shape it is the height that decides the distance
 * anyway, so the two agree exactly.
 *
 * The pitch has to be handed to the camera rather than left to it. Given no
 * rotation, the canvas points a new camera at the origin, which out here is the
 * point between the figure's feet, and the controls then aim it at the middle of
 * the figure the moment they load: a several degree pitch that swings the whole
 * sky with it, arriving a second into the page. Opening at the angle the
 * controls are going to hold means there is nothing to correct.
 */
export function opening(aspect = ASPECT) {
  const fit = framing(VIEWS[0], aspect);

  return {
    focus: fit.focus,
    distance: fit.distance,
    pitch: -Math.atan2(CAMERA_RISE, fit.distance),
  };
}
