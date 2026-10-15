import { ArrowUpRight } from "lucide-react";
import { Press_Start_2P } from "next/font/google";
import type { StaticImageData } from "next/image";
import * as React from "react";

import prettyMetricsShot from "@/assets/work/prettymetrics.webp";
import reelEstateShot from "@/assets/work/reelestate.webp";
import untilThenShot from "@/assets/work/until-then.webp";
import viewlioShot from "@/assets/work/viewlio.webp";
import { FadeImage } from "@/components/fade-image";

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

/*
 * The UntilThen mark: an ellipsis fading in inside a speech bubble. Three dots
 * are a message on its way; the ink comes up to full strength on the last one,
 * the day it arrives. Unlike the others it is not a glyph set on a tile but the
 * tile itself: the bubble, with its tail at the bottom left, is the outline. So
 * it fills the whole 48px slot and the slot is given no colour of its own. Same
 * geometry as the app's public/logo.svg, on the same 32 grid.
 *
 * Its colours are hardcoded for the reason the others' are: the rose bubble
 * and the near-black ink are the product's fixed brand colours.
 */

const untilThenRose = "#e9b6b1";
const untilThenInk = "#2b1213";

function UntilThenIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 0h18a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7H7c-2.5 0-5 2-7 4V7a7 7 0 0 1 7-7Z"
        fill={untilThenRose}
      />
      <g fill={untilThenInk}>
        <circle cx="9" cy="14" r="2.6" opacity="0.35" />
        <circle cx="16" cy="14" r="2.6" opacity="0.65" />
        <circle cx="23" cy="14" r="2.6" />
      </g>
    </svg>
  );
}

/*
 * The ReelEstate mark: a house with three film sprocket holes down its left
 * wall, a listing turned into a reel. It is set in the logo's coral on the
 * app's dark theme background, the way it sits on the app in dark mode, in
 * the same rounded square as the other marks. The holes are cut out with a
 * mask rather than drawn in, so the tile shows through them. Same geometry as
 * the app's src/app/icon.svg, on the same 512 grid, and like Pretty Metrics it
 * is drawn in the whole of that frame so the tile keeps the icon's own clear
 * space.
 *
 * Its colours are hardcoded for the reason the others' are.
 */

const reelEstateCoral = "#f0543c";
// The app's dark theme --background, oklch(0.145 0 0).
const reelEstateDark = "#0a0a0a";

function ReelEstateIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 512 512" fill="none" aria-hidden="true" {...props}>
      <defs>
        <mask
          id="reelestate-holes"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="512"
          height="512"
        >
          <rect width="512" height="512" fill="#FFFFFF" />
          {[230, 288, 346].map((y) => (
            <rect
              key={y}
              x="120"
              y={y}
              width="42"
              height="44"
              rx="10"
              fill="#000000"
            />
          ))}
        </mask>
      </defs>
      <path
        d="M256 104 L400 224 L400 408 L112 408 L112 224 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinejoin="round"
        mask="url(#reelestate-holes)"
      />
    </svg>
  );
}

/*
 * The Marketing Arena's own arcade face, for the one build that has no
 * screenshot to show: its preview is drawn instead, in the app's colours and
 * lettering, so it sits among the others as a picture of the product rather
 * than as a gap where one should be.
 */
const pressStart = Press_Start_2P({ subsets: ["latin"], weight: "400" });

function ArenaPreview() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center"
      style={{
        backgroundColor: arenaPurple,
        // A glow of the skull's own gold behind it, and the faint scan lines
        // of the screen the app is styled after.
        backgroundImage: [
          "radial-gradient(55% 55% at 50% 42%, rgba(255, 207, 51, 0.14), transparent 70%)",
          "repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 4px)",
        ].join(", "),
      }}
    >
      {/* Four and five pixels a cell, whole numbers for the same reason the
          tile's mark is set at 33px: 22 rows that each want the same height. */}
      <MarketingArenaIcon className="h-[88px] w-auto sm:h-[110px]" />
      <p
        className={`${pressStart.className} text-[11px] leading-relaxed tracking-wide text-[#ffcf33] sm:text-sm`}
      >
        The Marketing Arena
      </p>
    </div>
  );
}

type Build = {
  name: string;
  /** What kind of product it is, in a few words, under the name. */
  category: string;
  /** What it does and who it is for, in a sentence or two. */
  summary: string;
  href: string;
  /** The address as it is shown, without the scheme or the www. */
  domain: string;
  /** A screenshot of the product, or nothing for one drawn in its place. */
  shot: StaticImageData | null;
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

/*
 * The screenshots and the lines about each product are the ones the studio's
 * case studies use, so the two sites describe the same products the same way.
 */
const builds: Build[] = [
  {
    name: "Viewlio",
    category: "AI analytics for YouTube creators",
    summary:
      "Reads a video's audience retention curve against the video itself, frame by frame, and explains why viewers left and what to change in the next upload.",
    href: "https://www.viewlio.cc",
    domain: "viewlio.cc",
    shot: viewlioShot,
    icon: ViewlioIcon,
    // 70% of the tile, which is the clear space the mark is drawn with in the
    // app itself.
    iconClassName: "size-[70%]",
    tileClassName: "text-[#fafafa]",
    tileStyle: { backgroundColor: viewlioBlue },
  },
  {
    name: "The Marketing Arena",
    category: "Marketing, as a game",
    summary:
      "Turns your marketing routine into a game: commit to the work you mean to do, answer for it as it comes due, and build the record of a champion.",
    href: "https://www.themarketingarena.cc",
    domain: "themarketingarena.cc",
    shot: null,
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
    category: "Shareable revenue charts",
    summary:
      "Reads a founder's revenue from Stripe and six other payment providers and turns it into polished share cards and looping videos for X, LinkedIn and investor updates.",
    href: "https://www.prettymetrics.cc",
    domain: "prettymetrics.cc",
    shot: prettyMetricsShot,
    icon: PrettyMetricsIcon,
    // The whole tile: the mark is drawn with the app icon's clear space
    // already around it.
    iconClassName: "size-full",
    tileClassName: "text-white",
    tileStyle: { backgroundColor: prettyMetricsIndigo },
  },
  {
    name: "UntilThen",
    category: "Scheduled messages",
    summary:
      "Write a letter or record a voice or video message today, and have it emailed to the people you choose on a date you set, even years from now.",
    href: "https://www.until-then.cc",
    domain: "until-then.cc",
    shot: untilThenShot,
    icon: UntilThenIcon,
    // The whole slot, with no tile behind it: the bubble is the tile.
    iconClassName: "size-full",
    tileClassName: "",
  },
  {
    name: "ReelEstate",
    category: "AI video for estate agents",
    summary:
      "Turns the listing photos estate agents already have into branded property videos, reels and carousels for every social platform. No filming, no editing.",
    href: "https://reelestate.cc",
    domain: "reelestate.cc",
    shot: reelEstateShot,
    icon: ReelEstateIcon,
    // The whole tile: the mark is drawn with the app icon's clear space
    // already around it.
    iconClassName: "size-full",
    tileClassName: "",
    tileStyle: { backgroundColor: reelEstateDark, color: reelEstateCoral },
  },
];

export function SaasCards() {
  return (
    // Two to a row, with the first build across the top of both and laid on
    // its side: it is the one the list opens on, and five cards in a grid of
    // two leave one over, so the odd one out is made the lead rather than left
    // hanging at the bottom.
    <ul className="grid gap-6 md:grid-cols-2">
      {builds.map((build, index) => (
        <li key={build.href} className={index === 0 ? "md:col-span-2" : ""}>
          <BuildCard build={build} lead={index === 0} />
        </li>
      ))}
    </ul>
  );
}

function BuildCard({ build, lead }: { build: Build; lead: boolean }) {
  const Icon = build.icon;

  return (
    <a
      href={build.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${build.name}: ${build.category}`}
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition duration-300 hover:border-foreground/20 hover:shadow-[0_24px_48px_-28px_rgba(20,16,40,0.35)] focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${lead ? "xl:flex-row" : ""}`}
    >
      {/* The product as it looks, cropped from the top, which is where every
          one of these screenshots has its headline. The lead card lays its
          picture beside its words only from xl, and gives each half the row:
          any narrower and the words are squeezed into a column a few words
          wide, so below that it stands like the others, only wider. */}
      <div
        className={`relative aspect-[16/10] shrink-0 overflow-hidden border-b border-border bg-muted ${lead ? "xl:w-1/2 xl:border-r xl:border-b-0" : ""}`}
      >
        {build.shot ? (
          <FadeImage
            src={build.shot}
            alt=""
            fill
            sizes={
              lead
                ? "(min-width: 1280px) 30vw, (min-width: 768px) 60vw, 100vw"
                : "(min-width: 768px) 30vw, 100vw"
            }
            className="object-cover object-top transition duration-500 group-hover:scale-[1.015]"
          />
        ) : (
          <ArenaPreview />
        )}
      </div>

      <div
        className={`flex flex-1 flex-col p-6 ${lead ? "xl:justify-center xl:p-10" : ""}`}
      >
        <div className="flex items-center gap-3.5">
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${build.tileClassName}`}
            style={build.tileStyle}
          >
            <Icon className={build.iconClassName} />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block font-semibold text-foreground ${lead ? "text-lg xl:text-2xl" : "text-lg"}`}
            >
              {build.name}
            </span>
            <span className="block text-sm text-muted-foreground">
              {build.category}
            </span>
          </span>
          {/* The arrow leans the way the link goes, which is the one bit of
              the card that says it opens somewhere else. */}
          <ArrowUpRight
            aria-hidden="true"
            className="size-5 shrink-0 self-start text-faint-foreground transition duration-200 group-hover:text-foreground"
          />
        </div>

        <p
          className={`mt-4 leading-relaxed text-subtle-foreground ${lead ? "text-[15px] xl:text-lg" : "text-[15px]"}`}
        >
          {build.summary}
        </p>

        <p
          className={`pt-5 text-sm font-medium text-faint-foreground transition-colors group-hover:text-foreground ${lead ? "xl:mt-0" : "mt-auto"}`}
        >
          {build.domain}
        </p>
      </div>
    </a>
  );
}
