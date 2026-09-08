import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";

function YouTubeIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}

function SoundCloudIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M1 13.2c-.3 0-.5.2-.5.5l-.2 2 .2 2c0 .3.2.5.5.5s.5-.2.5-.5l.2-2-.2-2c0-.3-.2-.5-.5-.5Zm2.3-1.6c-.3 0-.5.2-.5.5l-.2 3.6.2 3.5c0 .3.2.5.5.5s.5-.2.5-.5l.3-3.5-.3-3.6c0-.3-.2-.5-.5-.5Zm2.4-.6c-.3 0-.6.2-.6.6l-.2 4.1.2 3.5c0 .3.3.6.6.6s.5-.3.6-.6l.2-3.5-.2-4.1c0-.4-.3-.6-.6-.6Zm2.5.3c-.4 0-.6.3-.6.6l-.2 3.8.2 3.5c0 .3.2.6.6.6s.6-.3.6-.6l.2-3.5-.2-3.8c0-.3-.3-.6-.6-.6Zm2.5-2.5c-.4 0-.7.3-.7.7L10.5 16l.2 3.4c0 .4.3.7.7.7s.7-.3.7-.7l.2-3.4-.2-6.5c0-.4-.3-.7-.7-.7Zm2.5-1.5c-.4 0-.7.3-.7.7l-.2 8 .2 3.3c0 .4.3.7.7.7s.7-.3.7-.7l.2-3.3-.2-8c0-.4-.3-.7-.7-.7Zm2.6-.6c-.4 0-.8.3-.8.8l-.1 8.6.1 3.2c0 .4.4.8.8.8s.8-.4.8-.8l.2-3.2-.2-8.6c0-.5-.4-.8-.8-.8Zm2.7 1c-.5 0-.8.4-.8.8l-.2 7.6.2 3.1c0 .5.3.8.8.8s.8-.3.8-.8l.2-3.1-.2-7.6c0-.4-.4-.8-.8-.8Zm3.9 3.3c-.5 0-1 .1-1.4.3l-.2 8.2c0 .4.4.8.8.8h4.1A3.1 3.1 0 0 0 24 16.9a3.1 3.1 0 0 0-3.1-3.1Z" />
    </svg>
  );
}

type SocialLink = {
  name: string;
  platform: string;
  description: string;
  /** Fill this in once the channel URL is known. */
  href: string | null;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  iconClassName: string;
};

const links: SocialLink[] = [
  {
    name: "YouTube Channel One",
    platform: "YouTube",
    description: "Placeholder for the first channel.",
    href: null,
    icon: YouTubeIcon,
    iconClassName: "bg-red-50 text-red-600",
  },
  {
    name: "YouTube Channel Two",
    platform: "YouTube",
    description: "Placeholder for the second channel.",
    href: null,
    icon: YouTubeIcon,
    iconClassName: "bg-red-50 text-red-600",
  },
  {
    name: "YouTube Channel Three",
    platform: "YouTube",
    description: "Placeholder for the third channel.",
    href: null,
    icon: YouTubeIcon,
    iconClassName: "bg-red-50 text-red-600",
  },
  {
    name: "SoundCloud",
    platform: "SoundCloud",
    description: "Placeholder for the music.",
    href: null,
    icon: SoundCloudIcon,
    iconClassName: "bg-orange-50 text-orange-500",
  },
];

export function SocialCards() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {links.map((link) => (
        <li key={link.name}>
          <SocialCard link={link} />
        </li>
      ))}
    </ul>
  );
}

function SocialCard({ link }: { link: SocialLink }) {
  const Icon = link.icon;

  const card = (
    <Card className="h-full gap-0 py-5 transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 px-5">
        <span
          className={`flex size-10 items-center justify-center rounded-lg ${link.iconClassName}`}
        >
          <Icon className="size-5" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {link.platform}
          </span>
          <span className="leading-none font-semibold text-neutral-900">
            {link.name}
          </span>
          <span className="text-sm text-muted-foreground">
            {link.description}
          </span>
        </span>
      </CardContent>
    </Card>
  );

  if (!link.href) {
    return card;
  }

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {card}
    </a>
  );
}
