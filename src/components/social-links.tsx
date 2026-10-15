import * as React from "react";

import { InstagramMark, LinkedInMark, XMark } from "@/components/marks";

/*
 * The profiles that go with the introduction: where to find Max professionally
 * and day to day. The channels and the music are in the creative section
 * further down, which is where they are about rather than who.
 */
const profiles = [
  {
    platform: "LinkedIn",
    href: "https://www.linkedin.com/in/maxwinter-leinweber/",
    mark: LinkedInMark,
  },
  { platform: "X", href: "https://x.com/MaxWinterL", mark: XMark },
  {
    platform: "Instagram",
    href: "https://www.instagram.com/max_eutonix/",
    mark: InstagramMark,
  },
] satisfies {
  platform: string;
  href: string;
  mark: React.ComponentType<React.ComponentProps<"svg">>;
}[];

/**
 * A row of round icon links, one mark per circle, in ink on white so they sit
 * under the introduction as part of it rather than as three brand colours
 * competing with the portrait. Each mark is sized to the same optical weight:
 * all three are 16px tall, and the circle around them does the rest.
 */
export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex items-center gap-3 ${className}`}>
      {profiles.map(({ platform, href, mark: Mark }) => (
        <li key={platform}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={`Max on ${platform}`}
            title={platform}
            className="flex size-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Mark className="h-4 w-auto" />
          </a>
        </li>
      ))}
    </ul>
  );
}
