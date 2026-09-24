import { ArrowUpRight } from "lucide-react";
import * as React from "react";

import carved from "@/components/carved.module.css";
import { Card, CardContent } from "@/components/ui/card";

/*
 * The Viewlio mark, drawn the way the app itself draws it: a chevron stroked
 * with round caps, with the left arm shaded where it passes behind the right
 * one so the two read as one folded ribbon rather than a flat V. The clip is
 * what squares off the tops of both arms; the gradient in the mask is the
 * fold. Colours are the product's own brand blue and off white, hardcoded like
 * the social marks are, since they belong to the product rather than to this
 * page's theme.
 */

const viewlioBlue = "#2f63e1";

function ViewlioIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id="viewlio-fold"
          x1="8.4"
          y1="7"
          x2="24.5"
          y2="36.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.76" stopColor="#FFFFFF" />
          <stop offset="0.91" stopColor="#757575" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <mask
          id="viewlio-mask"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="48"
          height="48"
        >
          <rect width="48" height="48" fill="#FFFFFF" />
          <path
            d="M2.5 7 L14.3 7 L30.17 36.5 L18.37 36.5 Z"
            fill="url(#viewlio-fold)"
          />
        </mask>
        <clipPath id="viewlio-clip">
          <rect x="0" y="7" width="48" height="41" />
        </clipPath>
      </defs>
      <g clipPath="url(#viewlio-clip)" mask="url(#viewlio-mask)">
        <path
          d="M5.08 0.84 L24 36 L42.92 0.84"
          stroke="currentColor"
          strokeWidth="10.39"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/*
 * The Marketing Arena mark: the pixel skull the app leads with, brought over in
 * the form the app authors it in rather than as a copy of the file it ships.
 * The skull is not drawn but computed, a silhouette shaded by a distance field
 * over its own sockets, so there is no outline to trace the way the social
 * marks were traced. What there is instead is the grid that falls out of that,
 * 18 cells by 22, and the palette it indexes into. Those two together reproduce
 * public/logo/mark-skull.svg in the app's repo exactly, cell for cell.
 *
 * Its colours are hardcoded for the reason the Viewlio mark's are: they belong
 * to the product, not to this page's theme.
 */

const arenaPurple = "#1b0637";

// The gold ramp the mark is shaded on, darkest step first.
const arenaRamp = [
  "#0b0118",
  "#3a1f58",
  "#78527a",
  "#c08a2e",
  "#ffcf33",
  "#fff2b0",
];

// One character per cell: an index into the ramp, or '.' where the skull is not.
const arenaSkull = [
  ".....55555554.....",
  "...555555555454...",
  "..55555555545444..",
  ".5555555554444343.",
  ".5555454444343433.",
  "555544343333333334",
  "544333333222223233",
  "432222222212122223",
  "422111123221111122",
  "320000033210000023",
  "320000023220000022",
  "320000033310000023",
  ".2000033322200002.",
  ".2000333122320002.",
  "..33333100233232..",
  "..34331000033322..",
  "...442200002333...",
  "...432122222232...",
  "....4404004044....",
  "....4404004044....",
  ".....23232322.....",
  "......333333......",
];

function MarketingArenaIcon(props: React.ComponentProps<"svg">) {
  return (
    // A cell to a unit, so the grid above is the coordinate system. crispEdges
    // is what keeps the cells square-cornered at any size: without it the
    // renderer antialiases every cell boundary and the pixels go soft.
    <svg
      viewBox="0 0 18 22"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      {arenaSkull.flatMap((line, row) =>
        Array.from(line, (cell, col) =>
          cell === "." ? null : (
            <rect
              key={`${row}-${col}`}
              x={col}
              y={row}
              width="1"
              height="1"
              fill={arenaRamp[Number(cell)]}
            />
          ),
        ),
      )}
    </svg>
  );
}

/*
 * The Pretty Metrics mark: a four-pointed sparkle over three rising bars, in
 * white on the product's indigo. It is drawn on the same 512 grid as the app
 * icon it comes from, so filling the tile with it keeps the icon's own clear
 * space rather than one picked here. The bars are round-capped strokes, which
 * is how they read in the icon: pills of one width standing on one baseline.
 *
 * Its colour is hardcoded for the reason the others' are.
 */

const prettyMetricsIndigo = "#4f46e5";

function PrettyMetricsIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 512 512" fill="none" aria-hidden="true" {...props}>
      <path
        d="M192 121 C197 152 216 171 247 176 C216 181 197 200 192 231 C187 200 168 181 137 176 C168 171 187 152 192 121 Z"
        fill="currentColor"
      />
      <path
        d="M192 304 V366 M272 238 V366 M352 159 V366"
        stroke="currentColor"
        strokeWidth="44"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Build = {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  /**
   * Each mark is sized on its own, as the social marks are: one is a square
   * glyph and the other a grid taller than it is wide, so a single rule would
   * have to pad one of them out to suit the other.
   */
  iconClassName: string;
  /** The rounded tile the mark sits on, in the product's own brand colour. */
  tileClassName: string;
  tileStyle?: React.CSSProperties;
};

const builds: Build[] = [
  {
    name: "Viewlio",
    description: "Retention insight for YouTube creators",
    href: "https://www.viewlio.cc",
    icon: ViewlioIcon,
    // 70% of the tile, which is the clear space the mark is drawn with in the
    // app itself.
    iconClassName: "size-[70%]",
    tileClassName: "text-[#fafafa]",
    tileStyle: { backgroundColor: viewlioBlue },
  },
  {
    name: "The Marketing Arena",
    description: "Turn marketing into a game",
    href: "https://www.themarketingarena.cc",
    icon: MarketingArenaIcon,
    // Set by height, the skull being the taller way round, and at 33px rather
    // than the 70% of 48 that Viewlio's mark takes because 22 rows want a whole
    // number of pixels each: 1.5 per cell is three whole device pixels on a 2x
    // display, where 33.6px would leave the renderer rounding some rows a pixel
    // deeper than their neighbours and the skull visibly uneven. The app sizes
    // this mark in multiples of 22 for the same reason.
    iconClassName: "h-[33px] w-auto",
    tileStyle: { backgroundColor: arenaPurple },
    tileClassName: "",
  },
  {
    name: "Pretty Metrics",
    description: "Your metrics, made pretty",
    href: "https://www.prettymetrics.cc",
    icon: PrettyMetricsIcon,
    // The whole tile: the mark is drawn with the app icon's clear space
    // already around it.
    iconClassName: "size-full",
    tileClassName: "text-white",
    tileStyle: { backgroundColor: prettyMetricsIndigo },
  },
];

export function SaasCards() {
  return (
    // Same wrapping, centred row as the social cards: the builds sit side by
    // side where the column is wide enough for both and stack where it is not,
    // and a short last row stays centred under the full ones above it.
    <ul className="flex flex-wrap justify-center gap-2">
      {/* min-w-0 on the item: the card below asks for 26rem and settles for
          less, but a flex item will not go below its own content width without
          being told it may, and in a column narrower than that it would
          otherwise push a horizontal scrollbar into the page. */}
      {builds.map((build) => (
        <li key={build.href} className="flex min-w-0">
          <BuildCard build={build} />
        </li>
      ))}
    </ul>
  );
}

function BuildCard({ build }: { build: Build }) {
  const Icon = build.icon;

  return (
    <a
      href={build.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${build.name}: ${build.description}`}
      className={`group flex w-[26rem] max-w-full rounded-2xl transition duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${carved.link}`}
    >
      {/* Cut into the pane like the row of handles above it and the name above
          that, and coming up to the face of the glass under a pointer. It is
          the deeper of the two carves, being a card rather than a pill and so
          tall enough to see down into.

          Its border goes with the carve: the edge of a trough is drawn by the
          light falling into it, and a drawn line around the outside of that is
          a second edge in the wrong place, reading on a white card as a grey
          outline laid over the shading rather than as part of it. */}
      <Card
        className={`flex-1 gap-0 rounded-2xl border-transparent bg-white py-4 transition duration-200 ${carved.carved} ${carved.deep}`}
      >
        {/* The mark on the left, the name and the line about the app stacked
            beside it, and the arrow held out at the far edge. */}
        <CardContent className="flex items-center gap-4 px-5">
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${build.tileClassName}`}
            style={build.tileStyle}
          >
            <Icon className={build.iconClassName} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg leading-tight font-semibold text-neutral-900">
              {build.name}
            </span>
            <span className="mt-1 block text-sm leading-snug text-neutral-500">
              {build.description}
            </span>
          </span>
          {/* The arrow leans the way the link goes, which is the one bit of
              the card that says it opens somewhere else. It does not travel
              when the card is hovered, it only darkens: the card coming up to
              the face of the glass is the whole of what the hover says, and a
              mark sliding about on top of it is a second thing happening at
              the same time. Darkening over the same 200ms carries it up with
              the card rather than beside it. */}
          <ArrowUpRight
            aria-hidden="true"
            className="size-5 shrink-0 text-neutral-400 transition duration-200 group-hover:text-neutral-900"
          />
        </CardContent>
      </Card>
    </a>
  );
}
