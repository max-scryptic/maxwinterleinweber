import { ArrowUpRight } from "lucide-react";
import * as React from "react";

import carved from "@/components/carved.module.css";
import { Card, CardContent } from "@/components/ui/card";

/*
 * The services offered off the page, as opposed to the products built from it.
 * They are all sold through one studio now, so where there used to be a card
 * per line of work and a mail link behind each, there is one card for the
 * studio and it goes to the studio's own site. It is laid out as the SaaS
 * cards are, mark on a tile, name and line beside it, arrow at the edge, so
 * the two groups read as the same kind of thing.
 */

/*
 * The Scryptic mark, "the split glass": a disc cut in half with the halves
 * slid apart, which also reads as an S. Same paths as the studio's own
 * src/components/brand-logo.tsx, on the same 24 grid: two half discs of
 * radius 8.5, the top one 4 units left of the bottom one and 2 units above it.
 * The brand keeps it one colour and never rotates it, or the S disappears.
 *
 * The brand sets the mark straight on the surface with no container, but
 * makes an exception for avatars, where the platform wants a filled square,
 * and draws those as a white mark on Lapis. A tile here is that same filled
 * square, so it takes the avatar's colours, and Lapis is hardcoded for the
 * reason the product colours are: it belongs to the studio, not to this
 * page's theme.
 */

const scrypticLapis = "#2b3fd6";

function ScrypticIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M1.5 11A8.5 8.5 0 0 1 18.5 11Z" />
      <path d="M5.5 13A8.5 8.5 0 0 0 22.5 13Z" />
    </svg>
  );
}

type Service = {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  iconClassName: string;
  /** The rounded tile the mark sits on, in the studio's own brand colour. */
  tileClassName: string;
  tileStyle?: React.CSSProperties;
};

const scryptic: Service = {
  name: "Scryptic",
  // The studio's own headline, as its landing page leads with it.
  description: "From idea to launched app, without hiring a dev team",
  href: "https://www.scryptic.co.uk",
  icon: ScrypticIcon,
  // The mark is 21 units across a 24 unit frame, so 60% of the tile puts it
  // at about half the tile's width, which is the clear space the brand's own
  // avatars give it.
  iconClassName: "size-[60%]",
  tileClassName: "text-white",
  tileStyle: { backgroundColor: scrypticLapis },
};

export function ServiceCards() {
  return (
    // The same centred row the builds sit in, so the one card lines up under
    // them rather than hanging off the left of the column. Where the builds go
    // two to a row it spans the both of them, so its edges are theirs and its
    // line has the room to stay on one row.
    <ul className="flex flex-wrap justify-center gap-2">
      <li className="flex min-w-0 @lg:basis-full">
        <ServiceCard service={scryptic} />
      </li>
    </ul>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon;

  return (
    <a
      href={service.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${service.name}: ${service.description}`}
      className={`group flex w-[26rem] max-w-full rounded-2xl @lg:w-auto @lg:flex-1 transition duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${carved.link}`}
    >
      {/* Cut into the pane to the same depth as the build cards, padded the
          same way for the same reason, and rising to the face of the glass
          under a pointer the same way. The same 26rem as the builds too: it
          carries a single line now rather than a sentence and a question,
          which settles at two rows at that width as the taglines above do. */}
      <Card
        className={`flex-1 gap-0 rounded-2xl border-transparent bg-white py-3 transition duration-200 ${carved.carved} ${carved.deep}`}
      >
        <CardContent className="flex items-center gap-4 px-5">
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${service.tileClassName}`}
            style={service.tileStyle}
          >
            <Icon className={service.iconClassName} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg leading-tight font-semibold text-neutral-900">
              {service.name}
            </span>
            <span className="mt-1 block text-sm leading-snug text-neutral-500">
              {service.description}
            </span>
          </span>
          {/* An arrow where these cards used to carry an envelope, because it
              no longer opens mail but another site, the same as the builds. */}
          <ArrowUpRight
            aria-hidden="true"
            className="size-5 shrink-0 text-neutral-400 transition duration-200 group-hover:text-neutral-900"
          />
        </CardContent>
      </Card>
    </a>
  );
}
