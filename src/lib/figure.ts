/*
 * The numbers that describe where the figure sits on the page and how the
 * camera is pointed at it.
 *
 * Kept apart from the components that use them because they are needed on both
 * sides of a split: the canvas has to set up its camera and draw its buttons
 * from these, while the figure itself, three.js and a three megabyte model are
 * a separate chunk that narrow screens never load.
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
 * left and low while facing the wrong way. Keeping those corrections on the
 * version leaves every model aligned at the same shared turntable angle through
 * every framing. Yaw is measured in radians about the vertical axis. All three
 * versions of scan 02 are the one capture, a clean export centred and standing
 * on its own origin, so none of them needs a shift or a rise.
 *
 * rigged says whether the model has a skeleton inside it, which is what decides
 * whether the pose buttons are offered for it at all. It is stated here rather
 * than discovered from the file because the buttons are drawn on the canvas,
 * which is on the page long before three.js has been loaded, let alone a model
 * opened and looked inside. Getting it wrong costs nothing worse than a row of
 * buttons that do not do anything: the figure itself reads the real skeleton and
 * is not fooled by this.
 *
 * It is false for both of the raw scans, and that is not an oversight.
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
 * out per layout from the framings the buttons can ask for; it only ever binds
 * on the narrow one, where the figure is fitted to the width of a portrait
 * window a good deal taller than it is wide, and the widest pose consequently
 * stands a long way off.
 */
export const HORIZON = 12;

// The camera sits above whatever it is looking at, angled very slightly down.
export const CAMERA_RISE = HEIGHT * 0.22;

// How much of the frame is left empty around the part being shown. 1 would
// crop to it exactly.
const MARGIN = 1.3;

/*
 * The figure does not stand in the middle of the page: the card takes the left
 * half, so it is framed into the middle of the right half instead. The canvas
 * still covers the whole window, because the sky has to, so this is done by
 * offsetting the camera's frustum rather than by moving anything.
 *
 * CENTRE is where the figure lands across the viewport, and COLUMN is the share
 * of the viewport width it is fitted into. Together they put it centred in the
 * right hand half and sized to it.
 */
export const CENTRE = 0.75;
export const COLUMN = 0.5;

/*
 * The share of a narrow window the figure is given, measured from the top.
 *
 * On a wide window the page is split sideways and the figure gets a column. A
 * phone has no width to give away, so the split is made the other way, and in
 * depth rather than across the page: the figure has the first screen to itself,
 * whole, and the card begins at the fold and is scrolled up over the sky.
 *
 * All of it, rather than the two fifths this was. The smaller share kept the
 * card's first few lines on screen at rest, which said there was more page
 * underneath; it paid for that hint with both halves of the page, since a figure
 * fitted into two fifths of the height stands a long way off and looks it, and
 * the card was read through a letterbox. A screen each is the other way round:
 * the figure is shown at the size the window can actually hold, and the card is
 * read at the size it was drawn for. What is given up is the hint, and a swipe
 * up is the one gesture a phone can be relied on to be given.
 *
 * Kept as a fraction rather than folded away now that it is 1, because three
 * things are set from it and have to agree: the height of the page's first row,
 * the share of the vertical field the camera frames the figure into, and the
 * distance the dissolve is measured over.
 */
export const BAND = 1;

/*
 * Where on the page the figure is given room to stand, and how much of it.
 *
 * x and y are where the figure lands in the window, as fractions of its width
 * and height. column and row are the share of the window's width and height it
 * is fitted into. Between them that is enough both to offset the camera's
 * frustum onto the right part of the window and to work out how far back the
 * camera has to stand to fill it.
 *
 * Two of these, one per layout, rather than numbers worked out where they are
 * used: the offset is applied by the canvas and the distance by the controls
 * inside the figure's own chunk, and those two have to agree about where the
 * figure is or it is framed for a part of the window it is not in.
 */
export type Stage = {
  x: number;
  y: number;
  column: number;
  row: number;
};

/** The right hand half of a wide window, full height. */
export const WIDE_STAGE: Stage = { x: CENTRE, y: 0.5, column: COLUMN, row: 1 };

/** The first screen of a narrow one, full width and full height, with the card
 * scrolling up past it. */
export const NARROW_STAGE: Stage = {
  x: 0.5,
  y: BAND / 2,
  column: 1,
  row: BAND,
};

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
  // loses the hands at the edges of a narrow column is still a torso shot, and
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
 * down the sides in a narrow column, where fitting the height alone is not
 * enough.
 *
 * The aspect passed in is the figure's own column, not the canvas: the canvas
 * covers the whole window, and fitting to that would size the figure as though
 * it had the card's half to spread into as well.
 *
 * span is how wide the figure is being made by whatever it is doing, in the same
 * units as a view's own width, and is taken instead of it when it is the larger.
 * A view's width describes a figure standing still, so a pose that reaches wider
 * than that, which is a T pose and nothing else so far, would otherwise be
 * framed by a number that was never about it.
 *
 * row is the share of the window's height the figure is being fitted into, and
 * is the vertical counterpart of the aspect above. The field of view belongs to
 * the whole canvas, which covers the window however little of it the figure is
 * standing in, so a figure given a strip of it is being fitted into that
 * fraction of the vertical field and has to be that much further away. It
 * defaults to the whole height, which is what both of the stages below in fact
 * ask for: the wide one gives the figure a full-height column, and the narrow
 * one the whole of the first screen. It is here for a stage that is given less,
 * which is what the narrow one was.
 */
export function framing(view: View, aspect: number, span = 0, row = 1) {
  const halfFov = Math.tan((FOV * Math.PI) / 360);
  const height = (view.top - view.bottom) * HEIGHT * MARGIN;
  const width = Math.max(view.width, span) * HEIGHT * MARGIN;

  return {
    focus: ((view.top + view.bottom) / 2) * HEIGHT,
    distance: Math.max(
      height / 2 / (halfFov * row),
      width / 2 / (halfFov * aspect),
    ),
  };
}

/**
 * The framing a stage opens on, before there is a window to measure, and how far
 * the camera is tilted down at it.
 *
 * The aspect is taken to be the stage's own column, which is to say the window
 * is assumed square. Only has to be close enough not to be seen jumping: the
 * first frame after mount corrects it against the real shape of the window. It
 * is closer than it looks, because on both stages it is the height that decides
 * the distance and the assumed aspect does not enter into it.
 *
 * The pitch has to be handed to the camera rather than left to it. Given no
 * rotation, the canvas points a new camera at the origin, which out here is the
 * point between the figure's feet, and the controls then aim it at the middle of
 * the figure the moment they load: a several degree pitch that swings the whole
 * sky with it, arriving a second into the page. Opening at the angle the
 * controls are going to hold means there is nothing to correct.
 */
export function opening(stage: Stage) {
  const fit = framing(VIEWS[0], stage.column, 0, stage.row);

  return {
    focus: fit.focus,
    distance: fit.distance,
    pitch: -Math.atan2(CAMERA_RISE, fit.distance),
  };
}
