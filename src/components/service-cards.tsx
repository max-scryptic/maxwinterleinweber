import { ArrowRight, ArrowUpRight } from "lucide-react";
import * as React from "react";

/*
 * The services offered off the page, as opposed to the products built from it.
 * They are all sold through one studio, so there is one card, for the studio,
 * and it says enough about the work that a visitor knows whether to book the
 * call before they leave for the studio's own site.
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

/*
 * The studio's own words, from its site: the one service it sells and the
 * three numbers a founder asks about first. Kept here as the studio states
 * them, so this card cannot promise something the studio's own pages do not.
 */
const SITE = "https://www.scryptic.co.uk";

const facts = [
  { label: "Development sprint", value: "2 or 3 weeks" },
  { label: "Demos", value: "Every Friday" },
  { label: "Fixed price", value: "From £10,000" },
];

export function ServiceCards() {
  return (
    <article className="overflow-hidden rounded-[0.75rem] border border-border bg-card">
      <div className="p-6 sm:p-10">
        <div className="flex items-center gap-4">
          {/* The mark is 21 units across a 24 unit frame, so 55% of the tile
              puts it at about half the tile's width, which is the clear space
              the brand's own avatars give it. */}
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: scrypticLapis }}
          >
            <ScrypticIcon className="size-[55%]" />
          </span>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Scryptic</h3>
            <p className="text-sm text-muted-foreground">
              MVP and app development studio in Brighton
            </p>
          </div>
        </div>

        <p className="mt-8 max-w-2xl font-serif text-3xl leading-tight text-foreground sm:text-4xl">
          From idea to MVP, without hiring a dev team.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-subtle-foreground sm:text-lg">
          I run Scryptic, a small studio building web apps for UK founders.
          One fixed-price sprint takes you from idea to launch, with the code
          and every account in your name.
        </p>
      </div>

      {/* The numbers, ruled off from the pitch above as a strip of their own,
          and the two ways onward beside them. */}
      <div className="border-t border-border bg-muted/35">
        <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {facts.map((fact) => (
            <div key={fact.label} className="px-6 py-5 sm:px-10">
              <dt className="text-sm text-muted-foreground">{fact.label}</dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap gap-3 border-t border-border px-6 py-6 sm:px-10">
          <a
            href={`${SITE}/book-a-call`}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
          >
            Book a discovery call
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </a>
          <a
            href={SITE}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
          >
            Visit scryptic.co.uk
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 text-faint-foreground transition group-hover:text-foreground"
            />
          </a>
        </div>
      </div>
    </article>
  );
}
