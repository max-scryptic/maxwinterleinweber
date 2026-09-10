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
 * The figures the tabs switch between, in the order they were made. Every one
 * of them is normalised to HEIGHT on load and stood on the plane through the
 * origin, so they can arrive at any size, in any unit and sitting anywhere
 * relative to their own origin, and still land framed the same way. That is
 * what lets a scan be dropped in beside the placeholder without a second set
 * of camera numbers to go with it.
 *
 * shift, rise and yaw are small visual calibrations after that normalisation.
 * Scan 01's exported bounds do not centre its visible head, and its forward
 * axis differs from the mannequin's, so it otherwise lands slightly left and
 * low while facing the wrong way. Keeping those corrections on the figure
 * leaves every model aligned at the same shared turntable angle through every
 * framing. Yaw is measured in radians about the vertical axis. Scan 02 is a
 * clean export, centred and standing on its own origin, so it needs no shift
 * or rise; it is only turned, because it was captured back to the camera.
 *
 * rigged says whether the model has a skeleton inside it, which is what decides
 * whether the pose buttons are offered for it at all. It is stated here rather
 * than discovered from the file because the buttons are drawn on the canvas,
 * which is on the page long before three.js has been loaded, let alone a model
 * opened and looked inside. Getting it wrong costs nothing worse than a row of
 * buttons that do not do anything: the figure itself reads the real skeleton and
 * is not fooled by this.
 *
 * It is false for scan-01, and that is not an oversight. Photogrammetry produces
 * a single mesh and no bones, and a mesh with no bones cannot be posed by any
 * amount of code at this end; that scan has no limbs to rig either. Scan 02 has
 * been through `scripts/rig-scan.py` and has a skeleton in it. See
 * `public/models/README.md`.
 *
 * The first entry is what the page opens on.
 */
export const FIGURES = [
  {
    id: "mannequin",
    label: "Mannequin",
    url: "/models/mannequin.glb",
    shift: 0,
    rise: 0,
    yaw: 0,
    rigged: true,
  },
  {
    id: "scan-01",
    label: "Scan 01",
    url: "/models/scan-01.glb",
    shift: 0.13,
    rise: 0.08,
    yaw: (Math.PI * 5) / 4,
    rigged: false,
  },
  {
    id: "scan-02",
    label: "Scan 02",
    url: "/models/scan-02.glb",
    shift: 0,
    rise: 0,
    // No yaw any more. It used to carry a half turn because it was captured
    // back to the camera, and rigging it was the moment to turn the export
    // round instead: a rig, a mesh and a set of poses that disagree about which
    // way the figure faces is a thing to be corrected once, in the file.
    yaw: 0,
    rigged: true,
  },
] as const;

export type Figure = (typeof FIGURES)[number];
export type FigureId = Figure["id"];

// Degrees, vertical.
export const FOV = 35;

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
 * The three framings, as fractions of the figure's height measured from its
 * feet: the band of the body each one has to fit on screen, and how wide that
 * band is at its widest point. Proportions of a standing figure, not of this
 * particular mesh, so they survive the swap to a scan: the hips sit a little
 * above half of a person's height, and the head is the top eighth.
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
 */
export function framing(view: View, aspect: number, span = 0) {
  const halfFov = Math.tan((FOV * Math.PI) / 360);
  const height = (view.top - view.bottom) * HEIGHT * MARGIN;
  const width = Math.max(view.width, span) * HEIGHT * MARGIN;

  return {
    focus: ((view.top + view.bottom) / 2) * HEIGHT,
    distance: Math.max(height / 2 / halfFov, width / 2 / (halfFov * aspect)),
  };
}

/**
 * The framing to open on, before there is a window to measure. Only has to be
 * close enough not to be seen jumping: the first frame after mount corrects it
 * against the real shape of the column.
 */
export const OPENING = framing(VIEWS[0], COLUMN);

/**
 * How far the camera is tilted down at that framing, in radians about X.
 *
 * The camera has to be handed this rather than left to aim itself. Given no
 * rotation, the canvas points a new camera at the origin, which out here is the
 * point between the figure's feet, and the controls then aim it at the middle
 * of the figure the moment they load: a several degree pitch that swings the
 * whole sky with it, arriving a second into the page. Opening at the angle the
 * controls are going to hold means there is nothing to correct.
 */
export const OPENING_PITCH = -Math.atan2(CAMERA_RISE, OPENING.distance);
