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

type Build = {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  /** The rounded tile the mark sits on, in the product's own brand colour. */
  tileClassName: string;
  tileStyle?: React.CSSProperties;
};

const builds: Build[] = [
  {
    name: "Viewlio",
    description: "Retention insight for YouTube creators",
    href: "https://hookpointai.vercel.app",
    icon: ViewlioIcon,
    tileClassName: "text-[#fafafa]",
    tileStyle: { backgroundColor: viewlioBlue },
  },
];

export function SaasCards() {
  return (
    // Same wrapping, centred row as the social cards, so a second build later
    // lines up beside this one and a short last row stays centred.
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
            {/* 70% of the tile, which is the clear space the mark is drawn
                with in the app itself. */}
            <Icon className="size-[70%]" />
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
              the card that says it opens somewhere else. */}
          <ArrowUpRight
            aria-hidden="true"
            className="size-5 shrink-0 text-neutral-400 transition duration-200 group-hover:text-neutral-900 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
          />
        </CardContent>
      </Card>
    </a>
  );
}
