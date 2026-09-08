import * as React from "react";
import { Caveat } from "next/font/google";

import { Card, CardContent } from "@/components/ui/card";
import { PencilArrow, PencilDefs } from "@/components/pencil-annotation";

const caveat = Caveat({ subsets: ["latin"] });

/*
 * The three marks are traced off the logo files committed at the repo root
 * (YouTube.png, SoundCloud.png, X.png): each viewBox is the artwork's own
 * bounding box, scaled, so the geometry below is the measured shape rather
 * than an approximation of it. They are flat white knockouts drawn as a single
 * filled shape, so they sit straight on the card colour with no second tone.
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

const youTubeIconSize = "h-[18px] w-auto";
const soundCloudIconSize = "h-auto w-9";
const xIconSize = "h-[17px] w-auto";

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
