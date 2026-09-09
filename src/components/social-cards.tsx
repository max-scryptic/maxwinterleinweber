import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";

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
];

export function SocialCards() {
  return (
    // A wrapping row rather than fixed tracks: each card is exactly its own
    // contents wide, and centring the flex line keeps a short last row centred
    // under the ones above it however many cards happen to fit per row.
    <ul className="flex flex-wrap justify-center gap-2">
      {links.map((link) => (
        <li key={link.href} className="flex">
          <SocialCard link={link} />
        </li>
      ))}
    </ul>
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
        // The lift is small on purpose: these are pills in a tight row, and
        // anything more makes the hovered one jump out of the line. Held back
        // for anyone who has asked for less motion, where the shadow alone
        // still says the card is live.
        className={`flex-1 gap-0 border-transparent py-[7px] text-white transition duration-200 hover:shadow-lg motion-safe:hover:-translate-y-0.5 ${link.cardClassName}`}
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
