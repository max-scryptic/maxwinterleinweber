import { ArrowUpRight } from "lucide-react";
import * as React from "react";

import { SoundCloudMark, YouTubeMark } from "@/components/marks";

type Channel = {
  handle: string;
  /** Where it lives, said the way a visitor would say it. */
  kind: string;
  /** What the link does when followed, which is the card's last line. */
  action: string;
  href: string;
  mark: React.ComponentType<React.ComponentProps<"svg">>;
  /**
   * Each mark is sized on its own so none reads as the bigger logo: the wide
   * SoundCloud mark is set by width, the taller YouTube one by height.
   */
  markClassName: string;
  /** The tile the mark sits on, in the platform's own colour. */
  tile: string;
};

// Official brand colours: YouTube red, SoundCloud orange.
const youTubeRed = "#ff0000";
const soundCloudOrange = "#ff5500";

const channels: Channel[] = [
  {
    handle: "@MaxDontStack",
    kind: "YouTube channel",
    action: "Watch on YouTube",
    href: "https://www.youtube.com/@MaxDontStack",
    mark: YouTubeMark,
    markClassName: "h-[18px] w-auto translate-x-px",
    tile: youTubeRed,
  },
  {
    handle: "@Scuba_Max",
    kind: "YouTube channel",
    action: "Watch on YouTube",
    href: "https://www.youtube.com/@Scuba_Max",
    mark: YouTubeMark,
    markClassName: "h-[18px] w-auto translate-x-px",
    tile: youTubeRed,
  },
  {
    handle: "@Max_WL",
    kind: "YouTube channel",
    action: "Watch on YouTube",
    href: "https://www.youtube.com/@Max_WL",
    mark: YouTubeMark,
    markClassName: "h-[18px] w-auto translate-x-px",
    tile: youTubeRed,
  },
  {
    handle: "@eutonix",
    kind: "Music on SoundCloud",
    action: "Listen on SoundCloud",
    href: "https://soundcloud.com/eutonix",
    mark: SoundCloudMark,
    markClassName: "h-auto w-8",
    tile: soundCloudOrange,
  },
];

/**
 * The channels and the music, one card each, four across where there is room
 * and two where there is not. Laid out like the product cards above them,
 * with the platform's mark on its own colour as the tile, so the two groups
 * read as the same kind of thing at different weights.
 */
export function CreativeCards() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {channels.map((channel) => {
        const Mark = channel.mark;

        return (
          <li key={channel.href}>
            <a
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${channel.handle}, ${channel.kind}`}
              className="group flex h-full flex-col rounded-3xl border border-neutral-200 bg-white p-6 transition duration-300 hover:border-neutral-300 hover:shadow-[0_24px_48px_-28px_rgba(20,16,40,0.35)] focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between">
                <span
                  className="flex size-12 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: channel.tile }}
                >
                  <Mark className={channel.markClassName} />
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-5 text-neutral-300 transition duration-200 group-hover:text-neutral-900"
                />
              </div>

              <p className="mt-8 text-lg font-semibold text-neutral-900">
                {channel.handle}
              </p>
              <p className="text-sm text-neutral-500">{channel.kind}</p>

              <p className="mt-auto pt-6 text-sm font-medium text-neutral-400 transition-colors group-hover:text-neutral-900">
                {channel.action}
              </p>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
