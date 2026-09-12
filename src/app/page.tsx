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
          keeps the 10px of space around it the same 10px all the way down.

          Narrower than that there is no width to split, so the split is made
          the other way. The figure gets a band across the top and the card
          starts below it, and it is the page that scrolls rather than the
          card's contents: the card is as tall as what is in it, and scrolling
          carries it up over the sky while the figure dissolves behind it. The
          band's height is BAND in `src/lib/figure.ts`, which is also what the
          camera is framed against and what the dissolve is measured over, so
          it is stated here as the same number rather than a second one that
          has to be kept in step by hand.

          Nothing here takes the pointer except the card itself: a drag
          anywhere the card is not has to reach the canvas underneath to turn
          the figure. */}
      <div
        className="pointer-events-none relative z-10 grid min-h-svh grid-cols-1 grid-rows-[var(--band)_auto] p-[10px] md:h-svh md:min-h-0 md:grid-cols-2 md:grid-rows-1"
        style={{ "--band": `${BAND * 100}svh` } as CSSProperties}
      >
        {/* The band itself is empty: what stands in it is the figure, which is
            on the canvas behind this grid rather than in it. This is only the
            hole in the layout that the card is kept out of, and it collapses
            to nothing on the wide layout, where the rows are one. */}
        <div aria-hidden="true" className="md:hidden" />

        <LeftCard />
      </div>
    </>
  );
}
