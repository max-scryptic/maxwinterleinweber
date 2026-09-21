import type { CSSProperties } from "react";

import { LeftCard } from "@/components/left-card";
import { SpaceBackdrop } from "@/components/space-backdrop";
import { BAND } from "@/lib/figure";

export default function Home() {
  return (
    <>
      <SpaceBackdrop />

      {/* Two equal columns from md up, the card on the left and the figure's
          half of the sky left clear on the right. There the page is the window
          exactly: the sky behind is pinned to it, so it cannot be allowed to
          grow past it and drag the card off the bottom, and anything longer
          than the card scrolls inside the card instead, which is also what
          keeps the gutter around it the same gutter all the way down.

          Narrower than that there is no width to split, so the split is made
          the other way, and the page is two screens: the figure has the first
          one and the card is the second. It is the page that scrolls rather than
          the card's contents, so a swipe up carries the card over the sky while
          the figure dissolves behind it, and ends with the card held in the
          window exactly as the wide layout holds it.

          The first row is BAND in `src/lib/figure.ts`, which is also what the
          camera is framed against and what the dissolve is measured over, so it
          is stated here as the same number rather than a second one that has to
          be kept in step by hand. The second is at least a screen less its
          gutters, which is what makes it a screen: the card is shorter than that
          and would otherwise be a short row near the bottom of a page that ran
          out of scroll with the figure still half dissolved above it. It is a
          minimum rather than a height so that the card can still grow past the
          window as things are added to it.

          The top gutter is dropped on that layout, and only there. It is the
          card's own margin from the edge of the window, and above the card on
          this layout there is nothing to hold off: the row is empty sky, since
          the figure standing in it is on the canvas behind rather than in the
          grid. Left in, it would take the figure's screen a gutter short of one
          and push the card's top edge a gutter below the fold, so that the first
          thing a swipe revealed was the gap.

          Nothing here takes the pointer except the card itself: a drag
          anywhere the card is not has to reach the canvas underneath to turn
          the figure. */}
      <div
        className="pointer-events-none relative z-10 grid min-h-svh grid-cols-1 grid-rows-[var(--band)_minmax(var(--screen),auto)] px-[var(--gutter)] pb-[var(--gutter)] md:h-svh md:min-h-0 md:grid-cols-2 md:grid-rows-1 md:pt-[var(--gutter)]"
        style={
          {
            "--gutter": "10px",
            "--band": `${BAND * 100}svh`,
            "--screen": "calc(100svh - 2 * var(--gutter))",
          } as CSSProperties
        }
      >
        {/* The figure's row is empty: what stands in it is the figure, which is
            on the canvas behind this grid rather than in it. This is only the
            hole in the layout that the card is kept out of, and it collapses
            to nothing on the wide layout, where the rows are one. */}
        <div aria-hidden="true" className="md:hidden" />

        <LeftCard />
      </div>
    </>
  );
}
