import * as React from "react";

/*
 * The platform marks the page links out with, as single filled shapes in
 * currentColor so each takes whatever colour it is set on.
 *
 * Three are traced off the logo files committed at the repo root (YouTube.png,
 * SoundCloud.png, X.png): each viewBox is the artwork's own bounding box,
 * scaled, so the geometry below is the measured shape rather than an
 * approximation of it. Instagram's artwork is not committed here, so it is laid
 * out from the proportions of the supplied logo on a square of 100 instead, and
 * LinkedIn's is the bare "in" from its wordmark, drawn on a square of 20.
 */

type MarkProps = React.ComponentProps<"svg">;

export function YouTubeMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 235 269" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M0 0L235 134.5L0 269Z" />
    </svg>
  );
}

/*
 * The SoundCloud waveform, left to right: [centre x, top, bottom, half width]
 * per bar. Each bar is widest at its middle and rounds off at both ends, so it
 * is drawn as two quadratics between a pair of semicircular caps.
 */
const waveform: [x: number, top: number, bottom: number, half: number][] = [
  [2.3, 60.3, 87, 2.5],
  [11, 52.3, 94.6, 3.2],
  [20.4, 48.4, 98.2, 3.2],
  [29.4, 47.3, 99.3, 3.2],
  [38.6, 49.1, 99.6, 3.4],
  [48, 33.9, 100, 3.4],
  [57.4, 25.3, 100, 3.4],
  [67, 20.9, 100, 3.6],
  [76.5, 18.8, 100, 3.8],
  [86.3, 20.2, 100, 3.8],
  [96, 21.7, 100, 3.8],
  [105.6, 12.3, 100, 4],
  [115.5, 6.5, 99.6, 4.2],
];

function bar(x: number, top: number, bottom: number, half: number) {
  const cap = half * 0.55;
  const middle = (top + bottom) / 2;
  // Pulling the control point out to twice the half width is what leaves the
  // curve itself passing through it at the widest point.
  const bulge = 2 * half - cap;
  return (
    `M${x - cap} ${top + cap}A${cap} ${cap} 0 0 1 ${x + cap} ${top + cap}` +
    `Q${x + bulge} ${middle} ${x + cap} ${bottom - cap}` +
    `A${cap} ${cap} 0 0 1 ${x - cap} ${bottom - cap}` +
    `Q${x - bulge} ${middle} ${x - cap} ${top + cap}Z`
  );
}

/*
 * The cloud is two circles over a flat base: a big one whose left side is cut
 * off square where the waveform ends, and a smaller one tucked into its right
 * shoulder, the notch between them being where the two arcs cross.
 */
const soundCloudCloud =
  "M122 100V4.4A50.3 50.3 0 0 1 192.7 45.7A28.5 28.5 0 1 1 209.4 100Z";

export function SoundCloudMark(props: MarkProps) {
  return (
    <svg
      viewBox="0 0 231.8 100"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d={waveform.map((b) => bar(...b)).join("") + soundCloudCloud} />
    </svg>
  );
}

/*
 * The X mark: the outline of the two crossing strokes, then the long slot down
 * the thick stroke as a second subpath. Even-odd fill makes that slot a hole,
 * and it reads through the thin stroke where the two cross, as it does in the
 * logo itself.
 */
const xOutline =
  "M1 0L96 0L167.4 104.2L257 0L293 0L183.4 127.5L301 299L207 299L130.9 188.6L36 299L0 299L114.9 165.3Z";
const xSlot = "M47 24L85 24L257 275L219 275Z";

export function XMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 301 299" fill="currentColor" aria-hidden="true" {...props}>
      <path fillRule="evenodd" d={xOutline + xSlot} />
    </svg>
  );
}

/*
 * The Instagram mark is three rings on a square of 100: the rounded square
 * around the outside, the lens in the middle of it, and the dot up in the top
 * right corner. Everything below is one wall thickness, 9.2, which is what
 * sets the second edge of each of the first two.
 */
const wall = 9.2;
const outerCorner = 29.6;
const lensRadius = 25.7;
const dot = { x: 76.6, y: 23.3, r: 6 } as const;

/*
 * A rounded square held the given distance in from the edge of the viewBox.
 * The corner of the inner edge of a wall is the outer corner less the wall, so
 * the two squares stay concentric and the stroke keeps an even width round the
 * turn rather than pinching at the corners.
 */
function roundedSquare(inset: number) {
  const near = inset;
  const far = 100 - inset;
  const r = outerCorner - inset;
  return (
    `M${near + r} ${near}H${far - r}A${r} ${r} 0 0 1 ${far} ${near + r}` +
    `V${far - r}A${r} ${r} 0 0 1 ${far - r} ${far}` +
    `H${near + r}A${r} ${r} 0 0 1 ${near} ${far - r}` +
    `V${near + r}A${r} ${r} 0 0 1 ${near + r} ${near}Z`
  );
}

// A closed circle, drawn as the two half turns a single arc cannot make.
function circle(cx: number, cy: number, r: number) {
  return (
    `M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}` +
    `A${r} ${r} 0 0 1 ${cx - r} ${cy}Z`
  );
}

/*
 * Under even-odd the five subpaths give three rings without any of them being
 * drawn as a stroke: the outer square is ink, the square inside it is back to
 * nothing, and each shape drawn inside that emptiness counts one crossing
 * further out again, so the lens is ink, the hole in the lens is not, and the
 * dot, sitting in the emptiness on its own, is ink.
 */
const instagram =
  roundedSquare(0) +
  roundedSquare(wall) +
  circle(50, 50, lensRadius) +
  circle(50, 50, lensRadius - wall) +
  circle(dot.x, dot.y, dot.r);

export function InstagramMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" {...props}>
      <path fillRule="evenodd" d={instagram} />
    </svg>
  );
}

/*
 * The "in": a dot over a stem for the i, and an n whose shoulder rises out of
 * its left stem and comes down square into its right one. The stems are all
 * one width, and the i's stem stands on the same baseline and rises to the
 * same height as the n's, which is what lets the two letters read as a pair.
 */
const linkedInI = circle(2.5, 2.5, 2.4) + "M0.4 6.6H4.6V20H0.4Z";
const linkedInN =
  "M7 6.6H10.9V8.4C11.7 7.1 13.1 6.2 15.1 6.2C18.4 6.2 20 8.3 20 12V20H16V12.9C16 11 15.3 10 13.8 10C12.2 10 11 11.1 11 13V20H7Z";

export function LinkedInMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path d={linkedInI + linkedInN} />
    </svg>
  );
}
