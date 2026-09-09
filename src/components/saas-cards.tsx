import * as React from "react";

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
      {builds.map((build) => (
        <li key={build.href} className="flex">
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
      className="flex w-[22rem] max-w-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card className="flex-1 gap-0 border-neutral-200 bg-white py-5 transition-shadow hover:shadow-md">
        {/* The mark and the name share the top line, with the line about the
            app under both of them. */}
        <CardContent className="flex flex-col items-start gap-2 px-5">
          <span className="flex items-center gap-3">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${build.tileClassName}`}
              style={build.tileStyle}
            >
              {/* 70% of the tile, which is the clear space the mark is drawn
                  with in the app itself. */}
              <Icon className="size-[70%]" />
            </span>
            <span className="text-xl leading-tight font-semibold text-neutral-900">
              {build.name}
            </span>
          </span>
          <span className="text-base leading-snug text-neutral-500">
            {build.description}
          </span>
        </CardContent>
      </Card>
    </a>
  );
}
