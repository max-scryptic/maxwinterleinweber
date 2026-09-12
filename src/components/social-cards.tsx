import * as React from "react";

import carved from "@/components/carved.module.css";
import { MarqueeTrack } from "@/components/marquee-track";
import { Card, CardContent } from "@/components/ui/card";

/*
 * Three of the marks are traced off the logo files committed at the repo root
 * (YouTube.png, SoundCloud.png, X.png): each viewBox is the artwork's own
 * bounding box, scaled, so the geometry below is the measured shape rather
 * than an approximation of it. The fourth, Instagram, is the one mark whose
 * artwork is not committed here, so it is laid out from the proportions of the
 * supplied logo on a square of 100 instead. They are flat white knockouts
 * drawn as a single filled shape, so they sit straight on the card colour with
 * no second tone.
 */

function YouTubeIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 235 269"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
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

function SoundCloudIcon(props: React.ComponentProps<"svg">) {
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

function XIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 301 299"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
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

function InstagramIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" {...props}>
      <path fillRule="evenodd" d={instagram} />
    </svg>
  );
}

type SocialLink = {
  name: string;
  platform: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  /**
   * Each mark is sized on its own so none reads as the bigger logo: the wide
   * SoundCloud mark is set by width, the taller YouTube and X marks by height.
   * Nothing pads them out to a common width, so the gap beside a mark is the
   * gap beside every other one.
   */
  iconClassName: string;
  cardClassName: string;
};

// Official brand colours: YouTube red, SoundCloud orange, X black.
const youTubeCard = "bg-[#FF0000]";
const soundCloudCard = "bg-[#FF5500]";
const xCard = "bg-black";

/*
 * Instagram's is not a colour but the brand ramp, which runs corner to corner
 * from yellow through orange and magenta to violet and blue. The app icon
 * pours that out of its bottom left corner, and a card is far wider than it is
 * tall, so a 45 degree line across one is near enough horizontal: laid out
 * evenly, the pale end would sit under the mark at the left and take the white
 * out of it. So the yellow is pulled back into the first tenth, which leaves it
 * as the corner it is on the icon rather than a band the mark has to sit on,
 * puts the mark over the same orange the SoundCloud card holds, and gives the
 * handle beside it the magenta and violet that most of the ramp is anyway.
 */
const instagramCard =
  "bg-[linear-gradient(45deg,#FEDA75_0%,#FA7E1E_10%,#D62976_40%,#962FBF_70%,#4F5BD5_100%)]";

const youTubeIconSize = "h-[18px] w-auto";
const soundCloudIconSize = "h-auto w-9";
const xIconSize = "h-[17px] w-auto";
const instagramIconSize = "h-[18px] w-auto";

const links: SocialLink[] = [
  {
    name: "@MaxDontStack",
    platform: "YouTube",
    href: "https://www.youtube.com/@MaxDontStack",
    icon: YouTubeIcon,
    iconClassName: youTubeIconSize,
    cardClassName: youTubeCard,
  },
  {
    name: "@Scuba_Max",
    platform: "YouTube",
    href: "https://www.youtube.com/@Scuba_Max",
    icon: YouTubeIcon,
    iconClassName: youTubeIconSize,
    cardClassName: youTubeCard,
  },
  {
    name: "@Max_WL",
    platform: "YouTube",
    href: "https://www.youtube.com/@Max_WL",
    icon: YouTubeIcon,
    iconClassName: youTubeIconSize,
    cardClassName: youTubeCard,
  },
  {
    name: "@eutonix",
    platform: "SoundCloud",
    href: "https://soundcloud.com/eutonix",
    icon: SoundCloudIcon,
    iconClassName: soundCloudIconSize,
    cardClassName: soundCloudCard,
  },
  {
    name: "@MaxWinterL",
    platform: "X",
    href: "https://x.com/MaxWinterL",
    icon: XIcon,
    iconClassName: xIconSize,
    cardClassName: xCard,
  },
  {
    name: "@max_eutonix",
    platform: "Instagram",
    href: "https://www.instagram.com/max_eutonix",
    icon: InstagramIcon,
    iconClassName: instagramIconSize,
    cardClassName: instagramCard,
  },
];

/*
 * The row is one line that never ends: the cards are laid out in a single
 * track, the track slides steadily sideways, and the cards that leave one edge
 * come back round the other. What makes that possible without a jump is laying
 * the same cards down COPIES times and sliding the track by exactly one copy
 * before starting over, at which point the row looks identical to how it looked
 * at the start and nobody can see where the loop is.
 *
 * The count is what covers the width: only one copy of the row is guaranteed to
 * have gone past by the end of a turn, so the remaining COPIES - 1 have to be
 * wide enough to fill the column, and four of a row this long is comfortably
 * more than half of even a very wide display.
 */
const COPIES = 4;

/*
 * What the row is handed: how far the cards fade at each edge, and how far one
 * turn of the animation travels, which is one copy out of the COPIES the track
 * is made of and so counted off the number above rather than written out twice
 * and left to drift from it. How long that turn takes is the marquee keyframes'
 * own business, in globals.css.
 */
const marqueeStyle = {
  "--fade": "2.5rem",
  "--marquee-shift": `${-100 / COPIES}%`,
} as React.CSSProperties;

/*
 * The cards do not stop dead at the edges of the column, they thin out into the
 * glass over the last few millimetres and come back the same way, so the row
 * reads as carrying on past the card rather than being cut off by it. The mask
 * does the clipping wherever it is understood; the overflow rule beside it is
 * what keeps a browser that ignores the mask from spilling the track across the
 * page rather than merely losing the fade.
 */
const edgeFade =
  "motion-safe:[mask-image:linear-gradient(to_right,transparent,#000_var(--fade),#000_calc(100%-var(--fade)),transparent)]";

/*
 * The window has to clip sideways, but clipping is not one edge at a time: a
 * box that hides what runs past its left and right hides what runs past its top
 * and bottom too, and a card wears a focus ring from the keyboard and a
 * hairline above and below however it is sitting in the glass, both of which
 * run past the top. So the window is given a band of its own above and below to
 * clip into, and takes the same band back off as negative margin, leaving the
 * row sitting exactly where it did. Half a rem either side is measured off the
 * deeper of the two: the ring and its offset stand 4px clear of a card, the
 * hairline 1px.
 */
const clipRoom = "-my-2 py-2";

export function SocialCards() {
  return (
    <div
      style={marqueeStyle}
      // The window the row travels behind. The fade is asked for only where the
      // row actually moves, so the still row below is left as plain as it was.
      className={`relative overflow-hidden ${clipRoom} ${edgeFade}`}
    >
      {/* The track. It is as wide as its contents and holds one flat line of
          cards, spaced by trailing padding on each rather than by a gap between
          them: a gap falls between cards but not after the last one, which
          would leave every copy of the row one space short of the step the loop
          takes and show a stutter at the seam. Held still while a pointer is on
          it or a card in it has the keyboard, since a link that is walking away
          from the cursor is a link that is hard to click. That holding is the
          one thing here done in script rather than in the cascade, and the note
          on MarqueeTrack is why: stopping a compositor driven animation from
          the main thread stops it on a frame the main thread has already left
          behind, which throws the row backwards by however long that frame was.

          For anyone who has asked for less motion the track stops being a track
          at all: it wraps, centres and spaces itself the way the row did before
          it moved, and the repeats below drop out. */}
      <MarqueeTrack
        // Every rule that shapes the moving track is asked for under
        // motion-safe and every rule that shapes the still one under
        // motion-reduce, so the two never both apply and neither has to win an
        // ordering argument with the other. Sliding a line of text under a mask
        // is worth a layer of its own: without one the row is repainted every
        // frame across the whole width of the column.
        className="flex motion-safe:w-max motion-safe:animate-marquee motion-safe:[will-change:transform] motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-2"
      >
        {Array.from({ length: COPIES }, (_, copy) =>
          links.map((link) => (
            <li
              key={`${copy}-${link.href}`}
              // Only the first copy is the row; the rest are the same cards
              // again to fill the line, so they are passed over by screen
              // readers and skipped by the tab key rather than read out four
              // times over.
              aria-hidden={copy > 0 || undefined}
              className={`flex motion-safe:pe-2 ${copy > 0 ? "motion-reduce:hidden" : ""}`}
            >
              <SocialCard link={link} repeat={copy > 0} />
            </li>
          )),
        )}
      </MarqueeTrack>
    </div>
  );
}

function SocialCard({ link, repeat }: { link: SocialLink; repeat?: boolean }) {
  const Icon = link.icon;

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={repeat ? undefined : `${link.name} on ${link.platform}`}
      tabIndex={repeat ? -1 : undefined}
      className={`flex rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${carved.link}`}
    >
      <Card
        // Cut into the pane, and coming up to its face under a pointer. Nothing
        // moves and nothing grows: the card is where it was and the line it
        // sits in is undisturbed, and all that changes is the light on it. That
        // is worth having in a row this tight, and it means the row answers a
        // pointer the same way for everyone rather than in a way held back from
        // anyone who has asked for less motion.
        className={`flex-1 gap-0 border-transparent py-[7px] text-white transition duration-200 ${carved.carved} ${link.cardClassName}`}
      >
        {/* The mark to handle gap is 8px on every card, and the two outer gaps
            are that plus 5 so the contents are not squeezed up against the
            card edges. Nothing here varies by card. */}
        <CardContent className="flex items-center gap-2 px-[13px]">
          {/* Fixed height, free width: the row keeps one height across the
              cards without padding the narrow marks out sideways. */}
          <span className="flex h-5 shrink-0 items-center">
            <Icon className={link.iconClassName} />
          </span>
          <span className="text-sm leading-tight font-semibold whitespace-nowrap lg:text-[13px]">
            {link.name}
          </span>
        </CardContent>
      </Card>
    </a>
  );
}
