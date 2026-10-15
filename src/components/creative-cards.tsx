import { ArrowUpRight, Bitcoin, Gamepad2, Shuffle } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import * as React from "react";

import maxDontStack from "@/assets/creative/max-dont-stack.png";
import maxWl from "@/assets/creative/max-wl.png";
import scubaMax from "@/assets/creative/scuba-max.png";
import { YouTubeMark } from "@/components/marks";

type Channel = {
  /** The channel's name, as it is said rather than as it is typed. */
  name: string;
  handle: string;
  href: string;
  /** The channel's own profile picture, cropped square from inside its circle. */
  avatar: StaticImageData;
  /** What the channel is about, in a word, and a mark that says the same. */
  topic: string;
  topicIcon: React.ComponentType<React.ComponentProps<"svg">>;
};

const channels: Channel[] = [
  {
    name: "Max Don't Stack",
    handle: "@MaxDontStack",
    href: "https://www.youtube.com/@MaxDontStack",
    avatar: maxDontStack,
    topic: "Crypto",
    topicIcon: Bitcoin,
  },
  {
    name: "Max_WL",
    handle: "@Max_WL",
    href: "https://www.youtube.com/@Max_WL",
    avatar: maxWl,
    topic: "Random",
    topicIcon: Shuffle,
  },
  {
    name: "Scuba Max",
    handle: "@Scuba_Max",
    href: "https://www.youtube.com/@Scuba_Max",
    avatar: scubaMax,
    topic: "Gaming",
    topicIcon: Gamepad2,
  },
];

// YouTube's own red, for the badge on each avatar.
const youTubeRed = "#ff0000";

/**
 * The YouTube channels, one card each, three across wherever there is room for
 * three and one under another where there is not. Each leads with the channel's
 * own profile picture rather than the platform's logo, since the three are on
 * the same platform and the pictures are what tell them apart; YouTube is a
 * badge on the corner of each, which is where the platform sits on a profile.
 */
export function CreativeCards() {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {channels.map((channel) => {
        const Topic = channel.topicIcon;

        return (
          <li key={channel.href}>
            <a
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${channel.name} (${channel.handle}), a ${channel.topic.toLowerCase()} channel on YouTube`}
              className="group flex h-full flex-col rounded-3xl border border-neutral-200 bg-white p-5 transition duration-300 hover:border-neutral-300 hover:shadow-[0_24px_48px_-28px_rgba(20,16,40,0.35)] focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none xl:p-6"
            >
              <div className="flex items-start justify-between">
                <span className="relative">
                  <Image
                    src={channel.avatar}
                    alt=""
                    placeholder="blur"
                    sizes="64px"
                    className="size-14 rounded-full object-cover ring-1 ring-black/5 xl:size-16"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full text-white ring-2 ring-white"
                    style={{ backgroundColor: youTubeRed }}
                  >
                    <YouTubeMark className="h-2.5 w-auto translate-x-px" />
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-5 text-neutral-300 transition duration-200 group-hover:text-neutral-900"
                />
              </div>

              <p className="mt-6 text-base leading-snug font-semibold text-neutral-900 xl:text-lg">
                {channel.name}
              </p>
              <p className="text-sm text-neutral-500">{channel.handle}</p>

              <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                <Topic aria-hidden="true" className="size-3.5" />
                {channel.topic}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
