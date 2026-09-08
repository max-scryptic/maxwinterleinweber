import * as React from "react";
import { Caveat } from "next/font/google";

import { Card, CardContent } from "@/components/ui/card";
import { PencilArrow, PencilDefs } from "@/components/pencil-annotation";

const caveat = Caveat({ subsets: ["latin"] });

/*
 * All three marks are the flat white knockout versions of the brand logos,
 * drawn as a single filled shape so they sit straight on the card colour with
 * no second tone. Where a mark has a counter — the YouTube play triangle — it
 * is a hole punched through the shape (fill-rule evenodd) rather than a white
 * shape stacked on top, so the card colour shows through it.
 */

function YouTubeIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 17" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M23.498 2.686a3.016 3.016 0 0 0-2.122-2.136C19.505.045 12 .045 12 .045S4.495.045 2.623.55A3.017 3.017 0 0 0 .502 2.686C0 4.57 0 8.5 0 8.5s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 12.43 24 8.5 24 8.5s0-3.93-.502-5.814ZM9.545 12.068V4.932L15.818 8.5l-6.273 3.568Z"
      />
    </svg>
  );
}

/*
 * The SoundCloud waveform: [centre x, top, bottom] for each spindle, which is
 * drawn as a lens — two quadratic curves meeting in a point at either end —
 * the way the brand mark tapers its bars rather than capping them flat.
 */
const waveform: [x: number, top: number, bottom: number][] = [
  [1.8, 60, 76],
  [12, 52, 85.5],
  [20, 47, 89],
  [28, 48, 91],
  [36, 50, 92],
  [44, 51, 93],
  [52, 35, 93.5],
  [60, 25, 94.5],
  [68, 19, 96],
  [76, 22, 96],
  [84, 24, 96],
  [92, 25, 97],
  [100, 18, 97.5],
  [108, 7, 98],
  [116, 4, 98],
];

const spindleHalfWidth = 2.1;

function spindle(x: number, top: number, bottom: number) {
  const middle = (top + bottom) / 2;
  const left = x - spindleHalfWidth;
  const right = x + spindleHalfWidth;
  return `M${x} ${top}Q${right} ${middle} ${x} ${bottom}Q${left} ${middle} ${x} ${top}Z`;
}

// Left edge, the small puff over it, then the big lobe sweeping round to the
// flat base: the cloud is two overlapping circles with a shallow notch between.
const soundCloudCloud =
  "M120 100V36A33 33 0 0 1 166.5 5.9A50 50 0 1 1 190 100Z";

function SoundCloudIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 240 100"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path
        d={
          waveform.map(([x, top, bottom]) => spindle(x, top, bottom)).join("") +
          soundCloudCloud
        }
      />
    </svg>
  );
}

/*
 * The X mark is the two crossing strokes of the logo — a thick descending one
 * and a thin ascending one — as two subpaths wound the same way so the default
 * nonzero fill unions them into one solid glyph.
 */
function XIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M0 0h7.5l16.5 24h-7.5ZM20.32 0H24L3.68 24H0Z" />
    </svg>
  );
}

type Note = {
  label: string;
  /** Absolute placement and tilt of the handwriting inside the note strip. */
  labelClassName: string;
  arrow: React.ComponentProps<typeof PencilArrow>;
};

type SocialLink = {
  name: string;
  platform: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  /**
   * Each mark is sized on its own so none reads as the bigger logo: the wide
   * SoundCloud mark is set by width, the taller YouTube and X marks by height.
   * They all sit in the same fixed box, so the handles line up down the row.
   */
  iconClassName: string;
  cardClassName: string;
  note: Note;
};

// Official brand colours: YouTube red, SoundCloud orange, X black.
const youTubeCard = "bg-[#FF0000]";
const soundCloudCard = "bg-[#FF5500]";
const xCard = "bg-black";

const youTubeIconSize = "h-[19px] w-auto";
const soundCloudIconSize = "w-9 h-auto";
const xIconSize = "h-[15px] w-auto";

const links: SocialLink[] = [
  {
    name: "@MaxDontStack",
    platform: "YouTube",
    href: "https://www.youtube.com/@MaxDontStack",
    icon: YouTubeIcon,
    iconClassName: youTubeIconSize,
    cardClassName: youTubeCard,
    note: {
      label: "Crypto",
      labelClassName: "top-14 left-0 -rotate-6",
      arrow: {
        path: "M6 52C10 39 17 27 28 18c4-4 9-6 14-8",
        tip: [42, 10],
        angle: -22,
        width: 64,
        height: 56,
        className: "absolute top-0 left-11",
      },
    },
  },
  {
    name: "@Scuba_Max",
    platform: "YouTube",
    href: "https://www.youtube.com/@Scuba_Max",
    icon: YouTubeIcon,
    iconClassName: youTubeIconSize,
    cardClassName: youTubeCard,
    note: {
      label: "Gaming",
      labelClassName: "top-16 left-6 rotate-3",
      arrow: {
        path: "M28 58c4-13 2-24-3-33-2-4-4-7-5-10",
        tip: [20, 15],
        angle: -108,
        width: 46,
        height: 62,
        className: "absolute top-0 left-14",
      },
    },
  },
  {
    name: "@Max_WL",
    platform: "YouTube",
    href: "https://www.youtube.com/@Max_WL",
    icon: YouTubeIcon,
    iconClassName: youTubeIconSize,
    cardClassName: youTubeCard,
    note: {
      label: "Random stuff",
      labelClassName: "top-[58px] right-6 rotate-2",
      arrow: {
        path: "M60 52C52 40 44 29 33 20c-4-3-8-5-12-7",
        tip: [21, 13],
        angle: -153,
        width: 66,
        height: 56,
        className: "absolute top-0 right-11",
      },
    },
  },
  {
    name: "@eutonix",
    platform: "SoundCloud",
    href: "https://soundcloud.com/eutonix",
    icon: SoundCloudIcon,
    iconClassName: soundCloudIconSize,
    cardClassName: soundCloudCard,
    note: {
      label: "Music",
      labelClassName: "top-[76px] left-6 -rotate-3",
      arrow: {
        path: "M8 56c11-3 21-8 26-17 3-6 4-15 2-25",
        tip: [36, 14],
        angle: -107,
        width: 70,
        height: 60,
        className: "absolute top-0 left-10",
      },
    },
  },
  {
    name: "@MaxWinterL",
    platform: "X",
    href: "https://x.com/MaxWinterL",
    icon: XIcon,
    iconClassName: xIconSize,
    cardClassName: xCard,
    note: {
      label: "Hacking",
      labelClassName: "top-[62px] left-4 rotate-2",
      arrow: {
        path: "M14 50c-2-12 1-22 8-30 3-3 6-6 10-8",
        tip: [33, 11],
        angle: -30,
        width: 60,
        height: 54,
        className: "absolute top-0 left-8",
      },
    },
  },
];

export function SocialCards() {
  return (
    <>
      <PencilDefs />
      <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-3">
        {links.map((link) => (
          <li key={link.href} className="flex flex-col">
            <SocialCard link={link} />
            <ScribbledNote note={link.note} />
          </li>
        ))}
      </ul>
    </>
  );
}

function SocialCard({ link }: { link: SocialLink }) {
  const Icon = link.icon;

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${link.name} on ${link.platform}`}
      className="flex rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card
        className={`flex-1 gap-0 border-transparent py-3 text-white transition-shadow hover:shadow-md ${link.cardClassName}`}
      >
        <CardContent className="flex items-center gap-2.5 px-4 lg:gap-2 lg:px-3">
          {/* Fixed box so the marks share one centre whatever their own
              proportions are, and every handle starts at the same point. */}
          <span className="flex h-5 w-9 shrink-0 items-center justify-center">
            <Icon className={link.iconClassName} />
          </span>
          <span className="min-w-0 text-sm leading-tight font-semibold break-words lg:text-[13px]">
            {link.name}
          </span>
        </CardContent>
      </Card>
    </a>
  );
}

/**
 * The topic label, moved off the card and scrawled underneath it with an arrow
 * pointing back up. The strip is a fixed height for every card so the cards
 * themselves stay the same size no matter where the handwriting sits inside it.
 */
function ScribbledNote({ note }: { note: Note }) {
  return (
    <div className="relative h-28 text-neutral-600">
      <PencilArrow {...note.arrow} />
      <span
        className={`${caveat.className} absolute text-2xl font-semibold whitespace-nowrap ${note.labelClassName}`}
      >
        {note.label}
      </span>
    </div>
  );
}
