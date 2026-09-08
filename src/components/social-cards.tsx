import * as React from "react";
import { Caveat } from "next/font/google";

import { Card, CardContent } from "@/components/ui/card";
import { PencilArrow, PencilDefs } from "@/components/pencil-annotation";

const caveat = Caveat({ subsets: ["latin"] });

/*
 * Both marks are the flat white knockout versions of the brand logos, drawn as
 * a single filled shape so they sit straight on the brand colour with no
 * second tone. The play triangle is a hole punched through the YouTube badge
 * (fill-rule evenodd) rather than a white shape stacked on top, so the card
 * colour shows through it.
 */

function YouTubeIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 160 110" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M154.3 17.5a19.4 19.4 0 0 0-13.7-13.7C128.6.5 79.9.5 79.9.5S31.2.5 19.2 3.8A19.4 19.4 0 0 0 5.5 17.5C2.2 29.5 2.2 55 2.2 55s0 25.5 3.3 37.5a19.4 19.4 0 0 0 13.7 13.7c12 3.3 60.7 3.3 60.7 3.3s48.7 0 60.7-3.3a19.4 19.4 0 0 0 13.7-13.7c3.3-12 3.3-37.5 3.3-37.5s0-25.5-3.3-37.5ZM64.3 78.4V31.6L104.8 55 64.3 78.4Z"
      />
    </svg>
  );
}

// Waveform heights, left to right: the top edge of each bar above a baseline
// at y=100.
const waveform = [63, 47, 38, 43, 41, 26, 19, 23, 14, 17, 11, 15, 8, 4, 4];

function SoundCloudIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 250 100" fill="currentColor" aria-hidden="true" {...props}>
      {waveform.map((top, index) => (
        <rect
          key={index}
          x={2 + index * 8.5}
          y={top}
          width={4.6}
          height={100 - top}
          rx={2.3}
        />
      ))}
      <path d="M130 100V34a34 34 0 0 1 67.4 6.5 33 33 0 0 1 19.6 59.5Z" />
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
   * The two marks are set to all but the same height so neither reads as the
   * bigger logo. Width is left to each mark's own proportions.
   */
  iconClassName: string;
  cardClassName: string;
  note: Note;
};

// Official brand colours: YouTube red and SoundCloud orange.
const youTubeCard = "bg-[#FF0000]";
const soundCloudCard = "bg-[#FF5500]";

const youTubeIconSize = "h-[26px] w-auto";
const soundCloudIconSize = "h-6 w-auto";

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
];

export function SocialCards() {
  return (
    <>
      <PencilDefs />
      <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-3">
        {links.map((link) => (
          <li key={link.name} className="flex flex-col">
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
        className={`flex-1 gap-0 border-transparent py-5 text-white transition-shadow hover:shadow-md ${link.cardClassName}`}
      >
        <CardContent className="flex flex-col gap-3 px-5 lg:px-4">
          {/* Fixed row height so both marks share one baseline across the row,
              whatever their own proportions are. */}
          <span className="flex h-7 items-center">
            <Icon className={link.iconClassName} />
          </span>
          <span className="leading-tight font-semibold break-words lg:text-sm">
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
